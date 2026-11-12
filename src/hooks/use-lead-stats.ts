"use client";

import { useMemo } from "react";
import { ACTIVE_STAGES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

export function useLeadStats() {
  const { leads, brokers } = useAppStore();

  return useMemo(() => {
    const unassigned = leads.filter((l) => l.brokerId === null).length;
    const byBroker = brokers.map((broker) => {
      const own = leads.filter((l) => l.brokerId === broker.id);
      return {
        broker,
        total: own.length,
        active: own.filter((l) => ACTIVE_STAGES.includes(l.stage)).length,
      };
    });

    return {
      total: leads.length,
      unassigned,
      assigned: leads.length - unassigned,
      availableBrokers: brokers.filter((b) => b.isPresent).length,
      byBroker,
    };
  }, [leads, brokers]);
}
