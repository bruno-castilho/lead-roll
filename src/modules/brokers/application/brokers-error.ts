export type BrokersOperation =
  | "listBrokers"
  | "loadPresence"
  | "confirmPresence";

/** Motivo da falha. A apresentação converte em texto (`brokers-messages`). */
export type BrokersFailure = "forbidden" | "auth" | "network" | "unknown";

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
