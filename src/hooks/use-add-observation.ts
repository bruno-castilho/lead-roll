"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Lead, Observation } from "@/lib/types";
import { LeadsService } from "@/services/leads-service";

/**
 * Registra uma observação no lead e confirma com um toast. A observação salva
 * entra na lista por `onAdded`. Devolve `true` se o banco registrou, para o
 * formulário limpar o texto só nesse caso.
 */
export function useAddObservation(
  onAdded: (leadId: string, observation: Observation) => void,
) {
  return useCallback(
    async (lead: Lead, content: string) => {
      try {
        const observation = await LeadsService.addObservation(lead.id, content);
        onAdded(lead.id, observation);
        toast.success("Observação adicionada");
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [onAdded],
  );
}
