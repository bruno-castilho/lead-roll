import { describe, expect, it } from "vitest";
import { lead } from "@/test/fixtures";
import { brokerWorkload, countLeads } from "./workload";

const leads = [
  lead("a"),
  lead("b", { brokerId: "b1", stage: "contacted" }),
  lead("c", { brokerId: "b1", stage: "won" }),
  lead("d", { brokerId: "b2", stage: "proposal" }),
];

describe("countLeads", () => {
  it("conta o total, os sem responsável e os distribuídos", () => {
    expect(countLeads(leads)).toEqual({ total: 4, unassigned: 1, assigned: 3 });
    expect(countLeads([])).toEqual({ total: 0, unassigned: 0, assigned: 0 });
  });
});

describe("brokerWorkload", () => {
  it("conta a carteira do corretor e os leads em atendimento", () => {
    expect(brokerWorkload(leads, "b1")).toEqual({ total: 2, active: 1 });
    expect(brokerWorkload(leads, "b2")).toEqual({ total: 1, active: 1 });
    expect(brokerWorkload(leads, "b3")).toEqual({ total: 0, active: 0 });
  });
});
