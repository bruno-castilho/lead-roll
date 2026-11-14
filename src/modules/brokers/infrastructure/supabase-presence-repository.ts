import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import {
  classifyPostgrestFailure,
  narrowFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import { BrokersError } from "../application/brokers-error";
import type { PresenceRepository } from "../application/ports";

const READ_FAILURES = ["network", "auth"] as const;
const CONFIRM_FAILURES = ["network", "auth", "forbidden"] as const;

/**
 * Fila em `broker_presence`. A RLS só devolve a própria presença ao corretor,
 * e a única escrita é a RPC `confirm_presence`.
 */
export const supabasePresenceRepository: PresenceRepository = {
  async findByBroker(brokerId) {
    const { data, error, status } = await getSupabaseClient()
      .from("broker_presence")
      .select("queued_at, expires_at")
      .eq("broker_id", brokerId)
      .maybeSingle();
    if (error) {
      const failure = classifyPostgrestFailure(error, status);
      throw new BrokersError(
        "loadPresence",
        narrowFailure(failure, READ_FAILURES),
        { cause: error },
      );
    }
    return data
      ? { queuedAt: data.queued_at, expiresAt: data.expires_at }
      : null;
  },

  async confirm() {
    const { data, error, status } =
      await getSupabaseClient().rpc("confirm_presence");
    if (error) {
      const failure = classifyPostgrestFailure(error, status);
      throw new BrokersError(
        "confirmPresence",
        narrowFailure(failure, CONFIRM_FAILURES),
        { cause: error },
      );
    }
    return { queuedAt: data.queued_at, expiresAt: data.expires_at };
  },
};
