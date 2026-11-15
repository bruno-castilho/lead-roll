"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/modules/auth";
import { ROUTES } from "@/shared/ui/routes";
import { issuePresenceToken } from "../composition";
import { canIssuePresenceToken } from "../domain/presence-policy";
import { presenceTokenLifetimeMs } from "../domain/presence-token";
import { brokersErrorMessage } from "./brokers-messages";

/** Depois de uma falha, o totem tenta gerar o código de novo neste intervalo. */
export const PRESENCE_QR_RETRY_MS = 15_000;

/** QR code exibido no totem: o link de presença e até quando ele vale. */
export interface PresenceQr {
  link: string;
  /** Vencimento no relógio do totem (emissão local + validade do banco). */
  expiresAt: string;
}

/**
 * Emite o QR code de presença assim que o totem está conectado e troca por
 * um novo quando o atual vence (a cada 5 minutos). Se a emissão falhar, o
 * código vencido sai da tela e o totem tenta de novo a cada 15 segundos.
 * Com a página oculta (outra rota), o efeito é desmontado e nada é emitido.
 */
export function usePresenceQr() {
  const { profile } = useSession();
  const kiosk = profile && canIssuePresenceToken(profile) ? profile : null;
  const kioskId = kiosk?.id ?? null;
  const [qr, setQr] = useState<PresenceQr | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQr(null);
    setError(null);
    if (!kioskId) return;
    let cancelled = false;
    let timer = 0;

    async function issueNext() {
      if (!kioskId) return;
      try {
        const token = await issuePresenceToken({ id: kioskId, role: "kiosk" });
        if (cancelled) return;
        // A validade vem do relógio do banco; o vencimento na tela é medido
        // pelo relógio do totem, que pode não estar sincronizado.
        const lifetime = presenceTokenLifetimeMs(token);
        const link = new URL(ROUTES.brokerPresence, window.location.origin);
        link.searchParams.set("token", token.token);
        setQr({
          link: link.toString(),
          expiresAt: new Date(Date.now() + lifetime).toISOString(),
        });
        setError(null);
        timer = window.setTimeout(issueNext, Math.max(lifetime, 1000));
      } catch (failure) {
        if (cancelled) return;
        setQr(null);
        setError(brokersErrorMessage(failure));
        timer = window.setTimeout(issueNext, PRESENCE_QR_RETRY_MS);
      }
    }

    void issueNext();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [kioskId]);

  return { qr, error, loading: qr === null && error === null };
}
