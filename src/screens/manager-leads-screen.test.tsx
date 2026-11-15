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
import { ManagerLeadsScreen } from "@/screens/manager-leads-screen";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, brokerRow, leadRow, MANAGER } from "@/test/fixtures";
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

describe("ManagerLeadsScreen", () => {
  async function renderPage(leads = managerLeads()) {
    arrangeSession(MANAGER);
    supabaseFake.respondWith(
      { on: "profiles", data: brokers },
      { on: "leads", data: leads },
    );
    render(<ManagerLeadsScreen />, { wrapper: ScreenProviders });
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
