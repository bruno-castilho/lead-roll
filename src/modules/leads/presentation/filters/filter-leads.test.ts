import { describe, expect, it } from "vitest";
import type { Lead } from "../../domain/lead";
import {
  countActiveFilters,
  DEFAULT_LEAD_FILTERS,
  filterLeads,
  type LeadFilterState,
  matchesQuery,
} from "./filter-leads";

function lead(overrides: Partial<Lead> & { id: string }): Lead {
  return {
    name: "Lead",
    phone: "(11) 98765-4321",
    email: null,
    source: "site",
    interest: "buy",
    stage: "new",
    brokerId: null,
    createdAt: "2026-11-01T10:00:00Z",
    assignedAt: null,
    observations: [],
    ...overrides,
  };
}

const leads = [
  lead({
    id: "a",
    name: "João Ávila",
    phone: "(11) 3456-7890",
    createdAt: "2026-11-02T10:00:00Z",
  }),
  lead({
    id: "b",
    name: "Maria Souza",
    source: "whatsapp",
    interest: "rent",
    stage: "contacted",
    brokerId: "broker-1",
    createdAt: "2026-11-03T10:00:00Z",
  }),
  lead({
    id: "c",
    name: "Pedro Lima",
    source: "portal",
    stage: "won",
    brokerId: "broker-2",
    createdAt: "2026-11-01T10:00:00Z",
  }),
];

const ids = (list: Lead[]) => list.map((l) => l.id);
const withFilters = (f: Partial<LeadFilterState>) =>
  ids(filterLeads(leads, { ...DEFAULT_LEAD_FILTERS, ...f }));

describe("matchesQuery", () => {
  it("aceita pesquisa vazia ou só com espaços", () => {
    expect(matchesQuery(leads[0], "")).toBe(true);
    expect(matchesQuery(leads[0], "   ")).toBe(true);
  });

  it("compara o nome sem acentos e sem caixa", () => {
    expect(matchesQuery(leads[0], "joao avila")).toBe(true);
    expect(matchesQuery(leads[0], "ÁVI")).toBe(true);
  });

  it("compara o telefone pelos dígitos, com ou sem máscara", () => {
    expect(matchesQuery(leads[0], "3456-78")).toBe(true);
    expect(matchesQuery(leads[0], "(11) 3456")).toBe(true);
    expect(matchesQuery(leads[0], "999")).toBe(false);
  });

  it("não casa texto sem dígitos que não está no nome", () => {
    expect(matchesQuery(leads[0], "maria")).toBe(false);
  });
});

describe("filterLeads", () => {
  it("ordena do mais recente para o mais antigo por padrão", () => {
    expect(withFilters({})).toEqual(["b", "a", "c"]);
  });

  it("ordena do mais antigo para o mais recente", () => {
    expect(withFilters({ sort: "oldest" })).toEqual(["c", "a", "b"]);
  });

  it("filtra por origem e etapa", () => {
    expect(withFilters({ source: "whatsapp" })).toEqual(["b"]);
    expect(withFilters({ stage: "won" })).toEqual(["c"]);
  });

  it("filtra por responsável", () => {
    expect(withFilters({ broker: "none" })).toEqual(["a"]);
    expect(withFilters({ broker: "assigned" })).toEqual(["b", "c"]);
    expect(withFilters({ broker: "broker-2" })).toEqual(["c"]);
  });

  it("combina pesquisa e filtros", () => {
    expect(withFilters({ query: "a", broker: "assigned" })).toEqual(["b", "c"]);
  });

  it("não altera a lista recebida", () => {
    const copy = [...leads];
    filterLeads(leads, { ...DEFAULT_LEAD_FILTERS, sort: "oldest" });
    expect(leads).toEqual(copy);
  });
});

describe("countActiveFilters", () => {
  it("não conta a ordenação nem pesquisa só com espaços", () => {
    expect(countActiveFilters(DEFAULT_LEAD_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...DEFAULT_LEAD_FILTERS,
        query: "  ",
        sort: "oldest",
      }),
    ).toBe(0);
  });

  it("conta cada filtro preenchido", () => {
    expect(
      countActiveFilters({
        query: "ana",
        source: "site",
        stage: "new",
        broker: "none",
        sort: "newest",
      }),
    ).toBe(4);
  });
});
