import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-semibold text-primary text-sm">404</p>
      <h1 className="font-semibold text-2xl tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground text-sm">
        O endereço acessado não existe no LeadRoll.
      </p>
      <Button asChild size="lg">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
