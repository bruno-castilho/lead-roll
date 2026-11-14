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
import { PresenceProvider } from "@/contexts/presence";
import { SessionProvider } from "@/contexts/session";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";
import { supabaseFake } from "@/test/fake-supabase";
import {
  arrangeSession,
  BROKER,
  brokerRow,
  leadRow,
  MANAGER,
} from "@/test/fixtures";
import { BrokerLeadsPage } from "./broker-leads-page";
import { ManagerBrokersPage } from "./manager-brokers-page";
import { ManagerLeadsPage } from "./manager-leads-page";

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

function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PresenceProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </PresenceProvider>
    </SessionProvider>
  );
}

/** 12 leads: 3 sem responsável e 9 distribuídos entre b1 e b2. */
function managerLeads() {
  return Array.from({ length: 12 }, (_, i) =>
    leadRow({
      id: `lead-${i + 1}`,
      name: `Lead ${String(i + 1).padStart(2, "0")}`,
      broker_id: i < 3 ? null : i % 2 ? "b1" : "b2",
      stage: i < 3 ? "new" : "contacted",
      created_at: `2026-11-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      assigned_at: i < 3 ? null : "2026-11-13T10:00:00Z",
    }),
  );
}

const brokers = [brokerRow("b1", "Bia", IN_1H), brokerRow("b2", "Caio")];

beforeEach(() => supabaseFake.reset());

describe("ManagerLeadsPage", () => {
  async function renderPage(leads = managerLeads()) {
    arrangeSession(MANAGER);
    supabaseFake.respondWith(
      { on: "profiles", data: brokers },
      { on: "leads", data: leads },
    );
    render(<ManagerLeadsPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(
        screen.queryAllByText(/^Lead 12$|^Nenhum lead cadastrado$/),
      ).not.toHaveLength(0),
    );
  }

  const quickFilters = () =>
    within(screen.getByRole("group", { name: "Filtros rápidos" }))
      .getAllByRole("button")
      .map((b) => [b.getAttribute("aria-pressed"), b.textContent]);
  const table = () => within(screen.getByRole("table"));

  it("mostra os totais, a primeira página e o responsável", async () => {
    await renderPage();
    expect(quickFilters()).toEqual([
      ["true", "TodosTodos os leads12"],
      ["false", "Sem resp.Sem responsável3"],
      ["false", "DistribuídosDistribuídos9"],
    ]);
    expect(screen.getByText("1–10 de 12")).toBeTruthy();
    const rows = table().getAllByRole("row");
    expect(rows).toHaveLength(11);
    expect(within(rows[1]).getByText("Lead 12")).toBeTruthy();
    expect(within(rows[1]).getByText("Bia")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Distribuir leads/ }).textContent,
    ).toBe("Distribuir leads3");
  });

  it("o filtro rápido 'Sem responsável' mostra só os pendentes", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Sem responsável3/ }));
    expect(screen.getByText("1–3 de 3")).toBeTruthy();
    expect(table().getAllByText("Sem responsável")).toHaveLength(3);
  });

  it("pesquisa sem resultado e limpa os filtros", async () => {
    await renderPage();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Pesquisar por nome ou telefone" }),
      { target: { value: "zzz" } },
    );
    expect(screen.getByText("Nenhum lead encontrado")).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: /Limpar filtros/ })[0],
    );
    expect(screen.getByText("1–10 de 12")).toBeTruthy();
  });

  it("sem leads, convida a cadastrar", async () => {
    await renderPage([]);
    expect(screen.getByText("Nenhum lead cadastrado")).toBeTruthy();
  });

  it("todos distribuídos: estado vazio do filtro 'Sem responsável'", async () => {
    await renderPage(managerLeads().slice(3));
    fireEvent.click(screen.getByRole("button", { name: /Sem responsável0/ }));
    expect(screen.getByText("Nenhum lead sem responsável")).toBeTruthy();
  });

  it("o atalho N abre o cadastro", async () => {
    await renderPage();
    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByRole("dialog", { name: "Novo lead" })).toBeTruthy();
  });

  it("abre os detalhes no modo do gestor", async () => {
    await renderPage();
    fireEvent.click(table().getByText("Lead 12"));
    const details = within(
      await screen.findByRole("dialog", { name: "Lead 12" }),
    );
    expect(details.getByText("Bia")).toBeTruthy();
    expect(details.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(details.getByRole("button", { name: "Excluir" })).toBeTruthy();
    expect(details.queryByText("Etapa do atendimento")).toBeNull();
    expect(details.queryByLabelText("Nova observação")).toBeNull();
  });

  it("abre a distribuição", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Distribuir leads/ }));
    expect(
      screen.getByRole("dialog", { name: "Distribuição de leads" }),
    ).toBeTruthy();
  });
});

describe("BrokerLeadsPage", () => {
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
    render(<BrokerLeadsPage />, { wrapper: Providers });
    await waitFor(() =>
      expect(supabaseFake.queries.map((q) => q.table)).toContain("leads"),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Carregando leads")).toBeNull(),
    );
  }

  it("ausente e sem leads: aviso e convite para confirmar presença", async () => {
    await renderPage([], null);
    expect(await screen.findByText("Você está ausente")).toBeTruthy();
    expect(
      screen.getByText(
        "Confirme sua presença para participar da próxima distribuição de leads.",
      ),
    ).toBeTruthy();
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

describe("ManagerBrokersPage", () => {
  async function renderPage(rows = brokers) {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({ on: "profiles", data: rows });
    render(<ManagerBrokersPage />, { wrapper: Providers });
    await waitFor(() => expect(screen.queryByText("Carregando…")).toBeNull());
  }

  it("mostra a presença e a carga (sempre 0, BUG-01)", async () => {
    await renderPage();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Todos (2)",
      "Disponíveis (1)",
      "Ausentes (1)",
    ]);
    expect(screen.getByText("Disponível")).toBeTruthy();
    expect(screen.getByText("Ausente")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(4);
  });

  it("filtra por presença", async () => {
    await renderPage();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Ausentes (1)" }), {
      button: 0,
    });
    expect(screen.getByText("Caio")).toBeTruthy();
    expect(screen.queryByText("Bia")).toBeNull();
  });

  it("sem corretores", async () => {
    await renderPage([]);
    expect(screen.getByText("Nenhum corretor cadastrado")).toBeTruthy();
  });
});
