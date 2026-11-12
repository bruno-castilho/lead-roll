"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  CalendarClock,
  GripVertical,
  MessageSquareText,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import { StageDot } from "@/components/shared/stage-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { INTEREST_LABEL, LEAD_STAGES, SOURCE_LABEL } from "@/lib/constants";
import { formatShortDateTime } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: Lead;
  onOpen: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
  /** Habilita arrastar e soltar (desktop). */
  draggable?: boolean;
  /** Renderização dentro do DragOverlay. */
  overlay?: boolean;
}

export function LeadCardContent({
  lead,
  onOpen,
  onStageChange,
  overlay,
  dragHandle,
}: Omit<LeadCardProps, "draggable"> & { dragHandle?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-3 text-left transition-[border-color,box-shadow] hover:border-foreground/20",
        overlay &&
          "rotate-[1.5deg] cursor-grabbing border-primary/50 shadow-lg ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-1.5">
        {dragHandle}
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          <p className="truncate pr-6 font-medium text-sm">{lead.name}</p>
        </button>
        <div className="absolute top-1.5 right-1.5 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:aria-expanded:opacity-100"
                aria-label={`Ações para ${lead.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => onOpen(lead)}>
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Mover para
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={lead.stage}
                onValueChange={(v) => onStageChange(lead, v as LeadStage)}
              >
                {LEAD_STAGES.map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value}>
                    <StageDot stage={s.value} />
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums">
        <Phone className="size-3" aria-hidden />
        {lead.phone}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {INTEREST_LABEL[lead.interest]}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {SOURCE_LABEL[lead.source]}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1" title="Data de atribuição">
          <CalendarClock className="size-3" aria-hidden />
          Recebido {formatShortDateTime(lead.assignedAt)}
        </span>
        {lead.observations.length > 0 && (
          <span className="flex items-center gap-1" title="Observações">
            <MessageSquareText className="size-3" aria-hidden />
            {lead.observations.length}
          </span>
        )}
      </div>
    </div>
  );
}

export function LeadCard({
  lead,
  onOpen,
  onStageChange,
  draggable = false,
}: LeadCardProps) {
  // Teclado e leitores de tela usam o menu "Mover para"; o arraste é por ponteiro.
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(isDragging && "opacity-40")}
      {...(draggable ? listeners : {})}
    >
      <LeadCardContent
        lead={lead}
        onOpen={onOpen}
        onStageChange={onStageChange}
        dragHandle={
          draggable ? (
            <GripVertical
              className="-ml-1 mt-0.5 size-3.5 shrink-0 cursor-grab text-muted-foreground/50 group-hover:text-muted-foreground"
              aria-hidden
            />
          ) : null
        }
      />
    </div>
  );
}
