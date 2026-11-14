"use client";

import { Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { LeadKanban } from "@/components/kanban/lead-kanban";
import { LeadDetails } from "@/components/leads/lead-details";
import { useAddObservation } from "@/hooks/use-add-observation";
import { useChangeStage } from "@/hooks/use-change-stage";
import { useLeads } from "@/hooks/use-leads";
import { useSession } from "@/hooks/use-session";
import { PresenceToggle, useBrokers, usePresence } from "@/modules/brokers";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { Spinner } from "@/shared/ui/components/loading-state";
import { PageHeader } from "@/shared/ui/components/page-header";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";

export function BrokerLeadsPage() {
  const { profile } = useSession();
  const { isPresent, loading: presenceLoading } = usePresence();
  // A consulta já filtra por `broker_id` e a RLS só devolve os leads do
  // corretor. A RLS de `profiles` devolve só o perfil dele em `brokers`.
  const { leads, loading, replaceLead, addObservation } = useLeads({
    own: true,
  });
  const { brokers } = useBrokers();
  const changeStage = useChangeStage(replaceLead);
  const addLeadObservation = useAddObservation(addObservation);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useResetOnHide(() => setViewingId(null));

  // Permissão: o corretor enxerga exclusivamente os leads atribuídos a ele
  // (última barreira no cliente, além do filtro da consulta e da RLS).
  const myLeads = useMemo(
    () => leads.filter((l) => profile && l.brokerId === profile.id),
    [leads, profile],
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Meus leads" />

      {!presenceLoading && !isPresent && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-medium text-sm">Você está ausente</p>
            <p className="text-muted-foreground text-xs">
              Confirme sua presença para receber novos leads na próxima
              distribuição. Seus leads atuais não são alterados.
            </p>
          </div>
          <PresenceToggle className="w-full sm:w-auto" />
        </div>
      )}

      {loading ? (
        <output
          aria-label="Carregando leads"
          className="flex justify-center rounded-xl border border-dashed py-16"
        >
          <Spinner className="size-5 text-muted-foreground" />
        </output>
      ) : myLeads.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <EmptyState
            icon={Inbox}
            title="Nenhum lead atribuído a você"
            description={
              isPresent
                ? "Você está disponível. Novos leads aparecerão aqui após a próxima distribuição do gestor."
                : "Confirme sua presença para participar da próxima distribuição de leads."
            }
          />
        </div>
      ) : (
        <LeadKanban
          leads={myLeads}
          onOpen={(lead) => setViewingId(lead.id)}
          onStageChange={changeStage}
        />
      )}

      <LeadDetails
        leads={myLeads}
        brokers={brokers}
        mode="broker"
        leadId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
        onStageChange={changeStage}
        onAddObservation={addLeadObservation}
      />
    </div>
  );
}
