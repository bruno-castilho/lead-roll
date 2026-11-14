import { describe, expect, it } from "vitest";
import {
  INTEREST_LABEL,
  INTEREST_OPTIONS,
  SOURCE_LABEL,
  SOURCE_OPTIONS,
  STAGE_DOT,
  STAGE_LABEL,
  STAGE_OPTIONS,
} from "./lead-labels";

describe("rótulos", () => {
  it("rótulos e cores atuais", () => {
    expect(STAGE_LABEL).toEqual({
      new: "Novo",
      contacted: "Em contato",
      visit_scheduled: "Visita agendada",
      proposal: "Proposta",
      won: "Ganho",
      lost: "Perdido",
    });
    expect(STAGE_DOT).toEqual({
      new: "bg-primary",
      contacted: "bg-chart-4",
      visit_scheduled: "bg-warning",
      proposal: "bg-violet-500",
      won: "bg-success",
      lost: "bg-muted-foreground/60",
    });
    expect(SOURCE_LABEL).toEqual({
      site: "Site",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      referral: "Indicação",
      portal: "Portal imobiliário",
      campaign: "Campanha",
      other: "Outros",
    });
    expect(INTEREST_LABEL).toEqual({
      buy: "Compra",
      rent: "Aluguel",
      apartment: "Apartamento",
      house: "Casa",
      land: "Terreno",
      commercial: "Comercial",
      other: "Outros",
    });
  });

  it("opções na ordem do domínio", () => {
    expect(STAGE_OPTIONS.map((o) => o.label)).toEqual([
      "Novo",
      "Em contato",
      "Visita agendada",
      "Proposta",
      "Ganho",
      "Perdido",
    ]);
    expect(SOURCE_OPTIONS[0]).toEqual({ value: "site", label: "Site" });
    expect(INTEREST_OPTIONS[0]).toEqual({ value: "buy", label: "Compra" });
  });
});
