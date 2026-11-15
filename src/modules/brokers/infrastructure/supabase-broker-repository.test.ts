import { beforeEach, describe, expect, it, vi } from "vitest";
import { failureOf } from "@/test/failure-of";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { BrokersError } from "../application/brokers-error";
import { supabaseBrokerRepository } from "./supabase-broker-repository";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const READ_CASES = [
  [0, "XX000", "network"],
  [401, "XX000", "auth"],
  [200, "PGRST301", "auth"],
  [403, "42501", "unknown"],
  [500, "XX000", "unknown"],
] as const;

beforeEach(() => supabaseFake.reset());

describe("supabaseBrokerRepository.list", () => {
  it("busca os corretores em ordem alfabética, com a presença", async () => {
    supabaseFake.respondWith({
      data: [
        {
          id: "a",
          name: "Ana",
          email: "a@x.com",
          broker_presence: { expires_at: "2026-11-14T16:00:00Z" },
        },
        { id: "b", name: "Bia", email: "b@x.com", broker_presence: null },
      ],
    });
    await expect(supabaseBrokerRepository.list()).resolves.toEqual([
      {
        id: "a",
        name: "Ana",
        email: "a@x.com",
        presenceExpiresAt: "2026-11-14T16:00:00Z",
      },
      { id: "b", name: "Bia", email: "b@x.com", presenceExpiresAt: null },
    ]);
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

  it.each(READ_CASES)("status %i / %s → %s", async (status, code, reason) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    await expect(
      failureOf(BrokersError, () => supabaseBrokerRepository.list()),
    ).resolves.toEqual({
      operation: "listBrokers",
      reason,
    });
  });
});
