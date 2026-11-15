// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Broker } from "@/modules/brokers";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, lead, leadRow, MANAGER } from "@/test/fixtures";
import { renderSignedIn } from "@/test/signed-in";
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

function broker(id: string, isPresent: boolean): Broker {
  return { id, name: id, email: `${id}@x.com`, isPresent };
}

beforeEach(() => {
  supabaseFake.reset();
  arrangeSession(MANAGER);
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
