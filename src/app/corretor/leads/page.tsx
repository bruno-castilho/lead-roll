import type { Metadata } from "next";
import { BrokerLeadsPage } from "@/screens/broker-leads-screen";

export const metadata: Metadata = { title: "Meus leads" };

export default function Page() {
  return <BrokerLeadsPage />;
}
