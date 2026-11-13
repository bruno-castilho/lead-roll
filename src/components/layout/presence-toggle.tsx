"use client";

import { CheckCircle2, CirclePower } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/** Controle de presença do corretor (Disponível / Ausente). */
export function PresenceToggle({
  className,
  compact = false,
}: {
  className?: string;
  /** Versão reduzida para o cabeçalho em telas pequenas. */
  compact?: boolean;
}) {
  const { profile } = useSession();
  if (profile?.role !== "broker") return null;

  // Presença ainda sem fonte de dados.
  const isPresent = false;

  function toggle() {
    // Sem implementação.
    if (isPresent) {
      toast("Disponibilidade desativada", {
        description: "Você não receberá novos leads até confirmar presença.",
      });
    } else {
      toast.success("Presença confirmada", {
        description:
          "Você já pode receber novos leads na próxima distribuição.",
      });
    }
  }

  if (compact) {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={toggle}
        aria-pressed={isPresent}
        aria-label={
          isPresent
            ? "Disponível. Desativar disponibilidade"
            : "Ausente. Confirmar presença"
        }
        className={cn(
          "h-9 gap-1.5 px-2.5 text-xs",
          isPresent &&
            "border-success/30 bg-success/10 text-success hover:bg-success/15",
          className,
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            isPresent ? "bg-success" : "bg-muted-foreground/50",
          )}
          aria-hidden
        />
        {isPresent ? "Disponível" : "Confirmar presença"}
      </Button>
    );
  }

  if (!isPresent) {
    return (
      <Button onClick={toggle} size="lg" className={cn("h-9", className)}>
        <CheckCircle2 />
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
        Disponível
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="h-7 text-muted-foreground hover:text-foreground"
          >
            <CirclePower />
            <span className="hidden sm:inline">Desativar disponibilidade</span>
            <span className="sm:hidden">Desativar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Parar de receber novos leads</TooltipContent>
      </Tooltip>
    </div>
  );
}
