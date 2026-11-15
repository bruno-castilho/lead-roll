import { describe, expect, it } from "vitest";
import { PAGE_SIZES } from "./pagination";

describe("paginação", () => {
  it("tamanhos de página", () => {
    expect(PAGE_SIZES).toEqual([10, 20, 50]);
  });
});
