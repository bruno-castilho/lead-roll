import {
  errorMessage,
  NETWORK_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "@/shared/ui/error-message";
import {
  LeadsError,
  type LeadsFailure,
  type LeadsOperation,
} from "../application/leads-error";
import { OBSERVATION_MAX_LENGTH } from "../domain/lead-input";

const INVALID_LEAD =
  "Os dados do lead são inválidos. Revise os campos e tente novamente.";

const MESSAGES: Record<
  LeadsOperation,
  Partial<Record<LeadsFailure, string>> & { unknown: string }
> = {
  listLeads: {
    unknown: "Não foi possível carregar os leads. Tente novamente.",
  },
  createLead: {
    forbidden: "Apenas o gestor pode cadastrar leads.",
    invalid: INVALID_LEAD,
    unknown: "Não foi possível cadastrar o lead. Tente novamente.",
  },
  updateLead: {
    forbidden: "Apenas o gestor pode editar leads.",
    not_found: "O lead não foi encontrado. Ele pode ter sido excluído.",
    invalid: INVALID_LEAD,
    unknown: "Não foi possível salvar as alterações do lead. Tente novamente.",
  },
  deleteLead: {
    forbidden: "Apenas o gestor pode excluir leads.",
    not_found: "O lead não foi encontrado. Ele pode já ter sido excluído.",
    unknown: "Não foi possível excluir o lead. Tente novamente.",
  },
  changeStage: {
    forbidden: "Apenas o corretor responsável pode mudar a etapa deste lead.",
    not_found:
      "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.",
    invalid: "A etapa escolhida é inválida.",
    unknown: "Não foi possível mudar a etapa do lead. Tente novamente.",
  },
  addObservation: {
    forbidden:
      "Apenas o corretor responsável pode registrar observações neste lead.",
    invalid: `A observação é inválida. Escreva de 1 a ${OBSERVATION_MAX_LENGTH} caracteres.`,
    unknown: "Não foi possível adicionar a observação. Tente novamente.",
  },
  distributeLeads: {
    forbidden: "Apenas o gestor pode distribuir leads.",
    unknown: "Não foi possível distribuir os leads. Tente novamente.",
  },
};

/** Texto pt-BR para mostrar ao usuário quando uma operação falha. */
export function leadsErrorMessage(error: unknown): string {
  if (!(error instanceof LeadsError)) return errorMessage(error);
  if (error.reason === "network") return NETWORK_MESSAGE;
  if (error.reason === "auth") return SESSION_EXPIRED_MESSAGE;
  const messages = MESSAGES[error.operation];
  return messages[error.reason] ?? messages.unknown;
}
