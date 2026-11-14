import { useContext } from "react";
import { PresenceContext } from "@/contexts/presence";

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence deve ser usado dentro de PresenceProvider.");
  }
  return ctx;
}
