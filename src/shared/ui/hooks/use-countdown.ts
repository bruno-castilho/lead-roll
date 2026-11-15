"use client";

import { useEffect, useState } from "react";

/**
 * Milissegundos que faltam até `until`, atualizados a cada segundo; `null`
 * sem prazo ou antes do primeiro efeito (o relógio só é lido em efeitos, para
 * não quebrar o prerender). Para de contar ao chegar a zero.
 */
export function useCountdown(until: string | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!until) {
      setRemaining(null);
      return;
    }
    const deadline = Date.parse(until);
    let timer = 0;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0) return;
      // Acorda na virada do próximo segundo do contador.
      timer = window.setTimeout(tick, left % 1000 || 1000);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [until]);

  return remaining;
}
