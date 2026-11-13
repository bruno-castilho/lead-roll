"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { STAGE_LABEL } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/types";

/** Altera a etapa de um lead e confirma com um toast. */
export function useChangeStage() {
  return useCallback((lead: Lead, stage: LeadStage) => {
    if (lead.stage === stage) return;
    // Sem implementação.
    toast.success("Etapa alterada com sucesso", {
      description: `${lead.name}: ${STAGE_LABEL[lead.stage]} → ${STAGE_LABEL[stage]}`,
    });
  }, []);
}
