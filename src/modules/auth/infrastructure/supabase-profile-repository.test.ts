import { beforeEach, describe, expect, it, vi } from "vitest";
import { failureOf } from "@/test/failure-of";
import { postgrestError, supabaseFake } from "@/test/fake-supabase";
import { AuthError } from "../application/auth-error";
import { supabaseProfileRepository } from "./supabase-profile-repository";

vi.mock("@/shared/infrastructure/supabase/client", async (importOriginal) => {
  const { supabaseFake } = await import("@/test/fake-supabase");
  return {
    ...(await importOriginal<object>()),
    getSupabaseClient: () => supabaseFake.getClient(),
  };
});

beforeEach(() => supabaseFake.reset());

describe("supabaseProfileRepository.findById", () => {
  const row = { id: "user-1", name: "Ana", email: "a@x.com", role: "broker" };

  it("busca o perfil em profiles", async () => {
    supabaseFake.respondWith({ data: row });
    await expect(supabaseProfileRepository.findById("user-1")).resolves.toEqual(
      row,
    );
    expect(supabaseFake.queries).toEqual([
      {
        table: "profiles",
        calls: [
          { method: "select", args: ["id, name, email, role"] },
          { method: "eq", args: ["id", "user-1"] },
          { method: "maybeSingle", args: [] },
        ],
      },
    ]);
  });

  it("sem linha: null", async () => {
    supabaseFake.respondWith({ data: null });
    await expect(
      supabaseProfileRepository.findById("user-1"),
    ).resolves.toBeNull();
  });

  it.each([
    [0, "XX000", "network"],
    [401, "XX000", "auth"],
    [200, "PGRST301", "auth"],
    [500, "XX000", "unknown"],
  ] as const)("status %i / %s → %s", async (status, code, reason) => {
    supabaseFake.respondWith({ status, error: postgrestError(code) });
    await expect(
      failureOf(AuthError, () => supabaseProfileRepository.findById("user-1")),
    ).resolves.toEqual({ operation: "loadProfile", reason });
  });
});
