// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManagerBrokersScreen } from "@/screens/manager-brokers-screen";
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
const brokers = [brokerRow("b1", "Bia", IN_1H), brokerRow("b2", "Caio")];
const leads = [
  leadRow({ id: "l1", broker_id: "b1", stage: "contacted" }),
  leadRow({ id: "l2", broker_id: "b1", stage: "new" }),
  leadRow({ id: "l3", broker_id: "b1", stage: "contacted" }),
  leadRow({ id: "l4", broker_id: "b2", stage: "contacted" }),
  leadRow({ id: "l5", broker_id: null }),
];

beforeEach(() => supabaseFake.reset());

describe("ManagerBrokersScreen", () => {
  async function renderPage(rows = brokers) {
    arrangeSession(MANAGER);
    supabaseFake.respondWith(
      { on: "profiles", data: rows },
      { on: "leads", data: leads },
    );
    render(<ManagerBrokersScreen />, { wrapper: ScreenProviders });
    await waitFor(() => expect(screen.queryByText("Carregando…")).toBeNull());
  }

  it("mostra a presença e a carga de cada corretor", async () => {
    await renderPage();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Todos (2)",
      "Disponíveis (1)",
      "Ausentes (1)",
    ]);
    expect(screen.getByText("Disponível")).toBeTruthy();
    expect(screen.getByText("Ausente")).toBeTruthy();
    const workload = (name: string) =>
      Array.from(
        screen.getByText(name).closest(".rounded-xl")?.querySelectorAll("dd") ??
          [],
        (dd) => dd.textContent,
      );
    expect(workload("Bia")).toEqual(["3", "2"]);
    expect(workload("Caio")).toEqual(["1", "1"]);
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
