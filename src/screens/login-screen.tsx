import { LoginForm } from "@/modules/auth";
import { Brand } from "@/shell/brand";
import { ThemeToggle } from "@/shell/theme-toggle";

/** Tela de login: marca, alternância de tema e formulário. */
export function LoginScreen() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Brand />
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-12 sm:items-center sm:pt-0">
        <LoginForm />
      </main>
    </div>
  );
}
