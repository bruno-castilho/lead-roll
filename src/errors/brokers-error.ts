/** Motivo de não conseguir carregar os corretores em `profiles`. */
export type BrokersFailure = "auth" | "network" | "unknown";

/** Falha ao buscar os corretores. `message` já vem pronta em pt-BR. */
export class BrokersError extends Error {
  constructor(
    readonly reason: BrokersFailure,
    cause?: unknown,
  ) {
    super(BrokersError.brokersErrorMessage(reason), { cause });
    this.name = "BrokersError";
  }

  private static brokersErrorMessage(reason: BrokersFailure): string {
    switch (reason) {
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível carregar os corretores. Tente novamente.";
    }
  }
}
