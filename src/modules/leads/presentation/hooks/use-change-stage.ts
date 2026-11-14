"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { STAGE_LABEL } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/types";
import { LeadsService } from "@/services/leads-service";

/**
 * Muda a etapa de um lead no banco e confirma com um toast. A lista é
 * atualizada na hora por `onChanged` (o card não volta para a coluna antiga
 * ao soltar no Kanban); se o banco recusar, o lead volta à etapa anterior.
 */
export function useChangeStage(onChanged: (lead: Lead) => void) {
  return useCallback(
    async (lead: Lead, stage: LeadStage) => {
      if (lead.stage === stage) return;
      onChanged({ ...lead, stage });
      try {
        const saved = await LeadsService.changeStage(lead.id, stage);
        onChanged(saved);
        toast.success("Etapa alterada com sucesso", {
          description: `${saved.name}: ${STAGE_LABEL[lead.stage]} → ${STAGE_LABEL[saved.stage]}`,
        });
      } catch (error) {
        onChanged(lead);
        toast.error(error instanceof Error ? error.message : String(error));
      }
    },
    [onChanged],
  );
}
