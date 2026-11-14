import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import {
  classifyPostgrestFailure,
  narrowFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import { BrokersError } from "../application/brokers-error";
import type { BrokerRepository } from "../application/ports";

const BROKER_COLUMNS = "id, name, email, broker_presence(expires_at)";
const READ_FAILURES = ["network", "auth"] as const;

/** Corretores em `profiles` (`role = 'broker'`), com a presença embutida. */
export const supabaseBrokerRepository: BrokerRepository = {
  async list() {
    const { data, error, status } = await getSupabaseClient()
      .from("profiles")
      .select(BROKER_COLUMNS)
      .eq("role", "broker")
      .order("name", { ascending: true });
    if (error) {
      const failure = classifyPostgrestFailure(error, status);
      throw new BrokersError(
        "listBrokers",
        narrowFailure(failure, READ_FAILURES),
        { cause: error },
      );
    }
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      presenceExpiresAt: row.broker_presence?.expires_at ?? null,
    }));
  },
};
