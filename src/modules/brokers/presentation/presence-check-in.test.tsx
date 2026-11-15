// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER } from "@/test/fixtures";
import { SignedIn } from "@/test/signed-in";
import { PresenceCheckIn } from "./presence-check-in";
import { PresenceProvider } from "./presence-provider";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// 12:00 em São Paulo; a presença vale até 17:00.
const NOW = new Date("2026-11-14T15:00:00Z");
const IN_1H = "2026-11-14T16:00:00Z";
const IN_5H = "2026-11-14T20:00:00Z";
const TOKEN = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";

function Providers({ children }: { children: ReactNode }) {
  return (
    <SignedIn>
      <PresenceProvider>{children}</PresenceProvider>
    </SignedIn>
  );
}

function openLink(url: string, presence: object | null) {
  window.history.replaceState(null, "", url);
  arrangeSession(BROKER);
  supabaseFake.respondWith({ on: "broker_presence", data: presence });
  return render(<PresenceCheckIn />, { wrapper: Providers });
}

const confirmCalls = () =>
  supabaseFake.queries.filter((q) => q.rpc === "confirm_presence");

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});

describe("PresenceCheckIn", () => {
  it("link do QR code: confirma uma vez e tira o token da URL", async () => {
    supabaseFake.respondWith({
      on: "confirm_presence",
      data: { queued_at: NOW.toISOString(), expires_at: IN_5H },
    });
    openLink(`/corretor/presenca?token=${TOKEN}`, null);
    expect(await screen.findByText("Presença confirmada")).toBeTruthy();
    expect(
      screen.getByText("Você entrou no final da fila até 17:00."),
    ).toBeTruthy();
    expect(screen.getByText("Tempo restante na fila")).toBeTruthy();
    expect(window.location.pathname + window.location.search).toBe(
      "/corretor/presenca",
    );
    expect(confirmCalls()).toEqual([
      {
        rpc: "confirm_presence",
        calls: [{ method: "args", args: [{ p_token: TOKEN }] }],
      },
    ]);
    expect(screen.getByRole("link", { name: "Ver meus leads" })).toBeTruthy();
  });

  it("já presente: espera a presença atual e mostra a renovação", async () => {
    supabaseFake.respondWith({
      on: "confirm_presence",
      data: { queued_at: "2026-11-14T11:00:00Z", expires_at: IN_5H },
    });
    openLink(`/corretor/presenca?token=${TOKEN}`, {
      queued_at: "2026-11-14T11:00:00Z",
      expires_at: IN_1H,
    });
    expect(await screen.findByText("Presença renovada")).toBeTruthy();
    expect(
      screen.getByText("Você continua na mesma posição da fila até 17:00."),
    ).toBeTruthy();
  });

  it("QR code vencido: não marca presença e explica", async () => {
    supabaseFake.respondWith({
      on: "confirm_presence",
      status: 400,
      error: postgrestError("22023"),
    });
    openLink(`/corretor/presenca?token=${TOKEN}`, null);
    expect(await screen.findByText("Presença não confirmada")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Este QR code expirou. Escaneie o código que está na tela da empresa agora.",
    );
  });

  it("token adulterado: recusa sem chamar o banco", async () => {
    openLink("/corretor/presenca?token=abc", null);
    expect(await screen.findByText("Presença não confirmada")).toBeTruthy();
    expect(confirmCalls()).toEqual([]);
  });

  it("sem token: instrui a escanear o QR code", async () => {
    openLink("/corretor/presenca", null);
    expect(await screen.findByText("Confirme pelo QR code")).toBeTruthy();
    await waitFor(() =>
      expect(supabaseFake.queries.map((q) => q.table)).toContain(
        "broker_presence",
      ),
    );
    expect(confirmCalls()).toEqual([]);
  });
});
