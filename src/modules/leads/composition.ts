import "client-only";
import {
  makeAddObservation,
  makeChangeStage,
  makeCreateLead,
  makeDeleteLead,
  makeDistributeLeads,
  makeListLeads,
  makeUpdateLead,
} from "./application/lead-use-cases";
import { supabaseLeadRepository } from "./infrastructure/supabase-lead-repository";

// Só liga as peças: o cliente Supabase é criado na primeira chamada.
const deps = { leads: supabaseLeadRepository };

export const listLeads = makeListLeads(deps);
export const createLead = makeCreateLead(deps);
export const updateLead = makeUpdateLead(deps);
export const deleteLead = makeDeleteLead(deps);
export const distributeLeads = makeDistributeLeads(deps);
export const changeStage = makeChangeStage(deps);
export const addObservation = makeAddObservation(deps);
