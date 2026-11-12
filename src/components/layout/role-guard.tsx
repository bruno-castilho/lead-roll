"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { LoadingState } from "@/components/shared/loading-state";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { AppShell } from "./app-shell";
import { HOME_BY_ROLE } from "./nav-items";

/**
 * Protege as áreas do gestor e do corretor (permissões simuladas no frontend).
 * Sem sessão → /login. Perfil diferente → página inicial do próprio perfil.
 */
export function RoleGuard({
  allow: role,
  children,
}: {
  allow: UserRole;
  children: ReactNode;
}) {
  const { ready, currentUser } = useAppStore();
  const router = useRouter();
  const allowed = ready && currentUser?.role === role;

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) router.replace(ROUTES.login);
    else if (currentUser.role !== role)
      router.replace(HOME_BY_ROLE[currentUser.role]);
  }, [ready, currentUser, role, router]);

  // Enquanto a sessão simulada é restaurada (inclusive na renderização do
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
