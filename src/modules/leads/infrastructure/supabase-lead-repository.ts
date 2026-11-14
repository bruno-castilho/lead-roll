import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import {
  classifyPostgrestFailure,
  narrowFailure,
  type PostgrestFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import {
  LeadsError,
  type LeadsFailure,
  type LeadsOperation,
} from "../application/leads-error";
import type { LeadRepository } from "../application/ports";
import type { Lead, Observation } from "../domain/lead";
import type { LeadInput } from "../domain/lead-input";

type Tables = Database["public"]["Tables"];
type ObservationRow = Pick<
  Tables["lead_observations"]["Row"],
  "id" | "content" | "created_at"
>;
type LeadRow = Tables["leads"]["Row"] & { lead_observations: ObservationRow[] };

const OBSERVATION_COLUMNS = "id, content, created_at";

/** Colunas do lead com as observações embutidas (a RLS também vale nelas). */
const LEAD_COLUMNS = `id, name, phone, email, source, interest, stage, broker_id, created_at, assigned_at, lead_observations(${OBSERVATION_COLUMNS})`;

/** Classes de falha que cada operação distingue; as demais viram `unknown`. */
const FAILURES: Record<LeadsOperation, readonly LeadsFailure[]> = {
  listLeads: ["network", "auth"],
  createLead: ["network", "auth", "forbidden", "invalid"],
  updateLead: ["not_found", "network", "auth", "forbidden", "invalid"],
  changeStage: ["not_found", "network", "auth", "forbidden", "invalid"],
  addObservation: ["network", "auth", "forbidden", "invalid"],
  distributeLeads: ["network", "auth", "forbidden"],
  deleteLead: ["network", "auth", "forbidden"],
};

function failure(
  operation: LeadsOperation,
  error: { code: string },
  status: number,
): LeadsError {
  const kind: PostgrestFailure = classifyPostgrestFailure(error, status);
  return new LeadsError(operation, narrowFailure(kind, FAILURES[operation]), {
    cause: error,
  });
}

function toObservation(row: ObservationRow): Observation {
  return { id: row.id, content: row.content, createdAt: row.created_at };
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    interest: row.interest,
    stage: row.stage,
    brokerId: row.broker_id,
    createdAt: row.created_at,
    assignedAt: row.assigned_at,
    observations: row.lead_observations.map(toObservation),
  };
}

/** Só as colunas do formulário: o banco cuida de etapa, responsável e datas. */
function formColumns(input: LeadInput) {
  return {
    name: input.name,
    phone: input.phone,
    email: input.email,
    source: input.source,
    interest: input.interest,
  };
}

/** Leads em `leads` e observações em `lead_observations`. */
export const supabaseLeadRepository: LeadRepository = {
  async list({ brokerId }) {
    let query = getSupabaseClient().from("leads").select(LEAD_COLUMNS);
    // Defesa em profundidade: além da RLS, a consulta filtra o responsável.
    if (brokerId) query = query.eq("broker_id", brokerId);
    const { data, error, status } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw failure("listLeads", error, status);
    return data.map(toLead);
  },

  async create(input) {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .insert(formColumns(input))
      .select(LEAD_COLUMNS)
      .single();
    if (error) throw failure("createLead", error, status);
    return toLead(data);
  },

  async update(id, input) {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .update(formColumns(input))
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    // PGRST116 (not_found): nenhuma linha atualizada (excluída ou fora da RLS).
    if (error) throw failure("updateLead", error, status);
    return toLead(data);
  },

  async changeStage(id, stage) {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .update({ stage })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    // PGRST116 (not_found): lead excluído, reatribuído ou fora da RLS.
    if (error) throw failure("changeStage", error, status);
    return toLead(data);
  },

  async addObservation(leadId, content) {
    const { data, error, status } = await getSupabaseClient()
      .from("lead_observations")
      .insert({ lead_id: leadId, content })
      .select(OBSERVATION_COLUMNS)
      .single();
    if (error) throw failure("addObservation", error, status);
    return toObservation(data);
  },

  async distribute() {
    const { data, error, status } = await getSupabaseClient()
      .rpc("distribute_leads")
      .select(LEAD_COLUMNS);
    if (error) throw failure("distributeLeads", error, status);
    return data.map(toLead);
  },

  async delete(id) {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw failure("deleteLead", error, status);
    // A RLS filtra o delete sem erro: nenhuma linha removida significa lead
    // inexistente ou fora do alcance do usuário.
    if (data.length === 0) throw new LeadsError("deleteLead", "not_found");
  },
};
