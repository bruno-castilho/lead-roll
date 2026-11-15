import type { ReactNode } from "react";
import { UserMenu } from "@/modules/auth";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

/** Moldura do totem: sem menu de navegação, só a marca, o tema e a conta. */
export function KioskShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center gap-2 border-b px-4 sm:px-6">
        <Brand />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
