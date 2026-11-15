import { vi } from "vitest";

/** Resposta de uma consulta, no formato do PostgREST (`{ data, error, status }`). */
export interface FakeResponse {
  data?: unknown;
  error?: { code: string; message: string } | null;
  status?: number;
  /**
   * Tabela ou RPC que recebe esta resposta. Sem `on`, vale para a próxima
   * consulta, qualquer que seja; com `on`, independe da ordem das consultas.
   */
  on?: string;
}

/** Uma consulta feita ao cliente falso: a origem e a cadeia de chamadas. */
export interface RecordedQuery {
  table?: string;
  rpc?: string;
  calls: { method: string; args: unknown[] }[];
}

/**
 * Cliente Supabase falso para testes. Cada `from()`/`rpc()` grava a cadeia de
 * chamadas (`select`, `eq`, `order`…) e, no `await`, devolve a próxima
 * resposta da fila de `respondWith`.
 */
function createFakeSupabase() {
  const queries: RecordedQuery[] = [];
  const responses: FakeResponse[] = [];
  let unavailable: Error | null = null;

  function chain(query: RecordedQuery): object {
    const builder: object = new Proxy(
      {},
      {
        get(_target, property) {
          if (property === "then") {
            const source = query.table ?? query.rpc;
            const index = responses.findIndex(
              (r) => r.on === undefined || r.on === source,
            );
            const { on: _on, ...response } =
              index === -1 ? {} : responses.splice(index, 1)[0];
            return (resolve: (value: unknown) => void) =>
              resolve({ data: null, error: null, status: 200, ...response });
          }
          return (...args: unknown[]) => {
            query.calls.push({ method: String(property), args });
            return builder;
          };
        },
      },
    );
    return builder;
  }

  const auth = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  };

  const client = {
    auth,
    from(table: string) {
      const query: RecordedQuery = { table, calls: [] };
      queries.push(query);
      return chain(query);
    },
    rpc(fn: string, ...args: unknown[]) {
      const query: RecordedQuery = { rpc: fn, calls: [] };
      if (args.length > 0) query.calls.push({ method: "args", args });
      queries.push(query);
      return chain(query);
    },
  };

  return {
    auth,
    queries,
    /** Enfileira as respostas das próximas consultas, na ordem. */
    respondWith(...next: FakeResponse[]) {
      responses.push(...next);
    },
    /** Faz `getSupabaseClient()` lançar este erro (ex.: variáveis ausentes). */
    makeUnavailable(error: Error) {
      unavailable = error;
    },
    /** Esquece as consultas já feitas (ex.: a da restauração da sessão). */
    forgetQueries() {
      queries.length = 0;
    },
    getClient() {
      if (unavailable) throw unavailable;
      return client;
    },
    reset() {
      queries.length = 0;
      responses.length = 0;
      unavailable = null;
      for (const fn of Object.values(auth)) fn.mockReset();
    },
  };
}

/** Instância única, compartilhada entre o `vi.mock` e o teste. */
export const supabaseFake = createFakeSupabase();

/** Erro do PostgREST no formato que o SDK devolve. */
export function postgrestError(code: string, message = "erro") {
  return { code, message, details: "", hint: "" };
}
