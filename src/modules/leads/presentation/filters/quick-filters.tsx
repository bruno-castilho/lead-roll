"use client";

import { CheckCheck, Inbox, Layers, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/ui/cn";
import type { LeadCounts } from "../../domain/workload";
import type { BrokerFilter } from "./filter-leads";

const QUICK_FILTERS: {
  value: BrokerFilter;
  label: string;
  short: string;
  icon: LucideIcon;
  count: keyof LeadCounts;
}[] = [
  {
    value: "all",
    label: "Todos os leads",
    short: "Todos",
    icon: Layers,
    count: "total",
  },
  {
    value: "none",
    label: "Sem responsável",
    short: "Sem resp.",
    icon: Inbox,
    count: "unassigned",
  },
  {
    value: "assigned",
    label: "Distribuídos",
    short: "Distribuídos",
    icon: CheckCheck,
    count: "assigned",
  },
];

interface QuickFiltersProps {
  selected: BrokerFilter;
  counts: LeadCounts;
  onSelect: (value: BrokerFilter) => void;
}

/** Cartões com os totais que também filtram por responsável. */
export function QuickFilters({
  selected,
  counts,
  onSelect,
}: QuickFiltersProps) {
  return (
    <fieldset className="grid grid-cols-3 gap-2 sm:gap-3">
      <legend className="sr-only">Filtros rápidos</legend>
      {QUICK_FILTERS.map((q) => {
        const active = selected === q.value;
        const highlight = q.value === "none" && counts.unassigned > 0;
        return (
          <button
            key={q.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(q.value)}
            className={cn(
              "group flex flex-col items-start gap-1 rounded-xl border bg-card p-3 text-left transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-4",
              active && "border-primary ring-1 ring-primary",
              highlight && !active && "border-primary/40",
            )}
          >
            <span className="flex w-full items-center justify-between gap-1 text-muted-foreground text-xs sm:text-[13px]">
              <span className="truncate">
                <span className="sm:hidden">{q.short}</span>
                <span className="hidden sm:inline">{q.label}</span>
              </span>
              <q.icon
                className={cn(
                  "hidden size-4 shrink-0 sm:block",
                  (active || highlight) && "text-primary",
                )}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "font-semibold text-xl tabular-nums tracking-tight sm:text-2xl",
                highlight && "text-primary",
              )}
            >
              {counts[q.count]}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
