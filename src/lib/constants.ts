import type { LeadInterest, LeadSource, LeadStage } from "./types";

export const LEAD_STAGES: { value: LeadStage; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Em contato" },
  { value: "visit_scheduled", label: "Visita agendada" },
  { value: "proposal", label: "Proposta" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];

export const STAGE_LABEL: Record<LeadStage, string> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.value, s.label]),
) as Record<LeadStage, string>;

/** Cor discreta (ponto) usada para diferenciar as etapas sem excesso de cor. */
export const STAGE_DOT: Record<LeadStage, string> = {
  new: "bg-primary",
  contacted: "bg-chart-4",
  visit_scheduled: "bg-warning",
  proposal: "bg-violet-500",
  won: "bg-success",
  lost: "bg-muted-foreground/60",
};

/** Etapas consideradas "em atendimento" (lead ativo com o corretor). */
export const ACTIVE_STAGES: LeadStage[] = [
  "contacted",
  "visit_scheduled",
  "proposal",
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Indicação" },
  { value: "portal", label: "Portal imobiliário" },
  { value: "campaign", label: "Campanha" },
  { value: "other", label: "Outros" },
];

export const SOURCE_LABEL: Record<LeadSource, string> = Object.fromEntries(
  LEAD_SOURCES.map((s) => [s.value, s.label]),
) as Record<LeadSource, string>;

export const LEAD_INTERESTS: { value: LeadInterest; label: string }[] = [
  { value: "buy", label: "Compra" },
  { value: "rent", label: "Aluguel" },
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
  { value: "other", label: "Outros" },
];

export const INTEREST_LABEL: Record<LeadInterest, string> = Object.fromEntries(
  LEAD_INTERESTS.map((s) => [s.value, s.label]),
) as Record<LeadInterest, string>;

export const PAGE_SIZES = [10, 20, 50] as const;

export const ROUTES = {
  login: "/login",
  managerLeads: "/gestor/leads",
  managerBrokers: "/gestor/corretores",
  brokerLeads: "/corretor/leads",
} as const;
