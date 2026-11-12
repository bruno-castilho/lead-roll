"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { StageDot } from "@/components/shared/stage-badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LEAD_STAGES } from "@/lib/constants";
import type { Lead, LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KanbanColumn } from "./kanban-column";
import { LeadCardContent } from "./lead-card";

interface LeadKanbanProps {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
}

function groupByStage(leads: Lead[]) {
  const groups = Object.fromEntries(
    LEAD_STAGES.map((s) => [s.value, [] as Lead[]]),
  ) as Record<LeadStage, Lead[]>;
  const sorted = [...leads].sort((a, b) =>
    (b.assignedAt ?? b.createdAt).localeCompare(a.assignedAt ?? a.createdAt),
  );
  for (const lead of sorted) groups[lead.stage].push(lead);
  return groups;
}

/**
 * Kanban de atendimento: colunas lado a lado com arrastar e soltar (tablet/desktop)
 * e navegação por etapas com lista vertical (mobile).
 */
export function LeadKanban({ leads, onOpen, onStageChange }: LeadKanbanProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)", true);
  const groups = useMemo(() => groupByStage(leads), [leads]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [mobileStage, setMobileStage] = useState<LeadStage>("new");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveLead((event.active.data.current?.lead as Lead) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const lead = event.active.data.current?.lead as Lead | undefined;
    const target = event.over?.id as LeadStage | undefined;
    if (lead && target && lead.stage !== target) onStageChange(lead, target);
  }

  if (!isDesktop) {
    const stageLeads = groups[mobileStage];
    const label = LEAD_STAGES.find((s) => s.value === mobileStage)?.label ?? "";
    return (
      <div className="space-y-3">
        <div
          role="tablist"
          aria-label="Etapas"
          className="grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-3"
        >
          {LEAD_STAGES.map((s) => {
            const selected = s.value === mobileStage;
            return (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMobileStage(s.value)}
                className={cn(
                  "flex h-10 min-w-0 items-center gap-1.5 rounded-lg border px-2.5 text-left font-medium text-xs transition-colors min-[380px]:text-[13px]",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <StageDot
                  stage={s.value}
                  className={cn(selected && "bg-primary-foreground")}
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 text-[11px] tabular-nums",
                    selected ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  {groups[s.value].length}
                </span>
              </button>
            );
          })}
        </div>
        <KanbanColumn
          stage={mobileStage}
          label={label}
          leads={stageLeads}
          onOpen={onOpen}
          onStageChange={onStageChange}
          droppable={false}
          className="bg-transparent dark:bg-transparent [&>header]:hidden [&>div]:px-0"
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
      autoScroll={{ threshold: { x: 0.08, y: 0.15 } }}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="grid min-h-[calc(100dvh-20rem)] auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3">
          {LEAD_STAGES.map((s) => (
            <KanbanColumn
              key={s.value}
              stage={s.value}
              label={s.label}
              leads={groups[s.value]}
              onOpen={onOpen}
              onStageChange={onStageChange}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeLead ? (
          <LeadCardContent
            lead={activeLead}
            onOpen={() => {}}
            onStageChange={() => {}}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
