import {
  isAuthApiError,
  isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { SupabaseConfigError } from "@/lib/supabase/client";

export class SignInError extends Error {
  constructor(error: unknown) {
    super(SignInError.signInErrorMessage(error));
  }

  private static signInErrorMessage(error: unknown): string {
    // Já traduzido (relançado pelo `catch` do `signIn`): mantém a mensagem.
    if (error instanceof SignInError) return error.message;
    if (SignInError.isNetworkError(error)) {
      return "Não foi possível conectar. Verifique sua internet e tente novamente.";
    }
    if (isAuthApiError(error)) {
      switch (error.code) {
        case "invalid_credentials":
          return "E-mail ou senha inválidos.";
        case "email_not_confirmed":
          return "Confirme seu e-mail antes de entrar.";
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
          return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        case "user_banned":
          return "Sua conta está bloqueada. Fale com o gestor.";
      }
    }
    return "Não foi possível entrar. Tente novamente.";
  }

  private static isNetworkError(error: unknown): boolean {
    return (
      error instanceof SupabaseConfigError ||
      isAuthRetryableFetchError(error) ||
      error instanceof TypeError
    );
  }
}
