"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/modules/auth";
import { HOME_BY_ROLE, ROUTES } from "@/shared/ui/routes";

/** Redireciona para o login ou para a página inicial do perfil conectado. */
export default function RootPage() {
  const { ready, profile } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? HOME_BY_ROLE[profile.role] : ROUTES.login);
  }, [ready, profile, router]);

  return null;
}
