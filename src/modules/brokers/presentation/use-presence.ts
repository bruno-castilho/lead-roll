"use client";

import { useContext } from "react";
import { PresenceContext } from "./presence-provider";

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence deve ser usado dentro de PresenceProvider.");
  }
  return ctx;
}
