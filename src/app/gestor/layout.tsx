import { RoleGuard } from "@/components/layout/role-guard";

export default function ManagerLayout({ children }: LayoutProps<"/gestor">) {
  return <RoleGuard allow="manager">{children}</RoleGuard>;
}
