import { describe, expect, it } from "vitest";
import { AuthError } from "../application/auth-error";
import { authErrorMessage } from "./auth-messages";

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";

describe("authErrorMessage", () => {
  it.each([
    ["signIn", "invalid_credentials", "E-mail ou senha inválidos."],
    ["signIn", "email_not_confirmed", "Confirme seu e-mail antes de entrar."],
    [
      "signIn",
      "rate_limited",
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    ],
    ["signIn", "banned", "Sua conta está bloqueada. Fale com o gestor."],
    ["signIn", "network", NETWORK],
    ["signIn", "unknown", "Não foi possível entrar. Tente novamente."],
    [
      "loadProfile",
      "missing_profile",
      "Sua conta não tem um perfil configurado. Fale com o gestor.",
    ],
    ["loadProfile", "auth", SESSION],
    ["loadProfile", "network", NETWORK],
    [
      "loadProfile",
      "unknown",
      "Não foi possível carregar seu perfil. Tente novamente.",
    ],
    ["restoreSession", "network", NETWORK],
    [
      "signOut",
      "unknown",
      "Error ao fazer logout. Tente novamente mais tarde.",
    ],
  ] as const)("%s / %s", (operation, reason, message) => {
    expect(authErrorMessage(new AuthError(operation, reason))).toBe(message);
  });

  it("erro que não é de autenticação mostra a própria mensagem", () => {
    expect(authErrorMessage(new Error("Configure as variáveis"))).toBe(
      "Configure as variáveis",
    );
  });
});
