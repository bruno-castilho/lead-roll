import type { Lead, LeadStage, Observation } from "../domain/lead";
import type { LeadInput } from "../domain/lead-input";

/**
 * Leads e observações. A RLS filtra o que cada perfil vê e pode gravar.
 * Todos os métodos lançam `LeadsError`.
 */
export interface LeadRepository {
  /** Do mais recente para o mais antigo; com `brokerId`, só os dele. */
  list(filter: { brokerId?: string }): Promise<Lead[]>;
  /** Grava só os campos do formulário; nasce em "new", sem responsável. */
  create(input: LeadInput): Promise<Lead>;
  /** Atualiza só os campos do formulário. */
  update(id: string, input: LeadInput): Promise<Lead>;
  delete(id: string): Promise<void>;
  changeStage(id: string, stage: LeadStage): Promise<Lead>;
  addObservation(leadId: string, content: string): Promise<Observation>;
  /** Distribui os leads sem responsável pela fila (regra no banco). */
  distribute(): Promise<Lead[]>;
}
