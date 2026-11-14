import { cn } from "@/shared/ui/cn";

/** Selo "Sem responsável" (lead aguardando distribuição). */
export function UnassignedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-medium text-warning text-xs",
        className,
      )}
    >
      Sem responsável
    </span>
  );
}
