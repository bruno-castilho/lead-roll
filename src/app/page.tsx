"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HOME_BY_ROLE } from "@/components/layout/nav-items";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

/** Redireciona para o login ou para a página inicial do perfil conectado. */
export default function RootPage() {
  const { ready, currentUser } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(currentUser ? HOME_BY_ROLE[currentUser.role] : ROUTES.login);
  }, [ready, currentUser, router]);

  return null;
}
