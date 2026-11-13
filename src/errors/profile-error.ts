/** Motivo de não conseguir carregar o perfil do usuário em `profiles`. */
export type ProfileFailure = "missing" | "auth" | "network" | "unknown";

/** Falha ao buscar o perfil. `message` já vem pronta em pt-BR. */
export class ProfileError extends Error {
  constructor(
    readonly reason: ProfileFailure,
    cause?: unknown,
  ) {
    super(ProfileError.profileErrorMessage(reason), { cause });
    this.name = "ProfileError";
  }

  private static profileErrorMessage(reason: ProfileFailure): string {
    switch (reason) {
      case "missing":
        return "Sua conta não tem um perfil configurado. Fale com o gestor.";
      case "auth":
        return "Sua sessão expirou. Entre novamente.";
      case "network":
        return "Não foi possível conectar. Verifique sua internet e tente novamente.";
      case "unknown":
        return "Não foi possível carregar seu perfil. Tente novamente.";
    }
  }
}
