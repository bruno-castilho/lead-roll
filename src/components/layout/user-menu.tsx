"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { AuthService } from "@/services/auth-service";

export function UserMenu() {
  const { profile: currentUser, clearSession } = useSession();
  const router = useRouter();
  if (!currentUser) return null;

  async function handleLogout() {
    try {
      // Limpa o estado local na hora; o servidor é avisado em seguida.
      clearSession();
      router.replace(ROUTES.login);
      await AuthService.signOut();
      toast.success("Você saiu da conta.");
    } catch (error) {
      toast.warning(
        error instanceof Error ? error.message : "Não foi possível sair.",
      );
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-1.5 sm:pr-2.5"
          aria-label="Menu do usuário"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate font-medium text-sm md:inline">
            {currentUser.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium text-sm">{currentUser.name}</p>
          <p className="truncate text-muted-foreground text-xs">
            {currentUser.email}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {currentUser.role === "manager" ? "Gestor" : "Corretor"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
