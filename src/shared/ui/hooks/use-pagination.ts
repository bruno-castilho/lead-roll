"use client";

import { useState } from "react";
import { PAGE_SIZES } from "@/shared/ui/components/pagination";

/**
 * Paginação no cliente. A página fica dentro do intervalo quando a lista
 * encolhe, e trocar o tamanho volta para a primeira página.
 */
export function usePagination<T>(items: readonly T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    page: currentPage,
    pageSize,
    pageItems,
    total: items.length,
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    resetPage: () => setPage(1),
  };
}
