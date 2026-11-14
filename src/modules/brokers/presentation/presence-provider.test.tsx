// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/contexts/session";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { PresenceProvider } from "./presence-provider";
import { usePresence } from "./use-presence";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

// 12:00 em São Paulo.
const NOW = new Date("2026-11-14T15:00:00Z");
const in1h = "2026-11-14T16:00:00Z";
const in5h = "2026-11-14T20:00:00Z";

function Probe() {
  const { isPresent, loading, confirming, expiresAt, confirm } = usePresence();
  return (
    <>
      <output aria-label="state">
        {loading ? "loading" : isPresent ? `present:${expiresAt}` : "absent"}
      </output>
      <output aria-label="confirming">{String(confirming)}</output>
      <button type="button" onClick={confirm}>
        confirmar
      </button>
    </>
  );
}

function renderPresence() {
  render(
    <SessionProvider>
      <PresenceProvider>
        <Probe />
      </PresenceProvider>
    </SessionProvider>,
  );
}

const state = () => screen.getByLabelText("state").textContent;

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("PresenceProvider", () => {
  it("busca a presença do corretor conectado", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({
      data: { queued_at: "2026-11-14T11:00:00Z", expires_at: in1h },
    });
    renderPresence();
    await waitFor(() => expect(state()).toBe(`present:${in1h}`));
    expect(supabaseFake.queries[1]).toMatchObject({
      table: "broker_presence",
      calls: [
        { method: "select" },
        { method: "eq", args: ["broker_id", "broker-1"] },
        { method: "maybeSingle" },
      ],
    });
  });

  it("fica ausente sozinho quando o prazo termina", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({
      data: { queued_at: "2026-11-14T11:00:00Z", expires_at: in1h },
    });
    renderPresence();
    await waitFor(() => expect(state()).toBe(`present:${in1h}`));
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(state()).toBe("absent");
  });

  it.each([
    ["sem linha", null],
    [
      "linha expirada",
      { queued_at: "2026-11-14T09:00:00Z", expires_at: "2026-11-14T14:59:00Z" },
    ],
  ])("%s: ausente", async (_label, data) => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({ data });
    renderPresence();
    await waitFor(() => expect(state()).toBe("absent"));
  });

  it("falha ao buscar: avisa e mostra ausente (BUG-05)", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith({ status: 500, error: postgrestError("XX000") });
    renderPresence();
    await waitFor(() => expect(state()).toBe("absent"));
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível carregar sua presença. Tente novamente.",
    );
  });

  it("não busca presença para o gestor", async () => {
    arrangeSession(MANAGER);
    renderPresence();
    await waitFor(() => expect(supabaseFake.queries).toHaveLength(1));
    expect(state()).toBe("loading");
  });

  it("confirmar quando ausente: entra no final da fila", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith(
      { data: null },
      { data: { queued_at: NOW.toISOString(), expires_at: in5h } },
    );
    renderPresence();
    await waitFor(() => expect(state()).toBe("absent"));
    act(() => screen.getByText("confirmar").click());
    await waitFor(() => expect(state()).toBe(`present:${in5h}`));
    expect(supabaseFake.queries[2]).toEqual({
      rpc: "confirm_presence",
      calls: [],
    });
    expect(toast.success).toHaveBeenCalledWith("Presença confirmada", {
      description: "Você entrou no final da fila e fica disponível até 17:00.",
    });
    expect(screen.getByLabelText("confirming").textContent).toBe("false");
  });

  it("confirmar quando presente: renova mantendo a posição", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith(
      { data: { queued_at: "2026-11-14T11:00:00Z", expires_at: in1h } },
      { data: { queued_at: "2026-11-14T11:00:00Z", expires_at: in5h } },
    );
    renderPresence();
    await waitFor(() => expect(state()).toBe(`present:${in1h}`));
    act(() => screen.getByText("confirmar").click());
    await waitFor(() => expect(state()).toBe(`present:${in5h}`));
    expect(toast.success).toHaveBeenCalledWith("Presença renovada", {
      description: "Você continua na mesma posição da fila até 17:00.",
    });
  });

  it("falha ao confirmar: avisa e continua como estava", async () => {
    arrangeSession(BROKER);
    supabaseFake.respondWith(
      { data: null },
      { status: 400, error: postgrestError("42501") },
    );
    renderPresence();
    await waitFor(() => expect(state()).toBe("absent"));
    act(() => screen.getByText("confirmar").click());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Apenas corretores podem confirmar presença.",
      ),
    );
    expect(state()).toBe("absent");
    expect(screen.getByLabelText("confirming").textContent).toBe("false");
  });
});
