/** Como uma consulta ao PostgREST falhou, do ponto de vista do app. */
export type PostgrestFailure =
  | "not_found"
  | "network"
  | "auth"
  | "forbidden"
  | "invalid"
  | "unknown";

/**
 * Classifica o erro devolvido pelo SDK (`{ error, status }`). Cada repositório
 * decide quais classes fazem sentido na operação dele e trata o resto como
 * `unknown`.
 */
export function classifyPostgrestFailure(
  error: { code: string },
  status: number,
): PostgrestFailure {
  // PGRST116: `.single()` sem nenhuma linha (lead excluído ou fora da RLS).
  if (error.code === "PGRST116") return "not_found";
  // Status 0: a requisição nem chegou ao servidor.
  if (status === 0) return "network";
  // 401 / PGRST30x: JWT ausente, inválido ou expirado.
  if (status === 401 || error.code.startsWith("PGRST30")) return "auth";
  // 42501: a RLS, os privilégios ou uma função recusaram o usuário.
  if (status === 403 || error.code === "42501") return "forbidden";
  // 23514: check constraint; 22P02: valor fora do enum.
  if (error.code === "23514" || error.code === "22P02") return "invalid";
  return "unknown";
}

/** Mantém só as classes esperadas na operação; as demais viram `unknown`. */
export function narrowFailure<T extends PostgrestFailure>(
  failure: PostgrestFailure,
  expected: readonly T[],
): T | "unknown" {
  return expected.find((f) => f === failure) ?? "unknown";
}
