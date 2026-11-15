import { describe, expect, it, vi } from "vitest";
import type { Actor } from "@/shared/domain/actor";
import type { Lead } from "../domain/lead";
import type { LeadDraft } from "../domain/lead-input";
import {
  makeAddObservation,
  makeChangeStage,
  makeCreateLead,
  makeDeleteLead,
  makeDistributeLeads,
  makeListLeads,
  makeUpdateLead,
} from "./lead-use-cases";
import { LeadsError } from "./leads-error";
import type { LeadRepository } from "./ports";

const manager: Actor = { id: "m1", role: "manager" };
const broker: Actor = { id: "b1", role: "broker" };

const lead: Lead = {
  id: "lead-1",
  name: "Ana",
  phone: "(11) 98765-4321",
  email: null,
  source: "site",
  interest: "buy",
  stage: "new",
  brokerId: "b1",
  createdAt: "2026-11-01T10:00:00Z",
  assignedAt: "2026-11-02T10:00:00Z",
  observations: [],
};

const draft: LeadDraft = {
  name: "Ana",
  phone: "11987654321",
  email: "",
  source: "site",
  interest: "buy",
};
const input = { ...draft, phone: "(11) 98765-4321", email: null };

function repository(): LeadRepository {
  return {
    list: vi.fn().mockResolvedValue([lead]),
    create: vi.fn().mockResolvedValue(lead),
    update: vi.fn().mockResolvedValue(lead),
    delete: vi.fn().mockResolvedValue(undefined),
    changeStage: vi.fn().mockResolvedValue({ ...lead, stage: "contacted" }),
    addObservation: vi
      .fn()
      .mockResolvedValue({ id: "o1", content: "x", createdAt: "" }),
    distribute: vi.fn().mockResolvedValue([lead]),
  };
}

async function forbidden(operation: () => Promise<unknown>) {
  const error = await operation().catch((e: unknown) => e);
  expect(error).toBeInstanceOf(LeadsError);
  return error instanceof LeadsError ? [error.operation, error.reason] : null;
}

describe("listLeads", () => {
  it("lista o que a RLS permite; com onlyOwn, filtra pelo usuário", async () => {
    const leads = repository();
    const listLeads = makeListLeads({ leads });
    await expect(listLeads(manager)).resolves.toEqual([lead]);
    expect(leads.list).toHaveBeenLastCalledWith({});
    await listLeads(broker, { onlyOwn: true });
    expect(leads.list).toHaveBeenLastCalledWith({ brokerId: "b1" });
  });
});

describe("operações do gestor", () => {
  it("cadastra e edita gravando o telefone com máscara e o e-mail vazio como null", async () => {
    const leads = repository();
    await makeCreateLead({ leads })(manager, draft);
    expect(leads.create).toHaveBeenCalledWith(input);
    await makeUpdateLead({ leads })(manager, "lead-1", draft);
    expect(leads.update).toHaveBeenCalledWith("lead-1", input);
  });

  it("exclui e distribui", async () => {
    const leads = repository();
    await makeDeleteLead({ leads })(manager, "lead-1");
    expect(leads.delete).toHaveBeenCalledWith("lead-1");
    await expect(makeDistributeLeads({ leads })(manager)).resolves.toEqual([
      lead,
    ]);
  });

  it("recusa o corretor sem chamar o banco", async () => {
    const leads = repository();
    await expect(
      forbidden(() => makeCreateLead({ leads })(broker, draft)),
    ).resolves.toEqual(["createLead", "forbidden"]);
    await expect(
      forbidden(() => makeUpdateLead({ leads })(broker, "lead-1", draft)),
    ).resolves.toEqual(["updateLead", "forbidden"]);
    await expect(
      forbidden(() => makeDeleteLead({ leads })(broker, "lead-1")),
    ).resolves.toEqual(["deleteLead", "forbidden"]);
    await expect(
      forbidden(() => makeDistributeLeads({ leads })(broker)),
    ).resolves.toEqual(["distributeLeads", "forbidden"]);
    expect(leads.create).not.toHaveBeenCalled();
    expect(leads.update).not.toHaveBeenCalled();
    expect(leads.delete).not.toHaveBeenCalled();
    expect(leads.distribute).not.toHaveBeenCalled();
  });
});

describe("operações do corretor responsável", () => {
  it("muda a etapa e registra observação", async () => {
    const leads = repository();
    await makeChangeStage({ leads })(broker, lead, "contacted");
    expect(leads.changeStage).toHaveBeenCalledWith("lead-1", "contacted");
    await makeAddObservation({ leads })(broker, lead, "Ligou");
    expect(leads.addObservation).toHaveBeenCalledWith("lead-1", "Ligou");
  });

  it.each([
    ["gestor", manager, lead],
    ["outro corretor", broker, { ...lead, brokerId: "b2" }],
    ["lead sem responsável", broker, { ...lead, brokerId: null }],
  ])("recusa %s sem chamar o banco", async (_label, actor, target) => {
    const leads = repository();
    await expect(
      forbidden(() => makeChangeStage({ leads })(actor, target, "won")),
    ).resolves.toEqual(["changeStage", "forbidden"]);
    await expect(
      forbidden(() => makeAddObservation({ leads })(actor, target, "x")),
    ).resolves.toEqual(["addObservation", "forbidden"]);
    expect(leads.changeStage).not.toHaveBeenCalled();
    expect(leads.addObservation).not.toHaveBeenCalled();
  });
});
