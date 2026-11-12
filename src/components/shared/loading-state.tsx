import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border bg-card p-4", className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex gap-4 border-b px-4 py-3">
        {[
          { id: "name", w: 40 },
          { id: "phone", w: 24 },
          { id: "source", w: 20 },
          { id: "stage", w: 20 },
          { id: "broker", w: 16 },
        ].map(({ id, w }) => (
          <Skeleton key={id} className="h-3" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => `skeleton-row-${i + 1}`).map(
        (id) => (
          <div
            key={id}
            className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
            <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
            <Skeleton className="ml-auto h-4 w-8" />
          </div>
        ),
      )}
    </div>
  );
}

/** Placeholder de página inteira, usado enquanto a sessão é restaurada. */
export function LoadingState({
  variant = "page",
}: {
  variant?: "page" | "table";
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {variant === "page" ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      <TableSkeleton />
    </div>
  );
}
