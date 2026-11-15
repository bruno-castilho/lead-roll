import type { ReactNode } from "react";
import { SessionProvider } from "@/modules/auth";
import { PresenceProvider } from "@/modules/brokers";
import { TooltipProvider } from "@/shared/ui/primitives/tooltip";

/** Provedores que as telas (`src/screens/`) recebem do layout do app. */
export function ScreenProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PresenceProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </PresenceProvider>
    </SessionProvider>
  );
}
