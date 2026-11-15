"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import type { UserRole } from "@/shared/domain/actor";
import { LoadingState } from "@/shared/ui/components/loading-state";
import { HOME_BY_ROLE, loginPath } from "@/shared/ui/routes";
import { useSession } from "./use-session";

/**
 * Protege as áreas do gestor e do corretor (a segurança real fica no RLS).
 * Sem sessão → /login, voltando depois para a página pedida (o link do QR code
 * de presença aberto num celular). Quem acabou de sair vai para o login sem
 * destino. Perfil diferente → página inicial do próprio perfil.
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
  const hadProfile = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (profile) hadProfile.current = true;
    if (!profile) {
      const { pathname, search } = window.location;
      router.replace(loginPath(hadProfile.current ? "/" : pathname + search));
    } else if (profile.role !== role) {
      router.replace(HOME_BY_ROLE[profile.role]);
    }
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
      <div hidden={!allowed}>{renderContent && children}</div>
    </>
  );
}
