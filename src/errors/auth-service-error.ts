/** Erro inesperado ao falar com o Supabase (rede, configuração, servidor). */
export class AuthServiceError extends Error {
  constructor(cause?: unknown) {
    super(
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
      { cause },
    );
    this.name = "AuthServiceError";
  }
}
