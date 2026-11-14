"use client";

import { useMemo, useState } from "react";
import { useBrokers } from "@/modules/brokers";
import {
  countActiveFilters,
  DEFAULT_LEAD_FILTERS,
  DeleteLeadDialog,
  DistributionDialog,
  type EmptyLeadListReason,
  filterLeads,
  type Lead,
  LeadDetails,
  type LeadFilterState,
  LeadFilters,
  LeadForm,
  LeadListEmpty,
  LeadsHeaderActions,
  LeadTable,
  QuickFilters,
  useLeadStats,
  useLeads,
} from "@/modules/leads";
import { TableSkeleton } from "@/shared/ui/components/loading-state";
import { PageHeader } from "@/shared/ui/components/page-header";
import { Pagination } from "@/shared/ui/components/pagination";
import { useHotkey } from "@/shared/ui/hooks/use-hotkey";
import { usePagination } from "@/shared/ui/hooks/use-pagination";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";

/** Página inicial do gestor: totais, filtros, tabela, CRUD e distribuição. */
export function ManagerLeadsScreen() {
  const { brokers } = useBrokers();
  const { leads, loading, addLead, replaceLead, removeLead } = useLeads();
  const stats = useLeadStats(leads, brokers);

  const [filters, setFilters] = useState<LeadFilterState>(DEFAULT_LEAD_FILTERS);
  const filtered = useMemo(() => filterLeads(leads, filters), [leads, filters]);
  const pagination = usePagination(filtered);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [distributing, setDistributing] = useState(false);

  function updateFilters(next: LeadFilterState) {
    setFilters(next);
    pagination.resetPage();
  }

  function clearFilters() {
    updateFilters({ ...DEFAULT_LEAD_FILTERS, sort: filters.sort });
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

  const hasOtherFilters = countActiveFilters({ ...filters, broker: "all" }) > 0;
  const emptyReason: EmptyLeadListReason | null =
    leads.length === 0
      ? "no_leads"
      : filtered.length > 0
        ? null
        : filters.broker === "none" && !hasOtherFilters
          ? "all_assigned"
          : "no_results";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie e distribua os leads imobiliários."
        actions={
          <LeadsHeaderActions
            unassigned={stats.unassigned}
            onDistribute={() => setDistributing(true)}
            onCreate={openCreate}
          />
        }
      />

      <QuickFilters
        selected={filters.broker}
        counts={stats}
        onSelect={(broker) => updateFilters({ ...filters, broker })}
      />

      <LeadFilters
        filters={filters}
        onChange={updateFilters}
        brokers={brokers}
      />

      {loading ? (
        <TableSkeleton />
      ) : emptyReason ? (
        <LeadListEmpty
          reason={emptyReason}
          onCreate={openCreate}
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="space-y-4">
          <LeadTable
            leads={pagination.pageItems}
            brokers={brokers}
            onView={(lead) => setViewingId(lead.id)}
            onEdit={openEdit}
            onDelete={openDelete}
          />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
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
        leadId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />
      <DeleteLeadDialog
        lead={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={removeLead}
      />
      <DistributionDialog
        open={distributing}
        onOpenChange={setDistributing}
        leads={leads}
        brokers={brokers}
        onDistributed={(list) => list.forEach(replaceLead)}
      />
    </div>
  );
}
