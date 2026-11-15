import "client-only";
import {
  makeRestoreSession,
  makeSignIn,
  makeSignOut,
  makeWatchSignedOut,
} from "./application/session-use-cases";
import { supabaseAuthGateway } from "./infrastructure/supabase-auth-gateway";
import { supabaseProfileRepository } from "./infrastructure/supabase-profile-repository";

// Só liga as peças: o cliente Supabase é criado na primeira chamada.
const deps = { auth: supabaseAuthGateway, profiles: supabaseProfileRepository };

export const signIn = makeSignIn(deps);
export const restoreSession = makeRestoreSession(deps);
export const signOut = makeSignOut(deps);
export const watchSignedOut = makeWatchSignedOut(deps);
