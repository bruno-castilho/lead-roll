import type { Metadata } from "next";
import { BrokerLeadsPage } from "@/components/pages/broker-leads-page";

export const metadata: Metadata = { title: "Meus leads" };

export default function Page() {
  return <BrokerLeadsPage />;
}
