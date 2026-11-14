"use client";

import { useContext } from "react";
import { SessionContext } from "./session-provider";

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession deve ser usado dentro de SessionProvider.");
  }
  return ctx;
}
