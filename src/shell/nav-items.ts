import { Inbox, KanbanSquare, type LucideIcon, Users } from "lucide-react";
import type { UserRole } from "@/shared/domain/actor";
import { ROUTES } from "@/shared/ui/routes";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  manager: [
    { href: ROUTES.managerLeads, label: "Leads", icon: Inbox },
    { href: ROUTES.managerBrokers, label: "Corretores", icon: Users },
  ],
  broker: [
    { href: ROUTES.brokerLeads, label: "Meus leads", icon: KanbanSquare },
  ],
};
