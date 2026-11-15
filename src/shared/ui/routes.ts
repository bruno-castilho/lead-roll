import type { UserRole } from "@/shared/domain/actor";

/** Caminhos das páginas do app. */
export const ROUTES = {
  login: "/login",
  managerLeads: "/gestor/leads",
  managerBrokers: "/gestor/corretores",
  brokerLeads: "/corretor/leads",
  brokerPresence: "/corretor/presenca",
  kiosk: "/totem",
} as const;

/** Página inicial de cada perfil, usada após o login e pelos redirecionamentos. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  manager: ROUTES.managerLeads,
  broker: ROUTES.brokerLeads,
  kiosk: ROUTES.kiosk,
};

const RETURN_PARAM = "next";

/**
 * Login que volta para `returnTo` depois de entrar (por exemplo, o link do QR
 * code de presença aberto num celular sem sessão). Sem destino útil, `/login`.
 */
export function loginPath(returnTo: string): string {
  if (!isSafeReturnPath(returnTo) || returnTo === "/") return ROUTES.login;
  return `${ROUTES.login}?${new URLSearchParams({ [RETURN_PARAM]: returnTo })}`;
}

/** Destino de volta guardado na URL do login (`?next=`), se for seguro. */
export function readReturnPath(search: string): string | null {
  const returnTo = new URLSearchParams(search).get(RETURN_PARAM);
  return returnTo && isSafeReturnPath(returnTo) ? returnTo : null;
}

/** Só caminhos internos: nada de `//outro-site`, `/\outro-site` ou o próprio login. */
function isSafeReturnPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/\\") &&
    !path.startsWith(ROUTES.login)
  );
}
