import { describe, expect, it } from "vitest";
import { isUserRole, USER_ROLES } from "./actor";

describe("isUserRole", () => {
  it("aceita só gestor e corretor", () => {
    expect(USER_ROLES).toEqual(["manager", "broker"]);
    expect(isUserRole("manager")).toBe(true);
    expect(isUserRole("broker")).toBe(true);
    expect(isUserRole("admin")).toBe(false);
    expect(isUserRole("authenticated")).toBe(false);
    expect(isUserRole("")).toBe(false);
  });
});
