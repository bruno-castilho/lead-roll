import type { LeadInterest, LeadSource } from "./lead";
import { formatPhone } from "./phone";

/** Limites de cada campo (os mesmos das constraints da tabela `leads`). */
export const LEAD_NAME_MIN_LENGTH = 3;
export const LEAD_NAME_MAX_LENGTH = 80;
export const OBSERVATION_MAX_LENGTH = 1000;

/** Dados do formulário de lead, já validados (e-mail vazio quando ausente). */
export interface LeadDraft {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interest: LeadInterest;
}

/** Dados editáveis de um lead, como são gravados. */
export interface LeadInput {
  name: string;
  /** Com a máscara brasileira: (11) 98765-4321. */
  phone: string;
  email: string | null;
  source: LeadSource;
  interest: LeadInterest;
}

/** O telefone é gravado com máscara e o e-mail vazio vira ausente. */
export function toLeadInput(draft: LeadDraft): LeadInput {
  return {
    name: draft.name,
    phone: formatPhone(draft.phone),
    email: draft.email || null,
    source: draft.source,
    interest: draft.interest,
  };
}
