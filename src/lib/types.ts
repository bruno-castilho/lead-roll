export type UserRole = "manager" | "broker";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Presença local (ainda não persistida no banco). */
  isPresent: boolean;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "visit_scheduled"
  | "proposal"
  | "won"
  | "lost";

export interface Observation {
  id: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interest: LeadInterest;
  stage: LeadStage;
  brokerId: string | null;
  createdAt: string;
  assignedAt: string | null;
  observations: Observation[];
}

export type LeadSource =
  | "site"
  | "whatsapp"
  | "instagram"
  | "referral"
  | "portal"
  | "campaign"
  | "other";

export type LeadInterest =
  | "buy"
  | "rent"
  | "apartment"
  | "house"
  | "land"
  | "commercial"
  | "other";

/** Dados editáveis de um lead (cadastro e edição pelo gestor). */
export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interest: LeadInterest;
}
