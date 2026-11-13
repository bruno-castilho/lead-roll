import type { PostgrestError } from "@supabase/supabase-js";
import {
  CreateLeadError,
  type CreateLeadFailure,
} from "@/errors/create-lead-error";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Lead, LeadInput } from "@/lib/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const LEAD_COLUMNS =
  "id, name, phone, email, source, interest, stage, broker_id, created_at, assigned_at";

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    source: row.source,
    interest: row.interest,
    stage: row.stage,
    brokerId: row.broker_id,
    createdAt: row.created_at,
    assignedAt: row.assigned_at,
    // Observações ainda sem fonte de dados.
    observations: [],
  };
}

function createFailure(
  error: PostgrestError,
  status: number,
): CreateLeadFailure {
  if (status === 0) return "network";
  // 401 / PGRST30x: JWT ausente, inválido ou expirado.
  if (status === 401 || error.code.startsWith("PGRST30")) return "auth";
  // 42501: a RLS ou os privilégios recusaram (o usuário não é gestor).
  if (status === 403 || error.code === "42501") return "forbidden";
  // 23514: check constraint; 22P02: valor fora do enum.
  if (error.code === "23514" || error.code === "22P02") return "invalid";
  return "unknown";
}

export const LeadsService = {
  /**
   * Cadastra um lead na etapa "new", sem responsável (aguardando
   * distribuição). Só o gestor pode cadastrar: a RLS de `leads` recusa os
   * demais. Lança `CreateLeadError` se não conseguir cadastrar.
   */
  async createLead(input: LeadInput): Promise<Lead> {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .insert({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        source: input.source,
        interest: input.interest,
      })
      .select(LEAD_COLUMNS)
      .single();
    if (error) {
      throw new CreateLeadError(createFailure(error, status), error);
    }
    return toLead(data);
  },
};
