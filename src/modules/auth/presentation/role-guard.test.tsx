// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { RoleGuard } from "./role-guard";
import { SessionProvider } from "./session-provider";
import { useSession } from "./use-session";

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

function SignOutButton() {
  const { clearSession } = useSession();
  return (
    <button type="button" onClick={clearSession}>
      sair
    </button>
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

  it("sem sessão num link (QR code), o login volta para ele depois", async () => {
    window.history.replaceState(null, "", "/corretor/presenca?token=abc");
    try {
      arrangeSession(null);
      renderGuard();
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith(
          "/login?next=%2Fcorretor%2Fpresenca%3Ftoken%3Dabc",
        ),
      );
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("ao sair da conta, vai para o login sem destino de volta", async () => {
    window.history.replaceState(null, "", "/corretor/leads");
    try {
      arrangeSession(BROKER);
      render(
        <SessionProvider>
          <SignOutButton />
          <RoleGuard allow="broker">
            <p>conteúdo protegido</p>
          </RoleGuard>
        </SessionProvider>,
      );
      await waitFor(() => expect(loading()).toBeNull());
      fireEvent.click(screen.getByRole("button", { name: "sair" }));
      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith("/login"),
      );
    } finally {
      window.history.replaceState(null, "", "/");
    }
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
