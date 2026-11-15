"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/auth";
import { listBrokers } from "../composition";
import type { Broker } from "../domain/broker";
import { brokersErrorMessage } from "./brokers-messages";

/**
 * Busca os corretores assim que há um perfil conectado. A página
 * é renderizada (oculta) antes da sessão ser restaurada, então a busca espera
 * o `profile` e é refeita quando o usuário muda.
 */
export function useBrokers() {
  const { profile } = useSession();
  const profileId = profile?.id ?? null;
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setBrokers([]);
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listBrokers()
      .then((list) => {
        if (!cancelled) setBrokers(list);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setBrokers([]);
        toast.error(brokersErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return { brokers, loading };
}
