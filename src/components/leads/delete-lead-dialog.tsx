"use client";

import { Trash2 } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/shared/loading-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import type { Lead } from "@/lib/types";
import { LeadsService } from "@/services/leads-service";

interface DeleteLeadDialogProps {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  /** Chamado com o lead que o banco acabou de excluir. */
  onDeleted?: (lead: Lead) => void;
}

export function DeleteLeadDialog({
  lead,
  onOpenChange,
  onDeleted,
}: DeleteLeadDialogProps) {
  const [shown, setShown] = useState<Lead | null>(lead);
  const [deleting, setDeleting] = useState(false);
  if (lead && lead !== shown) setShown(lead);

  useResetOnHide(() => setDeleting(false));

  function handleOpenChange(open: boolean) {
    // Não fecha enquanto a exclusão está em andamento.
    if (!open && deleting) return;
    onOpenChange(open);
  }

  async function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // O Action do Radix fecha o diálogo no clique; ele só fecha ao terminar.
    event.preventDefault();
    if (!lead || deleting) return;
    setDeleting(true);
    try {
      await LeadsService.deleteLead(lead.id);
      onDeleted?.(lead);
      toast.success("Lead excluído com sucesso", { description: lead.name });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={!!lead} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
          <AlertDialogDescription>
            O lead <strong className="text-foreground">{shown?.name}</strong>{" "}
            será removido permanentemente. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Spinner />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
