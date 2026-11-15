import "client-only";
import { makeListBrokers } from "./application/list-brokers";
import {
  makeConfirmPresence,
  makeLoadOwnPresence,
} from "./application/presence-use-cases";
import { supabaseBrokerRepository } from "./infrastructure/supabase-broker-repository";
import { supabasePresenceRepository } from "./infrastructure/supabase-presence-repository";

// Só liga as peças: nenhum cliente é criado aqui (os repositórios criam o
// cliente Supabase na primeira chamada, dentro de efeitos e handlers).
const now = () => new Date();

export const listBrokers = makeListBrokers({
  brokers: supabaseBrokerRepository,
  now,
});

export const loadOwnPresence = makeLoadOwnPresence({
  presence: supabasePresenceRepository,
  now,
});

export const confirmPresence = makeConfirmPresence({
  presence: supabasePresenceRepository,
  now,
});
