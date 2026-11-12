import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/format";
import type { Observation } from "@/lib/types";

/** Histórico de observações, da mais recente para a mais antiga. */
export function ObservationList({
  observations,
}: {
  observations: Observation[];
}) {
  if (observations.length === 0) {
    return (
      <EmptyState
        compact
        icon={MessageSquareText}
        title="Nenhuma observação registrada"
        description="Registre informações relevantes do atendimento para manter o histórico."
        className="rounded-lg border border-dashed"
      />
    );
  }

  const sorted = [...observations].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
      {sorted.map((obs) => (
        <li key={obs.id} className="relative pl-6">
          <span
            className="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-background bg-muted-foreground/40"
            aria-hidden
          />
          <time
            dateTime={obs.createdAt}
            className="block text-muted-foreground text-xs"
          >
            {formatDateTime(obs.createdAt)}
          </time>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {obs.content}
          </p>
        </li>
      ))}
    </ol>
  );
}
