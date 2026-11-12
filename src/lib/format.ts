/** Aplica a máscara brasileira de telefone: (11) 98765-4321 ou (11) 3456-7890. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
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

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTimeFormatter.format(new Date(iso));
}

export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return shortDateTimeFormatter.format(new Date(iso)).replace(".", "");
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Normaliza texto para busca sem acentos e sem diferenciar maiúsculas. */
export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}
