import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/ui/routes";

export default function BrokerIndex() {
  redirect(ROUTES.brokerLeads);
}
