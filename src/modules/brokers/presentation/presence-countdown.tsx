"use client";

import { QrCode, Timer } from "lucide-react";
import { useSession } from "@/modules/auth";
import { cn } from "@/shared/ui/cn";
import { formatCountdown, formatTime } from "@/shared/ui/format";
import { useCountdown } from "@/shared/ui/hooks/use-countdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/primitives/tooltip";
import { canConfirmPresence } from "../domain/presence-policy";
import { usePresence } from "./use-presence";

type PresenceCountdownProps = {
  className?: string;
  /** Versão reduzida para o cabeçalho em telas pequenas. */
  compact?: boolean;
};

const SCAN_HINT = "Escaneie o QR code na tela da empresa para confirmar.";

/**
 * Presença do corretor no cabeçalho: tempo que falta até sair da fila, ou
 * "Ausente". A confirmação é feita só pelo QR code do totem.
 */
export function PresenceCountdown(props: PresenceCountdownProps) {
  const { profile } = useSession();
  if (!profile || !canConfirmPresence(profile)) return null;
  return <BrokerPresenceCountdown {...props} />;
}

function BrokerPresenceCountdown({
  className,
  compact = false,
}: PresenceCountdownProps) {
  const { expiresAt, loading } = usePresence();
  const remaining = useCountdown(expiresAt);
  if (loading) return null;

  if (!expiresAt) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 font-medium text-muted-foreground text-xs sm:text-[13px]",
              className,
            )}
          >
            {compact ? (
              <span
                className="size-2 rounded-full bg-muted-foreground/50"
                aria-hidden
              />
            ) : (
              <QrCode className="size-4" aria-hidden />
            )}
            Ausente
            <span className="sr-only">. {SCAN_HINT}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>{SCAN_HINT}</TooltipContent>
      </Tooltip>
    );
  }

  const until = formatTime(expiresAt);
  const left = remaining === null ? "" : formatCountdown(remaining);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 font-medium text-success text-xs sm:text-[13px]",
            className,
          )}
        >
          {compact ? (
            <span className="size-2 rounded-full bg-success" aria-hidden />
          ) : (
            <Timer className="size-4" aria-hidden />
          )}
          {!compact && <span aria-hidden>Disponível</span>}
          {/* O leitor de tela lê o prazo fixo, não cada segundo. */}
          <span className="sr-only">Disponível até {until}</span>
          <span className="min-w-[4.5ch] text-right tabular-nums" aria-hidden>
            {left}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Na fila até {until}. Para renovar, escaneie o QR code na tela da
        empresa.
      </TooltipContent>
    </Tooltip>
  );
}
