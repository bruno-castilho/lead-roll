import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmPresenceError } from "@/errors/confirm-presence-error";
import { PresenceError } from "@/errors/presence-error";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { PresenceService } from "./presence-service";

vi.mock("@/lib/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";

const presenceRow = {
  queued_at: "2026-11-14T10:00:00Z",
  expires_at: "2026-11-14T15:00:00Z",
};
const presence = {
  queuedAt: "2026-11-14T10:00:00Z",
  expiresAt: "2026-11-14T15:00:00Z",
};

beforeEach(() => supabaseFake.reset());

describe("getOwnPresence", () => {
  it("busca a linha do corretor", async () => {
    supabaseFake.respondWith({ data: presenceRow });
    await expect(PresenceService.getOwnPresence("broker-1")).resolves.toEqual(
      presence,
    );
    expect(supabaseFake.queries).toEqual([
      {
        table: "broker_presence",
        calls: [
          { method: "select", args: ["queued_at, expires_at"] },
          { method: "eq", args: ["broker_id", "broker-1"] },
          { method: "maybeSingle", args: [] },
        ],
      },
    ]);
  });

  it("devolve null se o corretor nunca confirmou", async () => {
    supabaseFake.respondWith({ data: null });
    await expect(
      PresenceService.getOwnPresence("broker-1"),
    ).resolves.toBeNull();
  });

  it.each([
    [0, "XX000", "network", NETWORK],
    [401, "XX000", "auth", SESSION],
    [200, "PGRST301", "auth", SESSION],
    [
      500,
      "XX000",
      "unknown",
      "Não foi possível carregar sua presença. Tente novamente.",
    ],
  ])("status %i / %s vira PresenceError %s", async (status, code, reason, message) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    const error = await PresenceService.getOwnPresence("b").catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(PresenceError);
    expect(error).toMatchObject({ reason, message });
  });
});

describe("confirmPresence", () => {
  it("chama a RPC confirm_presence", async () => {
    supabaseFake.respondWith({ data: presenceRow });
    await expect(PresenceService.confirmPresence()).resolves.toEqual(presence);
    expect(supabaseFake.queries).toEqual([
      { rpc: "confirm_presence", calls: [] },
    ]);
  });

  it.each([
    [0, "XX000", "network", NETWORK],
    [401, "XX000", "auth", SESSION],
    [200, "PGRST301", "auth", SESSION],
    [403, "XX000", "forbidden", "Apenas corretores podem confirmar presença."],
    [400, "42501", "forbidden", "Apenas corretores podem confirmar presença."],
    [
      500,
      "XX000",
      "unknown",
      "Não foi possível confirmar sua presença. Tente novamente.",
    ],
  ])("status %i / %s vira ConfirmPresenceError %s", async (status, code, reason, message) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    const error = await PresenceService.confirmPresence().catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ConfirmPresenceError);
    expect(error).toMatchObject({ reason, message });
  });
});
