// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { leadRow } from "@/test/fixtures";
import type { Lead } from "../../domain/lead";
import { useAddObservation } from "./use-add-observation";
import { useChangeStage } from "./use-change-stage";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

const lead: Lead = {
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
  observations: [],
};

beforeEach(() => supabaseFake.reset());

describe("useChangeStage", () => {
  it("não faz nada se a etapa não mudou", async () => {
    const onChanged = vi.fn();
    const { result } = renderHook(() => useChangeStage(onChanged));
    await result.current(lead, "new");
    expect(onChanged).not.toHaveBeenCalled();
    expect(supabaseFake.queries).toEqual([]);
  });

  it("move na hora e depois troca pelo lead salvo", async () => {
    const onChanged = vi.fn();
    supabaseFake.respondWith({
      data: leadRow({
        id: "lead-1",
        stage: "contacted",
        broker_id: "broker-1",
        assigned_at: "2026-11-02T10:00:00Z",
      }),
    });
    const { result } = renderHook(() => useChangeStage(onChanged));
    await result.current(lead, "contacted");
    expect(onChanged.mock.calls).toEqual([
      [{ ...lead, stage: "contacted" }],
      [{ ...lead, stage: "contacted" }],
    ]);
    expect(supabaseFake.queries[0].calls[0]).toEqual({
      method: "update",
      args: [{ stage: "contacted" }],
    });
    expect(toast.success).toHaveBeenCalledWith("Etapa alterada com sucesso", {
      description: "Ana Souza: Novo → Em contato",
    });
  });

  it("se o banco recusar, devolve o lead à etapa anterior", async () => {
    const onChanged = vi.fn();
    supabaseFake.respondWith({
      status: 406,
      error: postgrestError("PGRST116"),
    });
    const { result } = renderHook(() => useChangeStage(onChanged));
    await result.current(lead, "won");
    expect(onChanged.mock.calls).toEqual([[{ ...lead, stage: "won" }], [lead]]);
    expect(toast.error).toHaveBeenCalledWith(
      "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.",
    );
  });
});

describe("useAddObservation", () => {
  it("registra, avisa e devolve true", async () => {
    const onAdded = vi.fn();
    supabaseFake.respondWith({
      data: { id: "o1", content: "Ligou", created_at: "2026-11-03T10:00:00Z" },
    });
    const { result } = renderHook(() => useAddObservation(onAdded));
    await expect(result.current(lead, "Ligou")).resolves.toBe(true);
    expect(onAdded).toHaveBeenCalledWith("lead-1", {
      id: "o1",
      content: "Ligou",
      createdAt: "2026-11-03T10:00:00Z",
    });
    expect(toast.success).toHaveBeenCalledWith("Observação adicionada");
  });

  it("falha: avisa e devolve false", async () => {
    const onAdded = vi.fn();
    supabaseFake.respondWith({ status: 400, error: postgrestError("42501") });
    const { result } = renderHook(() => useAddObservation(onAdded));
    await expect(result.current(lead, "x")).resolves.toBe(false);
    expect(onAdded).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Apenas o corretor responsável pode registrar observações neste lead.",
    );
  });
});
