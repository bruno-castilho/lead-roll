"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES } from "@/lib/constants";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 text-muted-foreground text-sm sm:flex-row">
      <div className="flex items-center gap-2">
        <span className="text-[13px]">Por página</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger
            size="sm"
            className="w-[72px]"
            aria-label="Registros por página"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] tabular-nums">
          {from}–{to} de {total}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            aria-label="Próxima página"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
