"use client";

import { Save, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/auth";
import { Spinner } from "@/shared/ui/components/loading-state";
import { fieldErrors } from "@/shared/ui/form-errors";
import { useResetOnHide } from "@/shared/ui/hooks/use-reset-on-hide";
import { Button } from "@/shared/ui/primitives/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/primitives/sheet";
import { createLead, updateLead } from "../../composition";
import type { Lead } from "../../domain/lead";
import { leadsErrorMessage } from "../leads-messages";
import {
  LeadFormFields,
  type LeadFormValues,
  toFormValues,
} from "./lead-form-fields";
import { leadSchema } from "./lead-form-schema";

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informado, o formulário funciona em modo de edição. */
  lead?: Lead | null;
  /** Chamado com o lead que o banco acabou de cadastrar. */
  onCreated?: (lead: Lead) => void;
  /** Chamado com o lead que o banco acabou de atualizar. */
  onUpdated?: (lead: Lead) => void;
}

export function LeadForm({
  open,
  onOpenChange,
  lead,
  onCreated,
  onUpdated,
}: LeadFormProps) {
  const { profile } = useSession();
  const isEdit = !!lead;
  const [values, setValues] = useState<LeadFormValues>(() =>
    toFormValues(lead),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  useResetOnHide(() => setSubmitting(false));

  // Reinicia o formulário sempre que o painel é aberto.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValues(toFormValues(lead));
      setErrors({});
      setSubmitting(false);
    }
  }

  function setField<K extends keyof LeadFormValues>(
    key: K,
    value: LeadFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      toast.error("Verifique os campos do formulário", {
        description: Object.values(errs)[0],
      });
      const firstField = Object.keys(errs)[0];
      document.getElementById(`lead-${firstField}`)?.focus();
      return;
    }

    // Só o gestor abre o formulário; sem perfil não há quem grave.
    if (!profile) return;
    setSubmitting(true);
    try {
      if (lead) {
        const updated = await updateLead(profile, lead.id, parsed.data);
        onUpdated?.(updated);
        toast.success("Lead atualizado com sucesso", {
          description: updated.name,
        });
        onOpenChange(false);
        return;
      }
      const created = await createLead(profile, parsed.data);
      onCreated?.(created);
      toast.success("Lead cadastrado com sucesso", {
        description: `${created.name} foi adicionado aos leads sem responsável.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(leadsErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="text-lg">
            {isEdit ? "Editar lead" : "Novo lead"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Atualize as informações de contato e interesse do lead."
              : "O lead será criado na etapa Novo, sem responsável, aguardando distribuição."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="lead-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 space-y-5 overflow-y-auto p-5"
        >
          <LeadFormFields values={values} errors={errors} onChange={setField} />

          {/* Permite enviar com Enter a partir de qualquer campo de texto. */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="lead-form"
            size="lg"
            disabled={submitting}
          >
            {submitting ? <Spinner /> : isEdit ? <Save /> : <UserPlus />}
            {isEdit ? "Salvar alterações" : "Cadastrar lead"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
