"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/auth";
import { changeStage } from "../../composition";
import type { Lead, LeadStage } from "../../domain/lead";
import { STAGE_LABEL } from "../lead-labels";
import { leadsErrorMessage } from "../leads-messages";

/**
 * Muda a etapa de um lead no banco e confirma com um toast. A lista é
 * atualizada na hora por `onChanged` (o card não volta para a coluna antiga
 * ao soltar no Kanban); se o banco recusar, o lead volta à etapa anterior.
 */
export function useChangeStage(onChanged: (lead: Lead) => void) {
  const { profile } = useSession();
  return useCallback(
    async (lead: Lead, stage: LeadStage) => {
      // Só o corretor conectado vê os próprios leads; sem perfil não há etapa a mudar.
      if (!profile || lead.stage === stage) return;
      onChanged({ ...lead, stage });
      try {
        const saved = await changeStage(profile, lead, stage);
        onChanged(saved);
        toast.success("Etapa alterada com sucesso", {
          description: `${saved.name}: ${STAGE_LABEL[lead.stage]} → ${STAGE_LABEL[saved.stage]}`,
        });
      } catch (error) {
        onChanged(lead);
        toast.error(leadsErrorMessage(error));
      }
    },
    [profile, onChanged],
  );
}
