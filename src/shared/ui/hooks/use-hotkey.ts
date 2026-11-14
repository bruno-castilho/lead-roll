"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

interface HotkeyOptions {
  /** Exige Ctrl (Windows/Linux) ou Cmd (macOS). */
  mod?: boolean;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Registra um atalho de teclado global.
 * Atalhos sem modificador são ignorados enquanto o usuário digita em campos
 * ou quando há um diálogo aberto.
 */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { mod = false, enabled = true }: HotkeyOptions = {},
) {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      // O autocompletar do navegador dispara `keydown` sem `key`.
      if (typeof event.key !== "string") return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      const hasMod = event.metaKey || event.ctrlKey;
      if (mod !== hasMod || event.altKey) return;
      if (!mod) {
        if (isTypingTarget(event.target)) return;
        if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      }
      event.preventDefault();
      handlerRef.current(event);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, mod, enabled]);
}
