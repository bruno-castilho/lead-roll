import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import {
  classifyPostgrestFailure,
  narrowFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import { BrokersError } from "../application/brokers-error";
import type { PresenceTokenRepository } from "../application/ports";

const ISSUE_FAILURES = ["network", "auth", "forbidden"] as const;

/**
 * QR codes de presença em `presence_tokens`. Ninguém lê a tabela: o totem só
 * recebe o token que acabou de emitir pela RPC `issue_presence_token`.
 */
export const supabasePresenceTokenRepository: PresenceTokenRepository = {
  async issue() {
    const { data, error, status } = await getSupabaseClient().rpc(
      "issue_presence_token",
    );
    if (error) {
      const failure = classifyPostgrestFailure(error, status);
      throw new BrokersError(
        "issuePresenceToken",
        narrowFailure(failure, ISSUE_FAILURES),
        { cause: error },
      );
    }
    return {
      token: data.token,
      issuedAt: data.issued_at,
      expiresAt: data.expires_at,
    };
  },
};
