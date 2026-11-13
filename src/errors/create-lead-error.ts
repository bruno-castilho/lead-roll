/** Motivo de não conseguir cadastrar um lead em `leads`. */
export type CreateLeadFailure =
  | "forbidden"
  | "invalid"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao cadastrar o lead. `message` já vem pronta em pt-BR. */
export class CreateLeadError extends Error {
  constructor(
    readonly reason: CreateLeadFailure,
    cause?: unknown,
  ) {
    super(CreateLeadError.createLeadErrorMessage(reason), { cause });
    this.name = "CreateLeadError";
  }

  private static createLeadErrorMessage(reason: CreateLeadFailure): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o gestor pode cadastrar leads.";
      case "invalid":
        return "Os dados do lead são inválidos. Revise os campos e tente novamente.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível cadastrar o lead. Tente novamente.";
    }
  }
}
