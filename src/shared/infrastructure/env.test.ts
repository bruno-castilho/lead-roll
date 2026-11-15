import { afterEach, describe, expect, it, vi } from "vitest";
import { readSupabaseEnv, SupabaseConfigError } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("readSupabaseEnv", () => {
  it("lê a URL e a chave pública", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "chave");
    expect(readSupabaseEnv()).toEqual({
      url: "https://x.supabase.co",
      publishableKey: "chave",
    });
  });

  it.each([
    ["", "chave"],
    ["https://x.supabase.co", ""],
  ])("falta uma variável (%j, %j)", (url, key) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
    expect(() => readSupabaseEnv()).toThrow(SupabaseConfigError);
    expect(() => readSupabaseEnv()).toThrow(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
  });
});
