/** Motivo de não conseguir carregar a presença em `broker_presence`. */
export type PresenceFailure = "auth" | "network" | "unknown";

/** Falha ao buscar a presença do corretor. `message` já vem pronta em pt-BR. */
export class PresenceError extends Error {
  constructor(
    readonly reason: PresenceFailure,
    cause?: unknown,
  ) {
    super(PresenceError.presenceErrorMessage(reason), { cause });
    this.name = "PresenceError";
  }

  private static presenceErrorMessage(reason: PresenceFailure): string {
    switch (reason) {
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível carregar sua presença. Tente novamente.";
    }
  }
}
