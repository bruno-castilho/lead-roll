// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";
import { location } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, MANAGER } from "@/test/fixtures";
import { SignedIn } from "@/test/signed-in";
import { AppShell } from "./app-shell";

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
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function Providers({ children }: { children: ReactNode }) {
  return (
    <SignedIn>
      <TooltipProvider>{children}</TooltipProvider>
    </SignedIn>
  );
}

async function renderShell() {
  render(
    <AppShell userRole="manager">
      <p>conteúdo</p>
    </AppShell>,
    { wrapper: Providers },
  );
  await screen.findByText("conteúdo");
}

const sidebarNav = () =>
  within(screen.getAllByRole("navigation", { name: "Navegação principal" })[0]);

beforeEach(() => {
  supabaseFake.reset();
  arrangeSession(MANAGER);
  location.pathname = "/gestor/leads";
});

describe("AppShell", () => {
  it("menu do gestor com a página atual marcada", async () => {
    await renderShell();
    expect(screen.getByText("Gestão")).toBeTruthy();
    const links = sidebarNav().getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Leads", "/gestor/leads"],
      ["Corretores", "/gestor/corretores"],
    ]);
    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(links[1].getAttribute("aria-current")).toBeNull();
  });

  it("recolhe e expande o menu lateral", async () => {
    await renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Recolher menu" }));
    expect(screen.queryByText("Gestão")).toBeNull();
    expect(screen.getByText("L")).toBeTruthy();
    expect(sidebarNav().getAllByText("Leads")[0].className).toContain(
      "sr-only",
    );
    fireEvent.click(screen.getByRole("button", { name: "Expandir menu" }));
    expect(screen.getByText("Gestão")).toBeTruthy();
  });

  it("abre o menu no mobile e fecha ao navegar", async () => {
    await renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));
    const sheet = within(await screen.findByRole("dialog"));
    expect(sheet.getByText("Menu de navegação")).toBeTruthy();
    fireEvent.click(sheet.getByRole("link", { name: "Corretores" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("o gestor não vê a presença", async () => {
    await renderShell();
    expect(screen.queryByText("Ausente")).toBeNull();
    expect(screen.queryByText("Disponível")).toBeNull();
  });
});
