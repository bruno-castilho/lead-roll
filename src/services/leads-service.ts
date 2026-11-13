import type { PostgrestError } from "@supabase/supabase-js";
import { ChangeStageError } from "@/errors/change-stage-error";
import {
  CreateLeadError,
  type CreateLeadFailure,
} from "@/errors/create-lead-error";
import { DeleteLeadError } from "@/errors/delete-lead-error";
import { LeadsError } from "@/errors/leads-error";
import {
  UpdateLeadError,
  type UpdateLeadFailure,
} from "@/errors/update-lead-error";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Lead, LeadInput, LeadStage } from "@/lib/types";

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

/** Motivo de falha comum a cadastro, edição e mudança de etapa. */
function writeFailure(
  error: PostgrestError,
  status: number,
): CreateLeadFailure & UpdateLeadFailure {
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
   * Lista os leads, dos mais recentes para os mais antigos. A RLS devolve
   * todos para o gestor e só os próprios para o corretor. Com `brokerId`, a
   * consulta também filtra pelo responsável (defesa em profundidade na
   * listagem do corretor). Lança `LeadsError` se não conseguir buscar.
   */
  async listLeads(options: { brokerId?: string } = {}): Promise<Lead[]> {
    let query = getSupabaseClient().from("leads").select(LEAD_COLUMNS);
    if (options.brokerId) query = query.eq("broker_id", options.brokerId);
    const { data, error, status } = await query.order("created_at", {
      ascending: false,
    });
    if (error) {
      if (status === 0) throw new LeadsError("network", error);
      // 401 / PGRST30x: JWT ausente, inválido ou expirado.
      if (status === 401 || error.code.startsWith("PGRST30")) {
        throw new LeadsError("auth", error);
      }
      throw new LeadsError("unknown", error);
    }
    return data.map(toLead);
  },

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
      throw new CreateLeadError(writeFailure(error, status), error);
    }
    return toLead(data);
  },

  /**
   * Atualiza os dados de contato e interesse de um lead. Etapa, responsável e
   * datas não mudam. Só o gestor pode editar: a RLS de `leads` recusa os
   * demais. Lança `UpdateLeadError` se não conseguir salvar.
   */
  async updateLead(id: string, input: LeadInput): Promise<Lead> {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .update({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        source: input.source,
        interest: input.interest,
      })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    if (error) {
      // PGRST116: nenhuma linha atualizada (lead excluído ou fora da RLS).
      const reason =
        error.code === "PGRST116" ? "not_found" : writeFailure(error, status);
      throw new UpdateLeadError(reason, error);
    }
    return toLead(data);
  },

  /**
   * Muda a etapa de um lead. Só o corretor responsável pode mudar: a RLS de
   * `leads` não deixa o corretor atualizar leads de outros, e o trigger
   * recusa a mudança de etapa pelo gestor e qualquer outra coluna pelo
   * corretor. Lança `ChangeStageError` se não conseguir salvar.
   */
  async changeStage(id: string, stage: LeadStage): Promise<Lead> {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .update({ stage })
      .eq("id", id)
      .select(LEAD_COLUMNS)
      .single();
    if (error) {
      // PGRST116: nenhuma linha atualizada (lead excluído, reatribuído ou
      // fora da RLS).
      const reason =
        error.code === "PGRST116" ? "not_found" : writeFailure(error, status);
      throw new ChangeStageError(reason, error);
    }
    return toLead(data);
  },

  /**
   * Exclui um lead. Só o gestor pode excluir: a RLS de `leads` não deixa o
   * corretor remover nenhuma linha. Lança `DeleteLeadError` se não conseguir
   * excluir (`not_found` quando nenhuma linha foi removida).
   */
  async deleteLead(id: string): Promise<void> {
    const { data, error, status } = await getSupabaseClient()
      .from("leads")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      const reason = writeFailure(error, status);
      // Exclusão não valida dados: "invalid" aqui seria inesperado.
      throw new DeleteLeadError(
        reason === "invalid" ? "unknown" : reason,
        error,
      );
    }
    // A RLS filtra o delete sem erro: nenhuma linha removida significa lead
    // inexistente ou fora do alcance do usuário.
    if (data.length === 0) throw new DeleteLeadError("not_found");
  },
};
