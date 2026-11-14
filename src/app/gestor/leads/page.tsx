import type { Metadata } from "next";
import { ManagerLeadsPage } from "@/screens/manager-leads-screen";

export const metadata: Metadata = { title: "Leads" };

export default function Page() {
  return <ManagerLeadsPage />;
}
