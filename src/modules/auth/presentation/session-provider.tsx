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
import { restoreSession, watchSignedOut } from "../composition";
import type { Profile } from "../domain/profile";
import { authErrorMessage } from "./auth-messages";

type SessionContextType = {
  /** A restauração da sessão terminou (com ou sem usuário conectado). */
  ready: boolean;
  profile: Profile | null;
  /** Registra o perfil de quem acabou de entrar. */
  startSession: (profile: Profile) => void;
  clearSession: () => void;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Restaura a sessão do Supabase (cookies). O cliente só é criado em efeitos.
  useEffect(() => {
    let cancelled = false;
    // Sem perfil válido (ou com a sessão recusada), o caso de uso encerra a
    // sessão e devolve null.
    restoreSession()
      .then((restored) => {
        // Um login feito enquanto a restauração rodava tem prioridade.
        if (!cancelled) setProfile((current) => current ?? restored);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(authErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback((next: Profile) => setProfile(next), []);
  const clearSession = useCallback(() => setProfile(null), []);

  // Sessão encerrada fora deste fluxo (outra aba, token revogado ou expirado).
  useEffect(() => watchSignedOut(() => setProfile(null)), []);

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
