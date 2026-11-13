/** Motivo de não conseguir carregar os leads em `leads`. */
export type LeadsFailure = "auth" | "network" | "unknown";

/** Falha ao buscar os leads. `message` já vem pronta em pt-BR. */
export class LeadsError extends Error {
  constructor(
    readonly reason: LeadsFailure,
    cause?: unknown,
  ) {
    super(LeadsError.leadsErrorMessage(reason), { cause });
    this.name = "LeadsError";
  }

  private static leadsErrorMessage(reason: LeadsFailure): string {
    switch (reason) {
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível carregar os leads. Tente novamente.";
    }
  }
}
