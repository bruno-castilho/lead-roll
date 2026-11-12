import { z } from "zod";
import { LEAD_INTERESTS, LEAD_SOURCES } from "./constants";
import { phoneDigits } from "./format";
import type { LeadInterest, LeadSource } from "./types";

const sourceValues = LEAD_SOURCES.map((s) => s.value) as [
  LeadSource,
  ...LeadSource[],
];
const interestValues = LEAD_INTERESTS.map((s) => s.value) as [
  LeadInterest,
  ...LeadInterest[],
];

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do lead.")
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  phone: z
    .string()
    .trim()
    .min(1, "Informe o telefone.")
    .refine((v) => {
      const len = phoneDigits(v).length;
      return len === 10 || len === 11;
    }, "Informe um telefone válido com DDD."),
  email: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.email().safeParse(v).success,
      "Informe um e-mail válido.",
    ),
  source: z.enum(sourceValues, { error: "Selecione a origem." }),
  interest: z.enum(interestValues, { error: "Selecione o interesse." }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .pipe(z.email("Informe um e-mail válido.")),
  password: z.string().min(1, "Informe a senha."),
});

export const observationSchema = z
  .string()
  .trim()
  .min(1, "Escreva a observação antes de adicionar.")
  .max(1000, "A observação deve ter no máximo 1000 caracteres.");

/** Converte os issues do Zod em um mapa campo → primeira mensagem. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
