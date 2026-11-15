"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { cn } from "@/shared/ui/cn";
import { useMediaQuery } from "@/shared/ui/hooks/use-media-query";
import { isLeadStage, type Lead, type LeadStage } from "../../domain/lead";
import { STAGE_LABEL, STAGE_OPTIONS } from "../lead-labels";
import { StageDot } from "../stage-badge";
import { KanbanColumn } from "./kanban-column";
import { LeadCardContent } from "./lead-card";

interface LeadKanbanProps {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
}

/** Colunas lado a lado a partir do breakpoint `md` do Tailwind. */
const DESKTOP_QUERY = "(min-width: 768px)";
/** O arraste só começa depois desse deslocamento, para o clique abrir o card. */
const DRAG_ACTIVATION_DISTANCE_PX = 6;

function groupByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const groups: Record<LeadStage, Lead[]> = {
    new: [],
    contacted: [],
    visit_scheduled: [],
    proposal: [],
    won: [],
    lost: [],
  };
  // Mais recentes primeiro: pela atribuição ou, sem ela, pelo cadastro.
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
  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const groups = useMemo(() => groupByStage(leads), [leads]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [mobileStage, setMobileStage] = useState<LeadStage>("new");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
    }),
  );

  const findLead = (id: UniqueIdentifier) => leads.find((l) => l.id === id);

  function handleDragStart(event: DragStartEvent) {
    setActiveLead(findLead(event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const lead = findLead(event.active.id);
    const target = event.over?.id;
    if (lead && isLeadStage(target) && lead.stage !== target) {
      onStageChange(lead, target);
    }
  }

  if (!isDesktop) {
    const stageLeads = groups[mobileStage];
    const label = STAGE_LABEL[mobileStage];
    return (
      <div className="space-y-3">
        <div
          role="tablist"
          aria-label="Etapas"
          className="grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-3"
        >
          {STAGE_OPTIONS.map((s) => {
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
          {STAGE_OPTIONS.map((s) => (
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
