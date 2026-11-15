import type { Actor } from "@/shared/domain/actor";

/** Só corretores entram na fila de distribuição. */
export function canConfirmPresence(actor: Actor): boolean {
  return actor.role === "broker";
}

/** Só o totem (a tela da empresa) emite os QR codes de presença. */
export function canIssuePresenceToken(actor: Actor): boolean {
  return actor.role === "kiosk";
}
