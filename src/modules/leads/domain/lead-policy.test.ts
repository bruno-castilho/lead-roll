import { describe, expect, it } from "vitest";
import type { Actor } from "@/shared/domain/actor";
import { canManageLeads, isResponsibleFor } from "./lead-policy";

const manager: Actor = { id: "m1", role: "manager" };
const broker: Actor = { id: "b1", role: "broker" };

describe("canManageLeads", () => {
  it("só o gestor administra leads", () => {
    expect(canManageLeads(manager)).toBe(true);
    expect(canManageLeads(broker)).toBe(false);
  });
});

describe("isResponsibleFor", () => {
  it("só o corretor responsável trabalha no lead", () => {
    expect(isResponsibleFor(broker, { brokerId: "b1" })).toBe(true);
    expect(isResponsibleFor(broker, { brokerId: "b2" })).toBe(false);
    expect(isResponsibleFor(broker, { brokerId: null })).toBe(false);
    expect(
      isResponsibleFor({ id: "b1", role: "manager" }, { brokerId: "b1" }),
    ).toBe(false);
  });
});
