import type { Metadata } from "next";
import { BrokerLeadsScreen } from "@/screens/broker-leads-screen";

export const metadata: Metadata = { title: "Meus leads" };

export default function Page() {
  return <BrokerLeadsScreen />;
}
