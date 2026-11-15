import type { Actor } from "@/shared/domain/actor";
import { activeUntil } from "../domain/presence";
import {
  canConfirmPresence,
  canIssuePresenceToken,
} from "../domain/presence-policy";
import {
  type PresenceToken,
  parsePresenceToken,
} from "../domain/presence-token";
import { BrokersError } from "./brokers-error";
import type {
  Clock,
  PresenceRepository,
  PresenceTokenRepository,
} from "./ports";

/** Presença do corretor conectado: até quando ele está na fila. */
export interface OwnPresence {
  /** Fim da presença atual; `null` quando o corretor está ausente. */
  activeUntil: string | null;
}

export interface ConfirmedPresence extends OwnPresence {
  /** Prazo gravado pelo banco nesta confirmação. */
  expiresAt: string;
}

type Deps = { presence: PresenceRepository; now: Clock };

/** Busca a presença do corretor conectado. */
export function makeLoadOwnPresence(deps: Deps) {
  return async function loadOwnPresence(actor: Actor): Promise<OwnPresence> {
    const presence = await deps.presence.findByBroker(actor.id);
    return { activeUntil: activeUntil(presence, deps.now()) };
  };
}

/**
 * Confirma a presença por 5h com o token lido no QR code (ausente: entra no
 * fim da fila; presente: renova e mantém a posição). Só corretores; a regra
 * da fila e a validade do token ficam no banco. Um link sem token no formato
 * certo é recusado sem ir à rede.
 */
export function makeConfirmPresence(deps: Deps) {
  return async function confirmPresence(
    actor: Actor,
    rawToken: string | null,
  ): Promise<ConfirmedPresence> {
    if (!canConfirmPresence(actor)) {
      throw new BrokersError("confirmPresence", "forbidden");
    }
    const token = parsePresenceToken(rawToken);
    if (!token) throw new BrokersError("confirmPresence", "invalid_token");
    const presence = await deps.presence.confirm(token);
    return {
      expiresAt: presence.expiresAt,
      activeUntil: activeUntil(presence, deps.now()),
    };
  };
}

/** Emite o próximo QR code de presença (válido por 5 minutos). Só o totem. */
export function makeIssuePresenceToken(deps: {
  tokens: PresenceTokenRepository;
}) {
  return async function issuePresenceToken(
    actor: Actor,
  ): Promise<PresenceToken> {
    if (!canIssuePresenceToken(actor)) {
      throw new BrokersError("issuePresenceToken", "forbidden");
    }
    return deps.tokens.issue();
  };
}
