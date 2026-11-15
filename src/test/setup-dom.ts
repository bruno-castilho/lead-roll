import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Só nos arquivos com `// @vitest-environment jsdom`.
if (typeof window !== "undefined") {
  afterEach(cleanup);

  // APIs do navegador que o jsdom não implementa e que o Radix, o next-themes
  // e o `useMediaQuery` usam.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
}
