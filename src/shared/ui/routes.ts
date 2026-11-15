import type { UserRole } from "@/shared/domain/actor";

/** Caminhos das páginas do app. */
export const ROUTES = {
  login: "/login",
  managerLeads: "/gestor/leads",
  managerBrokers: "/gestor/corretores",
  brokerLeads: "/corretor/leads",
} as const;

/** Página inicial de cada perfil, usada após o login e pelos redirecionamentos. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  manager: ROUTES.managerLeads,
  broker: ROUTES.brokerLeads,
};
