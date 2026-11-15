import { describe, expect, it } from "vitest";
import { classifyPostgrestFailure, narrowFailure } from "./postgrest-failure";

describe("classifyPostgrestFailure", () => {
  it.each([
    [406, "PGRST116", "not_found"],
    [0, "XX000", "network"],
    [0, "42501", "network"],
    [401, "XX000", "auth"],
    [200, "PGRST301", "auth"],
    [200, "PGRST303", "auth"],
    [403, "XX000", "forbidden"],
    [400, "42501", "forbidden"],
    [400, "23514", "invalid"],
    [400, "22P02", "invalid"],
    [500, "XX000", "unknown"],
    [409, "23505", "unknown"],
  ])("status %i, código %s → %s", (status, code, expected) => {
    expect(classifyPostgrestFailure({ code }, status)).toBe(expected);
  });
});

describe("narrowFailure", () => {
  it("mantém as classes esperadas e troca as demais por unknown", () => {
    const read = ["network", "auth"] as const;
    expect(narrowFailure("auth", read)).toBe("auth");
    expect(narrowFailure("forbidden", read)).toBe("unknown");
    expect(narrowFailure("not_found", read)).toBe("unknown");
  });
});
