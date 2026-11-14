"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import type { User } from "@/lib/types";
import { BrokersService } from "@/services/brokers-service";

/**
 * Busca os corretores no Supabase assim que há um perfil conectado. A página
 * é renderizada (oculta) antes da sessão ser restaurada, então a busca espera
 * o `profile` e é refeita quando o usuário muda.
 */
export function useBrokers() {
  const { profile } = useSession();
  const profileId = profile?.id ?? null;
  const [brokers, setBrokers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setBrokers([]);
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    BrokersService.listBrokers()
      .then((list) => {
        if (!cancelled) setBrokers(list);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setBrokers([]);
        toast.error(error instanceof Error ? error.message : String(error));
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
