"use client";

import { type ReactNode, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Brand, Sidebar, SidebarNav } from "./sidebar";

interface AppShellProps {
  role: UserRole;
  children: ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[272px] gap-0 bg-sidebar p-0">
          <SheetHeader className="h-14 justify-center border-b px-4">
            <SheetTitle>
              <Brand />
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menu de navegação
            </SheetDescription>
          </SheetHeader>
          <div className="p-3">
            <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-[248px]",
        )}
      >
        <Header role={role} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
