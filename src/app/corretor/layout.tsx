import { RoleGuard } from "@/components/layout/role-guard";
import { PresenceProvider } from "@/modules/brokers";

export default function BrokerLayout({ children }: LayoutProps<"/corretor">) {
  return (
    <PresenceProvider>
      <RoleGuard allow="broker">{children}</RoleGuard>
    </PresenceProvider>
  );
}
