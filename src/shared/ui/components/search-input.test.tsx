// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SearchInput } from "./search-input";

function Controlled({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <SearchInput value={value} onChange={setValue} placeholder="Buscar" />;
}

const input = () => screen.getByRole("searchbox", { name: "Buscar" });

describe("SearchInput", () => {
  it("mostra o atalho sem texto e o botão de limpar com texto", () => {
    render(<Controlled />);
    expect(screen.getByText("Ctrl K")).toBeTruthy();
    fireEvent.change(input(), { target: { value: "ana" } });
    expect(screen.queryByText("Ctrl K")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
    expect(input()).toHaveProperty("value", "");
  });

  it("Esc limpa a pesquisa", () => {
    render(<Controlled initial="ana" />);
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(input()).toHaveProperty("value", "");
  });

  it("Ctrl/Cmd + K foca o campo", () => {
    render(<Controlled />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(document.activeElement).toBe(input());
  });
});
