import { RoleGuard } from "@/components/layout/role-guard";

export default function BrokerLayout({ children }: LayoutProps<"/corretor">) {
  return <RoleGuard allow="broker">{children}</RoleGuard>;
}
