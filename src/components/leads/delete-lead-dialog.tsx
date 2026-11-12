"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import type { Lead } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface DeleteLeadDialogProps {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (lead: Lead) => void;
}

export function DeleteLeadDialog({
  lead,
  onOpenChange,
  onDeleted,
}: DeleteLeadDialogProps) {
  const { deleteLead } = useAppStore();
  const [shown, setShown] = useState<Lead | null>(lead);
  if (lead && lead !== shown) setShown(lead);

  function handleConfirm() {
    if (!lead) return;
    deleteLead(lead.id);
    toast.success("Lead excluído com sucesso", { description: lead.name });
    onDeleted?.(lead);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={!!lead} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
          <AlertDialogDescription>
            O lead <strong className="text-foreground">{shown?.name}</strong> e
            todas as suas observações serão removidos. Essa ação não poderá ser
            desfeita durante a sessão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
