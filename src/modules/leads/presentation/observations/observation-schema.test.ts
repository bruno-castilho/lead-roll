import { describe, expect, it } from "vitest";
import { observationSchema } from "./observation-schema";

describe("observationSchema", () => {
  it("apara o texto", () => {
    expect(observationSchema.parse("  ligou  ")).toBe("ligou");
  });

  it.each([
    ["", "Escreva a observação antes de adicionar."],
    ["   ", "Escreva a observação antes de adicionar."],
    ["a".repeat(1001), "A observação deve ter no máximo 1000 caracteres."],
  ])("%j → %j", (content, message) => {
    const result = observationSchema.safeParse(content);
    expect(result.success ? null : result.error.issues[0]?.message).toBe(
      message,
    );
  });
});
