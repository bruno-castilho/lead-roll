import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-3 py-6" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border bg-muted/50 text-muted-foreground",
          compact ? "size-9" : "size-12",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium", compact ? "text-[13px]" : "text-sm")}>
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "mx-auto max-w-sm text-muted-foreground",
              compact ? "text-xs" : "text-[13px]",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
