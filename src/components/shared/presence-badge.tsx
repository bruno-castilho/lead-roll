import { cn } from "@/lib/utils";

export function PresenceBadge({
  isPresent,
  className,
}: {
  isPresent: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 font-medium text-xs",
        isPresent
          ? "border-success/30 bg-success/10 text-success"
          : "bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isPresent ? "bg-success" : "bg-muted-foreground/50",
        )}
        aria-hidden
      />
      {isPresent ? "Disponível" : "Ausente"}
    </span>
  );
}
