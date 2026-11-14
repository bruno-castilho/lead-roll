import type { ProfileRecord } from "../domain/profile";

export interface Credentials {
  email: string;
  password: string;
}

/** Provedor de autenticação (sessão). Lança `AuthError`. */
export interface AuthGateway {
  /** Entra com e-mail e senha; devolve o id do usuário autenticado. */
  signIn(credentials: Credentials): Promise<{ userId: string }>;
  /** Encerra a sessão deste navegador. */
  signOut(): Promise<void>;
  /** Sessão salva neste navegador; `null` se não houver uma válida. */
  restoreSession(): Promise<{ userId: string } | null>;
  /**
   * Avisa quando a sessão termina fora do app (outra aba, sessão revogada).
   * Devolve a função que cancela o aviso.
   */
  onSignedOut(callback: () => void): () => void;
}

/** Leitura dos perfis. Lança `AuthError`. */
export interface ProfileRepository {
  findById(userId: string): Promise<ProfileRecord | null>;
}
