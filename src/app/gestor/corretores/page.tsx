import type { Metadata } from "next";
import { ManagerBrokersScreen } from "@/screens/manager-brokers-screen";

export const metadata: Metadata = { title: "Corretores" };

export default function Page() {
  return <ManagerBrokersScreen />;
}
