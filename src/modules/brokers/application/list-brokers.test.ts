import { describe, expect, it } from "vitest";
import { BrokersError } from "./brokers-error";
import { makeListBrokers } from "./list-brokers";
import type { BrokerRecord } from "./ports";

const NOW = new Date("2026-11-14T15:00:00.000Z");
const now = () => NOW;

const record = (
  id: string,
  presenceExpiresAt: string | null,
): BrokerRecord => ({
  id,
  name: `Corretor ${id}`,
  email: `${id}@leadroll.demo`,
  presenceExpiresAt,
});

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
