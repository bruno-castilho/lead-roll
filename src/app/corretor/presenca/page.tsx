import type { Metadata } from "next";
import { BrokerPresenceScreen } from "@/screens/broker-presence-screen";

export const metadata: Metadata = { title: "Confirmar presença" };

export default function Page() {
  return <BrokerPresenceScreen />;
}
