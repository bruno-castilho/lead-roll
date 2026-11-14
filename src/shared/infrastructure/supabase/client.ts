import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
    this.name = "SupabaseConfigError";
  }
}

let client: SupabaseClient<Database> | null = null;

/**
 * Cliente Supabase do navegador (sessão em cookies), criado na primeira
 * chamada. Chame apenas em efeitos ou handlers, nunca durante a renderização:
 * o build e o prerender rodam sem as variáveis de ambiente.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;
  // Referências diretas: o Next só embute NEXT_PUBLIC_* escritas por extenso.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new SupabaseConfigError();
  client = createBrowserClient<Database>(url, key);
  return client;
}
