import { z } from "zod";
import { OBSERVATION_MAX_LENGTH } from "../../domain/lead-input";

export const observationSchema = z
  .string()
  .trim()
  .min(1, "Escreva a observação antes de adicionar.")
  .max(
    OBSERVATION_MAX_LENGTH,
    `A observação deve ter no máximo ${OBSERVATION_MAX_LENGTH} caracteres.`,
  );
