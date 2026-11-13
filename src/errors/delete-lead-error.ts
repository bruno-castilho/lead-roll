/** Motivo de não conseguir excluir um lead em `leads`. */
export type DeleteLeadFailure =
  | "forbidden"
  | "not_found"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao excluir o lead. `message` já vem pronta em pt-BR. */
export class DeleteLeadError extends Error {
  constructor(
    readonly reason: DeleteLeadFailure,
    cause?: unknown,
  ) {
    super(DeleteLeadError.deleteLeadErrorMessage(reason), { cause });
    this.name = "DeleteLeadError";
  }

  private static deleteLeadErrorMessage(reason: DeleteLeadFailure): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o gestor pode excluir leads.";
      case "not_found":
        return "O lead não foi encontrado. Ele pode já ter sido excluído.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível excluir o lead. Tente novamente.";
    }
  }
}
