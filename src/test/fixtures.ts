import { vi } from "vitest";
import { supabaseFake } from "./fake-supabase";

export const MANAGER = {
  id: "manager-1",
  name: "Gestora Ana",
  email: "gestor@leadroll.demo",
  role: "manager",
} as const;

export const BROKER = {
  id: "broker-1",
  name: "Carlos Lima",
  email: "carlos@leadroll.demo",
  role: "broker",
} as const;

export const KIOSK = {
  id: "kiosk-1",
  name: "Totem da recepção",
  email: "totem@leadroll.demo",
  role: "kiosk",
} as const;

type ProfileRow = typeof MANAGER | typeof BROKER | typeof KIOSK;

/**
 * Prepara o cliente falso para o `SessionProvider` restaurar a sessão deste
 * perfil (ou nenhuma, com `null`). A resposta do perfil é a primeira da fila:
 * enfileire as demais depois.
 */
export function arrangeSession(profile: ProfileRow | null) {
  supabaseFake.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  if (!profile) {
    supabaseFake.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    return;
  }
  supabaseFake.auth.getSession.mockResolvedValue({
    data: { session: { access_token: "token", user: { id: profile.id } } },
    error: null,
  });
  supabaseFake.respondWith({ data: profile });
}

/** Linha de `leads` como o PostgREST devolve, com observações embutidas. */
export function leadRow(
  overrides: Partial<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    source: string;
    interest: string;
    stage: string;
    broker_id: string | null;
    created_at: string;
    assigned_at: string | null;
    lead_observations: { id: string; content: string; created_at: string }[];
  }> = {},
) {
  return {
    id: "lead-1",
    name: "Ana Souza",
    phone: "(11) 98765-4321",
    email: null,
    source: "site",
    interest: "buy",
    stage: "new",
    broker_id: null,
    created_at: "2026-11-01T10:00:00Z",
    assigned_at: null,
    lead_observations: [],
    ...overrides,
  };
}

/** Linha de `profiles` de corretor, com a presença embutida. */
export function brokerRow(
  id: string,
  name: string,
  expiresAt: string | null = null,
) {
  return {
    id,
    name,
    email: `${id}@leadroll.demo`,
    broker_presence: expiresAt === null ? null : { expires_at: expiresAt },
  };
}
