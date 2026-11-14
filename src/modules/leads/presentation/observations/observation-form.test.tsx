// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ObservationForm } from "./observation-form";

vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);

const textarea = () => screen.getByLabelText("Nova observação");
const addButton = () =>
  screen.getByRole("button", { name: "Adicionar observação" });

function type(value: string) {
  fireEvent.change(textarea(), { target: { value } });
}

describe("ObservationForm", () => {
  it("o botão só habilita com texto", () => {
    render(<ObservationForm onSubmit={vi.fn()} />);
    expect(addButton()).toHaveProperty("disabled", true);
    type("   ");
    expect(addButton()).toHaveProperty("disabled", true);
    type("Ligou");
    expect(addButton()).toHaveProperty("disabled", false);
  });

  it("Enter envia o texto aparado e limpa se o banco registrou", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<ObservationForm onSubmit={onSubmit} />);
    type("  Ligou  ");
    fireEvent.keyDown(textarea(), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Ligou");
    await waitFor(() => expect(textarea()).toHaveProperty("value", ""));
  });

  it("Shift + Enter não envia", () => {
    const onSubmit = vi.fn();
    render(<ObservationForm onSubmit={onSubmit} />);
    type("Ligou");
    fireEvent.keyDown(textarea(), { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("mantém o texto se o banco recusou", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<ObservationForm onSubmit={onSubmit} />);
    type("Ligou");
    fireEvent.click(addButton());
    await waitFor(() => expect(addButton()).toHaveProperty("disabled", false));
    expect(textarea()).toHaveProperty("value", "Ligou");
  });
});
