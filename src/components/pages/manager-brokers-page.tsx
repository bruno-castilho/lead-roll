"use client";

import { Users, UserX } from "lucide-react";
import { useState } from "react";
import { BrokerCard } from "@/components/brokers/broker-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeadStats } from "@/hooks/use-lead-stats";
import type { Lead, User } from "@/lib/types";

type PresenceFilter = "all" | "present" | "absent";

// Leads e corretores ainda sem fonte de dados.
const leads: Lead[] = [];
const brokers: User[] = [];

export function ManagerBrokersPage() {
  const { byBroker, availableBrokers } = useLeadStats(leads, brokers);
  const [filter, setFilter] = useState<PresenceFilter>("all");

  const absent = byBroker.length - availableBrokers;
  const rows = byBroker.filter(({ broker }) =>
    filter === "all"
      ? true
      : filter === "present"
        ? broker.isPresent
        : !broker.isPresent,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corretores"
        description="Acompanhe a presença dos corretores e a carga de leads de cada um."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as PresenceFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">Todos ({byBroker.length})</TabsTrigger>
            <TabsTrigger value="present">
              Disponíveis ({availableBrokers})
            </TabsTrigger>
            <TabsTrigger value="absent">Ausentes ({absent})</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-muted-foreground text-xs">
          Somente corretores disponíveis participam da distribuição.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          {filter === "present" ? (
            <EmptyState
              icon={UserX}
              title="Nenhum corretor disponível"
              description="Os corretores aparecem aqui assim que confirmarem presença."
            />
          ) : (
            <EmptyState
              icon={Users}
              title={
                filter === "absent"
                  ? "Nenhum corretor ausente"
                  : "Nenhum corretor cadastrado"
              }
              description={
                filter === "absent"
                  ? "Todos os corretores confirmaram presença."
                  : undefined
              }
            />
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <BrokerCard key={row.broker.id} {...row} />
          ))}
        </div>
      )}
    </div>
  );
}
