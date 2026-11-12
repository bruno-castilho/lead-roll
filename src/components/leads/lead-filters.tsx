"use client";

import { ArrowDownWideNarrow, FilterX } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_INTERESTS, LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import {
  countActiveFilters,
  DEFAULT_LEAD_FILTERS,
  type LeadFilterState,
} from "@/lib/lead-filters";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  className?: string;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  className,
}: FilterSelectProps) {
  const active = value !== "all";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 w-full min-w-0 sm:w-auto sm:min-w-36",
          active && "border-primary/40 bg-primary/5 dark:bg-primary/10",
          className,
        )}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        <SelectSeparator />
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface LeadFiltersProps {
  filters: LeadFilterState;
  onChange: (filters: LeadFilterState) => void;
  /** Gestor: origem, etapa, responsável e ordenação. Corretor: origem e interesse. */
  variant: "manager" | "broker";
  brokers?: User[];
}

export function LeadFilters({
  filters,
  onChange,
  variant,
  brokers = [],
}: LeadFiltersProps) {
  const set = <K extends keyof LeadFilterState>(
    key: K,
    value: LeadFilterState[K],
  ) => onChange({ ...filters, [key]: value });
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <SearchInput
        value={filters.query}
        onChange={(v) => set("query", v)}
        placeholder="Pesquisar por nome ou telefone"
        className="w-full lg:max-w-xs"
      />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <FilterSelect
          label="Origem"
          allLabel="Todas as origens"
          value={filters.source}
          onChange={(v) => set("source", v as LeadFilterState["source"])}
          options={LEAD_SOURCES}
        />
        {variant === "broker" && (
          <FilterSelect
            label="Interesse"
            allLabel="Todos os interesses"
            value={filters.interest}
            onChange={(v) => set("interest", v as LeadFilterState["interest"])}
            options={LEAD_INTERESTS}
          />
        )}
        {variant === "manager" && (
          <>
            <FilterSelect
              label="Etapa"
              allLabel="Todas as etapas"
              value={filters.stage}
              onChange={(v) => set("stage", v as LeadFilterState["stage"])}
              options={LEAD_STAGES}
            />
            <Select
              value={filters.broker}
              onValueChange={(v) => set("broker", v)}
            >
              <SelectTrigger
                aria-label="Responsável"
                className={cn(
                  "h-9 w-full min-w-0 sm:w-auto sm:min-w-40",
                  filters.broker !== "all" &&
                    "border-primary/40 bg-primary/5 dark:bg-primary/10",
                )}
              >
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                <SelectItem value="none">Sem responsável</SelectItem>
                <SelectItem value="assigned">Com responsável</SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Corretores</SelectLabel>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={filters.sort}
              onValueChange={(v) => set("sort", v as LeadFilterState["sort"])}
            >
              <SelectTrigger
                aria-label="Ordenar"
                className="h-9 w-full min-w-0 sm:w-auto"
              >
                <ArrowDownWideNarrow className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() =>
              onChange({ ...DEFAULT_LEAD_FILTERS, sort: filters.sort })
            }
            className="col-span-2 h-9 text-muted-foreground sm:col-span-1"
          >
            <FilterX />
            Limpar filtros
            <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums">
              {activeCount}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
