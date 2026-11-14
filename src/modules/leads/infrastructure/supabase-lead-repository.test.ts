import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type FakeResponse,
  postgrestError,
  supabaseFake,
} from "@/test/fake-supabase";
import { LeadsError } from "../application/leads-error";
import type { LeadInput } from "../domain/lead-input";
import { supabaseLeadRepository as repository } from "./supabase-lead-repository";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const LEAD_COLUMNS =
  "id, name, phone, email, source, interest, stage, broker_id, created_at, assigned_at, lead_observations(id, content, created_at)";

const row = {
  id: "lead-1",
  name: "Ana Souza",
  phone: "(11) 98765-4321",
  email: null,
  source: "site",
  interest: "buy",
  stage: "new",
  broker_id: "broker-1",
  created_at: "2026-11-01T10:00:00Z",
  assigned_at: "2026-11-02T10:00:00Z",
  lead_observations: [
    { id: "obs-1", content: "Ligou", created_at: "2026-11-03T10:00:00Z" },
  ],
};

const lead = {
  id: "lead-1",
  name: "Ana Souza",
  phone: "(11) 98765-4321",
  email: null,
  source: "site",
  interest: "buy",
  stage: "new",
  brokerId: "broker-1",
  createdAt: "2026-11-01T10:00:00Z",
  assignedAt: "2026-11-02T10:00:00Z",
  observations: [
    { id: "obs-1", content: "Ligou", createdAt: "2026-11-03T10:00:00Z" },
  ],
};

const input: LeadInput = {
  name: "Ana Souza",
  phone: "(11) 98765-4321",
  email: null,
  source: "site",
  interest: "buy",
};

/** Resposta do banco e `reason` esperado. */
type FailureCase = [FakeResponse, string];

const failure = (status: number, code = "XX000"): FakeResponse => ({
  status,
  error: postgrestError(code),
});

const READ: FailureCase[] = [
  [failure(0), "network"],
  [failure(401), "auth"],
  [failure(200, "PGRST301"), "auth"],
  [failure(403, "42501"), "unknown"],
  [failure(500), "unknown"],
];

/** Falhas comuns às gravações, com ou sem "invalid" e "not_found". */
function writeFailures(options: {
  invalid: boolean;
  notFound: boolean;
}): FailureCase[] {
  return [
    [failure(0), "network"],
    [failure(401), "auth"],
    [failure(200, "PGRST302"), "auth"],
    [failure(403), "forbidden"],
    [failure(400, "42501"), "forbidden"],
    [failure(400, "23514"), options.invalid ? "invalid" : "unknown"],
    [failure(400, "22P02"), options.invalid ? "invalid" : "unknown"],
    [failure(406, "PGRST116"), options.notFound ? "not_found" : "unknown"],
    [failure(500), "unknown"],
  ];
}

/** Executa esperando um `LeadsError` e devolve operação e motivo. */
async function failureOf(operation: () => Promise<unknown>) {
  const error = await operation().then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof LeadsError)) throw new Error("esperava LeadsError");
  return { operation: error.operation, reason: error.reason };
}

beforeEach(() => supabaseFake.reset());

describe("list", () => {
  it("busca do mais recente para o mais antigo", async () => {
    supabaseFake.respondWith({ data: [row] });
    await expect(repository.list({})).resolves.toEqual([lead]);
    expect(supabaseFake.queries).toEqual([
      {
        table: "leads",
        calls: [
          { method: "select", args: [LEAD_COLUMNS] },
          { method: "order", args: ["created_at", { ascending: false }] },
        ],
      },
    ]);
  });

  it("filtra pelo responsável quando recebe brokerId", async () => {
    supabaseFake.respondWith({ data: [] });
    await repository.list({ brokerId: "broker-1" });
    expect(supabaseFake.queries[0].calls).toEqual([
      { method: "select", args: [LEAD_COLUMNS] },
      { method: "eq", args: ["broker_id", "broker-1"] },
      { method: "order", args: ["created_at", { ascending: false }] },
    ]);
  });

  it("mantém o e-mail preenchido", async () => {
    supabaseFake.respondWith({
      data: [{ ...row, email: "ana@exemplo.com", lead_observations: [] }],
    });
    const [listed] = await repository.list({});
    expect(listed.email).toBe("ana@exemplo.com");
    expect(listed.observations).toEqual([]);
  });

  it.each(READ)("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(failureOf(() => repository.list({}))).resolves.toEqual({
      operation: "listLeads",
      reason,
    });
  });
});

