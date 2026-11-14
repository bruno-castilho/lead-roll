/**
 * Confere se um texto (ex.: o valor de um `<Select>`) é uma das opções
 * conhecidas, estreitando o tipo sem `as`.
 */
export function isOneOf<T extends string>(
  value: string,
  options: readonly T[],
): value is T {
  return options.some((option) => option === value);
}
