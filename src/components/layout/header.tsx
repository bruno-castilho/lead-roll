"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import { PresenceToggle } from "./presence-toggle";
import { Brand } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  role: UserRole;
  onOpenMobileMenu: () => void;
}

export function Header({ role, onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon-lg"
        className="lg:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menu"
      >
        <Menu />
      </Button>
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {role === "broker" && (
          <>
            <PresenceToggle compact className="sm:hidden" />
            <PresenceToggle className="hidden sm:flex" />
          </>
        )}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
