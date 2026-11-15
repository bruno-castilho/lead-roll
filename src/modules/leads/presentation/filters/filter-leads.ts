import { normalize } from "@/shared/ui/format";
import {
  isUnassigned,
  type Lead,
  type LeadSource,
  type LeadStage,
} from "../../domain/lead";
import { phoneDigits } from "../../domain/phone";

/** "all" | "none" (sem responsável) | "assigned" (qualquer corretor) | id do corretor */
export type BrokerFilter = "all" | "none" | "assigned" | (string & {});
export const SORT_ORDERS = ["newest", "oldest"] as const;
type SortOrder = (typeof SORT_ORDERS)[number];

export interface LeadFilterState {
  query: string;
  source: LeadSource | "all";
  stage: LeadStage | "all";
  broker: BrokerFilter;
  sort: SortOrder;
}

export const DEFAULT_LEAD_FILTERS: LeadFilterState = {
  query: "",
  source: "all",
  stage: "all",
  broker: "all",
  sort: "newest",
};

/** Pesquisa por nome ou telefone (com ou sem máscara). */
export function matchesQuery(lead: Lead, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (normalize(lead.name).includes(normalize(q))) return true;
  const digits = phoneDigits(q);
  return digits.length > 0 && phoneDigits(lead.phone).includes(digits);
}

export function filterLeads(leads: Lead[], f: LeadFilterState): Lead[] {
  const result = leads.filter((lead) => {
    if (!matchesQuery(lead, f.query)) return false;
    if (f.source !== "all" && lead.source !== f.source) return false;
    if (f.stage !== "all" && lead.stage !== f.stage) return false;
    if (f.broker === "none" && !isUnassigned(lead)) return false;
    if (f.broker === "assigned" && isUnassigned(lead)) return false;
    if (
      f.broker !== "all" &&
      f.broker !== "none" &&
      f.broker !== "assigned" &&
      lead.brokerId !== f.broker
    ) {
      return false;
    }
    return true;
  });

  return result.sort((a, b) =>
    f.sort === "newest"
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt),
  );
}

export function countActiveFilters(f: LeadFilterState): number {
  return (
    (f.query.trim() ? 1 : 0) +
    (f.source !== "all" ? 1 : 0) +
    (f.stage !== "all" ? 1 : 0) +
    (f.broker !== "all" ? 1 : 0)
  );
}
