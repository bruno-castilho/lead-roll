// @vitest-environment jsdom
import { AuthApiError } from "@supabase/supabase-js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { LoginForm } from "./login-form";
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

async function renderLogin() {
  arrangeSession(null);
  render(
    <SessionProvider>
      <LoginForm />
    </SessionProvider>,
  );
  // Espera a restauração (sem sessão) terminar.
  await waitFor(() => expect(supabaseFake.auth.getSession).toHaveBeenCalled());
}

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

function signInSucceeds() {
  supabaseFake.auth.signInWithPassword.mockResolvedValue({
    data: { user: { id: "user-1" }, session: { access_token: "t" } },
    error: null,
  });
}

beforeEach(() => supabaseFake.reset());

describe("LoginForm", () => {
  it("valida os campos antes de chamar o Supabase", async () => {
    await renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe o e-mail.")).toBeTruthy();
    expect(screen.getByText("Informe a senha.")).toBeTruthy();
    expect(supabaseFake.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it.each([
    [MANAGER, "/gestor/leads"],
    [BROKER, "/corretor/leads"],
  ])("entra e vai para a página inicial do perfil %#", async (row, home) => {
    await renderLogin();
    signInSucceeds();
    supabaseFake.respondWith({ data: row });
    submit(" ana@leadroll.demo ", "123456");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(home));
    expect(supabaseFake.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "ana@leadroll.demo",
      password: "123456",
    });
    expect(supabaseFake.auth.signOut).not.toHaveBeenCalled();
  });

  it("mostra o erro do login sem buscar o perfil", async () => {
    await renderLogin();
    supabaseFake.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new AuthApiError("x", 400, "invalid_credentials"),
    });
    submit("ana@leadroll.demo", "errada");
    expect((await screen.findByRole("alert")).textContent).toBe(
      "E-mail ou senha inválidos.",
    );
    expect(supabaseFake.queries).toEqual([]);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it.each([
    [
      "sem perfil",
      { data: null },
      "Sua conta não tem um perfil configurado. Fale com o gestor.",
    ],
    [
      "falha de rede no perfil",
      { status: 0, error: postgrestError("XX000") },
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
    ],
  ])("%s: encerra a sessão e mostra o erro", async (_label, response, message) => {
    await renderLogin();
    signInSucceeds();
    supabaseFake.auth.signOut.mockResolvedValue({ error: null });
    supabaseFake.respondWith(response);
    submit("ana@leadroll.demo", "123456");
    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(router.replace).not.toHaveBeenCalled();
  });
});
