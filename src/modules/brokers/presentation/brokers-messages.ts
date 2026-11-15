import {
  errorMessage,
  NETWORK_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "@/shared/ui/error-message";
import {
  BrokersError,
  type BrokersFailure,
  type BrokersOperation,
} from "../application/brokers-error";

const MESSAGES: Record<
  BrokersOperation,
  Partial<Record<BrokersFailure, string>> & { unknown: string }
> = {
  listBrokers: {
    unknown: "Não foi possível carregar os corretores. Tente novamente.",
  },
  loadPresence: {
    unknown: "Não foi possível carregar sua presença. Tente novamente.",
  },
  confirmPresence: {
    forbidden: "Apenas corretores podem confirmar presença.",
    invalid_token:
      "Este QR code expirou. Escaneie o código que está na tela da empresa agora.",
    unknown: "Não foi possível confirmar sua presença. Tente novamente.",
  },
  issuePresenceToken: {
    forbidden: "Apenas o totem pode gerar o QR code de presença.",
    unknown: "Não foi possível gerar o QR code de presença.",
  },
};

/** Texto pt-BR para mostrar ao usuário quando uma operação falha. */
export function brokersErrorMessage(error: unknown): string {
  if (!(error instanceof BrokersError)) return errorMessage(error);
  if (error.reason === "network") return NETWORK_MESSAGE;
  if (error.reason === "auth") return SESSION_EXPIRED_MESSAGE;
  const messages = MESSAGES[error.operation];
  return messages[error.reason] ?? messages.unknown;
}
