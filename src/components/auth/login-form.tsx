"use client";

import { AlertCircle, Eye, EyeOff, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { HOME_BY_ROLE } from "@/components/layout/nav-items";
import { Spinner } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_PASSWORD, MOCK_USERS } from "@/data/mock";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { fieldErrors, loginSchema } from "@/lib/validation";
import { useAppStore } from "@/store/app-store";

export function LoginForm() {
  const { ready, currentUser, login } = useAppStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoAccount, setDemoAccount] = useState<string>("");

  useResetOnHide(() => {
    setSubmitting(false);
    setPassword("");
    setAuthError(null);
    setErrors({});
    setDemoAccount("");
  });

  // Usuário já conectado não precisa ver o login.
  useEffect(() => {
    if (ready && currentUser) router.replace(HOME_BY_ROLE[currentUser.role]);
  }, [ready, currentUser, router]);

  function handleDemoSelect(userId: string) {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return;
    setDemoAccount(userId);
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setAuthError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    const result = login(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      setSubmitting(false);
      setAuthError(result.error);
      return;
    }
    router.replace(HOME_BY_ROLE[result.user.role]);
  }

  const managers = MOCK_USERS.filter((u) => u.role === "manager");
  const brokers = MOCK_USERS.filter((u) => u.role === "broker");

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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-10"
              autoFocus
            />
            {errors.email && (
              <p id="email-error" className="text-destructive text-xs">
                {errors.email}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className="h-10 pr-10"
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
                {errors.password}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={submitting}
          >
            {submitting ? <Spinner /> : <LogIn />}
            Entrar
          </Button>
        </form>
      </div>

      <div className="mt-5 rounded-xl border border-dashed p-4">
        <div className="mb-2.5 flex items-center gap-2 text-muted-foreground text-xs">
          <UserRound className="size-3.5" aria-hidden />
          Contas de demonstração · senha {DEMO_PASSWORD}
        </div>
        <Select value={demoAccount} onValueChange={handleDemoSelect}>
          <SelectTrigger
            className="h-9 w-full"
            aria-label="Selecionar conta de demonstração"
          >
            <SelectValue placeholder="Preencher com uma conta de demonstração" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Gestor</SelectLabel>
              {managers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.email}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Corretores</SelectLabel>
              {brokers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.email}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
