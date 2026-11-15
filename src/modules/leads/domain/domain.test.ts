import { describe, expect, it } from "vitest";
import type { Actor } from "@/shared/domain/actor";
import {
  ACTIVE_STAGES,
  isActiveStage,
  isLeadStage,
  isUnassigned,
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STAGES,
  type Lead,
} from "./lead";
import { toLeadInput } from "./lead-input";
import { canManageLeads, isResponsibleFor } from "./lead-policy";
import { formatPhone, isValidPhone, phoneDigits } from "./phone";
import { brokerWorkload, countLeads } from "./workload";

function lead(id: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id,
    name: `Lead ${id}`,
    phone: "(11) 98765-4321",
    email: null,
    source: "site",
    interest: "buy",
    stage: "new",
    brokerId: null,
    createdAt: "2026-11-01T10:00:00Z",
    assignedAt: null,
    observations: [],
    ...overrides,
  };
}

const manager: Actor = { id: "m1", role: "manager" };
const broker: Actor = { id: "b1", role: "broker" };

describe("valores do lead", () => {
  it("etapas, origens e interesses na ordem dos enums", () => {
    expect(LEAD_STAGES).toEqual([
      "new",
      "contacted",
      "visit_scheduled",
      "proposal",
      "won",
      "lost",
    ]);
    expect(LEAD_SOURCES).toEqual([
      "site",
      "whatsapp",
      "instagram",
      "referral",
      "portal",
      "campaign",
      "other",
    ]);
    expect(LEAD_INTERESTS).toEqual([
      "buy",
      "rent",
      "apartment",
      "house",
      "land",
      "commercial",
      "other",
    ]);
  });

  it("em atendimento: contato, visita e proposta", () => {
    expect(ACTIVE_STAGES).toEqual(["contacted", "visit_scheduled", "proposal"]);
    expect(LEAD_STAGES.filter(isActiveStage)).toEqual(ACTIVE_STAGES);
  });

  it("isLeadStage", () => {
    expect(isLeadStage("won")).toBe(true);
    expect(isLeadStage("archived")).toBe(false);
    expect(isLeadStage(undefined)).toBe(false);
  });

  it("isUnassigned", () => {
    expect(isUnassigned(lead("a"))).toBe(true);
    expect(isUnassigned(lead("a", { brokerId: "b1" }))).toBe(false);
  });
});

describe("telefone", () => {
  it("aceita 10 ou 11 dígitos, com ou sem máscara", () => {
    expect(isValidPhone("(11) 3456-7890")).toBe(true);
    expect(isValidPhone("11987654321")).toBe(true);
    expect(isValidPhone("(11) 9876-543")).toBe(false);
    expect(isValidPhone("119876543210")).toBe(false);
  });

  it("máscara e dígitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
    expect(phoneDigits("(11) 98765-4321")).toBe("11987654321");
  });
});

describe("toLeadInput", () => {
  it("grava o telefone com máscara e o e-mail vazio como ausente", () => {
    expect(
      toLeadInput({
        name: "Ana",
        phone: "11987654321",
        email: "",
        source: "site",
        interest: "buy",
      }),
    ).toEqual({
      name: "Ana",
      phone: "(11) 98765-4321",
      email: null,
      source: "site",
      interest: "buy",
    });
  });

  it("mantém o e-mail preenchido", () => {
    expect(
      toLeadInput({
        name: "Ana",
        phone: "(11) 98765-4321",
        email: "ana@x.com",
        source: "site",
        interest: "buy",
      }).email,
    ).toBe("ana@x.com");
  });
});

describe("política", () => {
  it("só o gestor administra leads", () => {
    expect(canManageLeads(manager)).toBe(true);
    expect(canManageLeads(broker)).toBe(false);
  });

  it("só o corretor responsável trabalha no lead", () => {
    expect(isResponsibleFor(broker, { brokerId: "b1" })).toBe(true);
    expect(isResponsibleFor(broker, { brokerId: "b2" })).toBe(false);
    expect(isResponsibleFor(broker, { brokerId: null })).toBe(false);
    expect(
      isResponsibleFor({ id: "b1", role: "manager" }, { brokerId: "b1" }),
    ).toBe(false);
  });
});

describe("carteira", () => {
  const leads = [
    lead("a"),
    lead("b", { brokerId: "b1", stage: "contacted" }),
    lead("c", { brokerId: "b1", stage: "won" }),
    lead("d", { brokerId: "b2", stage: "proposal" }),
  ];

  it("countLeads", () => {
    expect(countLeads(leads)).toEqual({ total: 4, unassigned: 1, assigned: 3 });
    expect(countLeads([])).toEqual({ total: 0, unassigned: 0, assigned: 0 });
  });

  it("brokerWorkload", () => {
    expect(brokerWorkload(leads, "b1")).toEqual({ total: 2, active: 1 });
    expect(brokerWorkload(leads, "b2")).toEqual({ total: 1, active: 1 });
    expect(brokerWorkload(leads, "b3")).toEqual({ total: 0, active: 0 });
  });
});
