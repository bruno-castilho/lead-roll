import { STAGE_DOT, STAGE_LABEL } from "@/lib/constants";
import type { LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StageDot({
  stage,
  className,
}: {
  stage: LeadStage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        STAGE_DOT[stage],
        className,
      )}
      aria-hidden
    />
  );
}

export function StageBadge({
  stage,
  className,
}: {
  stage: LeadStage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border bg-background px-2.5 font-medium text-xs",
        className,
      )}
    >
      <StageDot stage={stage} />
      {STAGE_LABEL[stage]}
    </span>
  );
}
