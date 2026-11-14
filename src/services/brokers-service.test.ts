import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrokersError } from "@/errors/brokers-error";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { BrokersService } from "./brokers-service";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const NOW = "2026-11-14T15:00:00.000Z";

const row = (id: string, expiresAt: string | null) => ({
  id,
  name: `Corretor ${id}`,
  email: `${id}@leadroll.demo`,
  broker_presence: expiresAt === null ? null : { expires_at: expiresAt },
});

beforeEach(() => {
  supabaseFake.reset();
  vi.useFakeTimers({ now: new Date(NOW) });
});
afterEach(() => vi.useRealTimers());

describe("listBrokers", () => {
  it("busca os corretores em ordem alfabética, com a presença", async () => {
    supabaseFake.respondWith({ data: [] });
    await BrokersService.listBrokers();
    expect(supabaseFake.queries).toEqual([
      {
        table: "profiles",
        calls: [
          {
            method: "select",
            args: ["id, name, email, broker_presence(expires_at)"],
          },
          { method: "eq", args: ["role", "broker"] },
          { method: "order", args: ["name", { ascending: true }] },
        ],
      },
    ]);
  });

  it("está presente só enquanto a presença não expirou", async () => {
    supabaseFake.respondWith({
      data: [
        row("a", "2026-11-14T15:00:00.001Z"),
        row("b", NOW),
        row("c", "2026-11-14T14:59:59.999Z"),
        row("d", null),
      ],
    });
    const brokers = await BrokersService.listBrokers();
    expect(brokers.map((b) => [b.id, b.isPresent])).toEqual([
      ["a", true],
      ["b", false],
      ["c", false],
      ["d", false],
    ]);
    expect(brokers[0]).toEqual({
      id: "a",
      name: "Corretor a",
      email: "a@leadroll.demo",
      role: "broker",
      isPresent: true,
    });
  });

  it.each([
    [
      0,
      "XX000",
      "network",
      "Não foi possível conectar. Verifique sua internet e tente novamente.",
    ],
    [401, "XX000", "auth", "Sua sessão expirou. Entre novamente."],
    [200, "PGRST303", "auth", "Sua sessão expirou. Entre novamente."],
    [
      500,
      "XX000",
      "unknown",
      "Não foi possível carregar os corretores. Tente novamente.",
    ],
  ])("status %i / %s vira BrokersError %s", async (status, code, reason, message) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    const error = await BrokersService.listBrokers().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BrokersError);
    expect(error).toMatchObject({ reason, message });
  });
});
