import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <span className="font-semibold text-[17px] tracking-tight">
          Lead<span className="text-primary">Roll</span>
        </span>
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-12 sm:items-center sm:pt-0">
        <LoginForm />
      </main>
    </div>
  );
}
