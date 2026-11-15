/**
 * Perfis do LeadRoll, na ordem do enum `user_role` do banco: gestor, corretor
 * e totem (a tela da empresa que exibe o QR code de presença).
 */
export const USER_ROLES = ["manager", "broker", "kiosk"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

/** Quem executa uma ação: o usuário conectado, identificado pelo perfil. */
export interface Actor {
  id: string;
  role: UserRole;
}
