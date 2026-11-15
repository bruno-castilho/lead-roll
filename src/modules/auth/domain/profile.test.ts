import { describe, expect, it } from "vitest";
import { toProfile } from "./profile";

const record = {
  id: "user-1",
  name: "Ana",
  email: "ana@leadroll.demo",
  role: "broker",
};

describe("toProfile", () => {
  it("aceita gestor e corretor com nome", () => {
    expect(toProfile(record)).toEqual(record);
    expect(toProfile({ ...record, role: "manager" })).toMatchObject({
      role: "manager",
    });
  });

  it("recusa papel desconhecido ou nome em branco", () => {
    expect(toProfile({ ...record, role: "admin" })).toBeNull();
    expect(toProfile({ ...record, role: "authenticated" })).toBeNull();
    expect(toProfile({ ...record, name: "   " })).toBeNull();
  });
});
