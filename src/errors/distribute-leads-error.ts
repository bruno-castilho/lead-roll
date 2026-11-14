/** Motivo de não conseguir distribuir os leads (`distribute_leads`). */
export type DistributeLeadsFailure =
  | "forbidden"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao distribuir os leads. `message` já vem pronta em pt-BR. */
export class DistributeLeadsError extends Error {
  constructor(
    readonly reason: DistributeLeadsFailure,
    cause?: unknown,
  ) {
    super(DistributeLeadsError.distributeLeadsErrorMessage(reason), { cause });
    this.name = "DistributeLeadsError";
  }

  private static distributeLeadsErrorMessage(
    reason: DistributeLeadsFailure,
  ): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o gestor pode distribuir leads.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível distribuir os leads. Tente novamente.";
    }
  }
}
