"use client";

import { useMemo } from "react";
import type { Broker } from "@/modules/brokers";
import type { Lead } from "../../domain/lead";
import { brokerWorkload, countLeads } from "../../domain/workload";

/** Totais da carteira e carga de cada corretor, para os filtros e cartões. */
export function useLeadStats(leads: Lead[], brokers: Broker[]) {
  return useMemo(
    () => ({
      ...countLeads(leads),
      availableBrokers: brokers.filter((b) => b.isPresent).length,
      byBroker: brokers.map((broker) => ({
        broker,
        ...brokerWorkload(leads, broker.id),
      })),
    }),
    [leads, brokers],
  );
}
