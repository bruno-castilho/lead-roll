"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { ProfileError } from "@/errors/profile-error";
import { type AuthProfile, AuthService } from "@/services/auth-service";

type SessionContextType = {
  /** A restauração da sessão terminou (com ou sem usuário conectado). */
  ready: boolean;
  profile: AuthProfile | null;
  /** Registra o perfil de quem acabou de entrar. */
  startSession: (profile: AuthProfile) => void;
  clearSession: () => void;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  // Restaura a sessão do Supabase (cookies). O cliente só é criado em efeitos.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const restored = await AuthService.restoreSession();
      if (!restored) return null;
      try {
        return await AuthService.getProfile(restored.user.id);
      } catch (error) {
        // Sem perfil válido (ou sessão inválida) não há acesso: sai.
        if (
          error instanceof ProfileError &&
          (error.reason === "missing" || error.reason === "auth")
        ) {
          await AuthService.signOut().catch(() => {});
          return null;
        }
        throw error;
      }
    }

    restore()
      .then((restored) => {
        // Um login feito enquanto a restauração rodava tem prioridade.
        if (!cancelled) setProfile((current) => current ?? restored);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback((next: AuthProfile) => setProfile(next), []);
  const clearSession = useCallback(() => setProfile(null), []);

  // Sessão encerrada fora deste fluxo (outra aba, token revogado ou expirado).
  useEffect(() => AuthService.onSignedOut(() => setProfile(null)), []);

  const value = useMemo<SessionContextType>(
    () => ({
      ready,
      profile,
      startSession,
      clearSession,
    }),
    [ready, profile, startSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
