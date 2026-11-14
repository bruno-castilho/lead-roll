export type LeadsOperation =
  | "listLeads"
  | "createLead"
  | "updateLead"
  | "deleteLead"
  | "changeStage"
  | "addObservation"
  | "distributeLeads";

/** Motivo da falha. A apresentação converte em texto (`leads-messages`). */
export type LeadsFailure =
  | "forbidden"
  | "not_found"
  | "invalid"
  | "auth"
  | "network"
  | "unknown";

/** Falha numa operação de leads. */
export class LeadsError extends Error {
  constructor(
    readonly operation: LeadsOperation,
    readonly reason: LeadsFailure,
    options?: ErrorOptions,
  ) {
    super(`${operation}: ${reason}`, options);
    this.name = "LeadsError";
  }
}
