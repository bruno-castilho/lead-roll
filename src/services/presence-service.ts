import { ConfirmPresenceError } from "@/errors/confirm-presence-error";
import { PresenceError } from "@/errors/presence-error";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";

/** Presença do corretor na fila. Presente enquanto `expiresAt` não passou. */
export interface BrokerPresence {
  queuedAt: string;
  expiresAt: string;
}

export const PresenceService = {
  /**
   * Busca a presença do corretor (`null` se ele nunca confirmou). A linha pode
   * estar expirada: compare `expiresAt` com a hora atual. A RLS só devolve a
   * própria presença ao corretor. Lança `PresenceError` se não conseguir buscar.
   */
  async getOwnPresence(brokerId: string): Promise<BrokerPresence | null> {
    const { data, error, status } = await getSupabaseClient()
      .from("broker_presence")
      .select("queued_at, expires_at")
      .eq("broker_id", brokerId)
      .maybeSingle();
    if (error) {
      if (status === 0) throw new PresenceError("network", error);
      // 401 / PGRST30x: JWT ausente, inválido ou expirado.
      if (status === 401 || error.code.startsWith("PGRST30")) {
        throw new PresenceError("auth", error);
      }
      throw new PresenceError("unknown", error);
    }
    return data
      ? { queuedAt: data.queued_at, expiresAt: data.expires_at }
      : null;
  },

  /**
   * Confirma a presença do corretor conectado por 5h. Se ele estava ausente,
   * entra no final da fila; se já estava presente, o prazo passa a ser agora +
   * 5h e a posição na fila é mantida. As datas vêm do relógio do banco. Lança
   * `ConfirmPresenceError` se não conseguir confirmar.
   */
  async confirmPresence(): Promise<BrokerPresence> {
    const { data, error, status } =
      await getSupabaseClient().rpc("confirm_presence");
    if (error) {
      if (status === 0) throw new ConfirmPresenceError("network", error);
      if (status === 401 || error.code.startsWith("PGRST30")) {
        throw new ConfirmPresenceError("auth", error);
      }
      // 42501: quem chamou não é corretor.
      if (status === 403 || error.code === "42501") {
        throw new ConfirmPresenceError("forbidden", error);
      }
      throw new ConfirmPresenceError("unknown", error);
    }
    return { queuedAt: data.queued_at, expiresAt: data.expires_at };
  },
};
