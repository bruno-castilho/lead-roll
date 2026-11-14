"use client";

import { cn } from "@/shared/ui/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import type { LeadStage } from "../../domain/lead";
import { STAGE_OPTIONS } from "../lead-labels";
import { StageDot } from "../stage-badge";

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
        {STAGE_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <StageDot stage={s.value} />
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
