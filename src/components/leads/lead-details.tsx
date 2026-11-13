"use client";

import {
  CalendarClock,
  CalendarPlus,
  Mail,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Phone,
  Tag,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { ObservationForm } from "@/components/observations/observation-form";
import { ObservationList } from "@/components/observations/observation-list";
import { StageBadge } from "@/components/shared/stage-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { INTEREST_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { formatDateTime, phoneDigits } from "@/lib/format";
import type { Lead, LeadStage, User } from "@/lib/types";
import { StageSelect } from "./stage-select";

interface LeadDetailsProps {
  leads: Lead[];
  brokers: User[];
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Gestor consulta e administra; corretor altera etapa e registra observações. */
  mode: "manager" | "broker";
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  /** Só o corretor responsável muda a etapa. */
  onStageChange?: (lead: Lead, stage: LeadStage) => void;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
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

export function LeadDetails({
  leads,
  brokers,
  leadId,
  onOpenChange,
  mode,
  onEdit,
  onDelete,
  onStageChange,
}: LeadDetailsProps) {
  // Busca o lead na lista recebida para refletir alterações em tempo real.
  const current = leadId ? leads.find((l) => l.id === leadId) : undefined;
  // Mantém o último lead exibido durante a animação de fechamento.
  const [lead, setLead] = useState<Lead | undefined>(current);
  if (current && current !== lead) setLead(current);
  const broker = brokers.find((b) => b.id === lead?.brokerId);

  return (
    <Sheet open={!!current} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {lead && (
          <>
            <SheetHeader className="space-y-2 border-b p-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <StageBadge stage={lead.stage} />
                {!lead.brokerId && (
                  <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-medium text-warning text-xs">
                    Sem responsável
                  </span>
                )}
              </div>
              <SheetTitle className="text-xl">{lead.name}</SheetTitle>
              <SheetDescription>
                Cadastrado em {formatDateTime(lead.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="lg" asChild>
                  <a
                    href={`https://wa.me/55${phoneDigits(lead.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
                {lead.email && (
                  <Button variant="outline" size="lg" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail /> Enviar e-mail
                    </a>
                  </Button>
                )}
                {mode === "manager" && onEdit && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onEdit(lead)}
                  >
                    <Pencil /> Editar
                  </Button>
                )}
                {mode === "manager" && onDelete && (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => onDelete(lead)}
                  >
                    <Trash2 /> Excluir
                  </Button>
                )}
              </div>

              {mode === "broker" && onStageChange && (
                <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
                  <label htmlFor="detail-stage" className="font-medium text-sm">
                    Etapa do atendimento
                  </label>
                  <StageSelect
                    id="detail-stage"
                    value={lead.stage}
                    onChange={(stage) => onStageChange(lead, stage)}
                    className="w-full bg-background"
                  />
                </div>
              )}

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
                      <span className="font-normal text-muted-foreground">
                        Não informado
                      </span>
                    )}
                  </InfoRow>
                  <InfoRow icon={Tag} label="Origem">
                    {SOURCE_LABEL[lead.source]}
                  </InfoRow>
                  <InfoRow icon={Target} label="Interesse">
                    {INTEREST_LABEL[lead.interest]}
                  </InfoRow>
                  <InfoRow icon={UserRound} label="Responsável">
                    {broker?.name ?? (
                      <span className="font-normal text-muted-foreground">
                        Sem responsável
                      </span>
                    )}
                  </InfoRow>
                  <InfoRow icon={CalendarClock} label="Atribuição">
                    {formatDateTime(lead.assignedAt)}
                  </InfoRow>
                  <InfoRow icon={CalendarPlus} label="Cadastro">
                    {formatDateTime(lead.createdAt)}
                  </InfoRow>
                </dl>
              </section>

              <Separator />

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquareText
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <h3 className="font-semibold text-base">Observações</h3>
                  <span className="rounded-full bg-muted px-1.5 text-muted-foreground text-xs tabular-nums">
                    {lead.observations.length}
                  </span>
                </div>
                {mode === "broker" && onStageChange && (
                  <ObservationForm
                    onSubmit={() => {
                      // Sem implementação.
                    }}
                  />
                )}
                <ObservationList observations={lead.observations} />
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
