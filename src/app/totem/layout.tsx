import { RoleGuard } from "@/modules/auth";
import { KioskShell } from "@/shell/kiosk-shell";

export default function KioskLayout({ children }: LayoutProps<"/totem">) {
  return (
    <RoleGuard allow="kiosk">
      <KioskShell>{children}</KioskShell>
    </RoleGuard>
  );
}
