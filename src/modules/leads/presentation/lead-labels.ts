import {
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STAGES,
  type LeadInterest,
  type LeadSource,
  type LeadStage,
} from "../domain/lead";

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: "Novo",
  contacted: "Em contato",
  visit_scheduled: "Visita agendada",
  proposal: "Proposta",
  won: "Ganho",
  lost: "Perdido",
};

/** Cor discreta (ponto) usada para diferenciar as etapas sem excesso de cor. */
export const STAGE_DOT: Record<LeadStage, string> = {
  new: "bg-primary",
  contacted: "bg-chart-4",
  visit_scheduled: "bg-warning",
  proposal: "bg-violet-500",
  won: "bg-success",
  lost: "bg-muted-foreground/60",
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  referral: "Indicação",
  portal: "Portal imobiliário",
  campaign: "Campanha",
  other: "Outros",
};

export const INTEREST_LABEL: Record<LeadInterest, string> = {
  buy: "Compra",
  rent: "Aluguel",
  apartment: "Apartamento",
  house: "Casa",
  land: "Terreno",
  commercial: "Comercial",
  other: "Outros",
};

/** Opções para listas e seletores, na ordem do domínio. */
export const STAGE_OPTIONS = LEAD_STAGES.map((value) => ({
  value,
  label: STAGE_LABEL[value],
}));
export const SOURCE_OPTIONS = LEAD_SOURCES.map((value) => ({
  value,
  label: SOURCE_LABEL[value],
}));
export const INTEREST_OPTIONS = LEAD_INTERESTS.map((value) => ({
  value,
  label: INTEREST_LABEL[value],
}));
