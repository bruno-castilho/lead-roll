import { describe, expect, it } from "vitest";
import { toLeadInput } from "./lead-input";

describe("toLeadInput", () => {
  it("grava o telefone com máscara e o e-mail vazio como ausente", () => {
    expect(
      toLeadInput({
        name: "Ana",
        phone: "11987654321",
        email: "",
        source: "site",
        interest: "buy",
      }),
    ).toEqual({
      name: "Ana",
      phone: "(11) 98765-4321",
      email: null,
      source: "site",
      interest: "buy",
    });
  });

  it("mantém o e-mail preenchido", () => {
    expect(
      toLeadInput({
        name: "Ana",
        phone: "(11) 98765-4321",
        email: "ana@x.com",
        source: "site",
        interest: "buy",
      }).email,
    ).toBe("ana@x.com");
  });
});
