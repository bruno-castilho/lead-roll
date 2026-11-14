import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthUnknownError,
} from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthServiceError } from "@/errors/auth-service-error";
import { ProfileError } from "@/errors/profile-error";
import { SignInError } from "@/errors/sign-in-error";
import { SignOutError } from "@/errors/sign-out-error";
import { SupabaseConfigError } from "@/lib/supabase/client";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { AuthService } from "./auth-service";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";

const user = { id: "user-1", email: "ana@leadroll.demo" };
const session = { access_token: "token", user };

beforeEach(() => supabaseFake.reset());

describe("signIn", () => {
  const credentials = { email: "ana@leadroll.demo", password: "123456" };

  it("entra com e-mail e senha", async () => {
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user, session, weakPassword: undefined },
      error: null,
    });
    await expect(AuthService.signIn(credentials)).resolves.toEqual({
      user,
      session,
      weakPassword: undefined,
    });
    expect(supabaseFake.auth.signInWithPassword).toHaveBeenCalledWith(
      credentials,
    );
  });

  it.each([
    ["invalid_credentials", "E-mail ou senha inválidos."],
    ["email_not_confirmed", "Confirme seu e-mail antes de entrar."],
    [
      "over_request_rate_limit",
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    ],
    [
      "over_email_send_rate_limit",
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    ],
    ["user_banned", "Sua conta está bloqueada. Fale com o gestor."],
    ["unexpected_failure", "Não foi possível entrar. Tente novamente."],
  ])("erro %s → %j", async (code, message) => {
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError("x", 400, code),
    });
    const error = await AuthService.signIn(credentials).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(SignInError);
    expect(error).toMatchObject({ message });
  });

  it.each([
    ["sem conexão", new AuthRetryableFetchError("x", 0), NETWORK],
    [
      "erro desconhecido",
      new AuthUnknownError("x", null),
      "Não foi possível entrar. Tente novamente.",
    ],
  ])("%s devolvido pelo SDK", async (_label, sdkError, message) => {
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: sdkError,
    });
    await expect(AuthService.signIn(credentials)).rejects.toThrow(message);
  });

  it("falha de rede lançada (TypeError) vira erro de conexão", async () => {
    supabaseFake.auth.signInWithPassword.mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await expect(AuthService.signIn(credentials)).rejects.toThrow(NETWORK);
  });

  it("variáveis ausentes viram erro de conexão", async () => {
    supabaseFake.makeUnavailable(new SupabaseConfigError());
    await expect(AuthService.signIn(credentials)).rejects.toThrow(NETWORK);
  });
});

describe("signOut", () => {
  it("encerra só a sessão local", async () => {
    supabaseFake.auth.signOut.mockResolvedValue({ error: null });
    await expect(AuthService.signOut()).resolves.toBeUndefined();
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  // BUG-02: a mensagem do servidor é descartada e o texto tem "Error".
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
  ])("%s vira SignOutError", async (_label, arrange) => {
    arrange();
    const error = await AuthService.signOut().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SignOutError);
    expect(error).toMatchObject({
      message: "Error ao fazer logout. Tente novamente mais tarde.",
    });
  });
});

describe("getProfile", () => {
  const profileRow = {
    id: "user-1",
    name: "Ana",
    email: "ana@leadroll.demo",
    role: "broker",
  };

  it("busca o perfil em profiles", async () => {
    supabaseFake.respondWith({ data: profileRow });
    await expect(AuthService.getProfile("user-1")).resolves.toEqual(profileRow);
    expect(supabaseFake.queries).toEqual([
      {
        table: "profiles",
        calls: [
          { method: "select", args: ["id, name, email, role"] },
          { method: "eq", args: ["id", "user-1"] },
          { method: "maybeSingle", args: [] },
        ],
      },
    ]);
  });

  it("aceita o papel manager", async () => {
    supabaseFake.respondWith({ data: { ...profileRow, role: "manager" } });
    await expect(AuthService.getProfile("user-1")).resolves.toMatchObject({
      role: "manager",
    });
  });

  it.each([
    ["sem linha", null],
    ["papel desconhecido", { ...profileRow, role: "admin" }],
    ["nome em branco", { ...profileRow, name: "   " }],
  ])("%s vira ProfileError missing", async (_label, data) => {
    supabaseFake.respondWith({ data });
    const error = await AuthService.getProfile("user-1").catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ProfileError);
    expect(error).toMatchObject({
      reason: "missing",
      message: "Sua conta não tem um perfil configurado. Fale com o gestor.",
    });
  });

  it.each([
    [0, "XX000", "network", NETWORK],
    [401, "XX000", "auth", SESSION],
    [200, "PGRST301", "auth", SESSION],
    [
      500,
      "XX000",
      "unknown",
      "Não foi possível carregar seu perfil. Tente novamente.",
    ],
  ])("status %i / %s vira ProfileError %s", async (status, code, reason, message) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    const error = await AuthService.getProfile("user-1").catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ProfileError);
    expect(error).toMatchObject({ reason, message });
  });
});

describe("restoreSession", () => {
  it("devolve o usuário e a sessão salvos", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });
    await expect(AuthService.restoreSession()).resolves.toEqual({
      user,
      session,
    });
  });

  it("devolve null sem sessão", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    await expect(AuthService.restoreSession()).resolves.toBeNull();
  });

  it("devolve null quando a sessão é inválida", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthApiError("x", 400, "session_not_found"),
    });
    await expect(AuthService.restoreSession()).resolves.toBeNull();
  });

  it("falha de conexão vira AuthServiceError", async () => {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError("x", 0),
    });
    const error = await AuthService.restoreSession().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthServiceError);
    expect(error).toMatchObject({ message: NETWORK });
  });
});

describe("onSignedOut", () => {
  afterEach(() => vi.useRealTimers());

  it("avisa, fora do callback do SDK, só no evento SIGNED_OUT", () => {
    vi.useFakeTimers();
    const unsubscribe = vi.fn();
    supabaseFake.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
    const callback = vi.fn();

    const stop = AuthService.onSignedOut(callback);
    const listener = supabaseFake.auth.onAuthStateChange.mock.calls[0][0];

    listener("TOKEN_REFRESHED");
    listener("SIGNED_OUT");
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("não falha sem as variáveis de ambiente", () => {
    supabaseFake.makeUnavailable(new SupabaseConfigError());
    const stop = AuthService.onSignedOut(vi.fn());
    expect(stop).not.toThrow();
  });
});
