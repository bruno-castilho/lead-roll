import type { Actor } from "@/shared/domain/actor";
import type { Lead } from "./lead";

/**
 * Quem pode o quê nos leads. A RLS e os triggers do banco são a autoridade;
 * estas regras decidem o que a interface oferece e barram chamadas indevidas
 * antes da rede.
 */

/** Cadastrar, editar, excluir e distribuir: só o gestor. */
export function canManageLeads(actor: Actor): boolean {
  return actor.role === "manager";
}

/** Mudar a etapa e registrar observações: só o corretor responsável. */
export function isResponsibleFor(
  actor: Actor,
  lead: Pick<Lead, "brokerId">,
): boolean {
  return actor.role === "broker" && lead.brokerId === actor.id;
}
