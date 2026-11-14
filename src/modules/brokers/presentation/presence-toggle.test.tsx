// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { SignedIn } from "@/test/signed-in";
import { PresenceProvider } from "./presence-provider";
import { PresenceToggle } from "./presence-toggle";

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

async function renderToggle(presence: object | null, compact = false) {
  arrangeSession(BROKER);
  supabaseFake.respondWith({ on: "broker_presence", data: presence });
  render(<PresenceToggle compact={compact} />, { wrapper: Providers });
  await waitFor(() => expect(screen.getByRole("button")).toBeTruthy());
  await waitFor(() =>
    expect(screen.getByRole("button")).toHaveProperty("disabled", false),
  );
}

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: NOW, shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("PresenceToggle", () => {
  it("ausente: botão para confirmar", async () => {
    await renderToggle(null);
    expect(screen.getByRole("button").textContent).toBe("Confirmar presença");
  });

  it("presente: prazo e botão de renovar", async () => {
    await renderToggle({ queued_at: NOW.toISOString(), expires_at: UNTIL });
    expect(screen.getByText("Disponível até 17:00")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe("Renovar");
  });

  it("versão compacta: rótulos para leitor de tela", async () => {
    await renderToggle(null, true);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe(
      "Ausente. Confirmar presença",
    );
  });

  it("versão compacta presente", async () => {
    await renderToggle(
      { queued_at: NOW.toISOString(), expires_at: UNTIL },
      true,
    );
    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Até 17:00");
    expect(button.getAttribute("aria-label")).toBe(
      "Disponível até 17:00. Renovar presença",
    );
  });

  it("confirmar chama a fila", async () => {
    await renderToggle(null);
    supabaseFake.respondWith({
      on: "confirm_presence",
      data: { queued_at: NOW.toISOString(), expires_at: UNTIL },
    });
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("Disponível até 17:00")).toBeTruthy();
  });

  it("não aparece para o gestor", async () => {
    arrangeSession(MANAGER);
    const { container } = render(<PresenceToggle />, {
      wrapper: ({ children }) => (
        <SignedIn>
          <PresenceProvider>{children}</PresenceProvider>
        </SignedIn>
      ),
    });
    await screen.findByTestId("signed-in");
    expect(container.querySelector("button")).toBeNull();
  });
});
