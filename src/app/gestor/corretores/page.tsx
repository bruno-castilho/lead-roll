import type { Metadata } from "next";
import { ManagerBrokersPage } from "@/screens/manager-brokers-screen";

export const metadata: Metadata = { title: "Corretores" };

export default function Page() {
  return <ManagerBrokersPage />;
}
