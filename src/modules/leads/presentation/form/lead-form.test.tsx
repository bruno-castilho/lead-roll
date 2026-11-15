// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/app-mocks";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, lead, leadRow, MANAGER } from "@/test/fixtures";
import { renderSignedIn } from "@/test/signed-in";
import { LeadForm } from "./lead-form";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

beforeEach(() => {
  supabaseFake.reset();
  arrangeSession(MANAGER);
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
