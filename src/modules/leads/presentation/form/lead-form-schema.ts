import { z } from "zod";
import { LEAD_INTERESTS, LEAD_SOURCES } from "../../domain/lead";
import {
  LEAD_NAME_MAX_LENGTH,
  LEAD_NAME_MIN_LENGTH,
} from "../../domain/lead-input";
import { isValidPhone } from "../../domain/phone";

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do lead.")
    .min(
      LEAD_NAME_MIN_LENGTH,
      `O nome deve ter pelo menos ${LEAD_NAME_MIN_LENGTH} caracteres.`,
    )
    .max(
      LEAD_NAME_MAX_LENGTH,
      `O nome deve ter no máximo ${LEAD_NAME_MAX_LENGTH} caracteres.`,
    ),
  phone: z
    .string()
    .trim()
    .min(1, "Informe o telefone.")
    .refine(isValidPhone, "Informe um telefone válido com DDD."),
  email: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.email().safeParse(v).success,
      "Informe um e-mail válido.",
    ),
  source: z.enum(LEAD_SOURCES, { error: "Selecione a origem." }),
  interest: z.enum(LEAD_INTERESTS, { error: "Selecione o interesse." }),
});
