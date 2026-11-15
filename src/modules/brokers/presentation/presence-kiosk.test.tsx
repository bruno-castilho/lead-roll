// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { qrCodePath } from "@/shared/ui/components/qr-code";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, KIOSK } from "@/test/fixtures";
import { SignedIn } from "@/test/signed-in";
import { PresenceKiosk } from "./presence-kiosk";
import { PRESENCE_QR_RETRY_MS } from "./use-presence-qr";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

const NOW = new Date("2026-11-14T15:00:00Z");
const FIRST = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";
const SECOND = "7d1e0c44-2b9a-4f6e-8c3d-5a2b1f0e9d87";
const FIVE_MINUTES = 5 * 60 * 1000;

// O relógio do banco está 1h adiantado: o totem só usa a duração.
function issued(token: string) {
  return {
    on: "issue_presence_token",
    data: {
      token,
      issued_by: "kiosk-1",
      issued_at: "2026-11-14T16:00:00Z",
      expires_at: "2026-11-14T16:05:00Z",
    },
  };
}

const link = (token: string) =>
  `${window.location.origin}/corretor/presenca?token=${token}`;
const qrPath = () =>
  screen
    .getByRole("img", { name: "QR code para confirmar presença" })
    .querySelector("path")
    ?.getAttribute("d");
const issueCalls = () =>
  supabaseFake.queries.filter((q) => q.rpc === "issue_presence_token").length;

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("PresenceKiosk", () => {
  it("mostra o QR code com o link de presença e o tempo até o próximo", async () => {
    arrangeSession(KIOSK);
    supabaseFake.respondWith(issued(FIRST));
    render(<PresenceKiosk />, { wrapper: SignedIn });
    await waitFor(() => expect(qrPath()).toBe(qrCodePath(link(FIRST)).path));
    expect(await screen.findByText(/^(5:00|4:59)$/)).toBeTruthy();
  });

  it("troca o QR code a cada 5 minutos", async () => {
    arrangeSession(KIOSK);
    supabaseFake.respondWith(issued(FIRST), issued(SECOND));
    render(<PresenceKiosk />, { wrapper: SignedIn });
    await waitFor(() => expect(qrPath()).toBe(qrCodePath(link(FIRST)).path));
    await screen.findByText(/^(5:00|4:59)$/);
    act(() => vi.advanceTimersByTime(FIVE_MINUTES - 1000));
    expect(issueCalls()).toBe(1);
    expect(await screen.findByText(/^0:0[01]$/)).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await waitFor(() => expect(qrPath()).toBe(qrCodePath(link(SECOND)).path));
    expect(issueCalls()).toBe(2);
  });

  it("falha: tira o código da tela e tenta de novo", async () => {
    arrangeSession(KIOSK);
    supabaseFake.respondWith(
      {
        on: "issue_presence_token",
        status: 500,
        error: postgrestError("XX000"),
      },
      issued(FIRST),
    );
    render(<PresenceKiosk />, { wrapper: SignedIn });
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      screen.getByText("Não foi possível gerar o QR code de presença."),
    ).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(PRESENCE_QR_RETRY_MS));
    await waitFor(() => expect(qrPath()).toBe(qrCodePath(link(FIRST)).path));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("não emite QR code para outro perfil", async () => {
    arrangeSession(BROKER);
    render(<PresenceKiosk />, { wrapper: SignedIn });
    await screen.findByTestId("signed-in");
    expect(issueCalls()).toBe(0);
    expect(screen.getByLabelText("Gerando QR code")).toBeTruthy();
  });

  it("para de emitir quando a tela sai", async () => {
    arrangeSession(KIOSK);
    supabaseFake.respondWith(issued(FIRST));
    const { unmount } = render(<PresenceKiosk />, { wrapper: SignedIn });
    await waitFor(() => expect(qrPath()).toBeTruthy());
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(FIVE_MINUTES * 2));
    expect(issueCalls()).toBe(1);
  });
});
