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
import { useState } from "react";
import type { Broker } from "@/modules/brokers";
import { formatDateTime } from "@/shared/ui/format";
import { Button } from "@/shared/ui/primitives/button";
import { Separator } from "@/shared/ui/primitives/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/primitives/sheet";
import { isUnassigned, type Lead, type LeadStage } from "../../domain/lead";
import { phoneDigits } from "../../domain/phone";
import { ObservationForm } from "../observations/observation-form";
import { ObservationList } from "../observations/observation-list";
import { StageBadge } from "../stage-badge";
import { UnassignedBadge } from "../unassigned-badge";
import { LeadInfo } from "./lead-info";
import { StageSelect } from "./stage-select";

interface LeadDetailsProps {
  leads: Lead[];
  brokers: Broker[];
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Editar e excluir (o gestor); sem eles, os botões não aparecem. */
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  /** Só o corretor responsável muda a etapa. */
  onStageChange?: (lead: Lead, stage: LeadStage) => void;
  /**
   * Só o corretor responsável registra observações; sem ele, o formulário
   * não aparece. Devolve `true` se o banco registrou.
   */
  onAddObservation?: (lead: Lead, content: string) => Promise<boolean>;
}

export function LeadDetails({
  leads,
  brokers,
  leadId,
  onOpenChange,
  onEdit,
  onDelete,
  onStageChange,
  onAddObservation,
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
                {isUnassigned(lead) && <UnassignedBadge />}
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
                {onEdit && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => onEdit(lead)}
                  >
                    <Pencil /> Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => onDelete(lead)}
                  >
                    <Trash2 /> Excluir
                  </Button>
                )}
              </div>

              {onStageChange && (
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

              <LeadInfo lead={lead} brokerName={broker?.name} />

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
                {onAddObservation && (
                  <ObservationForm
                    key={lead.id}
                    onSubmit={(content) => onAddObservation(lead, content)}
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
