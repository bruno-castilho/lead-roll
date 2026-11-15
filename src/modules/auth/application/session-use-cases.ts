import { type Profile, toProfile } from "../domain/profile";
import { AuthError } from "./auth-error";
import type { AuthGateway, Credentials, ProfileRepository } from "./ports";

type Deps = { auth: AuthGateway; profiles: ProfileRepository };

/** Busca o perfil do usuário; sem perfil utilizável, `missing_profile`. */
async function loadProfile(
  profiles: ProfileRepository,
  userId: string,
): Promise<Profile> {
  const record = await profiles.findById(userId);
  const profile = record ? toProfile(record) : null;
  if (!profile) throw new AuthError("loadProfile", "missing_profile");
  return profile;
}

/** Encerra a sessão sem deixar uma falha do logout esconder o erro original. */
async function signOutQuietly(auth: AuthGateway): Promise<void> {
  try {
    await auth.signOut();
  } catch {
    // O erro que importa é o do perfil; o logout é só limpeza.
  }
}

/**
 * Entra e busca o perfil. Sem perfil válido não há acesso: qualquer falha ao
 * buscar o perfil encerra a sessão recém-aberta antes de repassar o erro.
 */
export function makeSignIn({ auth, profiles }: Deps) {
  return async function signIn(credentials: Credentials): Promise<Profile> {
    const { userId } = await auth.signIn(credentials);
    try {
      return await loadProfile(profiles, userId);
    } catch (error) {
      if (error instanceof AuthError && error.operation === "loadProfile") {
        await signOutQuietly(auth);
      }
      throw error;
    }
  };
}

/**
 * Restaura a sessão salva e o perfil. Sem perfil ou com a sessão recusada pelo
 * banco, encerra a sessão e devolve `null`; outras falhas são repassadas.
 */
export function makeRestoreSession({ auth, profiles }: Deps) {
  return async function restoreSession(): Promise<Profile | null> {
    const restored = await auth.restoreSession();
    if (!restored) return null;
    try {
      return await loadProfile(profiles, restored.userId);
    } catch (error) {
      if (
        error instanceof AuthError &&
        (error.reason === "missing_profile" || error.reason === "auth")
      ) {
        await signOutQuietly(auth);
        return null;
      }
      throw error;
    }
  };
}

export function makeSignOut({ auth }: Pick<Deps, "auth">) {
  return function signOut(): Promise<void> {
    return auth.signOut();
  };
}

export function makeWatchSignedOut({ auth }: Pick<Deps, "auth">) {
  return function watchSignedOut(callback: () => void): () => void {
    return auth.onSignedOut(callback);
  };
}
