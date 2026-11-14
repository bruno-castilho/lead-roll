// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lead } from "@/lib/types";
import { SessionProvider } from "@/modules/auth";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, leadRow, MANAGER } from "@/test/fixtures";
import { useLeads } from "./use-leads";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

function lead(id: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id,
    name: `Lead ${id}`,
    phone: "(11) 98765-4321",
    email: undefined,
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

async function renderLeads(options?: { own?: boolean }) {
  const view = renderHook(() => useLeads(options), {
    wrapper: SessionProvider,
  });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view.result;
}

const ids = (list: Lead[]) => list.map((l) => l.id);

beforeEach(() => supabaseFake.reset());

describe("useLeads", () => {
  it("carrega enquanto não há perfil", () => {
    arrangeSession(null);
    const { result } = renderHook(() => useLeads(), {
      wrapper: SessionProvider,
    });
    expect(result.current).toMatchObject({ leads: [], loading: true });
  });

  it("busca todos os leads para o gestor", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({
      data: [leadRow({ id: "a" }), leadRow({ id: "b" })],
    });
    const result = await renderLeads();
    expect(ids(result.current.leads)).toEqual(["a", "b"]);
    expect(supabaseFake.queries[1].calls.map((c) => c.method)).toEqual([
      "select",
      "order",
    ]);
  });

  it("com own, filtra pelo usuário conectado", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({ data: [] });
    await renderLeads({ own: true });
    expect(supabaseFake.queries[1].calls[1]).toEqual({
      method: "eq",
      args: ["broker_id", "broker-1"],
    });
  });

  it("falha: avisa e deixa a lista vazia", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({ status: 0, error: postgrestError("XX000") });
    const result = await renderLeads();
    expect(result.current.leads).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
    );
  });

  it("addLead põe o lead no topo sem duplicar", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({
      data: [leadRow({ id: "a" }), leadRow({ id: "b" })],
    });
    const result = await renderLeads();
    act(() => result.current.addLead(lead("c")));
    act(() => result.current.addLead(lead("b", { name: "Novo nome" })));
    expect(ids(result.current.leads)).toEqual(["b", "c", "a"]);
    expect(result.current.leads[0].name).toBe("Novo nome");
  });

  it("replaceLead e removeLead", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({
      data: [leadRow({ id: "a" }), leadRow({ id: "b" })],
    });
    const result = await renderLeads();
    act(() => result.current.replaceLead(lead("b", { stage: "won" })));
    expect(result.current.leads[1].stage).toBe("won");
    act(() => result.current.replaceLead(lead("zz")));
    expect(ids(result.current.leads)).toEqual(["a", "b"]);
    act(() => result.current.removeLead(lead("a")));
    expect(ids(result.current.leads)).toEqual(["b"]);
  });

  it("addObservation acrescenta só a observação, sem duplicar", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({
      data: [
        leadRow({
          id: "a",
          stage: "contacted",
          lead_observations: [
            {
              id: "o1",
              content: "Primeira",
              created_at: "2026-11-01T10:00:00Z",
            },
          ],
        }),
      ],
    });
    const result = await renderLeads({ own: true });
    const second = {
      id: "o2",
      content: "Segunda",
      createdAt: "2026-11-02T10:00:00Z",
    };
    act(() => result.current.addObservation("a", second));
    act(() => result.current.addObservation("a", second));
    const [updated] = result.current.leads;
    expect(updated.observations.map((o) => o.id)).toEqual(["o1", "o2"]);
    expect(updated.stage).toBe("contacted");
  });
});
