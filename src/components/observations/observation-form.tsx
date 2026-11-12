"use client";

import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { observationSchema } from "@/lib/validation";

interface ObservationFormProps {
  onSubmit: (content: string) => void;
}

export function ObservationForm({ onSubmit }: ObservationFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = observationSchema.safeParse(content);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Observação inválida.";
      setError(message);
      toast.error(message);
      return;
    }
    onSubmit(parsed.data);
    setContent("");
    setError(null);
    toast.success("Observação adicionada");
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
          disabled={!content.trim()}
        >
          <Plus />
          Adicionar observação
        </Button>
      </div>
    </form>
  );
}
