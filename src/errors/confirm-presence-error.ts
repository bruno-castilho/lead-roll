/** Motivo de não conseguir confirmar a presença (`confirm_presence`). */
export type ConfirmPresenceFailure =
  | "forbidden"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao confirmar a presença. `message` já vem pronta em pt-BR. */
export class ConfirmPresenceError extends Error {
  constructor(
    readonly reason: ConfirmPresenceFailure,
    cause?: unknown,
  ) {
    super(ConfirmPresenceError.confirmPresenceErrorMessage(reason), { cause });
    this.name = "ConfirmPresenceError";
  }

  private static confirmPresenceErrorMessage(
    reason: ConfirmPresenceFailure,
  ): string {
    switch (reason) {
      case "forbidden":
        return "Apenas corretores podem confirmar presença.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível confirmar sua presença. Tente novamente.";
    }
  }
}
