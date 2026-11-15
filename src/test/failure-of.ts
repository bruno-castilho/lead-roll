/** Erro de módulo (`AuthError`, `BrokersError`, `LeadsError`). */
interface ModuleError extends Error {
  readonly operation: string;
  readonly reason: string;
}

/**
 * Executa esperando um erro da classe informada e devolve operação e motivo.
 * Falha o teste se a operação resolver ou lançar outro erro.
 */
export async function failureOf<E extends ModuleError>(
  errorClass: abstract new (...args: never[]) => E,
  run: () => Promise<unknown>,
): Promise<Pick<E, "operation" | "reason">> {
  const error = await run().then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof errorClass))
    throw new Error(`esperava ${errorClass.name}`);
  return { operation: error.operation, reason: error.reason };
}
