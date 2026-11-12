import { Inbox, KanbanSquare, type LucideIcon, Users } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";

export interface NavItem {
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

export const HOME_BY_ROLE: Record<UserRole, string> = {
  manager: ROUTES.managerLeads,
  broker: ROUTES.brokerLeads,
};
