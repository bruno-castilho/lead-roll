import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddObservationError } from "@/errors/add-observation-error";
import { ChangeStageError } from "@/errors/change-stage-error";
import { CreateLeadError } from "@/errors/create-lead-error";
import { DeleteLeadError } from "@/errors/delete-lead-error";
import { DistributeLeadsError } from "@/errors/distribute-leads-error";
import { LeadsError } from "@/errors/leads-error";
import { UpdateLeadError } from "@/errors/update-lead-error";
import type { LeadInput } from "@/lib/types";
import {
  type FakeResponse,
  postgrestError,
  supabaseFake,
} from "@/test/fake-supabase";
import { LeadsService } from "./leads-service";

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
  email: undefined,
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
  source: "site",
  interest: "buy",
};

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";

/** Resposta do banco, `reason` esperado e mensagem esperada. */
type FailureCase = [FakeResponse, string, string];

const failure = (status: number, code = "XX000"): FakeResponse => ({
  status,
  error: postgrestError(code),
});

/** Executa a operação esperando um erro e devolve `reason` e `message`. */
async function failureOf(operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && "reason" in error) {
      return {
        type: error.constructor,
        reason: error.reason,
        message: error.message,
      };
    }
    throw error;
  }
  throw new Error("a operação não falhou");
}

beforeEach(() => supabaseFake.reset());

describe("listLeads", () => {
  it("busca todos os leads do mais recente para o mais antigo", async () => {
    supabaseFake.respondWith({ data: [row] });
    await expect(LeadsService.listLeads()).resolves.toEqual([lead]);
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
    await LeadsService.listLeads({ brokerId: "broker-1" });
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
    const [listed] = await LeadsService.listLeads();
    expect(listed.email).toBe("ana@exemplo.com");
    expect(listed.observations).toEqual([]);
  });

  const cases: FailureCase[] = [
    [failure(0), "network", NETWORK],
    [failure(401), "auth", SESSION],
    [failure(200, "PGRST301"), "auth", SESSION],
    [
      failure(500),
      "unknown",
      "Não foi possível carregar os leads. Tente novamente.",
    ],
  ];
  it.each(
    cases,
  )("falha %# vira LeadsError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(failureOf(() => LeadsService.listLeads())).resolves.toEqual({
      type: LeadsError,
      reason,
      message,
    });
  });
});

/** Falhas comuns às gravações (`writeFailure`). */
function writeFailures(
  unknownMessage: string,
  forbiddenMessage: string,
  invalidMessage?: string,
): FailureCase[] {
  const invalid: FailureCase[] = invalidMessage
    ? [
        [failure(400, "23514"), "invalid", invalidMessage],
        [failure(400, "22P02"), "invalid", invalidMessage],
      ]
    : [];
  return [
    [failure(0), "network", NETWORK],
    [failure(401), "auth", SESSION],
    [failure(200, "PGRST302"), "auth", SESSION],
    [failure(403), "forbidden", forbiddenMessage],
    [failure(400, "42501"), "forbidden", forbiddenMessage],
    ...invalid,
    [failure(500), "unknown", unknownMessage],
  ];
}

describe("createLead", () => {
  it("insere só os campos do formulário, com e-mail nulo quando vazio", async () => {
    supabaseFake.respondWith({ data: row });
    await expect(LeadsService.createLead(input)).resolves.toEqual(lead);
    expect(supabaseFake.queries).toEqual([
      {
        table: "leads",
        calls: [
          { method: "insert", args: [{ ...input, email: null }] },
          { method: "select", args: [LEAD_COLUMNS] },
          { method: "single", args: [] },
        ],
      },
    ]);
  });

  it("envia o e-mail quando preenchido", async () => {
    supabaseFake.respondWith({ data: row });
    await LeadsService.createLead({ ...input, email: "ana@exemplo.com" });
    expect(supabaseFake.queries[0].calls[0].args).toEqual([
      { ...input, email: "ana@exemplo.com" },
    ]);
  });

  it.each(
    writeFailures(
      "Não foi possível cadastrar o lead. Tente novamente.",
      "Apenas o gestor pode cadastrar leads.",
      "Os dados do lead são inválidos. Revise os campos e tente novamente.",
    ),
  )("falha %# vira CreateLeadError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.createLead(input)),
    ).resolves.toEqual({ type: CreateLeadError, reason, message });
  });
});

