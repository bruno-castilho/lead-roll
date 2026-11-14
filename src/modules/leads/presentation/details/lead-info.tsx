import {
  CalendarClock,
  CalendarPlus,
  type LucideIcon,
  Mail,
  Phone,
  Tag,
  Target,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/ui/format";
import type { Lead } from "../../domain/lead";
import { phoneDigits } from "../../domain/phone";
import { INTEREST_LABEL, SOURCE_LABEL } from "../lead-labels";

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <dt className="w-28 shrink-0 text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium text-sm">
        {children}
      </dd>
    </div>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <span className="font-normal text-muted-foreground">{children}</span>;
}

/** Seção "Informações" dos detalhes: contato, origem, interesse e datas. */
export function LeadInfo({
  lead,
  brokerName,
}: {
  lead: Lead;
  brokerName: string | undefined;
}) {
  return (
    <section>
      <h3 className="mb-1 font-semibold text-base">Informações</h3>
      <dl className="divide-y">
        <InfoRow icon={Phone} label="Telefone">
          <a
            href={`tel:+55${phoneDigits(lead.phone)}`}
            className="hover:text-primary hover:underline"
          >
            {lead.phone}
          </a>
        </InfoRow>
        <InfoRow icon={Mail} label="E-mail">
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="hover:text-primary hover:underline"
            >
              {lead.email}
            </a>
          ) : (
            <Missing>Não informado</Missing>
          )}
        </InfoRow>
        <InfoRow icon={Tag} label="Origem">
          {SOURCE_LABEL[lead.source]}
        </InfoRow>
        <InfoRow icon={Target} label="Interesse">
          {INTEREST_LABEL[lead.interest]}
        </InfoRow>
        <InfoRow icon={UserRound} label="Responsável">
          {brokerName ?? <Missing>Sem responsável</Missing>}
        </InfoRow>
        <InfoRow icon={CalendarClock} label="Atribuição">
          {formatDateTime(lead.assignedAt)}
        </InfoRow>
        <InfoRow icon={CalendarPlus} label="Cadastro">
          {formatDateTime(lead.createdAt)}
        </InfoRow>
      </dl>
    </section>
  );
}
