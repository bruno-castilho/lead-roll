import { describe, expect, it } from "vitest";
import { activeUntil, isPresenceActive } from "./presence";

const now = new Date("2026-11-14T15:00:00.000Z");

describe("isPresenceActive", () => {
  it("vale só enquanto o prazo está no futuro", () => {
    expect(isPresenceActive("2026-11-14T15:00:00.001Z", now)).toBe(true);
    expect(isPresenceActive("2026-11-14T15:00:00.000Z", now)).toBe(false);
    expect(isPresenceActive("2026-11-14T14:59:59.999Z", now)).toBe(false);
  });
});

describe("activeUntil", () => {
  const presence = (expiresAt: string) => ({
    queuedAt: "2026-11-14T10:00:00Z",
    expiresAt,
  });

  it("devolve o prazo da presença válida", () => {
    expect(activeUntil(presence("2026-11-14T16:00:00Z"), now)).toBe(
      "2026-11-14T16:00:00Z",
    );
  });

  it("devolve null sem presença ou com presença expirada", () => {
    expect(activeUntil(null, now)).toBeNull();
    expect(activeUntil(presence("2026-11-14T14:00:00Z"), now)).toBeNull();
  });
});
