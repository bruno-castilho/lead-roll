import { BrokersError } from "@/errors/brokers-error";
import type { User } from "@/lib/types";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";

const BROKER_COLUMNS = "id, name, email, broker_presence(expires_at)";

export const BrokersService = {
  /**
   * Lista os corretores (`profiles` com `role = 'broker'`), em ordem
   * alfabética, com a presença (`broker_presence` ainda não expirada). A RLS devolve todos para o gestor e só o próprio perfil para o
   * corretor. Lança `BrokersError` se não conseguir buscar.
   */
  async listBrokers(): Promise<User[]> {
    const { data, error, status } = await getSupabaseClient()
      .from("profiles")
      .select(BROKER_COLUMNS)
      .eq("role", "broker")
      .order("name", { ascending: true });
    if (error) {
      if (status === 0) throw new BrokersError("network", error);
      // 401 / PGRST30x: JWT ausente, inválido ou expirado.
      if (status === 401 || error.code.startsWith("PGRST30")) {
        throw new BrokersError("auth", error);
      }
      throw new BrokersError("unknown", error);
    }
    const now = Date.now();
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: "broker",
      isPresent:
        row.broker_presence !== null &&
        Date.parse(row.broker_presence.expires_at) > now,
    }));
  },
};
