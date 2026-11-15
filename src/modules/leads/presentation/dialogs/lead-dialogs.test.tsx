// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Broker } from "@/modules/brokers";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, leadRow, MANAGER } from "@/test/fixtures";
import { renderSignedIn } from "@/test/signed-in";
import type { Lead } from "../../domain/lead";
import { LeadForm } from "../form/lead-form";
import { DeleteLeadDialog } from "./delete-lead-dialog";
import { DistributionDialog } from "./distribution-dialog";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function lead(id: string, overrides: Partial<Lead> = {}): Lead {
  return {
    id,
    name: `Lead ${id}`,
    phone: "(11) 98765-4321",
    email: null,
    source: "site",
    interest: "buy",
    stage: "new",
    brokerId: null,
    createdAt: "2026-11-01T10:00:00Z",
    assignedAt: null,
    observations: [],
    ...overrides,
  };
}

function broker(id: string, isPresent: boolean): Broker {
  return { id, name: id, email: `${id}@x.com`, isPresent };
}

beforeEach(() => {
  supabaseFake.reset();
  arrangeSession(MANAGER);
});

describe("DeleteLeadDialog", () => {
  it("exclui, avisa e fecha", async () => {
    const onDeleted = vi.fn();
    const onOpenChange = vi.fn();
    supabaseFake.respondWith({ data: [{ id: "a" }] });
    await renderSignedIn(
      <DeleteLeadDialog
        lead={lead("a", { name: "Ana Souza" })}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />,
    );
    expect(screen.getByText("Excluir lead?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onDeleted).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Lead excluído com sucesso", {
      description: "Ana Souza",
    });
  });

  it("falha: avisa e continua aberto", async () => {
    const onOpenChange = vi.fn();
    supabaseFake.respondWith({ data: [] });
    await renderSignedIn(
      <DeleteLeadDialog lead={lead("a")} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O lead não foi encontrado. Ele pode já ter sido excluído.",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("DistributionDialog", () => {
  const leads = [
    lead("a"),
    lead("b"),
    lead("c", { brokerId: "b1", stage: "contacted" }),
  ];
  const brokers = [broker("b1", true), broker("b2", false)];

  async function renderDialog(
    props: Partial<Parameters<typeof DistributionDialog>[0]> = {},
  ) {
    const onOpenChange = vi.fn();
    const onDistributed = vi.fn();
    await renderSignedIn(
      <DistributionDialog
        open
        onOpenChange={onOpenChange}
        leads={leads}
        brokers={brokers}
        onDistributed={onDistributed}
        {...props}
      />,
    );
    return { onOpenChange, onDistributed };
  }

  it("mostra as contagens do cliente", async () => {
    await renderDialog();
    expect(screen.getByText("leads aguardando distribuição")).toBeTruthy();
    expect(screen.getByText("corretor disponível")).toBeTruthy();
    expect(
      screen.getByText(
        "1 corretor ausente não participará desta distribuição.",
      ),
    ).toBeTruthy();
  });

  it("sem leads pendentes, só permite fechar", async () => {
    await renderDialog({ leads: [leads[2]] });
    expect(screen.getByText("Nenhum lead sem responsável")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeTruthy();
    expect(screen.queryByText("Confirmar distribuição")).toBeNull();
  });

  it("sem corretores presentes, aponta para a página de corretores", async () => {
    await renderDialog({ brokers: [broker("b2", false)] });
    expect(screen.getByText("Nenhum corretor disponível")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Ver corretores/ }).getAttribute("href"),
    ).toBe("/gestor/corretores");
  });

  it("distribui pelo banco e resume o resultado", async () => {
    supabaseFake.respondWith({
      data: [
        leadRow({ id: "a", broker_id: "b1" }),
        leadRow({ id: "b", broker_id: "b2" }),
      ],
    });
    const { onOpenChange, onDistributed } = await renderDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar distribuição" }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(supabaseFake.queries[0]).toMatchObject({ rpc: "distribute_leads" });
    expect(onDistributed.mock.calls[0][0]).toHaveLength(2);
    expect(toast.success).toHaveBeenCalledWith(
      "Distribuição realizada com sucesso",
      { description: "2 leads distribuídos entre 2 corretores." },
    );
  });

  it("nada distribuído: avisa com toast informativo", async () => {
    supabaseFake.respondWith({ data: [] });
    const { onOpenChange } = await renderDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar distribuição" }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.info).toHaveBeenCalledWith("Nenhum lead foi distribuído", {
      description:
        "Não há leads sem responsável ou corretores presentes no momento.",
    });
  });

  it("falha: avisa e continua aberto", async () => {
    supabaseFake.respondWith({ status: 400, error: postgrestError("42501") });
    const { onOpenChange } = await renderDialog();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar distribuição" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Apenas o gestor pode distribuir leads.",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("LeadForm", () => {
  it("cadastro vazio: mostra os erros e não grava", async () => {
    await renderSignedIn(<LeadForm open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Novo lead")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar lead" }));
    expect(toast.error).toHaveBeenCalledWith(
      "Verifique os campos do formulário",
      { description: "Informe o nome do lead." },
    );
    expect(screen.getByText("Informe o telefone.")).toBeTruthy();
    expect(screen.getByText("Selecione a origem.")).toBeTruthy();
    expect(supabaseFake.queries).toEqual([]);
  });

  it("aplica a máscara de telefone ao digitar", async () => {
    await renderSignedIn(<LeadForm open onOpenChange={vi.fn()} />);
    const phone = screen.getByLabelText(/Telefone/);
    fireEvent.change(phone, { target: { value: "11987654321" } });
    expect(phone).toHaveProperty("value", "(11) 98765-4321");
  });

  it("edição: grava os campos do formulário e fecha", async () => {
    const onUpdated = vi.fn();
    const onOpenChange = vi.fn();
    supabaseFake.respondWith({
      data: leadRow({ id: "a", name: "Ana Paula", email: null }),
    });
    await renderSignedIn(
      <LeadForm
        open
        onOpenChange={onOpenChange}
        lead={lead("a", { name: "Ana", email: "ana@x.com", source: "portal" })}
        onUpdated={onUpdated}
      />,
    );
    expect(screen.getByText("Editar lead")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: "  Ana Paula  " },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(supabaseFake.queries[0].calls.slice(0, 2)).toEqual([
      {
        method: "update",
        args: [
          {
            name: "Ana Paula",
            phone: "(11) 98765-4321",
            email: null,
            source: "portal",
            interest: "buy",
          },
        ],
      },
      { method: "eq", args: ["id", "a"] },
    ]);
    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a", name: "Ana Paula" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Lead atualizado com sucesso", {
      description: "Ana Paula",
    });
  });

  it("edição recusada: avisa e continua aberto", async () => {
    const onOpenChange = vi.fn();
    supabaseFake.respondWith({
      status: 406,
      error: postgrestError("PGRST116"),
    });
    await renderSignedIn(
      <LeadForm open onOpenChange={onOpenChange} lead={lead("a")} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "O lead não foi encontrado. Ele pode ter sido excluído.",
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
