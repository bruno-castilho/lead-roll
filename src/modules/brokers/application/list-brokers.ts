import type { Broker } from "../domain/broker";
import { isPresenceActive } from "../domain/presence";
import type { BrokerRepository, Clock } from "./ports";

/** Lista os corretores, marcando quem está presente agora. */
export function makeListBrokers(deps: {
  brokers: BrokerRepository;
  now: Clock;
}) {
  return async function listBrokers(): Promise<Broker[]> {
    const records = await deps.brokers.list();
    const now = deps.now();
    return records.map(({ presenceExpiresAt, ...broker }) => ({
      ...broker,
      isPresent:
        presenceExpiresAt !== null && isPresenceActive(presenceExpiresAt, now),
    }));
  };
}
