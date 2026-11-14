// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/contexts/session";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, brokerRow, MANAGER } from "@/test/fixtures";
import { useBrokers } from "./use-brokers";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

beforeEach(() => supabaseFake.reset());

describe("useBrokers", () => {
  it("carrega enquanto não há perfil", () => {
    arrangeSession(null);
    const { result } = renderHook(() => useBrokers(), {
      wrapper: SessionProvider,
    });
    expect(result.current).toEqual({ brokers: [], loading: true });
  });

  it("busca os corretores quando há perfil", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({ data: [brokerRow("b1", "Bia")] });
    const { result } = renderHook(() => useBrokers(), {
      wrapper: SessionProvider,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brokers).toEqual([
      {
        id: "b1",
        name: "Bia",
        email: "b1@leadroll.demo",
        isPresent: false,
      },
    ]);
  });

  it("falha: avisa e deixa a lista vazia", async () => {
    arrangeSession(MANAGER);
    supabaseFake.respondWith({ status: 500, error: postgrestError("XX000") });
    const { result } = renderHook(() => useBrokers(), {
      wrapper: SessionProvider,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.brokers).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível carregar os corretores. Tente novamente.",
    );
  });
});
