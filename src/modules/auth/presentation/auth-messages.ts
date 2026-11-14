import {
  errorMessage,
  NETWORK_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "@/shared/ui/error-message";
import {
  AuthError,
  type AuthFailure,
  type AuthOperation,
} from "../application/auth-error";

const MESSAGES: Record<
  AuthOperation,
  Partial<Record<AuthFailure, string>> & { unknown: string }
> = {
  signIn: {
    invalid_credentials: "E-mail ou senha inválidos.",
    email_not_confirmed: "Confirme seu e-mail antes de entrar.",
    rate_limited:
      "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    banned: "Sua conta está bloqueada. Fale com o gestor.",
    unknown: "Não foi possível entrar. Tente novamente.",
  },
  loadProfile: {
    missing_profile:
      "Sua conta não tem um perfil configurado. Fale com o gestor.",
    unknown: "Não foi possível carregar seu perfil. Tente novamente.",
  },
  restoreSession: {
    unknown: NETWORK_MESSAGE,
  },
  signOut: {
    // BUG-02 (registrado): texto mantido como está até a correção aprovada.
    unknown: "Error ao fazer logout. Tente novamente mais tarde.",
  },
};

/** Texto pt-BR para mostrar ao usuário quando uma operação falha. */
export function authErrorMessage(error: unknown): string {
  if (!(error instanceof AuthError)) return errorMessage(error);
  if (error.reason === "network") return NETWORK_MESSAGE;
  if (error.reason === "auth") return SESSION_EXPIRED_MESSAGE;
  const messages = MESSAGES[error.operation];
  return messages[error.reason] ?? messages.unknown;
}
