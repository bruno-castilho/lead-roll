import type { Metadata } from "next";
import { ManagerBrokersPage } from "@/components/pages/manager-brokers-page";

export const metadata: Metadata = { title: "Corretores" };

export default function Page() {
  return <ManagerBrokersPage />;
}
