import type { Actor } from "@/shared/domain/actor";
import type { Lead, LeadStage, Observation } from "../domain/lead";
import { type LeadDraft, toLeadInput } from "../domain/lead-input";
import { canManageLeads, isResponsibleFor } from "../domain/lead-policy";
import { LeadsError, type LeadsOperation } from "./leads-error";
import type { LeadRepository } from "./ports";

type Deps = { leads: LeadRepository };

function requireManager(actor: Actor, operation: LeadsOperation) {
  if (!canManageLeads(actor)) throw new LeadsError(operation, "forbidden");
}

function requireResponsible(
  actor: Actor,
  lead: Pick<Lead, "brokerId">,
  operation: LeadsOperation,
) {
  if (!isResponsibleFor(actor, lead)) {
    throw new LeadsError(operation, "forbidden");
  }
}

/**
 * Lista os leads que o usuário pode ver (a RLS filtra por perfil). Com
 * `onlyOwn`, a consulta também filtra pelo responsável.
 */
export function makeListLeads({ leads }: Deps) {
  return function listLeads(
    actor: Actor,
    options: { onlyOwn?: boolean } = {},
  ): Promise<Lead[]> {
    return leads.list(options.onlyOwn ? { brokerId: actor.id } : {});
  };
}

/** Cadastra um lead (só o gestor). Ele nasce em "new", sem responsável. */
export function makeCreateLead({ leads }: Deps) {
  return async function createLead(
    actor: Actor,
    draft: LeadDraft,
  ): Promise<Lead> {
    requireManager(actor, "createLead");
    return leads.create(toLeadInput(draft));
  };
}

/** Edita contato e interesse (só o gestor); etapa e responsável não mudam. */
export function makeUpdateLead({ leads }: Deps) {
  return async function updateLead(
    actor: Actor,
    id: string,
    draft: LeadDraft,
  ): Promise<Lead> {
    requireManager(actor, "updateLead");
    return leads.update(id, toLeadInput(draft));
  };
}

export function makeDeleteLead({ leads }: Deps) {
  return async function deleteLead(actor: Actor, id: string): Promise<void> {
    requireManager(actor, "deleteLead");
    await leads.delete(id);
  };
}

/**
 * Distribui os leads sem responsável entre os corretores presentes (só o
 * gestor). A regra da fila fica toda no banco.
 */
export function makeDistributeLeads({ leads }: Deps) {
  return async function distributeLeads(actor: Actor): Promise<Lead[]> {
    requireManager(actor, "distributeLeads");
    return leads.distribute();
  };
}

/** Muda a etapa (só o corretor responsável). */
export function makeChangeStage({ leads }: Deps) {
  return async function changeStage(
    actor: Actor,
    lead: Lead,
    stage: LeadStage,
  ): Promise<Lead> {
    requireResponsible(actor, lead, "changeStage");
    return leads.changeStage(lead.id, stage);
  };
}

/** Registra uma observação (só o corretor responsável). */
export function makeAddObservation({ leads }: Deps) {
  return async function addObservation(
    actor: Actor,
    lead: Lead,
    content: string,
  ): Promise<Observation> {
    requireResponsible(actor, lead, "addObservation");
    return leads.addObservation(lead.id, content);
  };
}
