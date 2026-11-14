import { CheckCheck, Inbox, Plus, SearchX } from "lucide-react";
import { EmptyState } from "@/shared/ui/components/empty-state";
import { Button } from "@/shared/ui/primitives/button";

/** Por que a lista do gestor está vazia. */
export type EmptyLeadListReason = "no_leads" | "all_assigned" | "no_results";

interface LeadListEmptyProps {
  reason: EmptyLeadListReason;
  onCreate: () => void;
  onClearFilters: () => void;
}

export function LeadListEmpty({
  reason,
  onCreate,
  onClearFilters,
}: LeadListEmptyProps) {
  return (
    <div className="rounded-xl border border-dashed">
      {reason === "no_leads" ? (
        <EmptyState
          icon={Inbox}
          title="Nenhum lead cadastrado"
          description="Cadastre o primeiro lead para começar a distribuir oportunidades entre os corretores."
          action={
            <Button size="lg" onClick={onCreate}>
              <Plus /> Novo lead
            </Button>
          }
        />
      ) : reason === "all_assigned" ? (
        <EmptyState
          icon={CheckCheck}
          title="Nenhum lead sem responsável"
          description="Todos os leads já foram distribuídos entre os corretores."
          action={
            <Button variant="outline" size="lg" onClick={onCreate}>
              <Plus /> Novo lead
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Nenhum lead encontrado"
          description="Nenhum lead corresponde à pesquisa e aos filtros aplicados."
          action={
            <Button variant="outline" size="lg" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          }
        />
      )}
    </div>
  );
}
