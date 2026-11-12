"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StageDot } from "@/components/shared/stage-badge";
import { pluralize } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LeadCard } from "./lead-card";

interface KanbanColumnProps {
  stage: LeadStage;
  label: string;
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
  /** Coluna como área de soltura (desktop). */
  droppable?: boolean;
  className?: string;
}

export function KanbanColumn({
  stage,
  label,
  leads,
  onOpen,
  onStageChange,
  droppable = true,
  className,
}: KanbanColumnProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: stage,
    disabled: !droppable,
  });
  const draggingFromHere = active?.data.current?.lead?.stage === stage;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${label}: ${pluralize(leads.length, "lead", "leads")}`}
      className={cn(
        "flex min-h-0 flex-col rounded-xl border border-transparent bg-muted/40 transition-colors dark:bg-muted/25",
        isOver &&
          !draggingFromHere &&
          "border-primary/50 border-dashed bg-primary/[0.05]",
        className,
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <StageDot stage={stage} />
        <h2 className="font-medium text-sm">{label}</h2>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 font-medium text-muted-foreground text-xs tabular-nums shadow-xs">
          {leads.length}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {leads.length === 0 ? (
          <EmptyState
            compact
            icon={Inbox}
            title="Nenhum lead nesta etapa"
            description={droppable ? "Arraste um card para cá." : undefined}
            className="rounded-lg border border-dashed bg-background/40"
          />
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={onOpen}
              onStageChange={onStageChange}
              draggable={droppable}
            />
          ))
        )}
      </div>
    </section>
  );
}
