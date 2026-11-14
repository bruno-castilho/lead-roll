"use client";

import { Plus, Shuffle } from "lucide-react";
import { cn } from "@/shared/ui/cn";
import { Kbd } from "@/shared/ui/components/kbd";
import { Button } from "@/shared/ui/primitives/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/primitives/tooltip";

interface LeadsHeaderActionsProps {
  unassigned: number;
  onDistribute: () => void;
  onCreate: () => void;
}

/** "Distribuir leads" (com o total pendente) e "Novo lead" (atalho N). */
export function LeadsHeaderActions({
  unassigned,
  onDistribute,
  onCreate,
}: LeadsHeaderActionsProps) {
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="h-9 flex-1 sm:flex-none"
        onClick={onDistribute}
      >
        <Shuffle />
        Distribuir leads
        <span
          className={cn(
            "rounded-full px-1.5 font-semibold text-[11px] tabular-nums",
            unassigned > 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {unassigned}
        </span>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className="h-9 flex-1 sm:flex-none"
            onClick={onCreate}
          >
            <Plus />
            Novo lead
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Atalho{" "}
          <Kbd className="ml-1 border-transparent bg-background/20 text-inherit">
            N
          </Kbd>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
