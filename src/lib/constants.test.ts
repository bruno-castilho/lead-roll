import { describe, expect, it } from "vitest";
import { PAGE_SIZES } from "@/components/shared/pagination";
import {
  ACTIVE_STAGES,
  INTEREST_LABEL,
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STAGES,
  ROUTES,
  SOURCE_LABEL,
  STAGE_DOT,
  STAGE_LABEL,
} from "./constants";

describe("etapas", () => {
  it("seguem a ordem do funil, com os rótulos atuais", () => {
    expect(LEAD_STAGES.map((s) => s.value)).toEqual([
      "new",
      "contacted",
      "visit_scheduled",
      "proposal",
      "won",
      "lost",
    ]);
    expect(STAGE_LABEL).toEqual({
      new: "Novo",
      contacted: "Em contato",
      visit_scheduled: "Visita agendada",
      proposal: "Proposta",
      won: "Ganho",
      lost: "Perdido",
    });
  });

  it("'em atendimento' são contato, visita e proposta", () => {
    expect(ACTIVE_STAGES).toEqual(["contacted", "visit_scheduled", "proposal"]);
  });

  it("cada etapa tem uma cor", () => {
    expect(STAGE_DOT).toEqual({
      new: "bg-primary",
      contacted: "bg-chart-4",
      visit_scheduled: "bg-warning",
      proposal: "bg-violet-500",
      won: "bg-success",
      lost: "bg-muted-foreground/60",
    });
  });
});

describe("origens e interesses", () => {
  it("origens na ordem atual", () => {
    expect(LEAD_SOURCES.map((s) => s.value)).toEqual([
      "site",
      "whatsapp",
      "instagram",
      "referral",
      "portal",
      "campaign",
      "other",
    ]);
    expect(SOURCE_LABEL).toEqual({
      site: "Site",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      referral: "Indicação",
      portal: "Portal imobiliário",
      campaign: "Campanha",
      other: "Outros",
    });
  });

  it("interesses na ordem atual", () => {
    expect(LEAD_INTERESTS.map((s) => s.value)).toEqual([
      "buy",
      "rent",
      "apartment",
      "house",
      "land",
      "commercial",
      "other",
    ]);
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
});

describe("navegação", () => {
  it("rotas e tamanhos de página", () => {
    expect(ROUTES).toEqual({
      login: "/login",
      managerLeads: "/gestor/leads",
      managerBrokers: "/gestor/corretores",
      brokerLeads: "/corretor/leads",
    });
    expect(PAGE_SIZES).toEqual([10, 20, 50]);
  });
});