describe("updateLead", () => {
  it("atualiza só os campos do formulário do lead", async () => {
    supabaseFake.respondWith({ data: row });
    await expect(LeadsService.updateLead("lead-1", input)).resolves.toEqual(
      lead,
    );
    expect(supabaseFake.queries[0]).toEqual({
      table: "leads",
      calls: [
        { method: "update", args: [{ ...input, email: null }] },
        { method: "eq", args: ["id", "lead-1"] },
        { method: "select", args: [LEAD_COLUMNS] },
        { method: "single", args: [] },
      ],
    });
  });

  it.each<FailureCase>([
    [
      failure(406, "PGRST116"),
      "not_found",
      "O lead não foi encontrado. Ele pode ter sido excluído.",
    ],
    ...writeFailures(
      "Não foi possível salvar as alterações do lead. Tente novamente.",
      "Apenas o gestor pode editar leads.",
      "Os dados do lead são inválidos. Revise os campos e tente novamente.",
    ),
  ])("falha %# vira UpdateLeadError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.updateLead("lead-1", input)),
    ).resolves.toEqual({ type: UpdateLeadError, reason, message });
  });
});

describe("changeStage", () => {
  it("atualiza só a etapa", async () => {
    supabaseFake.respondWith({ data: { ...row, stage: "contacted" } });
    await expect(
      LeadsService.changeStage("lead-1", "contacted"),
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

  it.each<FailureCase>([
    [
      failure(406, "PGRST116"),
      "not_found",
      "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.",
    ],
    ...writeFailures(
      "Não foi possível mudar a etapa do lead. Tente novamente.",
      "Apenas o corretor responsável pode mudar a etapa deste lead.",
      "A etapa escolhida é inválida.",
    ),
  ])("falha %# vira ChangeStageError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.changeStage("lead-1", "won")),
    ).resolves.toEqual({ type: ChangeStageError, reason, message });
  });
});

describe("addObservation", () => {
  it("insere só lead_id e conteúdo", async () => {
    supabaseFake.respondWith({ data: row.lead_observations[0] });
    await expect(
      LeadsService.addObservation("lead-1", "Ligou"),
    ).resolves.toEqual(lead.observations[0]);
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
    writeFailures(
      "Não foi possível adicionar a observação. Tente novamente.",
      "Apenas o corretor responsável pode registrar observações neste lead.",
      "A observação é inválida. Escreva de 1 a 1000 caracteres.",
    ),
  )("falha %# vira AddObservationError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.addObservation("lead-1", "x")),
    ).resolves.toEqual({ type: AddObservationError, reason, message });
  });
});

describe("distributeLeads", () => {
  it("chama a RPC distribute_leads com as colunas do lead", async () => {
    supabaseFake.respondWith({ data: [row] });
    await expect(LeadsService.distributeLeads()).resolves.toEqual([lead]);
    expect(supabaseFake.queries).toEqual([
      {
        rpc: "distribute_leads",
        calls: [{ method: "select", args: [LEAD_COLUMNS] }],
      },
    ]);
  });

  it.each<FailureCase>([
    ...writeFailures(
      "Não foi possível distribuir os leads. Tente novamente.",
      "Apenas o gestor pode distribuir leads.",
    ),
    [
      failure(400, "23514"),
      "unknown",
      "Não foi possível distribuir os leads. Tente novamente.",
    ],
  ])("falha %# vira DistributeLeadsError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.distributeLeads()),
    ).resolves.toEqual({ type: DistributeLeadsError, reason, message });
  });
});

describe("deleteLead", () => {
  it("exclui pelo id e confere a linha removida", async () => {
    supabaseFake.respondWith({ data: [{ id: "lead-1" }] });
    await expect(LeadsService.deleteLead("lead-1")).resolves.toBeUndefined();
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
    [
      { data: [] },
      "not_found",
      "O lead não foi encontrado. Ele pode já ter sido excluído.",
    ],
    ...writeFailures(
      "Não foi possível excluir o lead. Tente novamente.",
      "Apenas o gestor pode excluir leads.",
    ),
    [
      failure(400, "22P02"),
      "unknown",
      "Não foi possível excluir o lead. Tente novamente.",
    ],
  ])("falha %# vira DeleteLeadError", async (response, reason, message) => {
    supabaseFake.respondWith(response);
    await expect(
      failureOf(() => LeadsService.deleteLead("lead-1")),
    ).resolves.toEqual({ type: DeleteLeadError, reason, message });
  });
});
