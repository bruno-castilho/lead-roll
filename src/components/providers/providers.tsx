"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStoreProvider } from "@/store/app-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppStoreProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </AppStoreProvider>
    </ThemeProvider>
  );
}
