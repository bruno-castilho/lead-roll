import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrors } from "./form-errors";

describe("fieldErrors", () => {
  it("guarda só a primeira mensagem de cada campo", () => {
    const schema = z.object({
      name: z.string().min(1, "Informe o nome.").min(3, "Nome curto."),
      phone: z.string().min(1, "Informe o telefone."),
    });
    const result = schema.safeParse({ name: "", phone: "" });
    expect(result.success ? {} : fieldErrors(result.error)).toEqual({
      name: "Informe o nome.",
      phone: "Informe o telefone.",
    });
  });

  it("erro sem campo vai para 'form'", () => {
    const result = z.string().min(1, "Vazio.").safeParse("");
    expect(result.success ? {} : fieldErrors(result.error)).toEqual({
      form: "Vazio.",
    });
  });
});
