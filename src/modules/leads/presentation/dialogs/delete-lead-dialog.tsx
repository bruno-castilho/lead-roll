"use client";

import { Trash2 } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/auth";
import { Spinner } from "@/shared/ui/components/loading-state";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";
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
} from "@/shared/ui/primitives/alert-dialog";
import { deleteLead } from "../../composition";
import type { Lead } from "../../domain/lead";
import { leadsErrorMessage } from "../leads-messages";

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
  const { profile } = useSession();
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
    if (!lead || !profile || deleting) return;
    setDeleting(true);
    try {
      await deleteLead(profile, lead.id);
      onDeleted?.(lead);
      toast.success("Lead excluído com sucesso", { description: lead.name });
      onOpenChange(false);
    } catch (error) {
      toast.error(leadsErrorMessage(error));
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