describe("create", () => {
  it("insere só os campos do formulário", async () => {
    supabaseFake.respondWith({ data: row });
    await expect(repository.create(input)).resolves.toEqual(lead);
    expect(supabaseFake.queries).toEqual([
      {
        table: "leads",
        calls: [
          { method: "insert", args: [input] },
          { method: "select", args: [LEAD_COLUMNS] },
          { method: "single", args: [] },
        ],
      },
    ]);
  });

  it.each(
    writeFailures({ invalid: true, notFound: false }),
  )("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(failureOf(() => repository.create(input))).resolves.toEqual({
      operation: "createLead",
      reason,
    });
  });
});

describe("update", () => {
  it("atualiza só os campos do formulário do lead", async () => {
    supabaseFake.respondWith({ data: row });
    await expect(
      repository.update("lead-1", { ...input, email: "ana@x.com" }),
    ).resolves.toEqual(lead);
    expect(supabaseFake.queries[0]).toEqual({
      table: "leads",
      calls: [
        { method: "update", args: [{ ...input, email: "ana@x.com" }] },
        { method: "eq", args: ["id", "lead-1"] },
        { method: "select", args: [LEAD_COLUMNS] },
        { method: "single", args: [] },
      ],
    });
  });

  it.each(
    writeFailures({ invalid: true, notFound: true }),
  )("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => repository.update("lead-1", input)),
    ).resolves.toEqual({ operation: "updateLead", reason });
  });
});

describe("changeStage", () => {
  it("atualiza só a etapa", async () => {
    supabaseFake.respondWith({ data: { ...row, stage: "contacted" } });
    await expect(
      repository.changeStage("lead-1", "contacted"),
    ).resolves.toEqual({ ...lead, stage: "contacted" });
    expect(supabaseFake.queries[0]).toEqual({
      table: "leads",
      calls: [
        { method: "update", args: [{ stage: "contacted" }] },
        { method: "eq", args: ["id", "lead-1"] },
        { method: "select", args: [LEAD_COLUMNS] },
        { method: "single", args: [] },
      ],
    });
  });

  it.each(
    writeFailures({ invalid: true, notFound: true }),
  )("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => repository.changeStage("lead-1", "won")),
    ).resolves.toEqual({ operation: "changeStage", reason });
  });
});

describe("addObservation", () => {
  it("insere só lead_id e conteúdo", async () => {
    supabaseFake.respondWith({ data: row.lead_observations[0] });
    await expect(repository.addObservation("lead-1", "Ligou")).resolves.toEqual(
      lead.observations[0],
    );
    expect(supabaseFake.queries[0]).toEqual({
      table: "lead_observations",
      calls: [
        { method: "insert", args: [{ lead_id: "lead-1", content: "Ligou" }] },
        { method: "select", args: ["id, content, created_at"] },
        { method: "single", args: [] },
      ],
    });
  });

  it.each(
    writeFailures({ invalid: true, notFound: false }),
  )("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => repository.addObservation("lead-1", "x")),
    ).resolves.toEqual({ operation: "addObservation", reason });
  });
});

describe("distribute", () => {
  it("chama a RPC distribute_leads com as colunas do lead", async () => {
    supabaseFake.respondWith({ data: [row] });
    await expect(repository.distribute()).resolves.toEqual([lead]);
    expect(supabaseFake.queries).toEqual([
      {
        rpc: "distribute_leads",
        calls: [{ method: "select", args: [LEAD_COLUMNS] }],
      },
    ]);
  });

  it.each(
    writeFailures({ invalid: false, notFound: false }),
  )("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(failureOf(() => repository.distribute())).resolves.toEqual({
      operation: "distributeLeads",
      reason,
    });
  });
});

describe("delete", () => {
  it("exclui pelo id e confere a linha removida", async () => {
    supabaseFake.respondWith({ data: [{ id: "lead-1" }] });
    await expect(repository.delete("lead-1")).resolves.toBeUndefined();
    expect(supabaseFake.queries[0]).toEqual({
      table: "leads",
      calls: [
        { method: "delete", args: [] },
        { method: "eq", args: ["id", "lead-1"] },
        { method: "select", args: ["id"] },
      ],
    });
  });

  it.each<FailureCase>([
    [{ data: [] }, "not_found"],
    ...writeFailures({ invalid: false, notFound: false }),
  ])("falha %# → %s", async (response, reason) => {
    supabaseFake.respondWith(response);
    await expect(failureOf(() => repository.delete("lead-1"))).resolves.toEqual(
      { operation: "deleteLead", reason },
    );
  });
});
