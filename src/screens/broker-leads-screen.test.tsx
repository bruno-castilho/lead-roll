// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrokerLeadsScreen } from "@/screens/broker-leads-screen";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, brokerRow, leadRow } from "@/test/fixtures";
import { ScreenProviders } from "@/test/screen-providers";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);
vi.mock(
  "next/navigation",
  async () => (await import("@/test/app-mocks")).navigationMock,
);
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const IN_1H = new Date(Date.now() + 60 * 60 * 1000).toISOString();

beforeEach(() => supabaseFake.reset());

describe("BrokerLeadsScreen", () => {
  async function renderPage(
    leads: ReturnType<typeof leadRow>[],
    presence: object | null,
  ) {
    arrangeSession(BROKER);
    supabaseFake.respondWith(
      { on: "broker_presence", data: presence },
      { on: "leads", data: leads },
      { on: "profiles", data: [brokerRow("broker-1", "Carlos Lima")] },
    );
    render(<BrokerLeadsScreen />, { wrapper: ScreenProviders });
    await waitFor(() =>
      expect(supabaseFake.queries.map((q) => q.table)).toContain("leads"),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Carregando leads")).toBeNull(),
    );
  }

  it("ausente e sem leads: aviso e convite para escanear o QR code", async () => {
    await renderPage([], null);
    expect(await screen.findByText("Você está ausente")).toBeTruthy();
    expect(
      screen.getByText(
        "Escaneie o QR code na tela da empresa para participar da próxima distribuição de leads.",
      ),
    ).toBeTruthy();
    // A confirmação é só pelo QR code: não há mais botão.
    expect(screen.queryByRole("button", { name: /presença/i })).toBeNull();
  });

  it("presente e sem leads: aguarda a distribuição", async () => {
    await renderPage([], { queued_at: IN_1H, expires_at: IN_1H });
    expect(
      await screen.findByText(
        "Você está disponível. Novos leads aparecerão aqui após a próxima distribuição do gestor.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Você está ausente")).toBeNull();
  });

  it("mostra só os próprios leads, agrupados por etapa (mobile)", async () => {
    await renderPage(
      [
        leadRow({ id: "a", name: "Lead A", broker_id: "broker-1" }),
        leadRow({
          id: "b",
          name: "Lead B",
          broker_id: "broker-1",
          stage: "contacted",
        }),
        leadRow({ id: "x", name: "Lead de outro", broker_id: "outro" }),
      ],
      null,
    );
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent);
    expect(tabs).toEqual([
      "Novo1",
      "Em contato1",
      "Visita agendada0",
      "Proposta0",
      "Ganho0",
      "Perdido0",
    ]);
    expect(screen.getByText("Lead A")).toBeTruthy();
    expect(screen.queryByText("Lead de outro")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Em contato/ }));
    expect(screen.getByText("Lead B")).toBeTruthy();
    expect(screen.queryByText("Lead A")).toBeNull();
  });

  it("detalhes no modo do corretor: etapa e observação", async () => {
    await renderPage(
      [leadRow({ id: "a", name: "Lead A", broker_id: "broker-1" })],
      null,
    );
    fireEvent.click(screen.getByRole("button", { name: "Lead A" }));
    const details = within(
      await screen.findByRole("dialog", { name: "Lead A" }),
    );
    expect(details.getByText("Etapa do atendimento")).toBeTruthy();
    expect(details.getByLabelText("Nova observação")).toBeTruthy();
    expect(details.getByText("Carlos Lima")).toBeTruthy();
    expect(details.queryByRole("button", { name: "Editar" })).toBeNull();
  });
});
