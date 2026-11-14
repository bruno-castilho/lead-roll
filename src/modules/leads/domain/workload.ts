import { isActiveStage, isUnassigned, type Lead } from "./lead";

export interface LeadCounts {
  total: number;
  unassigned: number;
  assigned: number;
}

/** Totais da carteira: todos, sem responsável e distribuídos. */
export function countLeads(leads: readonly Lead[]): LeadCounts {
  const unassigned = leads.filter(isUnassigned).length;
  return {
    total: leads.length,
    unassigned,
    assigned: leads.length - unassigned,
  };
}

export interface BrokerWorkload {
  /** Leads atribuídos ao corretor. */
  total: number;
  /** Desses, os que estão em atendimento. */
  active: number;
}

export function brokerWorkload(
  leads: readonly Lead[],
  brokerId: string,
): BrokerWorkload {
  const own = leads.filter((lead) => lead.brokerId === brokerId);
  return {
    total: own.length,
    active: own.filter((lead) => isActiveStage(lead.stage)).length,
  };
}
