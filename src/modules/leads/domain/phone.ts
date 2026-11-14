/** Telefones válidos têm DDD: 10 (fixo) ou 11 (celular) dígitos. */
export const PHONE_DIGIT_COUNTS: readonly number[] = [10, 11];

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string): boolean {
  return PHONE_DIGIT_COUNTS.includes(phoneDigits(value).length);
}

/** Aplica a máscara brasileira de telefone: (11) 98765-4321 ou (11) 3456-7890. */
export function formatPhone(value: string): string {
  const digits = phoneDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
