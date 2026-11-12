import type { Metadata } from "next";
import { ManagerLeadsPage } from "@/components/pages/manager-leads-page";

export const metadata: Metadata = { title: "Leads" };

export default function Page() {
  return <ManagerLeadsPage />;
}
