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
import { useSession } from "@/hooks/use-session";
import { formatTime } from "@/shared/ui/format";
import { confirmPresence, loadOwnPresence } from "../composition";
import { canConfirmPresence } from "../domain/presence-policy";
import { brokersErrorMessage } from "./brokers-messages";

type PresenceContextType = {
  /** Fim da presença atual; `null` quando o corretor está ausente. */
  expiresAt: string | null;
  isPresent: boolean;
  loading: boolean;
  confirming: boolean;
  /** Confirma a presença por 5h, ou renova se já estiver presente. */
  confirm: () => Promise<void>;
};

export const PresenceContext = createContext<PresenceContextType | null>(null);

/**
 * Presença do corretor conectado, compartilhada entre o cabeçalho e a página
 * do corretor. Busca quando há um perfil de corretor e passa a "ausente"
 * sozinha quando o prazo termina.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession();
  const brokerId = profile && canConfirmPresence(profile) ? profile.id : null;
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setExpiresAt(null);
    setConfirming(false);
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

  const confirm = useCallback(async () => {
    // Só o corretor vê o botão (PresenceToggle); sem perfil não há o que confirmar.
    if (!profile) return;
    const renewing = expiresAt !== null;
    setConfirming(true);
    try {
      const presence = await confirmPresence(profile);
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
    } catch (error) {
      toast.error(brokersErrorMessage(error));
    } finally {
      setConfirming(false);
    }
  }, [profile, expiresAt]);

  const value = useMemo<PresenceContextType>(
    () => ({
      expiresAt,
      isPresent: expiresAt !== null,
      loading,
      confirming,
      confirm,
    }),
    [expiresAt, loading, confirming, confirm],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
