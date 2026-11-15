// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { SignedIn } from "@/test/signed-in";
import { PresenceCountdown } from "./presence-countdown";
import { PresenceProvider } from "./presence-provider";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

// 12:00 em São Paulo; a presença vale até 17:00.
const NOW = new Date("2026-11-14T15:00:00Z");
const UNTIL = "2026-11-14T20:00:00Z";

function Providers({ children }: { children: ReactNode }) {
  return (
    <SignedIn>
      <PresenceProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </PresenceProvider>
    </SignedIn>
  );
}

async function renderCountdown(presence: object | null, compact = false) {
  arrangeSession(BROKER);
  supabaseFake.respondWith({ on: "broker_presence", data: presence });
  const view = render(<PresenceCountdown compact={compact} />, {
    wrapper: Providers,
  });
  await waitFor(() =>
    expect(supabaseFake.queries.map((q) => q.table)).toContain(
      "broker_presence",
    ),
  );
  return view;
}

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("PresenceCountdown", () => {
  it("ausente: aviso para escanear o QR code, sem botão", async () => {
    await renderCountdown(null);
    expect(await screen.findByText("Ausente")).toBeTruthy();
    expect(
      screen.getByText(
        ". Escaneie o QR code na tela da empresa para confirmar.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("presente: conta o tempo até o fim da presença", async () => {
    await renderCountdown({ queued_at: NOW.toISOString(), expires_at: UNTIL });
    expect(await screen.findByText("Disponível até 17:00")).toBeTruthy();
    const clock = () => screen.getByText(/^\d+:\d{2}:\d{2}$/).textContent;
    await waitFor(() => expect(clock()).toMatch(/^[45]:\d{2}:\d{2}$/));
    const before = clock();
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(clock()).not.toBe(before);
    expect(clock()).toMatch(/^[34]:\d{2}:\d{2}$/);
  });

  it("vira ausente quando o prazo acaba", async () => {
    await renderCountdown({
      queued_at: NOW.toISOString(),
      expires_at: "2026-11-14T15:00:03Z",
    });
    expect(await screen.findByText("Disponível até 12:00")).toBeTruthy();
    act(() => vi.advanceTimersByTime(4000));
    expect(await screen.findByText("Ausente")).toBeTruthy();
  });

  it("versão compacta: só o ponto e o tempo", async () => {
    await renderCountdown(
      { queued_at: NOW.toISOString(), expires_at: UNTIL },
      true,
    );
    expect(await screen.findByText("Disponível até 17:00")).toBeTruthy();
    expect(screen.queryByText("Disponível")).toBeNull();
  });

  it("não aparece para o gestor", async () => {
    arrangeSession(MANAGER);
    const { container } = render(<PresenceCountdown />, {
      wrapper: Providers,
    });
    await screen.findByTestId("signed-in");
    expect(container.textContent).toBe("");
  });
});
