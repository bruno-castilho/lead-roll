import type { Lead, User } from "./types";

export interface DistributionPlan {
  /** Leads sem responsável, na ordem em que serão distribuídos (mais antigos primeiro). */
  leads: Lead[];
  /** Corretores disponíveis, na ordem do rodízio para esta operação. */
  brokers: User[];
  /** leadId → brokerId */
  assignments: Map<string, string>;
  /** brokerId → quantidade que receberá */
  countByBroker: Map<string, number>;
  /** Último corretor que receberá um lead (novo cursor do rodízio). */
  nextCursor: string | null;
}

/**
 * Planeja a distribuição em rodízio (round-robin).
 *
 * - Considera somente leads sem responsável e corretores com presença confirmada.
 * - O cursor guarda o último corretor que recebeu um lead; a próxima operação
 *   começa no corretor seguinte da lista completa, para que distribuições
 *   sucessivas continuem a alternância em vez de sempre começar pelo primeiro.
 */
export function planDistribution(
  leads: Lead[],
  users: User[],
  cursor: string | null,
): DistributionPlan {
  const roster = users.filter((u) => u.role === "broker");
  const pending = leads
    .filter((l) => l.brokerId === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const cursorIndex = cursor ? roster.findIndex((b) => b.id === cursor) : -1;
  const start = cursorIndex + 1;
  const rotated = [...roster.slice(start), ...roster.slice(0, start)];
  const brokers = rotated.filter((b) => b.isPresent);

  const assignments = new Map<string, string>();
  const countByBroker = new Map<string, number>(brokers.map((b) => [b.id, 0]));
  let nextCursor = cursor;

  if (brokers.length > 0) {
    pending.forEach((lead, i) => {
      const broker = brokers[i % brokers.length];
      assignments.set(lead.id, broker.id);
      countByBroker.set(broker.id, (countByBroker.get(broker.id) ?? 0) + 1);
      nextCursor = broker.id;
    });
  }

  return { leads: pending, brokers, assignments, countByBroker, nextCursor };
}

/** Aplica o plano aos leads, registrando responsável, etapa inicial e data de atribuição. */
export function applyDistribution(
  leads: Lead[],
  plan: DistributionPlan,
  assignedAt: string,
): Lead[] {
  return leads.map((lead) => {
    const brokerId = plan.assignments.get(lead.id);
    if (!brokerId || lead.brokerId !== null) return lead;
    return { ...lead, brokerId, assignedAt, stage: "new" };
  });
}
