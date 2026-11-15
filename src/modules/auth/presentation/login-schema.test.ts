import { describe, expect, it } from "vitest";
import { fieldErrors } from "@/shared/ui/form-errors";
import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("exige e-mail e senha", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success ? {} : fieldErrors(result.error)).toEqual({
      email: "Informe o e-mail.",
      password: "Informe a senha.",
    });
  });

  it("valida o formato do e-mail", () => {
    const result = loginSchema.safeParse({ email: "ana", password: "x" });
    expect(result.success ? {} : fieldErrors(result.error)).toEqual({
      email: "Informe um e-mail válido.",
    });
  });

  it("apara o e-mail e não mexe na senha", () => {
    const result = loginSchema.safeParse({
      email: " ana@exemplo.com ",
      password: " 123 ",
    });
    expect(result.success && result.data).toEqual({
      email: "ana@exemplo.com",
      password: " 123 ",
    });
  });
});
