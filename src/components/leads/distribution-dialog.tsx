"use client";

import { ArrowRight, Inbox, Shuffle, UserX } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
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
import { pluralize } from "@/lib/format";
import type { Lead, User } from "@/lib/types";

interface DistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  brokers: User[];
}

/** Confirmação da distribuição em rodízio dos leads sem responsável. */
export function DistributionDialog({
  open,
  onOpenChange,
  leads,
  brokers,
}: DistributionDialogProps) {
  const pendingCount = leads.filter((l) => l.brokerId === null).length;
  const brokerCount = brokers.filter((b) => b.isPresent).length;
  const absentCount = brokers.length - brokerCount;
  const canDistribute = pendingCount > 0 && brokerCount > 0;

  function handleConfirm() {
    // Sem implementação.
    onOpenChange(false);
    toast.success("Distribuição realizada com sucesso", {
      description: `${pluralize(pendingCount, "lead distribuído", "leads distribuídos")} entre ${pluralize(brokerCount, "corretor", "corretores")}.`,
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
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              {canDistribute ? "Cancelar" : "Fechar"}
            </Button>
          </DialogClose>
          {canDistribute && (
            <Button size="lg" onClick={handleConfirm} autoFocus>
              <Shuffle />
              Confirmar distribuição
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
