"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { STAGE_LABEL } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

/** Altera a etapa de um lead e confirma com um toast. */
export function useChangeStage() {
  const { setLeadStage } = useAppStore();
  return useCallback(
    (lead: Lead, stage: LeadStage) => {
      if (lead.stage === stage) return;
      setLeadStage(lead.id, stage);
      toast.success("Etapa alterada com sucesso", {
        description: `${lead.name}: ${STAGE_LABEL[lead.stage]} → ${STAGE_LABEL[stage]}`,
      });
    },
    [setLeadStage],
  );
}
