"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export function UserMenu() {
  const { currentUser, logout } = useAppStore();
  const router = useRouter();
  if (!currentUser) return null;

  function handleLogout() {
    router.replace(ROUTES.login);
    logout();
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
