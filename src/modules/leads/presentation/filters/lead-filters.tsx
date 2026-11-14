"use client";

import { ArrowDownWideNarrow, FilterX } from "lucide-react";
import type { Broker } from "@/modules/brokers";
import { isOneOf } from "@/shared/domain/one-of";
import { cn } from "@/shared/ui/cn";
import { SearchInput } from "@/shared/ui/components/search-input";
import { Button } from "@/shared/ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { LEAD_SOURCES, LEAD_STAGES } from "../../domain/lead";
import { SOURCE_OPTIONS, STAGE_OPTIONS } from "../lead-labels";
import {
  countActiveFilters,
  DEFAULT_LEAD_FILTERS,
  type LeadFilterState,
  SORT_ORDERS,
} from "./filter-leads";

const ACTIVE_FILTER_CLASS = "border-primary/40 bg-primary/5 dark:bg-primary/10";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "h-9 w-full min-w-0 sm:w-auto sm:min-w-36",
          value !== "all" && ACTIVE_FILTER_CLASS,
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
  brokers: Broker[];
}

/** Pesquisa, origem, etapa, responsável e ordenação da lista do gestor. */
export function LeadFilters({ filters, onChange, brokers }: LeadFiltersProps) {
  const setFilter = <K extends keyof LeadFilterState>(
    key: K,
    value: LeadFilterState[K],
  ) => onChange({ ...filters, [key]: value });
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <SearchInput
        value={filters.query}
        onChange={(v) => setFilter("query", v)}
        placeholder="Pesquisar por nome ou telefone"
        className="w-full lg:max-w-xs"
      />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <FilterSelect
          label="Origem"
          allLabel="Todas as origens"
          value={filters.source}
          onChange={(v) => {
            if (v === "all" || isOneOf(v, LEAD_SOURCES)) setFilter("source", v);
          }}
          options={SOURCE_OPTIONS}
        />
        <FilterSelect
          label="Etapa"
          allLabel="Todas as etapas"
          value={filters.stage}
          onChange={(v) => {
            if (v === "all" || isOneOf(v, LEAD_STAGES)) setFilter("stage", v);
          }}
          options={STAGE_OPTIONS}
        />
        <Select
          value={filters.broker}
          onValueChange={(v) => setFilter("broker", v)}
        >
          <SelectTrigger
            aria-label="Responsável"
            className={cn(
              "h-9 w-full min-w-0 sm:w-auto sm:min-w-40",
              filters.broker !== "all" && ACTIVE_FILTER_CLASS,
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
          onValueChange={(v) => {
            if (isOneOf(v, SORT_ORDERS)) setFilter("sort", v);
          }}
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
