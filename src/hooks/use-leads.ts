"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import type { Lead } from "@/lib/types";
import { LeadsService } from "@/services/leads-service";

/**
 * Busca os leads no Supabase assim que há um perfil conectado. A RLS devolve
 * todos para o gestor e só os próprios para o corretor. A página é renderizada
 * (oculta) antes da sessão ser restaurada, então a busca espera o `profile` e
 * é refeita quando o usuário muda.
 */
export function useLeads() {
  const { profile } = useSession();
  const profileId = profile?.id ?? null;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setLeads([]);
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    LeadsService.listLeads()
      .then((list) => {
        if (!cancelled) setLeads(list);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLeads([]);
        toast.error(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  /** Inclui na lista um lead que o banco acabou de cadastrar. */
  const addLead = useCallback((lead: Lead) => {
    setLeads((list) => [lead, ...list.filter((l) => l.id !== lead.id)]);
  }, []);

  /** Substitui na lista um lead que o banco acabou de atualizar. */
  const replaceLead = useCallback((lead: Lead) => {
    setLeads((list) => list.map((l) => (l.id === lead.id ? lead : l)));
  }, []);

  return { leads, loading, addLead, replaceLead };
}
