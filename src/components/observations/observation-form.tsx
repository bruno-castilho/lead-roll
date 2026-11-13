"use client";

import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { observationSchema } from "@/lib/validation";

interface ObservationFormProps {
  /** Registra a observação; devolve `true` se salvou (o texto é limpo). */
  onSubmit: (content: string) => Promise<boolean>;
}

export function ObservationForm({ onSubmit }: ObservationFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) return;
    const parsed = observationSchema.safeParse(content);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Observação inválida.";
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (await onSubmit(parsed.data)) setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <label htmlFor="observation" className="sr-only">
        Nova observação
      </label>
      <Textarea
        id="observation"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          // Enter adiciona; Shift + Enter quebra a linha.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Escreva uma observação sobre o atendimento…"
        rows={3}
        maxLength={1000}
        readOnly={submitting}
        aria-invalid={!!error}
        aria-describedby={error ? "observation-error" : undefined}
        className="min-h-20 resize-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {error && (
          <p id="observation-error" className="text-destructive text-xs">
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="ml-auto shrink-0"
          disabled={submitting || !content.trim()}
        >
          {submitting ? <Spinner /> : <Plus />}
          Adicionar observação
        </Button>
      </div>
    </form>
  );
}
