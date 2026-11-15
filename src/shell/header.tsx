"use client";

import { Menu } from "lucide-react";
import { UserMenu } from "@/modules/auth";
import { PresenceCountdown } from "@/modules/brokers";
import { Button } from "@/shared/ui/primitives/button";
import { Brand } from "./brand";
import type { ShellRole } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  role: ShellRole;
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
        {/* Só na área do corretor: o PresenceProvider existe apenas nela.
            Durante a restauração da sessão, a área do gestor é renderizada
            oculta e o perfil já pode ser de corretor; sem este teste o
            PresenceCountdown pediria um provider que não existe. */}
        {role === "broker" && (
          <>
            <PresenceCountdown compact className="sm:hidden" />
            <PresenceCountdown className="hidden sm:inline-flex" />
          </>
        )}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
