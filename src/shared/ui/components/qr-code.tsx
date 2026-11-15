import { create } from "qrcode";
import { useMemo } from "react";
import { cn } from "@/shared/ui/cn";

/** Margem branca em módulos, como pede a especificação do QR code. */
const QUIET_ZONE = 4;

/**
 * Caminho SVG com um quadrado por módulo escuro do QR code de `value`.
 * Exportado para teste.
 */
export function qrCodePath(value: string): { size: number; path: string } {
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  const squares: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        squares.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
  }
  return { size: modules.size + QUIET_ZONE * 2, path: squares.join("") };
}

interface QrCodeProps {
  value: string;
  /** Descrição para leitores de tela. */
  label: string;
  className?: string;
}

/**
 * QR code em SVG. Fundo sempre branco e módulos pretos, também no modo
 * escuro: leitores de QR code esperam esse contraste.
 */
export function QrCode({ value, label, className }: QrCodeProps) {
  const { size, path } = useMemo(() => qrCodePath(value), [value]);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("rounded-xl bg-white", className)}
    >
      <path d={path} fill="#000" />
    </svg>
  );
}
