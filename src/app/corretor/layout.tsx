import { RoleGuard } from "@/modules/auth";
import { PresenceProvider } from "@/modules/brokers";
import { AppShell } from "@/shell/app-shell";

export default function BrokerLayout({ children }: LayoutProps<"/corretor">) {
  return (
    <PresenceProvider>
      <RoleGuard allow="broker">
        <AppShell userRole="broker">{children}</AppShell>
      </RoleGuard>
    </PresenceProvider>
  );
}
