import { describe, expect, it, vi } from "vitest";
import type { Actor } from "@/shared/domain/actor";
import { BrokersError } from "./brokers-error";
import { makeListBrokers } from "./list-brokers";
import type { BrokerRecord, PresenceRepository } from "./ports";
import {
  makeConfirmPresence,
  makeIssuePresenceToken,
  makeLoadOwnPresence,
} from "./presence-use-cases";

const NOW = new Date("2026-11-14T15:00:00.000Z");
const now = () => NOW;
const broker: Actor = { id: "broker-1", role: "broker" };
const manager: Actor = { id: "manager-1", role: "manager" };
const kiosk: Actor = { id: "kiosk-1", role: "kiosk" };
const TOKEN = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";

const record = (
  id: string,
  presenceExpiresAt: string | null,
): BrokerRecord => ({
  id,
  name: `Corretor ${id}`,
  email: `${id}@leadroll.demo`,
  presenceExpiresAt,
});

function presenceRepository(
  overrides: Partial<PresenceRepository> = {},
): PresenceRepository {
  return {
    findByBroker: vi.fn().mockResolvedValue(null),
    confirm: vi.fn(),
    ...overrides,
  };
}

describe("listBrokers", () => {
  it("marca como presente só quem tem prazo no futuro", async () => {
    const listBrokers = makeListBrokers({
      now,
      brokers: {
        list: async () => [
          record("a", "2026-11-14T15:00:00.001Z"),
          record("b", "2026-11-14T15:00:00.000Z"),
          record("c", null),
        ],
      },
    });
    await expect(listBrokers()).resolves.toEqual([
      {
        id: "a",
        name: "Corretor a",
        email: "a@leadroll.demo",
        isPresent: true,
      },
      {
        id: "b",
        name: "Corretor b",
        email: "b@leadroll.demo",
        isPresent: false,
      },
      {
        id: "c",
        name: "Corretor c",
        email: "c@leadroll.demo",
        isPresent: false,
      },
    ]);
  });

  it("repassa a falha do repositório", async () => {
    const failure = new BrokersError("listBrokers", "network");
    const listBrokers = makeListBrokers({
      now,
      brokers: { list: () => Promise.reject(failure) },
    });
    await expect(listBrokers()).rejects.toBe(failure);
  });
});

describe("loadOwnPresence", () => {
  it("busca a presença do corretor conectado", async () => {
    const presence = presenceRepository({
      findByBroker: vi.fn().mockResolvedValue({
        queuedAt: "2026-11-14T11:00:00Z",
        expiresAt: "2026-11-14T16:00:00Z",
      }),
    });
    const loadOwnPresence = makeLoadOwnPresence({ presence, now });
    await expect(loadOwnPresence(broker)).resolves.toEqual({
      activeUntil: "2026-11-14T16:00:00Z",
    });
    expect(presence.findByBroker).toHaveBeenCalledWith("broker-1");
  });

  it("presença expirada ou inexistente: ausente", async () => {
    const expired = presenceRepository({
      findByBroker: vi.fn().mockResolvedValue({
        queuedAt: "2026-11-14T09:00:00Z",
        expiresAt: "2026-11-14T14:00:00Z",
      }),
    });
    await expect(
      makeLoadOwnPresence({ presence: expired, now })(broker),
    ).resolves.toEqual({ activeUntil: null });
    await expect(
      makeLoadOwnPresence({ presence: presenceRepository(), now })(broker),
    ).resolves.toEqual({ activeUntil: null });
  });
});

describe("confirmPresence", () => {
  it("confirma pelo banco com o token do QR code e devolve o novo prazo", async () => {
    const presence = presenceRepository({
      confirm: vi.fn().mockResolvedValue({
        queuedAt: "2026-11-14T15:00:00Z",
        expiresAt: "2026-11-14T20:00:00Z",
      }),
    });
    await expect(
      makeConfirmPresence({ presence, now })(broker, TOKEN.toUpperCase()),
    ).resolves.toEqual({
      expiresAt: "2026-11-14T20:00:00Z",
      activeUntil: "2026-11-14T20:00:00Z",
    });
    expect(presence.confirm).toHaveBeenCalledWith(TOKEN);
  });

  it.each([
    ["quem não é corretor", manager, TOKEN, "forbidden"],
    ["o totem", kiosk, TOKEN, "forbidden"],
    ["link sem token", broker, null, "invalid_token"],
    ["token com formato errado", broker, "abc", "invalid_token"],
  ] as const)("recusa %s sem chamar o banco", async (_label, actor, token, reason) => {
    const presence = presenceRepository();
    const error = await makeConfirmPresence({ presence, now })(
      actor,
      token,
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BrokersError);
    expect(error).toMatchObject({ operation: "confirmPresence", reason });
    expect(presence.confirm).not.toHaveBeenCalled();
  });

  it("repassa a recusa do banco (QR code vencido)", async () => {
    const failure = new BrokersError("confirmPresence", "invalid_token");
    const presence = presenceRepository({
      confirm: vi.fn().mockRejectedValue(failure),
    });
    await expect(
      makeConfirmPresence({ presence, now })(broker, TOKEN),
    ).rejects.toBe(failure);
  });
});

describe("issuePresenceToken", () => {
  const issued = {
    token: TOKEN,
    issuedAt: "2026-11-14T15:00:00Z",
    expiresAt: "2026-11-14T15:05:00Z",
  };

  it("o totem emite um QR code pelo banco", async () => {
    const tokens = { issue: vi.fn().mockResolvedValue(issued) };
    await expect(makeIssuePresenceToken({ tokens })(kiosk)).resolves.toEqual(
      issued,
    );
  });

  it.each([
    ["corretor", broker],
    ["gestor", manager],
  ])("recusa o %s sem chamar o banco", async (_label, actor) => {
    const tokens = { issue: vi.fn() };
    const error = await makeIssuePresenceToken({ tokens })(actor).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({
      operation: "issuePresenceToken",
      reason: "forbidden",
    });
    expect(tokens.issue).not.toHaveBeenCalled();
  });
});
