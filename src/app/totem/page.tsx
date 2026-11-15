import type { Metadata } from "next";
import { KioskScreen } from "@/screens/kiosk-screen";

export const metadata: Metadata = { title: "Presença" };

export default function Page() {
  return <KioskScreen />;
}
