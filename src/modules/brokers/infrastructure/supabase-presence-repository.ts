import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import {
  classifyPostgrestFailure,
  narrowFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import {
  BrokersError,
  type BrokersFailure,
} from "../application/brokers-error";
import type { PresenceRepository } from "../application/ports";

const READ_FAILURES = ["network", "auth"] as const;
const CONFIRM_FAILURES = ["network", "auth", "forbidden", "invalid"] as const;

/** Código que `confirm_presence` usa para o QR code vencido ou inexistente. */
const INVALID_TOKEN_CODE = "22023";

/**
 * Fila em `broker_presence`. A RLS só devolve a própria presença ao corretor,
 * e a única escrita é a RPC `confirm_presence(p_token)`.
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

  async confirm(token) {
    const { data, error, status } = await getSupabaseClient().rpc(
      "confirm_presence",
      { p_token: token },
    );
    if (error) {
      throw new BrokersError("confirmPresence", confirmFailure(error, status), {
        cause: error,
      });
    }
    return { queuedAt: data.queued_at, expiresAt: data.expires_at };
  },
};

function confirmFailure(
  error: { code: string },
  status: number,
): BrokersFailure {
  if (error.code === INVALID_TOKEN_CODE) return "invalid_token";
  const failure = narrowFailure(
    classifyPostgrestFailure(error, status),
    CONFIRM_FAILURES,
  );
  // 22P02: o banco não leu o token como uuid.
  return failure === "invalid" ? "invalid_token" : failure;
}
