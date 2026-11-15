// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, lead, MANAGER } from "@/test/fixtures";
import { renderSignedIn } from "@/test/signed-in";
import { DeleteLeadDialog } from "./delete-lead-dialog";

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
