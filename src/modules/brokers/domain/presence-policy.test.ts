import { describe, expect, it } from "vitest";
import type { Actor } from "@/shared/domain/actor";
import { canConfirmPresence, canIssuePresenceToken } from "./presence-policy";

const actor = (role: Actor["role"]): Actor => ({ id: "u", role });

describe("canConfirmPresence", () => {
  it("só o corretor confirma presença", () => {
    expect(canConfirmPresence(actor("broker"))).toBe(true);
    expect(canConfirmPresence(actor("manager"))).toBe(false);
    expect(canConfirmPresence(actor("kiosk"))).toBe(false);
  });
});

describe("canIssuePresenceToken", () => {
  it("só o totem emite QR codes", () => {
    expect(canIssuePresenceToken(actor("kiosk"))).toBe(true);
    expect(canIssuePresenceToken(actor("broker"))).toBe(false);
    expect(canIssuePresenceToken(actor("manager"))).toBe(false);
  });
});
