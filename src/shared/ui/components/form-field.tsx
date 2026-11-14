import type { ReactNode } from "react";
import { Label } from "@/shared/ui/primitives/label";

interface FormFieldProps {
  /** `id` do controle; a mensagem de erro usa `${id}-error`. */
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

/** Rótulo (com * ou "opcional"), controle e mensagem de erro de um campo. */
export function FormField({
  id,
  label,
  required,
  error,
  children,
}: FormFieldProps) {
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
      ) : null}
    </div>
  );
}
