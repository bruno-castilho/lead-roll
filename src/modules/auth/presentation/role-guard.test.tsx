// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { RoleGuard } from "./role-guard";
import { SessionProvider } from "./session-provider";

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

function renderGuard() {
  return render(
    <SessionProvider>
      <RoleGuard allow="broker">
        <p>conteúdo protegido</p>
      </RoleGuard>
    </SessionProvider>,
  );
}

const loading = () => screen.queryByText("Carregando…");

beforeEach(() => supabaseFake.reset());

describe("RoleGuard", () => {
  it("antes da sessão ser restaurada, renderiza a página oculta", () => {
    arrangeSession(BROKER);
    const { container } = renderGuard();
    const hidden = container.querySelector("div[hidden]");
    expect(hidden?.textContent).toContain("conteúdo protegido");
    expect(loading()).not.toBeNull();
  });

  it("sem sessão, vai para o login e não renderiza o conteúdo", async () => {
    arrangeSession(null);
    renderGuard();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("conteúdo protegido")).toBeNull();
    expect(loading()).not.toBeNull();
  });

  it("com outro perfil, vai para a página inicial dele", async () => {
    arrangeSession(MANAGER);
    renderGuard();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/gestor/leads"),
    );
    expect(screen.queryByText("conteúdo protegido")).toBeNull();
  });

  it("com o perfil permitido, mostra o conteúdo", async () => {
    arrangeSession(BROKER);
    const { container } = renderGuard();
    await waitFor(() => expect(loading()).toBeNull());
    expect(container.querySelector("div[hidden]")).toBeNull();
    expect(screen.getByText("conteúdo protegido")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
