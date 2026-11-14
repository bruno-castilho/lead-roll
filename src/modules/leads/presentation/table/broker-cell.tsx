"use client";

import type { Broker } from "@/modules/brokers";
import { getInitials } from "@/shared/ui/format";
import { Avatar, AvatarFallback } from "@/shared/ui/primitives/avatar";
import { UnassignedBadge } from "../unassigned-badge";

export function BrokerCell({ broker }: { broker?: Broker }) {
  if (!broker) {
    return <UnassignedBadge className="inline-flex items-center gap-1.5" />;
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
