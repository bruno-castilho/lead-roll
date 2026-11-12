"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { createMockLeads, createMockUsers } from "@/data/mock";
import { planDistribution } from "@/lib/distribution";
import { createId } from "@/lib/format";
import type { Lead, LeadInput, LeadStage, User } from "@/lib/types";
import { type AppState, appReducer } from "./reducer";

const SESSION_KEY = "leadroll:session";

type LoginResult = { ok: true; user: User } | { ok: false; error: string };

interface AppStore {
  /** Indica que a sessão simulada já foi restaurada no navegador. */
  ready: boolean;
  users: User[];
  brokers: User[];
  leads: Lead[];
  currentUser: User | null;
  roundRobinCursor: string | null;
  getUser: (id: string | null) => User | undefined;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
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

function createInitialState(): AppState {
  return {
    users: createMockUsers(),
    // Os leads dependem da data atual e são criados somente no navegador.
    leads: [],
    currentUserId: null,
    roundRobinCursor: null,
  };
}

function readSession(): string | null {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(userId: string | null) {
  try {
    if (userId) window.sessionStorage.setItem(SESSION_KEY, userId);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Armazenamento indisponível: a sessão simulada fica apenas em memória.
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    createInitialState,
  );
  const [ready, setReady] = useState(false);

  // Carrega os dados fictícios e restaura apenas o usuário conectado
  // (não há autenticação real). Executado uma única vez no navegador.
  useEffect(() => {
    dispatch({
      type: "app/init",
      leads: createMockLeads(Date.now()),
      userId: readSession(),
    });
    setReady(true);
  }, []);

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

  const login = useCallback(
    (email: string, password: string): LoginResult => {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!user || user.password !== password) {
        return { ok: false, error: "E-mail ou senha inválidos." };
      }
      dispatch({ type: "session/login", userId: user.id });
      writeSession(user.id);
      return { ok: true, user };
    },
    [state.users],
  );

  const logout = useCallback(() => {
    dispatch({ type: "session/logout" });
    writeSession(null);
  }, []);

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
      login,
      logout,
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
      login,
      logout,
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
