import { RoleGuard } from "@/components/layout/role-guard";
import { PresenceProvider } from "@/contexts/presence";

export default function BrokerLayout({ children }: LayoutProps<"/corretor">) {
  return (
    <PresenceProvider>
      <RoleGuard allow="broker">{children}</RoleGuard>
    </PresenceProvider>
  );
}
