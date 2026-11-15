// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, leadRow } from "@/test/fixtures";
import { renderHookSignedIn } from "@/test/signed-in";
import type { Lead } from "../../domain/lead";
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

beforeEach(() => {
  supabaseFake.reset();
  arrangeSession(BROKER);
});

describe("useChangeStage", () => {
  it("não faz nada se a etapa não mudou", async () => {
    const onChanged = vi.fn();
    const { result } = await renderHookSignedIn(() =>
      useChangeStage(onChanged),
    );
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
    const { result } = await renderHookSignedIn(() =>
      useChangeStage(onChanged),
    );
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
    const { result } = await renderHookSignedIn(() =>
      useChangeStage(onChanged),
    );
    await result.current(lead, "won");
    expect(onChanged.mock.calls).toEqual([[{ ...lead, stage: "won" }], [lead]]);
    expect(toast.error).toHaveBeenCalledWith(
      "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.",
    );
  });
});
