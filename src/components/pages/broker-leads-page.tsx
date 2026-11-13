"use client";

import { Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { LeadKanban } from "@/components/kanban/lead-kanban";
import { PresenceToggle } from "@/components/layout/presence-toggle";
import { LeadDetails } from "@/components/leads/lead-details";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useChangeStage } from "@/hooks/use-change-stage";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { useSession } from "@/hooks/use-session";
import type { Lead, User } from "@/lib/types";

// Leads, corretores e presença ainda sem fonte de dados.
const leads: Lead[] = [];
const brokers: User[] = [];
const isPresent = false;

export function BrokerLeadsPage() {
  const { profile } = useSession();
  const changeStage = useChangeStage();
  const [viewingId, setViewingId] = useState<string | null>(null);

  useResetOnHide(() => setViewingId(null));

  // Permissão: o corretor enxerga exclusivamente os leads atribuídos a ele.
  const myLeads = useMemo(
    () => leads.filter((l) => profile && l.brokerId === profile.id),
    [profile],
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Meus leads" />

      {!isPresent && (
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

      {myLeads.length === 0 ? (
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
        leads={leads}
        brokers={brokers}
        mode="broker"
        leadId={viewingId}
        onOpenChange={(open) => !open && setViewingId(null)}
      />
    </div>
  );
}
