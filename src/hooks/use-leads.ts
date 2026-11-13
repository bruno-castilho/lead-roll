"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import type { Lead, Observation } from "@/lib/types";
import { LeadsService } from "@/services/leads-service";

/**
 * Busca os leads no Supabase assim que há um perfil conectado. A RLS devolve
 * todos para o gestor e só os próprios para o corretor. A página é renderizada
 * (oculta) antes da sessão ser restaurada, então a busca espera o `profile` e
 * é refeita quando o usuário muda.
 *
 * Com `own`, busca só os leads atribuídos ao usuário conectado (a consulta
 * filtra por `broker_id`, além da RLS). Usado na listagem do corretor.
 */
export function useLeads({ own = false }: { own?: boolean } = {}) {
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
    LeadsService.listLeads(own ? { brokerId: profileId } : {})
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
  }, [profileId, own]);

  /** Inclui na lista um lead que o banco acabou de cadastrar. */
  const addLead = useCallback((lead: Lead) => {
    setLeads((list) => [lead, ...list.filter((l) => l.id !== lead.id)]);
  }, []);

  /** Substitui na lista um lead que o banco acabou de atualizar. */
  const replaceLead = useCallback((lead: Lead) => {
    setLeads((list) => list.map((l) => (l.id === lead.id ? lead : l)));
  }, []);

  /** Retira da lista um lead que o banco acabou de excluir. */
  const removeLead = useCallback((lead: Lead) => {
    setLeads((list) => list.filter((l) => l.id !== lead.id));
  }, []);

  /**
   * Inclui uma observação que o banco acabou de registrar. Atualiza só as
   * observações, para não desfazer uma mudança de etapa em andamento.
   */
  const addObservation = useCallback(
    (leadId: string, observation: Observation) => {
      setLeads((list) =>
        list.map((l) =>
          l.id === leadId
            ? {
                ...l,
                observations: [
                  ...l.observations.filter((o) => o.id !== observation.id),
                  observation,
                ],
              }
            : l,
        ),
      );
    },
    [],
  );

  return { leads, loading, addLead, replaceLead, removeLead, addObservation };
}
