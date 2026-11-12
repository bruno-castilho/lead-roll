"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";
import type { User } from "@/lib/types";

export function BrokerCell({ broker }: { broker?: User }) {
  if (!broker) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-medium text-warning text-xs">
        Sem responsável
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className="text-[10px]">
          {getInitials(broker.name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{broker.name}</span>
    </span>
  );
}
