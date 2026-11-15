import { vi } from "vitest";

/**
 * Dublês de `sonner` e `next/navigation`, compartilhados entre o `vi.mock` de
 * cada arquivo de teste e as asserções:
 *
 *   vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);
 *   vi.mock("next/navigation", async () => (await import("@/test/app-mocks")).navigationMock);
 */
export const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

export const router = {
  replace: vi.fn(),
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const location = { pathname: "/" };

export const sonnerMock = { toast };

export const navigationMock = {
  useRouter: () => router,
  usePathname: () => location.pathname,
};
