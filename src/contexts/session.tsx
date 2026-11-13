"use client";

import type { Session, User } from "@supabase/supabase-js";
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
  ready: boolean;
  user: User | null;
  session: Session | null;

  profile: AuthProfile | null;
  onSession: (user: User, session: Session, profile: AuthProfile) => void;
  clearSession: () => void;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<{
    user: User;
    session: Session;
    profile: AuthProfile;
  } | null>(null);

  // Restaura a sessão do Supabase (cookies). O cliente só é criado em efeitos.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const restored = await AuthService.restoreSession();
      if (!restored) return null;
      try {
        const profile = await AuthService.getProfile(restored.user.id);
        return { ...restored, profile };
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
        if (!cancelled) setAuth((current) => current ?? restored);
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

  const onSession = useCallback(
    (user: User, session: Session, profile: AuthProfile) =>
      setAuth({ user, session, profile }),
    [],
  );
  const clearSession = useCallback(() => setAuth(null), []);

  // Sessão encerrada fora deste fluxo (outra aba, token revogado ou expirado).
  useEffect(() => AuthService.onSignedOut(() => setAuth(null)), []);

  const value = useMemo<SessionContextType>(
    () => ({
      ready,
      user: auth?.user ?? null,
      session: auth?.session ?? null,
      profile: auth?.profile ?? null,
      onSession,
      clearSession,
    }),
    [ready, auth, onSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
