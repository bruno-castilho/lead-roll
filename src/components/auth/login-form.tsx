"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { HOME_BY_ROLE } from "@/components/layout/nav-items";
import { Spinner } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileError } from "@/errors/profile-error";
import { SignInError } from "@/errors/sign-in-error";
import { useSession } from "@/hooks/use-session";
import { type LoginSchemaType, loginSchema } from "@/lib/validation";
import { AuthService } from "@/services/auth-service";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { profile, onSession } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { isSubmitting, errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Já conectado (sessão restaurada ou login concluído): vai para a página
  // inicial do perfil. O papel vem da tabela `profiles`, não de `user.role`.
  useEffect(() => {
    if (profile) router.replace(HOME_BY_ROLE[profile.role]);
  }, [profile, router]);

  async function onSubmit({ email, password }: LoginSchemaType) {
    try {
      setAuthError(null);
      const { user, session } = await AuthService.signIn({ email, password });
      const profile = await AuthService.getProfile(user.id);
      reset();
      onSession(user, session, profile);
    } catch (error) {
      // Sem perfil válido não há acesso: não deixa a sessão aberta.
      if (error instanceof ProfileError) {
        await AuthService.signOut().catch(() => {});
      }
      setAuthError(
        error instanceof SignInError || error instanceof ProfileError
          ? error.message
          : "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.",
      );
      setFocus("password");
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 space-y-1.5 text-center">
        <h1 className="font-semibold text-2xl tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-muted-foreground text-sm">
          Entre para gerenciar e acompanhar seus leads.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <fieldset disabled={isSubmitting} className="space-y-4">
            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@empresa.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-10"
                autoFocus
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className="h-10 pr-10"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  className="-translate-y-1/2 absolute top-1/2 right-1 text-muted-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-destructive text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? <Spinner /> : <LogIn />}
              Entrar
            </Button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
