"use client";

import { AlertCircle } from "lucide-react";
import { Spinner } from "@/shared/ui/components/loading-state";
import { QrCode } from "@/shared/ui/components/qr-code";
import { formatCountdown } from "@/shared/ui/format";
import { useCountdown } from "@/shared/ui/hooks/use-countdown";
import { usePresenceQr } from "./use-presence-qr";

/**
 * Tela do totem: QR code de presença em tamanho grande, renovado a cada
 * 5 minutos, com o tempo até o próximo código.
 */
export function PresenceKiosk() {
  const { qr, error } = usePresenceQr();
  const remaining = useCountdown(qr?.expiresAt ?? null);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight sm:text-4xl">
          Confirme sua presença
        </h1>
        <p className="text-muted-foreground sm:text-lg">
          Abra a câmera do celular, escaneie o código e entre na fila de
          distribuição por 5 horas.
        </p>
      </div>

      <div className="flex aspect-square w-full max-w-[min(90vw,60dvh)] items-center justify-center rounded-2xl border bg-card p-4 sm:p-6">
        {qr ? (
          <QrCode
            value={qr.link}
            label="QR code para confirmar presença"
            className="size-full"
          />
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 px-6 text-destructive"
          >
            <AlertCircle className="size-10" aria-hidden />
            <p className="font-medium">{error}</p>
            <p className="text-muted-foreground text-sm">
              Tentando novamente em instantes…
            </p>
          </div>
        ) : (
          <output aria-label="Gerando QR code">
            <Spinner className="size-8 text-muted-foreground" />
          </output>
        )}
      </div>

      <p className="min-h-6 text-muted-foreground text-sm sm:text-base">
        {qr && remaining !== null && (
          <>
            Novo código em{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCountdown(remaining)}
            </span>
            . Códigos antigos não confirmam presença.
          </>
        )}
      </p>
    </div>
  );
}
