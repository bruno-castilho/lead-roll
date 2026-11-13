"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { toast } from "sonner";
import { createMockLeads, initialPresence } from "@/data/mock";
import { useSession } from "@/hooks/use-session";
import { planDistribution } from "@/lib/distribution";
import { createId } from "@/lib/format";
import type { Lead, LeadInput, LeadStage, User } from "@/lib/types";
import { type AuthProfile, AuthService } from "@/services/auth-service";
import { appReducer, initialAppState } from "./reducer";

interface AppStore {
  /** Sessão restaurada e dados do usuário conectado carregados. */
  ready: boolean;
  users: User[];
  brokers: User[];
  leads: Lead[];
  currentUser: User | null;
  roundRobinCursor: string | null;
  getUser: (id: string | null) => User | undefined;
  createLead: (input: LeadInput) => Lead;
  updateLead: (id: string, input: LeadInput) => void;
  deleteLead: (id: string) => void;
  setLeadStage: (id: string, stage: LeadStage) => void;
  addObservation: (id: string, content: string) => void;
  /** Executa a distribuição em rodízio e retorna a quantidade distribuída. */
  distributeLeads: () => number;
  setPresence: (userId: string, isPresent: boolean) => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

/**
 * Monta os usuários (perfis do Supabase + presença local) e os leads mock
 * ligados a eles. Usa a data atual: chamar só em efeitos ou handlers.
 */
function createSessionData(
  profile: AuthProfile,
  profiles: AuthProfile[],
): { users: User[]; leads: Lead[] } {
  const visible = profiles.some((p) => p.id === profile.id)
    ? profiles
    : [profile, ...profiles];
  const users: User[] = visible.map((p) => ({
    ...p,
    isPresent: initialPresence(p.email, p.role),
  }));
  const brokerIdByEmail = new Map(
    users
      .filter((u) => u.role === "broker")
      .map((u) => [u.email.toLowerCase(), u.id]),
  );
  return { users, leads: createMockLeads(Date.now(), brokerIdByEmail) };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { ready: sessionReady, profile, clearSession } = useSession();

  // Acompanha o perfil da sessão (login, restauração, logout, outra aba):
  // carrega os perfis visíveis e recria os leads mock, ou limpa tudo.
  useEffect(() => {
    if (!profile) {
      dispatch({ type: "session/logout" });
      return;
    }
    let cancelled = false;
    AuthService.listProfiles()
      .then((profiles) => {
        if (cancelled) return;
        dispatch({
          type: "session/login",
          userId: profile.id,
          ...createSessionData(profile, profiles),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Sem a lista de perfis a sessão ficaria incompleta: sai de novo.
        toast.error(error instanceof Error ? error.message : String(error));
        clearSession();
        void AuthService.signOut().catch(() => {});
      });
    return () => {
      cancelled = true;
    };
  }, [profile, clearSession]);

  // Pronto quando o estado local corresponde à sessão (com ou sem usuário).
  const ready = sessionReady && state.currentUserId === (profile?.id ?? null);

  const usersById = useMemo(
    () => new Map(state.users.map((u) => [u.id, u])),
    [state.users],
  );
  const brokers = useMemo(
    () => state.users.filter((u) => u.role === "broker"),
    [state.users],
  );
  const currentUser = state.currentUserId
    ? (usersById.get(state.currentUserId) ?? null)
    : null;

  const getUser = useCallback(
    (id: string | null) => (id ? usersById.get(id) : undefined),
    [usersById],
  );

  const createLead = useCallback((input: LeadInput) => {
    const lead: Lead = {
      ...input,
      id: createId("lead"),
      stage: "new",
      brokerId: null,
      createdAt: new Date().toISOString(),
      assignedAt: null,
      observations: [],
    };
    dispatch({ type: "lead/create", lead });
    return lead;
  }, []);

  const updateLead = useCallback((id: string, input: LeadInput) => {
    dispatch({ type: "lead/update", id, input });
  }, []);

  const deleteLead = useCallback((id: string) => {
    dispatch({ type: "lead/delete", id });
  }, []);

  const setLeadStage = useCallback((id: string, stage: LeadStage) => {
    dispatch({ type: "lead/setStage", id, stage });
  }, []);

  const addObservation = useCallback((id: string, content: string) => {
    dispatch({
      type: "lead/addObservation",
      id,
      observation: {
        id: createId("obs"),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    });
  }, []);

  const distributeLeads = useCallback(() => {
    const plan = planDistribution(
      state.leads,
      state.users,
      state.roundRobinCursor,
    );
    if (plan.assignments.size === 0) return 0;
    dispatch({
      type: "leads/distribute",
      assignedAt: new Date().toISOString(),
    });
    return plan.assignments.size;
  }, [state.leads, state.users, state.roundRobinCursor]);

  const setPresence = useCallback((userId: string, isPresent: boolean) => {
    dispatch({ type: "broker/setPresence", userId, isPresent });
  }, []);

  const value = useMemo<AppStore>(
    () => ({
      ready,
      users: state.users,
      brokers,
      leads: state.leads,
      currentUser,
      roundRobinCursor: state.roundRobinCursor,
      getUser,
      createLead,
      updateLead,
      deleteLead,
      setLeadStage,
      addObservation,
      distributeLeads,
      setPresence,
    }),
    [
      ready,
      state.users,
      state.leads,
      state.roundRobinCursor,
      brokers,
      currentUser,
      getUser,
      createLead,
      updateLead,
      deleteLead,
      setLeadStage,
      addObservation,
      distributeLeads,
      setPresence,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore deve ser usado dentro de AppStoreProvider.");
  }
  return ctx;
}
