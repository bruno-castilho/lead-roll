"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { usePresence } from "@/hooks/use-presence";
import { useSession } from "@/hooks/use-session";
import { formatTime } from "@/lib/format";
import { cn } from "@/shared/ui/cn";
import { Spinner } from "@/shared/ui/components/loading-state";
import { Button } from "@/shared/ui/primitives/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/primitives/tooltip";

type PresenceToggleProps = {
  className?: string;
  /** Versão reduzida para o cabeçalho em telas pequenas. */
  compact?: boolean;
};

/** Confirmação de presença do corretor (entra na fila ou renova por 5h). */
export function PresenceToggle(props: PresenceToggleProps) {
  const { profile } = useSession();
  if (profile?.role !== "broker") return null;
  return <BrokerPresenceToggle {...props} />;
}

function BrokerPresenceToggle({
  className,
  compact = false,
}: PresenceToggleProps) {
  const { expiresAt, loading, confirming, confirm } = usePresence();
  const busy = loading || confirming;
  const until = expiresAt ? formatTime(expiresAt) : null;

  if (compact) {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={confirm}
        disabled={busy}
        aria-label={
          until
            ? `Disponível até ${until}. Renovar presença`
            : "Ausente. Confirmar presença"
        }
        className={cn(
          "h-9 gap-1.5 px-2.5 text-xs",
          until &&
            "border-success/30 bg-success/10 text-success hover:bg-success/15",
          className,
        )}
      >
        {confirming ? (
          <Spinner className="size-3.5" />
        ) : (
          <span
            className={cn(
              "size-2 rounded-full",
              until ? "bg-success" : "bg-muted-foreground/50",
            )}
            aria-hidden
          />
        )}
        {until ? `Até ${until}` : "Confirmar presença"}
      </Button>
    );
  }

  if (!until) {
    return (
      <Button
        onClick={confirm}
        disabled={busy}
        size="lg"
        className={cn("h-9", className)}
      >
        {confirming ? <Spinner /> : <CheckCircle2 />}
        Confirmar presença
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-1 rounded-lg border border-success/30 bg-success/10 pr-1 pl-2.5",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span className="mr-1 font-medium text-[13px] text-success">
        Disponível até {until}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={confirm}
            disabled={busy}
            className="h-7 text-muted-foreground hover:text-foreground"
          >
            {confirming ? <Spinner /> : <RefreshCw />}
            Renovar
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Mais 5h a partir de agora, sem perder a posição na fila
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
