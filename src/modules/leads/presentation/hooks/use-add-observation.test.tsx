// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER } from "@/test/fixtures";
import { renderHookSignedIn } from "@/test/signed-in";
import type { Lead } from "../../domain/lead";
import { useAddObservation } from "./use-add-observation";

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

describe("useAddObservation", () => {
  it("registra, avisa e devolve true", async () => {
    const onAdded = vi.fn();
    supabaseFake.respondWith({
      data: { id: "o1", content: "Ligou", created_at: "2026-11-03T10:00:00Z" },
    });
    const { result } = await renderHookSignedIn(() =>
      useAddObservation(onAdded),
    );
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
    const { result } = await renderHookSignedIn(() =>
      useAddObservation(onAdded),
    );
    await expect(result.current(lead, "x")).resolves.toBe(false);
    expect(onAdded).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Apenas o corretor responsável pode registrar observações neste lead.",
    );
  });
});
