/** Etapas do atendimento, na ordem do funil (enum `lead_stage`). */
export const LEAD_STAGES = [
  "new",
  "contacted",
  "visit_scheduled",
  "proposal",
  "won",
  "lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Etapas "em atendimento": o lead está ativo com o corretor. */
export const ACTIVE_STAGES: readonly LeadStage[] = [
  "contacted",
  "visit_scheduled",
  "proposal",
];

/** Origens do lead (enum `lead_source`). */
export const LEAD_SOURCES = [
  "site",
  "whatsapp",
  "instagram",
  "referral",
  "portal",
  "campaign",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Interesses do lead (enum `lead_interest`). */
export const LEAD_INTERESTS = [
  "buy",
  "rent",
  "apartment",
  "house",
  "land",
  "commercial",
  "other",
] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

export interface Observation {
  id: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  interest: LeadInterest;
  stage: LeadStage;
  /** Corretor responsável; `null` enquanto aguarda distribuição. */
  brokerId: string | null;
  createdAt: string;
  assignedAt: string | null;
  observations: Observation[];
}

export function isLeadStage(value: unknown): value is LeadStage {
  return LEAD_STAGES.some((stage) => stage === value);
}

export function isActiveStage(stage: LeadStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

/** Lead sem responsável: entra na próxima distribuição. */
export function isUnassigned(lead: Pick<Lead, "brokerId">): boolean {
  return lead.brokerId === null;
}
