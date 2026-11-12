"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { useHotkey } from "@/hooks/use-hotkey";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Campo de pesquisa com atalho Ctrl/Cmd + K para foco. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar…",
  className,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkey(
    "k",
    () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
    { mod: true },
  );

  return (
    <div className={cn("relative", className)}>
      <Search
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 pr-16 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Limpar pesquisa"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
        )}
      </div>
    </div>
  );
}
