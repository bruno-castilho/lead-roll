/** Mensagens de falha comuns a todos os módulos. */
export const NETWORK_MESSAGE =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente.";

/** Texto de um erro sem tradução própria (o mesmo que o app sempre mostrou). */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
