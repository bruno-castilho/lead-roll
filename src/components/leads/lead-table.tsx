"use client";

import { Fragment } from "react";
import { StageBadge } from "@/components/shared/stage-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INTEREST_LABEL, SOURCE_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { BrokerCell } from "./broker-cell";
import { type LeadActionHandlers, LeadRowActions } from "./lead-row-actions";

interface LeadTableProps extends LeadActionHandlers {
  leads: Lead[];
}

/** Tabela de leads do gestor (desktop) + listagem compacta em cards (mobile). */
export function LeadTable({ leads, ...handlers }: LeadTableProps) {
  const { getUser } = useAppStore();

  return (
    <Fragment>
      {/* Desktop / tablet */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden xl:table-cell">Origem</TableHead>
              <TableHead className="hidden lg:table-cell">Interesse</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="hidden lg:table-cell">Atribuição</TableHead>
              <TableHead className="w-12 pr-4 text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => handlers.onView(lead)}
              >
                <TableCell className="max-w-56 pl-4">
                  <p className="truncate font-medium">{lead.name}</p>
                  <p className="text-muted-foreground text-xs">
                    Cadastro {formatDate(lead.createdAt)}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                  {lead.phone}
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {SOURCE_LABEL[lead.source]}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {INTEREST_LABEL[lead.interest]}
                </TableCell>
                <TableCell>
                  <StageBadge stage={lead.stage} />
                </TableCell>
                <TableCell className="max-w-44">
                  <BrokerCell broker={getUser(lead.brokerId)} />
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground text-xs lg:table-cell">
                  {formatDateTime(lead.assignedAt)}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <LeadRowActions lead={lead} {...handlers} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="space-y-2 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            {/* biome-ignore lint/a11y/useSemanticElements: o card contém um menu de ações (botão aninhado) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handlers.onView(lead)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlers.onView(lead);
                }
              }}
              className="rounded-xl border bg-card p-3.5 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{lead.name}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {lead.phone}
                  </p>
                </div>
                <div className="-mt-1 -mr-1.5">
                  <LeadRowActions lead={lead} {...handlers} />
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={lead.stage} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                  {SOURCE_LABEL[lead.source]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                  {INTEREST_LABEL[lead.interest]}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
                <BrokerCell broker={getUser(lead.brokerId)} />
                <span className="shrink-0 text-muted-foreground text-xs">
                  {lead.assignedAt ? formatDate(lead.assignedAt) : "—"}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Fragment>
  );
}
