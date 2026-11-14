// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePagination } from "./use-pagination";

const items = Array.from({ length: 25 }, (_, i) => i + 1);

describe("usePagination", () => {
  it("começa na primeira página com 10 itens", () => {
    const { result } = renderHook(() => usePagination(items));
    expect(result.current).toMatchObject({ page: 1, pageSize: 10, total: 25 });
    expect(result.current.pageItems).toEqual(items.slice(0, 10));
  });

  it("navega, troca o tamanho (volta à 1) e reinicia", () => {
    const { result } = renderHook(() => usePagination(items));
    act(() => result.current.setPage(3));
    expect(result.current.pageItems).toEqual([21, 22, 23, 24, 25]);
    act(() => result.current.setPageSize(20));
    expect(result.current).toMatchObject({ page: 1, pageSize: 20 });
    act(() => result.current.setPage(2));
    act(() => result.current.resetPage());
    expect(result.current.page).toBe(1);
  });

  it("mantém a página no intervalo quando a lista encolhe", () => {
    const { result, rerender } = renderHook(({ list }) => usePagination(list), {
      initialProps: { list: items },
    });
    act(() => result.current.setPage(3));
    rerender({ list: items.slice(0, 12) });
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([11, 12]);
  });
});
