import { Mail } from "lucide-react";
import { PresenceBadge } from "@/components/shared/presence-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BrokerCardProps {
  broker: User;
  total: number;
  active: number;
}

export function BrokerCard({ broker, total, active }: BrokerCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        broker.isPresent && "border-success/30",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="font-medium text-sm">
            {getInitials(broker.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{broker.name}</p>
          <a
            href={`mailto:${broker.email}`}
            className="flex items-center gap-1 truncate text-muted-foreground text-xs hover:text-foreground"
          >
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{broker.email}</span>
          </a>
        </div>
        <PresenceBadge isPresent={broker.isPresent} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground text-xs">Leads atribuídos</dt>
          <dd className="font-semibold text-lg tabular-nums">{total}</dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground text-xs">Em atendimento</dt>
          <dd className="font-semibold text-lg tabular-nums">{active}</dd>
        </div>
      </dl>
    </div>
  );
}
