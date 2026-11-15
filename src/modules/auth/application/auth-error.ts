export type AuthOperation =
  | "signIn"
  | "loadProfile"
  | "restoreSession"
  | "signOut";

/** Motivo da falha. A apresentação converte em texto (`auth-messages`). */
export type AuthFailure =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "banned"
  | "missing_profile"
  | "auth"
  | "network"
  | "unknown";

/** Falha numa operação de autenticação. */
export class AuthError extends Error {
  constructor(
    readonly operation: AuthOperation,
    readonly reason: AuthFailure,
    options?: ErrorOptions,
  ) {
    super(`${operation}: ${reason}`, options);
    this.name = "AuthError";
  }
}
