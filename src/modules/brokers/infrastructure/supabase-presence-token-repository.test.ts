import { beforeEach, describe, expect, it, vi } from "vitest";
import { failureOf } from "@/test/failure-of";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { BrokersError } from "../application/brokers-error";
import { supabasePresenceTokenRepository } from "./supabase-presence-token-repository";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const TOKEN = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";

beforeEach(() => supabaseFake.reset());

describe("supabasePresenceTokenRepository.issue", () => {
  it("chama a RPC issue_presence_token e devolve o token emitido", async () => {
    supabaseFake.respondWith({
      data: {
        token: TOKEN,
        issued_by: "kiosk-1",
        issued_at: "2026-11-14T15:00:00Z",
        expires_at: "2026-11-14T15:05:00Z",
      },
    });
    await expect(supabasePresenceTokenRepository.issue()).resolves.toEqual({
      token: TOKEN,
      issuedAt: "2026-11-14T15:00:00Z",
      expiresAt: "2026-11-14T15:05:00Z",
    });
    expect(supabaseFake.queries).toEqual([
      { rpc: "issue_presence_token", calls: [] },
    ]);
  });

  it.each([
    [0, "XX000", "network"],
    [401, "XX000", "auth"],
    [400, "42501", "forbidden"],
    [500, "XX000", "unknown"],
  ] as const)("status %i / %s → %s", async (status, code, reason) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    await expect(
      failureOf(BrokersError, () => supabasePresenceTokenRepository.issue()),
    ).resolves.toEqual({ operation: "issuePresenceToken", reason });
  });
});
