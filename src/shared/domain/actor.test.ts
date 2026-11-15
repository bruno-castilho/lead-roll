import { describe, expect, it } from "vitest";
import { isUserRole, USER_ROLES } from "./actor";

describe("isUserRole", () => {
  it("aceita só gestor, corretor e totem", () => {
    expect(USER_ROLES).toEqual(["manager", "broker", "kiosk"]);
    expect(isUserRole("manager")).toBe(true);
    expect(isUserRole("broker")).toBe(true);
    expect(isUserRole("kiosk")).toBe(true);
    expect(isUserRole("admin")).toBe(false);
    expect(isUserRole("authenticated")).toBe(false);
    expect(isUserRole("")).toBe(false);
  });
});
