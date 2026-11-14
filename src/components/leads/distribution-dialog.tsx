"use client";

import { ArrowRight, Inbox, Shuffle, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import type { Lead } from "@/lib/types";
import type { Broker } from "@/modules/brokers";
import { LeadsService } from "@/services/leads-service";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { Spinner } from "@/shared/ui/components/loading-state";
import { pluralize } from "@/shared/ui/format";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";
import { Button } from "@/shared/ui/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/primitives/dialog";

interface DistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  brokers: Broker[];
  /** Chamado com os leads que o banco acabou de distribuir. */
  onDistributed?: (leads: Lead[]) => void;
}

/** Confirmação da distribuição em rodízio dos leads sem responsável. */
export function DistributionDialog({
  open,
  onOpenChange,
  leads,
  brokers,
  onDistributed,
}: DistributionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const pendingCount = leads.filter((l) => l.brokerId === null).length;
  const brokerCount = brokers.filter((b) => b.isPresent).length;
  const absentCount = brokers.length - brokerCount;
  const canDistribute = pendingCount > 0 && brokerCount > 0;

  useResetOnHide(() => setSubmitting(false));

  function handleOpenChange(next: boolean) {
    // Não fecha enquanto a distribuição está em andamento.
    if (!next && submitting) return;
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const distributed = await LeadsService.distributeLeads();
      onDistributed?.(distributed);
      onOpenChange(false);
      // O banco decide quem participa: a presença pode ter expirado ou outro
      // gestor pode ter distribuído antes.
      if (distributed.length === 0) {
        toast.info("Nenhum lead foi distribuído", {
          description:
            "Não há leads sem responsável ou corretores presentes no momento.",
        });
        return;
      }
      const receivers = new Set(distributed.map((l) => l.brokerId)).size;
      toast.success("Distribuição realizada com sucesso", {
        description: `${pluralize(distributed.length, "lead distribuído", "leads distribuídos")} entre ${pluralize(receivers, "corretor", "corretores")}.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="size-4 text-primary" aria-hidden />
            Distribuição de leads
          </DialogTitle>
          <DialogDescription>
            Os leads sem responsável, dos mais antigos para os mais novos,
            seguem a fila dos corretores que confirmaram presença nas últimas
            5h. Quem recebe um lead volta para o final da fila.
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
            <Button variant="outline" size="lg" disabled={submitting}>
              {canDistribute ? "Cancelar" : "Fechar"}
            </Button>
          </DialogClose>
          {canDistribute && (
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={submitting}
              autoFocus
            >
              {submitting ? <Spinner /> : <Shuffle />}
              Confirmar distribuição
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
