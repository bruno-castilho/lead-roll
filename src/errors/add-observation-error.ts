/** Motivo de não conseguir registrar uma observação em `lead_observations`. */
export type AddObservationFailure =
  | "forbidden"
  | "invalid"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao registrar a observação. `message` já vem pronta em pt-BR. */
export class AddObservationError extends Error {
  constructor(
    readonly reason: AddObservationFailure,
    cause?: unknown,
  ) {
    super(AddObservationError.addObservationErrorMessage(reason), { cause });
    this.name = "AddObservationError";
  }

  private static addObservationErrorMessage(
    reason: AddObservationFailure,
  ): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o corretor responsável pode registrar observações neste lead.";
      case "invalid":
        return "A observação é inválida. Escreva de 1 a 1000 caracteres.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível adicionar a observação. Tente novamente.";
    }
  }
}
