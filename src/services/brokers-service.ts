import { BrokersError } from "@/errors/brokers-error";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

const BROKER_COLUMNS = "id, name, email";

export const BrokersService = {
  /**
   * Lista os corretores (`profiles` com `role = 'broker'`), em ordem
   * alfabética. A RLS devolve todos para o gestor e só o próprio perfil para o
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
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: "broker",
      // Presença ainda sem fonte de dados.
      isPresent: false,
    }));
  },
};
