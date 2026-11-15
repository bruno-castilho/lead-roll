import { RoleGuard } from "@/modules/auth";
import { AppShell } from "@/shell/app-shell";

export default function ManagerLayout({ children }: LayoutProps<"/gestor">) {
  return (
    <RoleGuard allow="manager">
      <AppShell userRole="manager">{children}</AppShell>
    </RoleGuard>
  );
}
