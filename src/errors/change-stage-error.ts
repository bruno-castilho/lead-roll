/** Motivo de não conseguir mudar a etapa de um lead em `leads`. */
export type ChangeStageFailure =
  | "forbidden"
  | "not_found"
  | "invalid"
  | "auth"
  | "network"
  | "unknown";

/** Falha ao mudar a etapa do lead. `message` já vem pronta em pt-BR. */
export class ChangeStageError extends Error {
  constructor(
    readonly reason: ChangeStageFailure,
    cause?: unknown,
  ) {
    super(ChangeStageError.changeStageErrorMessage(reason), { cause });
    this.name = "ChangeStageError";
  }

  private static changeStageErrorMessage(reason: ChangeStageFailure): string {
    switch (reason) {
      case "forbidden":
        return "Apenas o corretor responsável pode mudar a etapa deste lead.";
      case "not_found":
        return "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.";
      case "invalid":
        return "A etapa escolhida é inválida.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível mudar a etapa do lead. Tente novamente.";
    }
  }
}
