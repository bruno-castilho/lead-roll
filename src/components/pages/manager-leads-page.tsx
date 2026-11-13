"use client";

import {
  CheckCheck,
  Inbox,
  Layers,
  Plus,
  SearchX,
  Shuffle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import { DistributionDialog } from "@/components/leads/distribution-dialog";
import { LeadDetails } from "@/components/leads/lead-details";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadTable } from "@/components/leads/lead-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Kbd } from "@/components/shared/kbd";
import { TableSkeleton } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBrokers } from "@/hooks/use-brokers";
import { useHotkey } from "@/hooks/use-hotkey";
import { useLeadStats } from "@/hooks/use-lead-stats";
import { useLeads } from "@/hooks/use-leads";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import {
  type BrokerFilter,
  countActiveFilters,
  DEFAULT_LEAD_FILTERS,
  filterLeads,
  type LeadFilterState,
} from "@/lib/lead-filters";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUICK_FILTERS: {
  value: BrokerFilter;
  label: string;
  short: string;
  icon: typeof Layers;
  key: "total" | "unassigned" | "assigned";
}[] = [
  {
    value: "all",
    label: "Todos os leads",
    short: "Todos",
    icon: Layers,
    key: "total",
  },
  {
    value: "none",
    label: "Sem responsável",
    short: "Sem resp.",
    icon: Inbox,
    key: "unassigned",
  },
  {
    value: "assigned",
    label: "Distribuídos",
    short: "Distribuídos",
    icon: CheckCheck,
    key: "assigned",
  },
];

export function ManagerLeadsPage() {
  const { brokers } = useBrokers();
  const { leads, loading, addLead, replaceLead } = useLeads();
  const stats = useLeadStats(leads, brokers);

  const [filters, setFilters] = useState<LeadFilterState>(DEFAULT_LEAD_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [distributing, setDistributing] = useState(false);

  const filtered = useMemo(() => filterLeads(leads, filters), [leads, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function updateFilters(next: LeadFilterState) {
    setFilters(next);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(lead: Lead) {
    setViewingId(null);
    setEditing(lead);
    setFormOpen(true);
  }

  function openDelete(lead: Lead) {
    setViewingId(null);
    setDeleting(lead);
  }

  useHotkey("n", openCreate);
  useResetOnHide(() => {
    setFormOpen(false);
    setViewingId(null);
    setDeleting(null);
    setDistributing(false);
  });

  const handlers = {
    onView: (lead: Lead) => setViewingId(lead.id),
    onEdit: openEdit,
    onDelete: openDelete,
  };

  const hasOtherFilters = countActiveFilters({ ...filters, broker: "all" }) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie e distribua os leads imobiliários."
        actions={
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-9 flex-1 sm:flex-none"
              onClick={() => setDistributing(true)}
            >
              <Shuffle />
              Distribuir leads
              <span
                className={cn(
                  "rounded-full px-1.5 font-semibold text-[11px] tabular-nums",
                  stats.unassigned > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {stats.unassigned}
              </span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className="h-9 flex-1 sm:flex-none"
                  onClick={openCreate}
                >
                  <Plus />
                  Novo lead
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Atalho{" "}
                <Kbd className="ml-1 border-transparent bg-background/20 text-inherit">
                  N
                </Kbd>
              </TooltipContent>
            </Tooltip>
          </>
        }
      />

      <fieldset className="grid grid-cols-3 gap-2 sm:gap-3">
        <legend className="sr-only">Filtros rápidos</legend>
        {QUICK_FILTERS.map((q) => {
          const active = filters.broker === q.value;
          const highlight = q.value === "none" && stats.unassigned > 0;
          return (
            <button
              key={q.value}
              type="button"
              aria-pressed={active}
              onClick={() => updateFilters({ ...filters, broker: q.value })}
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
                {stats[q.key]}
              </span>
            </button>
          );
        })}
      </fieldset>

      <LeadFilters
        variant="manager"
        filters={filters}
        onChange={updateFilters}
        brokers={brokers}
      />

      {loading ? (
        <TableSkeleton />
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <EmptyState
            icon={Inbox}
            title="Nenhum lead cadastrado"
            description="Cadastre o primeiro lead para começar a distribuir oportunidades entre os corretores."
            action={
              <Button size="lg" onClick={openCreate}>
                <Plus /> Novo lead
              </Button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          {filters.broker === "none" && !hasOtherFilters ? (
            <EmptyState
              icon={CheckCheck}
              title="Nenhum lead sem responsável"
              description="Todos os leads já foram distribuídos entre os corretores."
              action={
                <Button variant="outline" size="lg" onClick={openCreate}>
                  <Plus /> Novo lead
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nenhum lead encontrado"
              description="Nenhum lead corresponde à pesquisa e aos filtros aplicados."
              action={
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    updateFilters({
                      ...DEFAULT_LEAD_FILTERS,
                      sort: filters.sort,
                    })
                  }
                >
                  Limpar filtros
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <LeadTable leads={pageItems} brokers={brokers} {...handlers} />
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      <LeadForm
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editing}
        onCreated={addLead}
        onUpdated={replaceLead}
      />
      <LeadDetails
        leads={leads}
        brokers={brokers}
        mode="manager"
        leadId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />
      <DeleteLeadDialog
        lead={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
      <DistributionDialog
        open={distributing}
        onOpenChange={setDistributing}
        leads={leads}
        brokers={brokers}
      />
    </div>
  );
}
