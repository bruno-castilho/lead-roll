"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

interface SidebarNavProps {
  role: UserRole;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({
  role,
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Navegação principal">
      {NAV_ITEMS[role].map((item) => {
        const active = pathname === item.href;
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-10 items-center gap-2.5 rounded-lg px-2.5 font-medium text-sm transition-colors md:h-9",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon
              className={cn("size-4 shrink-0", active && "text-primary")}
              aria-hidden
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {collapsed && <span className="sr-only">{item.label}</span>}
          </Link>
        );

        if (!collapsed) return link;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="font-semibold text-[17px] tracking-tight">
      {collapsed ? (
        <>
          L<span className="text-primary">R</span>
        </>
      ) : (
        <>
          Lead<span className="text-primary">Roll</span>
        </>
      )}
    </span>
  );
}

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Menu lateral fixo (desktop). No mobile, o mesmo conteúdo é exibido em um Sheet. */
export function Sidebar({ role, collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Brand collapsed={collapsed} />
      </div>
      <div className={cn("flex-1 overflow-y-auto p-3", collapsed && "px-2")}>
        {!collapsed && (
          <p className="mb-2 px-2.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
            {role === "manager" ? "Gestão" : "Atendimento"}
          </p>
        )}
        <SidebarNav role={role} collapsed={collapsed} />
      </div>
      <div
        className={cn("border-t p-3", collapsed && "flex justify-center px-2")}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon-lg" : "lg"}
              onClick={onToggleCollapsed}
              className={cn(
                "text-muted-foreground",
                !collapsed && "w-full justify-start",
              )}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              {!collapsed && "Recolher menu"}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Expandir menu</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
