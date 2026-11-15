import "client-only";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readSupabaseEnv } from "../env";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

/**
 * Cliente Supabase do navegador (sessão em cookies), criado na primeira
 * chamada. Chame apenas em efeitos ou handlers, nunca durante a renderização:
 * o build e o prerender rodam sem as variáveis de ambiente.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;
  const { url, publishableKey } = readSupabaseEnv();
  client = createBrowserClient<Database>(url, publishableKey);
  return client;
}
