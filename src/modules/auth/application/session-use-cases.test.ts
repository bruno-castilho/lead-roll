import { describe, expect, it, vi } from "vitest";
import type { ProfileRecord } from "../domain/profile";
import { AuthError, type AuthFailure } from "./auth-error";
import type { AuthGateway, ProfileRepository } from "./ports";
import {
  makeRestoreSession,
  makeSignIn,
  makeSignOut,
  makeWatchSignedOut,
} from "./session-use-cases";

const record: ProfileRecord = {
  id: "user-1",
  name: "Ana",
  email: "ana@leadroll.demo",
  role: "broker",
};
const credentials = { email: "ana@leadroll.demo", password: "123456" };

function gateway(overrides: Partial<AuthGateway> = {}) {
  return {
    signIn: vi.fn().mockResolvedValue({ userId: "user-1" }),
    signOut: vi.fn().mockResolvedValue(undefined),
    restoreSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
    onSignedOut: vi.fn(),
    ...overrides,
  } satisfies AuthGateway;
}

function profiles(result: ProfileRecord | null | Error): ProfileRepository {
  return {
    findById: vi.fn(() =>
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result),
    ),
  };
}

const profileFailure = (reason: AuthFailure) =>
  new AuthError("loadProfile", reason);

describe("signIn", () => {
  it("entra e devolve o perfil validado", async () => {
    const auth = gateway();
    const repository = profiles(record);
    await expect(
      makeSignIn({ auth, profiles: repository })(credentials),
    ).resolves.toEqual(record);
    expect(auth.signIn).toHaveBeenCalledWith(credentials);
    expect(repository.findById).toHaveBeenCalledWith("user-1");
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("falha no login: repassa sem buscar perfil nem sair", async () => {
    const failure = new AuthError("signIn", "invalid_credentials");
    const auth = gateway({ signIn: vi.fn().mockRejectedValue(failure) });
    const repository = profiles(record);
    await expect(
      makeSignIn({ auth, profiles: repository })(credentials),
    ).rejects.toBe(failure);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it.each([
    ["sem perfil", null, "missing_profile"],
    ["perfil inválido", { ...record, role: "admin" }, "missing_profile"],
    ["falha de rede", profileFailure("network"), "network"],
    ["sessão recusada", profileFailure("auth"), "auth"],
    ["erro desconhecido", profileFailure("unknown"), "unknown"],
  ] as const)("%s: encerra a sessão e repassa", async (_label, result, reason) => {
    const auth = gateway();
    const error = await makeSignIn({ auth, profiles: profiles(result) })(
      credentials,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toMatchObject({ operation: "loadProfile", reason });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("falha do logout não esconde o erro do perfil", async () => {
    const auth = gateway({
      signOut: vi.fn().mockRejectedValue(new AuthError("signOut", "unknown")),
    });
    await expect(
      makeSignIn({ auth, profiles: profiles(null) })(credentials),
    ).rejects.toMatchObject({ reason: "missing_profile" });
  });

  it("erro que não é de autenticação não encerra a sessão", async () => {
    const auth = gateway();
    const failure = new Error("configuração");
    await expect(
      makeSignIn({ auth, profiles: profiles(failure) })(credentials),
    ).rejects.toBe(failure);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe("restoreSession", () => {
  it("sem sessão salva: null, sem buscar perfil", async () => {
    const auth = gateway({ restoreSession: vi.fn().mockResolvedValue(null) });
    const repository = profiles(record);
    await expect(
      makeRestoreSession({ auth, profiles: repository })(),
    ).resolves.toBeNull();
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("com sessão: devolve o perfil", async () => {
    await expect(
      makeRestoreSession({ auth: gateway(), profiles: profiles(record) })(),
    ).resolves.toEqual(record);
  });

  it.each([
    ["sem perfil", null],
    ["sessão recusada", profileFailure("auth")],
  ] as const)("%s: encerra a sessão e devolve null", async (_label, result) => {
    const auth = gateway();
    await expect(
      makeRestoreSession({ auth, profiles: profiles(result) })(),
    ).resolves.toBeNull();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it.each([
    profileFailure("network"),
    profileFailure("unknown"),
  ])("falha %# ao buscar o perfil: repassa sem sair", async (failure) => {
    const auth = gateway();
    await expect(
      makeRestoreSession({ auth, profiles: profiles(failure) })(),
    ).rejects.toBe(failure);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("falha ao restaurar a sessão é repassada", async () => {
    const failure = new AuthError("restoreSession", "network");
    const auth = gateway({
      restoreSession: vi.fn().mockRejectedValue(failure),
    });
    await expect(
      makeRestoreSession({ auth, profiles: profiles(record) })(),
    ).rejects.toBe(failure);
  });
});

describe("signOut e watchSignedOut", () => {
  it("delegam ao provedor", async () => {
    const stop = () => {};
    const auth = gateway({ onSignedOut: vi.fn().mockReturnValue(stop) });
    await makeSignOut({ auth })();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    const callback = () => {};
    expect(makeWatchSignedOut({ auth })(callback)).toBe(stop);
    expect(auth.onSignedOut).toHaveBeenCalledWith(callback);
  });
});
