import "client-only";
import {
  isAuthApiError,
  isAuthRetryableFetchError,
} from "@supabase/supabase-js";
import { SupabaseConfigError } from "@/shared/infrastructure/env";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import { AuthError, type AuthFailure } from "../application/auth-error";
import type { AuthGateway } from "../application/ports";

/** Sem variáveis, sem rede ou falha de fetch: o usuário vê "não foi possível conectar". */
function isNetworkError(error: unknown): boolean {
  return (
    error instanceof SupabaseConfigError ||
    isAuthRetryableFetchError(error) ||
    error instanceof TypeError
  );
}

function signInFailure(error: unknown): AuthFailure {
  if (isNetworkError(error)) return "network";
  if (isAuthApiError(error)) {
    switch (error.code) {
      case "invalid_credentials":
        return "invalid_credentials";
      case "email_not_confirmed":
        return "email_not_confirmed";
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return "rate_limited";
      case "user_banned":
        return "banned";
    }
  }
  return "unknown";
}

/** Supabase Auth com e-mail e senha; a sessão fica nos cookies do navegador. */
export const supabaseAuthGateway: AuthGateway = {
  async signIn({ email, password }) {
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword(
        { email, password },
      );
      if (error) {
        throw new AuthError("signIn", signInFailure(error), { cause: error });
      }
      return { userId: data.user.id };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("signIn", signInFailure(error), { cause: error });
    }
  },

  async signOut() {
    try {
      const { error } = await getSupabaseClient().auth.signOut({
        scope: "local",
      });
      if (error) throw error;
    } catch (error) {
      throw new AuthError("signOut", "unknown", { cause: error });
    }
  },

  async restoreSession() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) {
      if (isAuthRetryableFetchError(error)) {
        throw new AuthError("restoreSession", "network", { cause: error });
      }
      return null;
    }
    if (!data.session) return null;
    return { userId: data.session.user.id };
  },

  onSignedOut(callback) {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      // Sem as variáveis de ambiente não há sessão para acompanhar; a
      // restauração da sessão já avisa o usuário dessa falha.
      return () => {};
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Nada de await de outras chamadas do Supabase aqui (risco de deadlock).
      if (event === "SIGNED_OUT") setTimeout(callback, 0);
    });
    return () => data.subscription.unsubscribe();
  },
};
