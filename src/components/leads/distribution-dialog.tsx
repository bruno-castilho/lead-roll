"use client";

import { ArrowRight, Inbox, Shuffle, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Spinner } from "@/components/shared/loading-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import { planDistribution } from "@/lib/distribution";
import { getInitials, pluralize } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

interface DistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmação e prévia da distribuição em rodízio dos leads sem responsável. */
export function DistributionDialog({
  open,
  onOpenChange,
}: DistributionDialogProps) {
  const { leads, users, brokers, roundRobinCursor, distributeLeads } =
    useAppStore();
  const [running, setRunning] = useState(false);

  const plan = useMemo(
    () => planDistribution(leads, users, roundRobinCursor),
    [leads, users, roundRobinCursor],
  );
  const pendingCount = plan.leads.length;
  const brokerCount = plan.brokers.length;
  const absentCount = brokers.length - brokerCount;
  const canDistribute = pendingCount > 0 && brokerCount > 0;

  function handleConfirm() {
    setRunning(true);
    // Operação síncrona no estado local; o indicador fica pronto para uma futura API.
    const count = distributeLeads();
    setRunning(false);
    onOpenChange(false);
    toast.success("Distribuição realizada com sucesso", {
      description: `${pluralize(count, "lead distribuído", "leads distribuídos")} entre ${pluralize(brokerCount, "corretor", "corretores")}.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="size-4 text-primary" aria-hidden />
            Distribuição de leads
          </DialogTitle>
          <DialogDescription>
            Os leads sem responsável serão divididos em rodízio entre os
            corretores que confirmaram presença.
          </DialogDescription>
        </DialogHeader>

        {pendingCount === 0 ? (
          <EmptyState
            compact
            icon={Inbox}
            title="Nenhum lead sem responsável"
            description="Todos os leads já foram distribuídos. Cadastre novos leads para distribuir."
            className="rounded-lg border border-dashed"
          />
        ) : brokerCount === 0 ? (
          <EmptyState
            compact
            icon={UserX}
            title="Nenhum corretor disponível"
            description="Aguarde a confirmação de presença dos corretores para distribuir os leads."
            className="rounded-lg border border-dashed"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={ROUTES.managerBrokers}
                  onClick={() => onOpenChange(false)}
                >
                  Ver corretores <ArrowRight />
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold text-2xl text-primary tabular-nums">
                  {pendingCount}
                </p>
                <p className="text-muted-foreground text-xs">
                  {pendingCount === 1 ? "lead aguardando" : "leads aguardando"}{" "}
                  distribuição
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold text-2xl tabular-nums">
                  {brokerCount}
                </p>
                <p className="text-muted-foreground text-xs">
                  {brokerCount === 1
                    ? "corretor disponível"
                    : "corretores disponíveis"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-sm">Prévia por corretor</p>
              <ul className="divide-y rounded-lg border">
                {plan.brokers.map((broker, index) => {
                  const count = plan.countByBroker.get(broker.id) ?? 0;
                  return (
                    <li
                      key={broker.id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px]">
                          {getInitials(broker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {broker.name}
                        </p>
                        {index === 0 && (
                          <p className="text-muted-foreground text-xs">
                            Próximo no rodízio
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-sm tabular-nums">
                        {pluralize(count, "lead", "leads")}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {absentCount > 0 && (
                <p className="mt-2 text-muted-foreground text-xs">
                  {pluralize(
                    absentCount,
                    "corretor ausente não participará",
                    "corretores ausentes não participarão",
                  )}{" "}
                  desta distribuição.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              {canDistribute ? "Cancelar" : "Fechar"}
            </Button>
          </DialogClose>
          {canDistribute && (
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={running}
              autoFocus
            >
              {running ? <Spinner /> : <Shuffle />}
              Confirmar distribuição
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
