export type BrokersOperation =
  | "listBrokers"
  | "loadPresence"
  | "confirmPresence"
  | "issuePresenceToken";

/**
 * Motivo da falha. A apresentação converte em texto (`brokers-messages`).
 * `invalid_token`: o QR code de presença venceu ou o link está errado.
 */
export type BrokersFailure =
  | "forbidden"
  | "invalid_token"
  | "auth"
  | "network"
  | "unknown";

/** Falha numa operação do módulo de corretores. */
export class BrokersError extends Error {
  constructor(
    readonly operation: BrokersOperation,
    readonly reason: BrokersFailure,
    options?: ErrorOptions,
  ) {
    super(`${operation}: ${reason}`, options);
    this.name = "BrokersError";
  }
}
