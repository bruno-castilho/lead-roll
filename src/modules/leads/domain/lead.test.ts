import { describe, expect, it } from "vitest";
import { lead } from "@/test/fixtures";
import {
  ACTIVE_STAGES,
  isActiveStage,
  isLeadStage,
  isUnassigned,
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STAGES,
} from "./lead";

describe("valores do lead", () => {
  it("etapas, origens e interesses na ordem dos enums", () => {
    expect(LEAD_STAGES).toEqual([
      "new",
      "contacted",
      "visit_scheduled",
      "proposal",
      "won",
      "lost",
    ]);
    expect(LEAD_SOURCES).toEqual([
      "site",
      "whatsapp",
      "instagram",
      "referral",
      "portal",
      "campaign",
      "other",
    ]);
    expect(LEAD_INTERESTS).toEqual([
      "buy",
      "rent",
      "apartment",
      "house",
      "land",
      "commercial",
      "other",
    ]);
  });

  it("em atendimento: contato, visita e proposta", () => {
    expect(ACTIVE_STAGES).toEqual(["contacted", "visit_scheduled", "proposal"]);
    expect(LEAD_STAGES.filter(isActiveStage)).toEqual(ACTIVE_STAGES);
  });

  it("isLeadStage", () => {
    expect(isLeadStage("won")).toBe(true);
    expect(isLeadStage("archived")).toBe(false);
    expect(isLeadStage(undefined)).toBe(false);
  });

  it("isUnassigned", () => {
    expect(isUnassigned(lead("a"))).toBe(true);
    expect(isUnassigned(lead("a", { brokerId: "b1" }))).toBe(false);
  });
});
