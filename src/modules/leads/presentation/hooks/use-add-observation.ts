"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/auth";
import { addObservation } from "../../composition";
import type { Lead, Observation } from "../../domain/lead";
import { leadsErrorMessage } from "../leads-messages";

/**
 * Registra uma observação no lead e confirma com um toast. A observação salva
 * entra na lista por `onAdded`. Devolve `true` se o banco registrou, para o
 * formulário limpar o texto só nesse caso.
 */
export function useAddObservation(
  onAdded: (leadId: string, observation: Observation) => void,
) {
  const { profile } = useSession();
  return useCallback(
    async (lead: Lead, content: string) => {
      // Sem perfil não há quem registre (o formulário só aparece ao corretor).
      if (!profile) return false;
      try {
        const observation = await addObservation(profile, lead, content);
        onAdded(lead.id, observation);
        toast.success("Observação adicionada");
        return true;
      } catch (error) {
        toast.error(leadsErrorMessage(error));
        return false;
      }
    },
    [profile, onAdded],
  );
}
