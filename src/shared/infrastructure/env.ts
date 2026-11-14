/** Faltam as variáveis públicas do Supabase (veja `.env.example`). */
export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
    this.name = "SupabaseConfigError";
  }
}

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

/**
 * Único ponto de leitura das variáveis de ambiente do app. Chame só em efeitos
 * e handlers: o build e o prerender rodam sem as variáveis. Lança
 * `SupabaseConfigError` se alguma faltar.
 */
export function readSupabaseEnv(): SupabaseEnv {
  // Referências literais: o Next só embute NEXT_PUBLIC_* escritas por extenso.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new SupabaseConfigError();
  return { url, publishableKey };
}
