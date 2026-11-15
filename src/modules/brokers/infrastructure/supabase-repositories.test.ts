import { beforeEach, describe, expect, it, vi } from "vitest";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { BrokersError } from "../application/brokers-error";
import { supabaseBrokerRepository } from "./supabase-broker-repository";
import { supabasePresenceRepository } from "./supabase-presence-repository";
import { supabasePresenceTokenRepository } from "./supabase-presence-token-repository";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

const presenceRow = {
  queued_at: "2026-11-14T10:00:00Z",
  expires_at: "2026-11-14T15:00:00Z",
};
const presence = {
  queuedAt: "2026-11-14T10:00:00Z",
  expiresAt: "2026-11-14T15:00:00Z",
};

/** Executa esperando um `BrokersError` e devolve operação e motivo. */
async function failureOf(operation: () => Promise<unknown>) {
  const error = await operation().then(
    () => null,
    (e: unknown) => e,
  );
  if (!(error instanceof BrokersError))
    throw new Error("esperava BrokersError");
  return { operation: error.operation, reason: error.reason };
}

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
      failureOf(() => supabaseBrokerRepository.list()),
    ).resolves.toEqual({
      operation: "listBrokers",
      reason,
    });
  });
});

describe("supabasePresenceRepository.findByBroker", () => {
  it("busca a linha do corretor", async () => {
    supabaseFake.respondWith({ data: presenceRow });
    await expect(
      supabasePresenceRepository.findByBroker("broker-1"),
    ).resolves.toEqual(presence);
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
      supabasePresenceRepository.findByBroker("broker-1"),
    ).resolves.toBeNull();
  });

  it.each(READ_CASES)("status %i / %s → %s", async (status, code, reason) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    await expect(
      failureOf(() => supabasePresenceRepository.findByBroker("b")),
    ).resolves.toEqual({ operation: "loadPresence", reason });
  });
});

const TOKEN = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";

describe("supabasePresenceRepository.confirm", () => {
  it("chama a RPC confirm_presence com o token do QR code", async () => {
    supabaseFake.respondWith({ data: presenceRow });
    await expect(supabasePresenceRepository.confirm(TOKEN)).resolves.toEqual(
      presence,
    );
    expect(supabaseFake.queries).toEqual([
      {
        rpc: "confirm_presence",
        calls: [{ method: "args", args: [{ p_token: TOKEN }] }],
      },
    ]);
  });

  it.each([
    [0, "XX000", "network"],
    [401, "XX000", "auth"],
    [200, "PGRST301", "auth"],
    [403, "XX000", "forbidden"],
    [400, "42501", "forbidden"],
    [400, "22023", "invalid_token"],
    [400, "22P02", "invalid_token"],
    [400, "23505", "unknown"],
    [500, "XX000", "unknown"],
  ] as const)("status %i / %s → %s", async (status, code, reason) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    await expect(
      failureOf(() => supabasePresenceRepository.confirm(TOKEN)),
    ).resolves.toEqual({ operation: "confirmPresence", reason });
  });
});

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
      failureOf(() => supabasePresenceTokenRepository.issue()),
    ).resolves.toEqual({ operation: "issuePresenceToken", reason });
  });
});
