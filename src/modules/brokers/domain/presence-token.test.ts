import { describe, expect, it } from "vitest";
import { parsePresenceToken, presenceTokenLifetimeMs } from "./presence-token";

const TOKEN = "0b6f3a52-6a4e-4c2e-9d1f-2f7c1e9a8b30";

describe("parsePresenceToken", () => {
  it("aceita o uuid emitido pelo banco", () => {
    expect(parsePresenceToken(TOKEN)).toBe(TOKEN);
    expect(parsePresenceToken(` ${TOKEN.toUpperCase()} `)).toBe(TOKEN);
  });

  it.each([
    null,
    "",
    "abc",
    `${TOKEN}x`,
    "'; drop table x; --",
  ])("recusa %s", (value) => {
    expect(parsePresenceToken(value)).toBeNull();
  });
});

describe("presenceTokenLifetimeMs", () => {
  it("mede a validade pelo relógio do banco", () => {
    expect(
      presenceTokenLifetimeMs({
        token: TOKEN,
        issuedAt: "2026-11-15T12:00:00Z",
        expiresAt: "2026-11-15T12:05:00Z",
      }),
    ).toBe(5 * 60 * 1000);
  });

  it("nunca é negativa", () => {
    expect(
      presenceTokenLifetimeMs({
        token: TOKEN,
        issuedAt: "2026-11-15T12:05:00Z",
        expiresAt: "2026-11-15T12:00:00Z",
      }),
    ).toBe(0);
  });
});
