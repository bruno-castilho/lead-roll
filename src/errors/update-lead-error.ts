/** Motivo de não conseguir editar um lead em `leads`. */
export type UpdateLeadFailure =
  | "forbidden"
  | "not_found"
  | "invalid"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao editar o lead. `message` já vem pronta em pt-BR. */
export class UpdateLeadError extends Error {
  constructor(
    readonly reason: UpdateLeadFailure,
    cause?: unknown,
  ) {
    super(UpdateLeadError.updateLeadErrorMessage(reason), { cause });
    this.name = "UpdateLeadError";
  }

  private static updateLeadErrorMessage(reason: UpdateLeadFailure): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o gestor pode editar leads.";
      case "not_found":
        return "O lead não foi encontrado. Ele pode ter sido excluído.";
      case "invalid":
        return "Os dados do lead são inválidos. Revise os campos e tente novamente.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível salvar as alterações do lead. Tente novamente.";
    }
  }
}
