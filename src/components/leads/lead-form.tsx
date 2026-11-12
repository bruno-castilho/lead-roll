"use client";

import { Save, UserPlus } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LEAD_INTERESTS, LEAD_SOURCES } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import type { Lead, LeadInput } from "@/lib/types";
import { fieldErrors, leadSchema } from "@/lib/validation";
import { useAppStore } from "@/store/app-store";

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informado, o formulário funciona em modo de edição. */
  lead?: Lead | null;
}

type FormState = {
  name: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
};

function toFormState(lead?: Lead | null): FormState {
  return {
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    source: lead?.source ?? "",
    interest: lead?.interest ?? "",
  };
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : (
          <span className="font-normal text-muted-foreground text-xs">
            (opcional)
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function LeadForm({ open, onOpenChange, lead }: LeadFormProps) {
  const { createLead, updateLead } = useAppStore();
  const isEdit = !!lead;
  const [values, setValues] = useState<FormState>(() => toFormState(lead));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevOpen, setPrevOpen] = useState(open);

  // Reinicia o formulário sempre que o painel é aberto.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setValues(toFormState(lead));
      setErrors({});
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    const input: LeadInput = {
      name: parsed.data.name,
      phone: formatPhone(parsed.data.phone),
      email: parsed.data.email || undefined,
      source: parsed.data.source,
      interest: parsed.data.interest,
    };

    if (lead) {
      updateLead(lead.id, input);
      toast.success("Lead atualizado com sucesso", { description: input.name });
    } else {
      createLead(input);
      toast.success("Lead cadastrado com sucesso", {
        description: `${input.name} foi adicionado aos leads sem responsável.`,
      });
    }
    onOpenChange(false);
  }

  const invalid = (key: keyof FormState) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `lead-${key}-error` : undefined,
  });

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
          <Field id="lead-name" label="Nome" required error={errors.name}>
            <Input
              id="lead-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome completo"
              autoComplete="off"
              className="h-10"
              autoFocus
              {...invalid("name")}
            />
          </Field>

          <Field id="lead-phone" label="Telefone" required error={errors.phone}>
            <Input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
              placeholder="(11) 98765-4321"
              autoComplete="off"
              className="h-10"
              {...invalid("phone")}
            />
          </Field>

          <Field id="lead-email" label="E-mail" error={errors.email}>
            <Input
              id="lead-email"
              type="email"
              inputMode="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@exemplo.com"
              autoComplete="off"
              className="h-10"
              {...invalid("email")}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="lead-source"
              label="Origem"
              required
              error={errors.source}
            >
              <Select
                value={values.source}
                onValueChange={(v) => set("source", v)}
              >
                <SelectTrigger
                  id="lead-source"
                  className="h-10 w-full"
                  {...invalid("source")}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="lead-interest"
              label="Interesse"
              required
              error={errors.interest}
            >
              <Select
                value={values.interest}
                onValueChange={(v) => set("interest", v)}
              >
                <SelectTrigger
                  id="lead-interest"
                  className="h-10 w-full"
                  {...invalid("interest")}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_INTERESTS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

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
          <Button type="submit" form="lead-form" size="lg">
            {isEdit ? <Save /> : <UserPlus />}
            {isEdit ? "Salvar alterações" : "Cadastrar lead"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
