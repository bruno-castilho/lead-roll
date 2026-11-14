/**
 * Presença do corretor na fila (`broker_presence`). A ordem da fila é
 * `queuedAt`; cada confirmação vale até `expiresAt` (o prazo de 5h é
 * calculado pelo banco, em `confirm_presence`).
 */
export interface BrokerPresence {
  queuedAt: string;
  expiresAt: string;
}

/** Presente enquanto o prazo não passou (`expires_at > now()`, como no banco). */
export function isPresenceActive(expiresAt: string, now: Date): boolean {
  return Date.parse(expiresAt) > now.getTime();
}

/** Prazo da presença se ela ainda vale; `null` se o corretor está ausente. */
export function activeUntil(
  presence: BrokerPresence | null,
  now: Date,
): string | null {
  if (!presence) return null;
  return isPresenceActive(presence.expiresAt, now) ? presence.expiresAt : null;
}
