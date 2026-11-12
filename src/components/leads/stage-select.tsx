"use client";

import { StageDot } from "@/components/shared/stage-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STAGES } from "@/lib/constants";
import type { LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StageSelectProps {
  value: LeadStage;
  onChange: (stage: LeadStage) => void;
  className?: string;
  id?: string;
}

export function StageSelect({
  value,
  onChange,
  className,
  id,
}: StageSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LeadStage)}>
      <SelectTrigger
        id={id}
        aria-label="Etapa do lead"
        className={cn("h-9", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STAGES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <StageDot stage={s.value} />
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
