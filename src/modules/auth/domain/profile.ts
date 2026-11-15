import { type Actor, isUserRole } from "@/shared/domain/actor";

/**
 * Perfil do usuário conectado (tabela `profiles`), a única fonte do papel no
 * app: nunca `user.role` do Supabase (papel do Postgres) nem `user_metadata`.
 */
export interface Profile extends Actor {
  name: string;
  email: string;
}

/** Perfil como está guardado, antes de validar o papel. */
export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Perfil válido para entrar no app: papel conhecido e nome preenchido.
 * Devolve `null` quando a conta não tem um perfil utilizável.
 */
export function toProfile(record: ProfileRecord): Profile | null {
  if (!isUserRole(record.role) || !record.name.trim()) return null;
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
  };
}
