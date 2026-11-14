import type { Actor } from "@/shared/domain/actor";
import { activeUntil } from "../domain/presence";
import { canConfirmPresence } from "../domain/presence-policy";
import { BrokersError } from "./brokers-error";
import type { Clock, PresenceRepository } from "./ports";

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
 * Confirma a presença por 5h (ausente: entra no fim da fila; presente: renova
 * e mantém a posição). Só corretores; a regra da fila fica no banco.
 */
export function makeConfirmPresence(deps: Deps) {
  return async function confirmPresence(
    actor: Actor,
  ): Promise<ConfirmedPresence> {
    if (!canConfirmPresence(actor)) {
      throw new BrokersError("confirmPresence", "forbidden");
    }
    const presence = await deps.presence.confirm();
    return {
      expiresAt: presence.expiresAt,
      activeUntil: activeUntil(presence, deps.now()),
    };
  };
}
