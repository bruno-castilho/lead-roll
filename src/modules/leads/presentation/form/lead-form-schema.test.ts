import { describe, expect, it } from "vitest";
import { fieldErrors } from "@/shared/ui/form-errors";
import { leadSchema } from "./lead-form-schema";

const validLead = {
  name: "Ana Souza",
  phone: "(11) 98765-4321",
  email: "",
  source: "site",
  interest: "buy",
};

function leadErrors(
  overrides: Partial<Record<keyof typeof validLead, string>>,
) {
  const result = leadSchema.safeParse({ ...validLead, ...overrides });
  return result.success ? {} : fieldErrors(result.error);
}

describe("leadSchema", () => {
  it("aceita um lead válido e apara os textos", () => {
    const result = leadSchema.safeParse({
      ...validLead,
      name: "  Ana Souza  ",
      email: " ana@exemplo.com ",
    });
    expect(result.success && result.data).toEqual({
      ...validLead,
      name: "Ana Souza",
      email: "ana@exemplo.com",
    });
  });

  it.each([
    ["", "Informe o nome do lead."],
    ["   ", "Informe o nome do lead."],
    ["ab", "O nome deve ter pelo menos 3 caracteres."],
    ["a".repeat(81), "O nome deve ter no máximo 80 caracteres."],
  ])("nome %j → %j", (name, message) => {
    expect(leadErrors({ name }).name).toBe(message);
  });

  it("aceita nome com 3 e com 80 caracteres", () => {
    expect(leadErrors({ name: "abc" }).name).toBeUndefined();
    expect(leadErrors({ name: "a".repeat(80) }).name).toBeUndefined();
  });

  it.each([
    ["", "Informe o telefone."],
    ["(11) 9876-543", "Informe um telefone válido com DDD."],
    ["119876543210", "Informe um telefone válido com DDD."],
  ])("telefone %j → %j", (phone, message) => {
    expect(leadErrors({ phone }).phone).toBe(message);
  });

  it("aceita telefone com 10 ou 11 dígitos", () => {
    expect(leadErrors({ phone: "1134567890" }).phone).toBeUndefined();
    expect(leadErrors({ phone: "11987654321" }).phone).toBeUndefined();
  });

  it("valida o e-mail só quando preenchido", () => {
    expect(leadErrors({ email: "" }).email).toBeUndefined();
    expect(leadErrors({ email: "ana" }).email).toBe(
      "Informe um e-mail válido.",
    );
  });

  it("exige origem e interesse da lista", () => {
    expect(leadErrors({ source: "" }).source).toBe("Selecione a origem.");
    expect(leadErrors({ source: "tv" }).source).toBe("Selecione a origem.");
    expect(leadErrors({ interest: "" }).interest).toBe(
      "Selecione o interesse.",
    );
  });
});
