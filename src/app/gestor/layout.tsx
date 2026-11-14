import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";

export default function ManagerLayout({ children }: LayoutProps<"/gestor">) {
  return (
    <RoleGuard allow="manager">
      <AppShell userRole="manager">{children}</AppShell>
    </RoleGuard>
  );
}
