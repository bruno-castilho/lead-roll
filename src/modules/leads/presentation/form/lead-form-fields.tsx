"use client";

import { FormField } from "@/shared/ui/components/form-field";
import { Input } from "@/shared/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import type { Lead } from "../../domain/lead";
import { formatPhone } from "../../domain/phone";
import { INTEREST_OPTIONS, SOURCE_OPTIONS } from "../lead-labels";

/** Valores digitados no formulário, antes da validação. */
export type LeadFormValues = {
  name: string;
  phone: string;
  email: string;
  source: string;
  interest: string;
};

export function toFormValues(lead?: Lead | null): LeadFormValues {
  return {
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    source: lead?.source ?? "",
    interest: lead?.interest ?? "",
  };
}

interface LeadFormFieldsProps {
  values: LeadFormValues;
  errors: Record<string, string>;
  onChange: <K extends keyof LeadFormValues>(
    key: K,
    value: LeadFormValues[K],
  ) => void;
}

/** Campos do lead: nome, telefone (com máscara), e-mail, origem e interesse. */
export function LeadFormFields({
  values,
  errors,
  onChange,
}: LeadFormFieldsProps) {
  const invalid = (key: keyof LeadFormValues) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `lead-${key}-error` : undefined,
  });

  const optionSelect = (
    key: "source" | "interest",
    options: { value: string; label: string }[],
  ) => (
    <Select value={values[key]} onValueChange={(v) => onChange(key, v)}>
      <SelectTrigger
        id={`lead-${key}`}
        className="h-10 w-full"
        {...invalid(key)}
      >
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <FormField id="lead-name" label="Nome" required error={errors.name}>
        <Input
          id="lead-name"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Nome completo"
          autoComplete="off"
          className="h-10"
          autoFocus
          {...invalid("name")}
        />
      </FormField>

      <FormField id="lead-phone" label="Telefone" required error={errors.phone}>
        <Input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => onChange("phone", formatPhone(e.target.value))}
          placeholder="(11) 98765-4321"
          autoComplete="off"
          className="h-10"
          {...invalid("phone")}
        />
      </FormField>

      <FormField id="lead-email" label="E-mail" error={errors.email}>
        <Input
          id="lead-email"
          type="email"
          inputMode="email"
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="email@exemplo.com"
          autoComplete="off"
          className="h-10"
          {...invalid("email")}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="lead-source"
          label="Origem"
          required
          error={errors.source}
        >
          {optionSelect("source", SOURCE_OPTIONS)}
        </FormField>
        <FormField
          id="lead-interest"
          label="Interesse"
          required
          error={errors.interest}
        >
          {optionSelect("interest", INTEREST_OPTIONS)}
        </FormField>
      </div>
    </>
  );
}
