import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, phoneDigits } from "./phone";

describe("formatPhone", () => {
  it.each([
    ["", ""],
    ["abc", ""],
    ["1", "(1"],
    ["11", "(11"],
    ["119", "(11) 9"],
    ["119876", "(11) 9876"],
    ["1198765", "(11) 9876-5"],
    ["1134567890", "(11) 3456-7890"],
    ["11987654321", "(11) 98765-4321"],
    ["(11) 98765-4321", "(11) 98765-4321"],
    ["119876543210000", "(11) 98765-4321"],
    ["a1b1c9", "(11) 9"],
  ])("formata %j como %j", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });
});

describe("phoneDigits", () => {
  it("mantém só os dígitos", () => {
    expect(phoneDigits("(11) 98765-4321")).toBe("11987654321");
    expect(phoneDigits("sem número")).toBe("");
  });
});

describe("isValidPhone", () => {
  it("aceita 10 ou 11 dígitos, com ou sem máscara", () => {
    expect(isValidPhone("(11) 3456-7890")).toBe(true);
    expect(isValidPhone("11987654321")).toBe(true);
    expect(isValidPhone("(11) 9876-543")).toBe(false);
    expect(isValidPhone("119876543210")).toBe(false);
  });
});
