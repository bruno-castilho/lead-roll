import type { BrokerPresence } from "../domain/presence";
import type { PresenceToken } from "../domain/presence-token";

/** Relógio injetado nos casos de uso (testes usam um horário fixo). */
export type Clock = () => Date;

/** Corretor como está guardado, com o prazo da última presença confirmada. */
export interface BrokerRecord {
  id: string;
  name: string;
  email: string;
  presenceExpiresAt: string | null;
}

/** Leitura dos corretores. Lança `BrokersError`. */
export interface BrokerRepository {
  /** Corretores em ordem alfabética (a RLS devolve só o próprio ao corretor). */
  list(): Promise<BrokerRecord[]>;
}

/** Fila de presença. Lança `BrokersError`. */
export interface PresenceRepository {
  /** Presença do corretor (pode estar expirada); `null` se nunca confirmou. */
  findByBroker(brokerId: string): Promise<BrokerPresence | null>;
  /**
   * Confirma ou renova a presença de quem está conectado com o token do QR
   * code (regra da fila e validade do token no banco).
   */
  confirm(token: string): Promise<BrokerPresence>;
}

/** QR codes de presença. Lança `BrokersError`. */
export interface PresenceTokenRepository {
  /** Emite um token novo, válido por 5 minutos (só o totem). */
  issue(): Promise<PresenceToken>;
}
