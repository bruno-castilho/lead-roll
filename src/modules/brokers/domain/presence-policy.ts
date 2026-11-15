import type { Actor } from "@/shared/domain/actor";

/** Só corretores entram na fila de distribuição. */
export function canConfirmPresence(actor: Actor): boolean {
  return actor.role === "broker";
}
