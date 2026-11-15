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
import { useSession } from "@/modules/auth";
import { formatTime } from "@/shared/ui/format";
import { confirmPresence, loadOwnPresence } from "../composition";
import { canConfirmPresence } from "../domain/presence-policy";
import { brokersErrorMessage } from "./brokers-messages";

/** Resultado da confirmação pelo QR code, para a tela de check-in. */
export type PresenceCheckInResult =
  | { status: "confirmed" | "renewed"; expiresAt: string }
  | { status: "failed"; message: string };

type PresenceContextType = {
  /** Fim da presença atual; `null` quando o corretor está ausente. */
  expiresAt: string | null;
  isPresent: boolean;
  loading: boolean;
  /**
   * Confirma a presença por 5h com o token do QR code, ou renova se já
   * estiver presente. `null` quando não há corretor conectado. Chame depois
   * de `loading` terminar, para saber se é uma renovação.
   */
  confirm: (token: string | null) => Promise<PresenceCheckInResult | null>;
};

export const PresenceContext = createContext<PresenceContextType | null>(null);

/**
 * Presença do corretor conectado, compartilhada entre o cabeçalho e as
 * páginas do corretor. Busca quando há um perfil de corretor e passa a
 * "ausente" sozinha quando o prazo termina.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession();
  const brokerId = profile && canConfirmPresence(profile) ? profile.id : null;
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setExpiresAt(null);
    if (!brokerId) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadOwnPresence({ id: brokerId, role: "broker" })
      .then((presence) => {
        if (!cancelled) setExpiresAt(presence.activeUntil);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(brokersErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brokerId]);

  // Expira sozinha no fim do prazo, sem precisar recarregar.
  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setTimeout(
      () => setExpiresAt(null),
      Math.max(0, Date.parse(expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [expiresAt]);

  const confirm = useCallback(
    async (token: string | null): Promise<PresenceCheckInResult | null> => {
      if (!profile || !canConfirmPresence(profile)) return null;
      const renewing = expiresAt !== null;
      try {
        const presence = await confirmPresence(profile, token);
        setExpiresAt(presence.activeUntil);
        const until = formatTime(presence.expiresAt);
        if (renewing) {
          toast.success("Presença renovada", {
            description: `Você continua na mesma posição da fila até ${until}.`,
          });
        } else {
          toast.success("Presença confirmada", {
            description: `Você entrou no final da fila e fica disponível até ${until}.`,
          });
        }
        return {
          status: renewing ? "renewed" : "confirmed",
          expiresAt: presence.expiresAt,
        };
      } catch (error) {
        const message = brokersErrorMessage(error);
        toast.error(message);
        return { status: "failed", message };
      }
    },
    [profile, expiresAt],
  );

  const value = useMemo<PresenceContextType>(
    () => ({
      expiresAt,
      isPresent: expiresAt !== null,
      loading,
      confirm,
    }),
    [expiresAt, loading, confirm],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
