"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * O Next.js preserva o estado das páginas ao navegar (React Activity).
 * Executa `reset` quando a página é ocultada, para limpar estados transitórios
 * (diálogos abertos, indicadores de envio etc.).
 */
export function useResetOnHide(reset: () => void) {
  const resetRef = useRef(reset);
  useLayoutEffect(() => {
    resetRef.current = reset;
  });
  useLayoutEffect(() => () => resetRef.current(), []);
}
