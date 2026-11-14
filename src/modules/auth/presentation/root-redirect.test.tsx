// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { router } from "@/test/app-mocks";
import { supabaseFake } from "@/test/fake-supabase";
import { arrangeSession, BROKER, MANAGER } from "@/test/fixtures";
import { RootRedirect } from "./root-redirect";
import { SessionProvider } from "./session-provider";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});
vi.mock("sonner", async () => (await import("@/test/app-mocks")).sonnerMock);
vi.mock(
  "next/navigation",
  async () => (await import("@/test/app-mocks")).navigationMock,
);

beforeEach(() => supabaseFake.reset());

describe("RootRedirect (página /)", () => {
  it.each([
    ["sem sessão", null, "/login"],
    ["gestor", MANAGER, "/gestor/leads"],
    ["corretor", BROKER, "/corretor/leads"],
  ] as const)("%s → %s", async (_label, profile, target) => {
    arrangeSession(profile);
    render(
      <SessionProvider>
        <RootRedirect />
      </SessionProvider>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith(target));
    expect(router.replace).toHaveBeenCalledTimes(1);
  });
});
