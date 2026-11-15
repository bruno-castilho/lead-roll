import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  formatDate,
  formatDateTime,
  formatShortDateTime,
  formatTime,
  getInitials,
  normalize,
  pluralize,
} from "./format";

describe("datas (fuso America/Sao_Paulo)", () => {
  const iso = "2026-11-14T15:30:00Z";

  it("formatDate", () => {
    expect(formatDate(iso)).toBe("14/11/2026");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("formatDateTime", () => {
    expect(formatDateTime(iso)).toBe("14/11/2026, 12:30");
    expect(formatDateTime(null)).toBe("—");
  });

  it("formatShortDateTime tira o ponto da abreviação do mês", () => {
    expect(formatShortDateTime(iso)).toBe("14 de nov, 12:30");
    expect(formatShortDateTime(null)).toBe("—");
  });

  it("formatTime", () => {
    expect(formatTime(iso)).toBe("12:30");
  });
});

describe("getInitials", () => {
  it.each([
    ["Ana Paula Souza", "AS"],
    ["ana", "A"],
    ["  carlos   lima ", "CL"],
    ["", ""],
  ])("%j → %j", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});

describe("pluralize", () => {
  it("usa o singular só para 1", () => {
    expect(pluralize(0, "lead", "leads")).toBe("0 leads");
    expect(pluralize(1, "lead", "leads")).toBe("1 lead");
    expect(pluralize(2, "lead", "leads")).toBe("2 leads");
  });
});

describe("normalize", () => {
  it("remove acentos e caixa", () => {
    expect(normalize("Ação É Ótima")).toBe("acao e otima");
  });
});

describe("formatCountdown", () => {
  it.each([
    [5 * 3600 * 1000, "5:00:00"],
    [(4 * 3600 + 59 * 60 + 7) * 1000, "4:59:07"],
    [3600 * 1000, "1:00:00"],
    [3599 * 1000, "59:59"],
    [5 * 60 * 1000, "5:00"],
    [61_000, "1:01"],
    [1, "0:01"],
    [0, "0:00"],
    [-5000, "0:00"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatCountdown(ms)).toBe(text);
  });
});
