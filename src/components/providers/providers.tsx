"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { SessionProvider } from "@/contexts/session";
import { Toaster } from "@/shared/ui/primitives/sonner";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
