import "client-only";
import { getSupabaseClient } from "@/shared/infrastructure/supabase/client";
import {
  classifyPostgrestFailure,
  narrowFailure,
} from "@/shared/infrastructure/supabase/postgrest-failure";
import { AuthError } from "../application/auth-error";
import type { ProfileRepository } from "../application/ports";

const PROFILE_COLUMNS = "id, name, email, role";
const READ_FAILURES = ["network", "auth"] as const;

/** Perfis em `profiles`; a RLS devolve todos ao gestor e só o próprio ao corretor. */
export const supabaseProfileRepository: ProfileRepository = {
  async findById(userId) {
    const { data, error, status } = await getSupabaseClient()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      const failure = classifyPostgrestFailure(error, status);
      throw new AuthError(
        "loadProfile",
        narrowFailure(failure, READ_FAILURES),
        { cause: error },
      );
    }
    return data;
  },
};
