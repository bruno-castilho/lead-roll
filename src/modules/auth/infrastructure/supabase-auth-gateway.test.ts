import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthUnknownError,
} from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseConfigError } from "@/shared/infrastructure/env";
import { failureOf } from "@/test/failure-of";
import { supabaseFake } from "@/test/fake-supabase";
import { AuthError } from "../application/auth-error";
import { supabaseAuthGateway } from "./supabase-auth-gateway";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const credentials = { email: "ana@leadroll.demo", password: "123456" };

beforeEach(() => supabaseFake.reset());

describe("supabaseAuthGateway.signIn", () => {
  it("entra com e-mail e senha", async () => {
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: {} },
      error: null,
    });
    await expect(supabaseAuthGateway.signIn(credentials)).resolves.toEqual({
      userId: "user-1",
    });
    expect(supabaseFake.auth.signInWithPassword).toHaveBeenCalledWith(
      credentials,
    );
  });

  it.each([
    ["invalid_credentials", "invalid_credentials"],
    ["email_not_confirmed", "email_not_confirmed"],
    ["over_request_rate_limit", "rate_limited"],
    ["over_email_send_rate_limit", "rate_limited"],
    ["user_banned", "banned"],
    ["unexpected_failure", "unknown"],
  ])("código %s → %s", async (code, reason) => {
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError("x", 400, code),
    });
    await expect(
      failureOf(AuthError, () => supabaseAuthGateway.signIn(credentials)),
    ).resolves.toEqual({ operation: "signIn", reason });
  });

  it.each([
    [
      "sem conexão (devolvido)",
      () =>
        supabaseFake.auth.signInWithPassword.mockResolvedValue({
          data: {},
          error: new AuthRetryableFetchError("x", 0),
        }),
      "network",
    ],
    [
      "erro desconhecido (devolvido)",
      () =>
        supabaseFake.auth.signInWithPassword.mockResolvedValue({
          data: {},
          error: new AuthUnknownError("x", null),
        }),
      "unknown",
    ],
    [
      "fetch lançado",
      () =>
        supabaseFake.auth.signInWithPassword.mockRejectedValue(
          new TypeError("Failed to fetch"),
        ),
      "network",
    ],
    [
      "variáveis ausentes",
      () => supabaseFake.makeUnavailable(new SupabaseConfigError()),
      "network",
    ],
  ])("%s → %s", async (_label, arrange, reason) => {
    arrange();
    await expect(
      failureOf(AuthError, () => supabaseAuthGateway.signIn(credentials)),
    ).resolves.toEqual({ operation: "signIn", reason });
  });
});

describe("supabaseAuthGateway.signOut", () => {
  it("encerra só a sessão local", async () => {
    supabaseFake.auth.signOut.mockResolvedValue({ error: null });
    await expect(supabaseAuthGateway.signOut()).resolves.toBeUndefined();
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it.each([
    [
      "erro devolvido",
      () =>
        supabaseFake.auth.signOut.mockResolvedValue({
          error: new AuthApiError("falhou", 500, "x"),
        }),
    ],
    [
      "erro lançado",
      () =>
        supabaseFake.auth.signOut.mockRejectedValue(
          new TypeError("Failed to fetch"),
        ),
    ],
  ])("%s → unknown", async (_label, arrange) => {
    arrange();
    await expect(
      failureOf(AuthError, () => supabaseAuthGateway.signOut()),
    ).resolves.toEqual({
      operation: "signOut",
      reason: "unknown",
    });
  });
});

describe("supabaseAuthGateway.restoreSession", () => {
  it("devolve o usuário da sessão salva", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    await expect(supabaseAuthGateway.restoreSession()).resolves.toEqual({
      userId: "user-1",
    });
  });

  it("sem sessão ou com sessão inválida: null", async () => {
    supabaseFake.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    await expect(supabaseAuthGateway.restoreSession()).resolves.toBeNull();
    supabaseFake.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: new AuthApiError("x", 400, "session_not_found"),
    });
    await expect(supabaseAuthGateway.restoreSession()).resolves.toBeNull();
  });

  it("falha de conexão → network", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError("x", 0),
    });
    await expect(
      failureOf(AuthError, () => supabaseAuthGateway.restoreSession()),
    ).resolves.toEqual({ operation: "restoreSession", reason: "network" });
  });

  it("variáveis ausentes: repassa o erro de configuração", async () => {
    supabaseFake.makeUnavailable(new SupabaseConfigError());
    await expect(supabaseAuthGateway.restoreSession()).rejects.toBeInstanceOf(
      SupabaseConfigError,
    );
  });
});

describe("supabaseAuthGateway.onSignedOut", () => {
  afterEach(() => vi.useRealTimers());

  it("avisa, fora do callback do SDK, só no evento SIGNED_OUT", () => {
    vi.useFakeTimers();
    const unsubscribe = vi.fn();
    supabaseFake.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const callback = vi.fn();
    const stop = supabaseAuthGateway.onSignedOut(callback);
    const listener = supabaseFake.auth.onAuthStateChange.mock.calls[0][0];
    listener("TOKEN_REFRESHED");
    listener("SIGNED_OUT");
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("sem as variáveis de ambiente, não falha", () => {
    supabaseFake.makeUnavailable(new SupabaseConfigError());
    expect(supabaseAuthGateway.onSignedOut(vi.fn())).not.toThrow();
  });
});
