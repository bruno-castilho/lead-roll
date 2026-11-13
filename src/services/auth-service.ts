import {
  isAuthRetryableFetchError,
  type Session,
  type User,
} from "@supabase/supabase-js";
import { AuthServiceError } from "@/errors/auth-service-error";
import { ProfileError } from "@/errors/profile-error";
import { SignInError } from "@/errors/sign-in-error";
import { SignOutError } from "@/errors/sign-out-error";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

/** Perfil do usuário na tabela `profiles` (a fonte do papel no app). */
export type AuthProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const PROFILE_COLUMNS = "id, name, email, role";
const ROLES: readonly UserRole[] = ["manager", "broker"];

type ProfileRow = { id: string; name: string; email: string; role: string };

function toProfile(row: ProfileRow): AuthProfile | null {
  const role = ROLES.find((r) => r === row.role);
  if (!role || !row.name.trim()) return null;
  return { id: row.id, name: row.name, email: row.email, role };
}

export const AuthService = {
  async signIn({ email, password }: { email: string; password: string }) {
    try {
      const { data, error } = await getSupabaseClient().auth.signInWithPassword(
        {
          email,
          password,
        },
      );
      if (error) throw new SignInError(error);

      return {
        user: data.user,
        session: data.session,
        weakPassword: data.weakPassword,
      };
    } catch (error) {
      throw new SignInError(error);
    }
  },

  async signOut() {
    try {
      const { error } = await getSupabaseClient().auth.signOut({
        scope: "local",
      });
      if (error) throw new SignOutError(error.message);
    } catch {
      throw new SignOutError(
        "Error ao fazer logout. Tente novamente mais tarde.",
      );
    }
  },

  /**
   * Busca o perfil do usuário. O papel vem sempre de `profiles`, nunca de
   * `user.role` (papel do Postgres) nem de `user_metadata`.
   * Lança `ProfileError` se não encontrar ou não conseguir buscar.
   */
  async getProfile(userId: string): Promise<AuthProfile> {
    const { data, error, status } = await getSupabaseClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      if (status === 0) throw new ProfileError("network", error);
      // 401 / PGRST30x: JWT ausente, inválido ou expirado.
      if (status === 401 || error.code.startsWith("PGRST30")) {
        throw new ProfileError("auth", error);
      }
      throw new ProfileError("unknown", error);
    }
    const profile = data ? toProfile(data) : null;
    if (!profile) throw new ProfileError("missing");
    return profile;
  },

  /**
   * Restaura a sessão salva nos cookies. Retorna `null` sem sessão válida.
   * Lança `AuthServiceError` em falhas de conexão.
   */
  async restoreSession(): Promise<{ user: User; session: Session } | null> {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) {
      if (isAuthRetryableFetchError(error)) throw new AuthServiceError(error);
      return null;
    }
    if (!data.session) return null;
    return { user: data.session.user, session: data.session };
  },

  /** Perfis visíveis pela RLS: todos para o gestor, só o próprio para o corretor. */
  async listProfiles(): Promise<AuthProfile[]> {
    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .order("name");
    if (error) throw new AuthServiceError(error);
    return data.flatMap((row) => toProfile(row) ?? []);
  },

  /**
   * Chama `callback` quando a sessão termina fora do fluxo normal (logout em
   * outra aba, sessão revogada, falha ao renovar o token).
   */
  onSignedOut(callback: () => void): () => void {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      return () => {};
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Nada de await de outras chamadas do Supabase aqui (risco de deadlock).
      if (event === "SIGNED_OUT") setTimeout(callback, 0);
    });
    return () => data.subscription.unsubscribe();
  },
};
