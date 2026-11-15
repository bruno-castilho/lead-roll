/**
 * Token do QR code de presença (`presence_tokens`). O totem emite um novo a
 * cada 5 minutos; a confirmação só vale com um token ainda não vencido, e
 * quem confere a validade é o banco (`confirm_presence`).
 */
export interface PresenceToken {
  token: string;
  issuedAt: string;
  expiresAt: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Token lido do link, se tiver o formato emitido pelo banco (uuid). */
export function parsePresenceToken(value: string | null): string | null {
  const token = value?.trim() ?? "";
  return UUID.test(token) ? token.toLowerCase() : null;
}

/**
 * Por quanto tempo o QR code fica na tela, medido pelo relógio do banco
 * (emissão → vencimento): o relógio do totem pode estar adiantado ou atrasado.
 */
export function presenceTokenLifetimeMs(token: PresenceToken): number {
  return Math.max(0, Date.parse(token.expiresAt) - Date.parse(token.issuedAt));
}
