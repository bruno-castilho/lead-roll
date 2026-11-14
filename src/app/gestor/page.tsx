import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/ui/routes";

export default function ManagerIndex() {
  redirect(ROUTES.managerLeads);
}
