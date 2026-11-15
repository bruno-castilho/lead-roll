"use client";

import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useSession } from "@/modules/auth";
import { Spinner } from "@/shared/ui/components/loading-state";
import { formatCountdown, formatTime } from "@/shared/ui/format";
import { useCountdown } from "@/shared/ui/hooks/use-countdown";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";
import { Button } from "@/shared/ui/primitives/button";
import { ROUTES } from "@/shared/ui/routes";
import { canConfirmPresence } from "../domain/presence-policy";
import type { PresenceCheckInResult } from "./presence-provider";
import { usePresence } from "./use-presence";

const TOKEN_PARAM = "token";

type CheckInState =
  | { status: "idle" }
  | { status: "confirming" }
  | PresenceCheckInResult;

/**
 * Destino do link do QR code (`/corretor/presenca?token=…`): confirma a
 * presença com o token assim que a sessão do corretor e a presença atual
 * estão carregadas. O token sai da URL na hora, para recarregar a página não
 * repetir a confirmação.
 */
export function PresenceCheckIn() {
  const { profile } = useSession();
  const { loading, expiresAt, confirm } = usePresence();
  const [state, setState] = useState<CheckInState>({ status: "idle" });
  const isBroker = profile !== null && canConfirmPresence(profile);

  useResetOnHide(() => setState({ status: "idle" }));

  useEffect(() => {
    if (!isBroker || loading) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has(TOKEN_PARAM)) return;
    const token = params.get(TOKEN_PARAM);
    window.history.replaceState(null, "", ROUTES.brokerPresence);
    setState({ status: "confirming" });
    // Sem cancelamento: o token já saiu da URL, e o resultado precisa
    // aparecer mesmo que o efeito rode de novo antes de a resposta chegar.
    void confirm(token).then((result) => {
      if (result) setState(result);
    });
  }, [isBroker, loading, confirm]);

  if (state.status === "confirming" || (state.status === "idle" && loading)) {
    return (
      <CheckInCard>
        <Spinner className="size-8 text-muted-foreground" />
        <h1 className="font-semibold text-xl">Confirmando presença…</h1>
      </CheckInCard>
    );
  }

  if (state.status === "failed") {
    return (
      <CheckInCard>
        <XCircle className="size-12 text-destructive" aria-hidden />
        <h1 className="font-semibold text-xl">Presença não confirmada</h1>
        <p role="alert" className="text-muted-foreground text-sm">
          {state.message}
        </p>
        <LeadsLink />
      </CheckInCard>
    );
  }

  if (state.status === "idle") {
    return (
      <CheckInCard>
        <QrCode className="size-12 text-muted-foreground" aria-hidden />
        <h1 className="font-semibold text-xl">Confirme pelo QR code</h1>
        <p className="text-muted-foreground text-sm">
          Para entrar na fila ou renovar sua presença, escaneie com a câmera do
          celular o QR code exibido na tela da empresa.
        </p>
        {expiresAt && <PresenceTimeLeft expiresAt={expiresAt} />}
        <LeadsLink />
      </CheckInCard>
    );
  }

  return (
    <CheckInCard>
      <CheckCircle2 className="size-12 text-success" aria-hidden />
      <h1 className="font-semibold text-xl">
        {state.status === "renewed"
          ? "Presença renovada"
          : "Presença confirmada"}
      </h1>
      <p className="text-muted-foreground text-sm">
        {state.status === "renewed"
          ? "Você continua na mesma posição da fila"
          : "Você entrou no final da fila"}{" "}
        até {formatTime(state.expiresAt)}.
      </p>
      {expiresAt && <PresenceTimeLeft expiresAt={expiresAt} />}
      <LeadsLink />
    </CheckInCard>
  );
}

function PresenceTimeLeft({ expiresAt }: { expiresAt: string }) {
  const remaining = useCountdown(expiresAt);
  return (
    <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-success">
      <p className="text-xs">Tempo restante na fila</p>
      <p className="font-semibold text-2xl tabular-nums">
        <span className="sr-only">Disponível até {formatTime(expiresAt)}</span>
        <span aria-hidden>
          {remaining === null ? "—" : formatCountdown(remaining)}
        </span>
      </p>
    </div>
  );
}

function CheckInCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card px-5 py-10 text-center sm:px-8">
      {children}
    </div>
  );
}

function LeadsLink() {
  return (
    <Button asChild size="lg" variant="outline" className="h-10 w-full">
      <Link href={ROUTES.brokerLeads}>Ver meus leads</Link>
    </Button>
  );
}
