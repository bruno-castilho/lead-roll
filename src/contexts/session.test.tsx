// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "@/hooks/use-session";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER } from "@/test/fixtures";
import { SessionProvider } from "./session";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";

function Probe() {
  const { ready, profile, clearSession } = useSession();
  return (
    <>
      <output aria-label="ready">{String(ready)}</output>
      <output aria-label="profile">{profile ? profile.name : "none"}</output>
      <button type="button" onClick={clearSession}>
        sair
      </button>
    </>
  );
}

async function renderProvider() {
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await screen.findByText("true");
}

const profile = () => screen.getByLabelText("profile").textContent;

beforeEach(() => supabaseFake.reset());

describe("SessionProvider", () => {
  it("começa sem estar pronto", () => {
    arrangeSession(null);
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByLabelText("ready").textContent).toBe("false");
  });

  it("fica pronto sem perfil quando não há sessão", async () => {
    arrangeSession(null);
    await renderProvider();
    expect(profile()).toBe("none");
    expect(supabaseFake.auth.signOut).not.toHaveBeenCalled();
  });

  it("restaura a sessão com o perfil de profiles", async () => {
    arrangeSession(BROKER);
    await renderProvider();
    expect(profile()).toBe("Carlos Lima");
    expect(supabaseFake.queries[0]).toMatchObject({ table: "profiles" });
  });

  it.each([
    ["sem perfil", { data: null }],
    ["sessão expirada", { status: 401, error: postgrestError("XX000") }],
  ])("%s: encerra a sessão local e fica sem perfil", async (_label, response) => {
    arrangeSession(null);
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    supabaseFake.auth.signOut.mockResolvedValue({ error: null });
    supabaseFake.respondWith(response);
    await renderProvider();
    expect(profile()).toBe("none");
    expect(supabaseFake.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("falha de rede ao buscar o perfil: avisa e não encerra a sessão", async () => {
    arrangeSession(null);
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    supabaseFake.respondWith({ status: 0, error: postgrestError("XX000") });
    await renderProvider();
    expect(profile()).toBe("none");
    expect(supabaseFake.auth.signOut).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(NETWORK);
  });

  it("falha de rede ao restaurar a sessão: avisa", async () => {
    arrangeSession(null);
    const { AuthRetryableFetchError } = await import("@supabase/supabase-js");
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError("x", 0),
    });
    await renderProvider();
    expect(toast.error).toHaveBeenCalledWith(NETWORK);
  });

  it("limpa o perfil quando a sessão termina em outra aba", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    arrangeSession(BROKER);
    await renderProvider();
    const listener = supabaseFake.auth.onAuthStateChange.mock.calls[0][0];
    act(() => {
      listener("SIGNED_OUT");
      vi.runAllTimers();
    });
    expect(profile()).toBe("none");
    vi.useRealTimers();
  });

  it("clearSession limpa o perfil na hora", async () => {
    arrangeSession(BROKER);
    await renderProvider();
    act(() => screen.getByText("sair").click());
    expect(profile()).toBe("none");
  });
});
