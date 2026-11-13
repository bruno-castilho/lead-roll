"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { useSession } from "@/hooks/use-session";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { AppShell } from "./app-shell";
import { HOME_BY_ROLE } from "./nav-items";

/**
 * Protege as áreas do gestor e do corretor (a segurança real fica no RLS).
 * Sem sessão → /login. Perfil diferente → página inicial do próprio perfil.
 */
export function RoleGuard({
  allow: role,
  children,
}: {
  allow: UserRole;
  children: ReactNode;
}) {
  const { ready, profile } = useSession();
  const router = useRouter();
  const allowed = ready && profile?.role === role;

  useEffect(() => {
    if (!ready) return;
    if (!profile) router.replace(ROUTES.login);
    else if (profile.role !== role) router.replace(HOME_BY_ROLE[profile.role]);
  }, [ready, profile, role, router]);

  // Enquanto a sessão é restaurada (inclusive na renderização do
  // servidor), a página é renderizada oculta: o Next.js precisa dela para
  // validar a navegação instantânea e o estado ainda não contém dados.
  // Com a sessão restaurada, só é exibida para o perfil permitido.
  const renderContent = !ready || allowed;

  return (
    <>
      {!allowed && (
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState />
        </div>
      )}
      <div hidden={!allowed}>
        {renderContent && <AppShell role={role}>{children}</AppShell>}
      </div>
    </>
  );
}
