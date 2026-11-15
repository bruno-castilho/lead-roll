import { Inbox, KanbanSquare, type LucideIcon, Users } from "lucide-react";
import type { UserRole } from "@/shared/domain/actor";
import { ROUTES } from "@/shared/ui/routes";

/** Perfis com menu e cabeçalho do app; o totem tem uma moldura própria. */
export type ShellRole = Exclude<UserRole, "kiosk">;

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<ShellRole, NavItem[]> = {
  manager: [
    { href: ROUTES.managerLeads, label: "Leads", icon: Inbox },
    { href: ROUTES.managerBrokers, label: "Corretores", icon: Users },
  ],
  broker: [
    { href: ROUTES.brokerLeads, label: "Meus leads", icon: KanbanSquare },
  ],
};
