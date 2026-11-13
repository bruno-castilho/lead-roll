import { applyDistribution, planDistribution } from "@/lib/distribution";
import type {
  Lead,
  LeadInput,
  LeadStage,
  Observation,
  User,
} from "@/lib/types";

/**
 * Estado compartilhado da aplicação (fonte única de verdade).
 * As transições são puras para facilitar a futura troca por serviços reais.
 */
export interface AppState {
  users: User[];
  leads: Lead[];
  currentUserId: string | null;
  /** Último corretor que recebeu lead no rodízio. */
  roundRobinCursor: string | null;
}

export const initialAppState: AppState = {
  users: [],
  leads: [],
  currentUserId: null,
  roundRobinCursor: null,
};

export type AppAction =
  | { type: "session/login"; userId: string; users: User[]; leads: Lead[] }
  | { type: "session/logout" }
  | { type: "lead/create"; lead: Lead }
  | { type: "lead/update"; id: string; input: LeadInput }
  | { type: "lead/delete"; id: string }
  | { type: "lead/setStage"; id: string; stage: LeadStage }
  | { type: "lead/addObservation"; id: string; observation: Observation }
  | { type: "leads/distribute"; assignedAt: string }
  | { type: "broker/setPresence"; userId: string; isPresent: boolean };

function updateLead(
  leads: Lead[],
  id: string,
  update: (lead: Lead) => Lead,
): Lead[] {
  return leads.map((lead) => (lead.id === id ? update(lead) : lead));
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "session/login":
      return {
        users: action.users,
        leads: action.leads,
        currentUserId: action.userId,
        roundRobinCursor: null,
      };
    case "session/logout":
      // Nada do usuário anterior pode sobrar para o próximo login na aba.
      return initialAppState;
    case "lead/create":
      return { ...state, leads: [action.lead, ...state.leads] };
    case "lead/update":
      return {
        ...state,
        leads: updateLead(state.leads, action.id, (lead) => ({
          ...lead,
          ...action.input,
        })),
      };
    case "lead/delete":
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.id),
      };
    case "lead/setStage":
      return {
        ...state,
        leads: updateLead(state.leads, action.id, (lead) => ({
          ...lead,
          stage: action.stage,
        })),
      };
    case "lead/addObservation":
      return {
        ...state,
        leads: updateLead(state.leads, action.id, (lead) => ({
          ...lead,
          observations: [action.observation, ...lead.observations],
        })),
      };
    case "leads/distribute": {
      const plan = planDistribution(
        state.leads,
        state.users,
        state.roundRobinCursor,
      );
      if (plan.assignments.size === 0) return state;
      return {
        ...state,
        leads: applyDistribution(state.leads, plan, action.assignedAt),
        roundRobinCursor: plan.nextCursor,
      };
    }
    case "broker/setPresence":
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.userId
            ? { ...user, isPresent: action.isPresent }
            : user,
        ),
      };
    default:
      return state;
  }
}
