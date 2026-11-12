import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function ManagerIndex() {
  redirect(ROUTES.managerLeads);
}
