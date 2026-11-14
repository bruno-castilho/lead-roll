// @vitest-environment jsdom
import { AuthApiError } from "@supabase/supabase-js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/contexts/session";
import { router, toast } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, MANAGER } from "@/test/fixtures";
import { UserMenu } from "./user-menu";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
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

async function openMenu() {
  arrangeSession(MANAGER);
  render(
    <SessionProvider>
      <UserMenu />
    </SessionProvider>,
  );
  const trigger = await screen.findByRole("button", {
    name: "Menu do usuário",
  });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
}

beforeEach(() => supabaseFake.reset());

describe("UserMenu", () => {
  it("não aparece sem perfil", async () => {
    arrangeSession(null);
    render(
      <SessionProvider>
        <UserMenu />
      </SessionProvider>,
    );
    await waitFor(() =>
      expect(supabaseFake.auth.getSession).toHaveBeenCalled(),
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("mostra nome, e-mail e perfil", async () => {
    await openMenu();
    expect(await screen.findByText("gestor@leadroll.demo")).toBeTruthy();
    expect(screen.getByText("Gestor")).toBeTruthy();
  });

  it("sair: limpa a sessão, vai para o login e avisa", async () => {
    supabaseFake.auth.signOut.mockResolvedValue({ error: null });
    await openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sair" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Você saiu da conta."),
    );
    expect(router.replace).toHaveBeenCalledWith("/login");
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(
      screen.queryByRole("button", { name: "Menu do usuário" }),
    ).toBeNull();
  });

  it("sair com falha no servidor: sai mesmo assim e avisa (BUG-02)", async () => {
    supabaseFake.auth.signOut.mockResolvedValue({
      error: new AuthApiError("falhou", 500, "x"),
    });
    await openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sair" }));
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "Error ao fazer logout. Tente novamente mais tarde.",
      ),
    );
    expect(router.replace).toHaveBeenCalledWith("/login");
  });
});
