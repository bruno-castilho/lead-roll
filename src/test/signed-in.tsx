import { render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { expect } from "vitest";
import { SessionProvider, useSession } from "@/modules/auth";
import { supabaseFake } from "./fake-supabase";

function WhenReady({ children }: { children: ReactNode }) {
  const { ready, profile } = useSession();
  return ready && profile ? (
    <div data-testid="signed-in">{children}</div>
  ) : null;
}

/**
 * Wrapper de teste: restaura a sessão preparada com `arrangeSession(perfil)`
 * e só renderiza o conteúdo com o usuário conectado.
 */
export function SignedIn({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WhenReady>{children}</WhenReady>
    </SessionProvider>
  );
}

/**
 * `render` com o usuário de `arrangeSession` já conectado. As consultas da
 * restauração da sessão são esquecidas: o teste vê só as dele.
 */
export async function renderSignedIn(ui: ReactElement) {
  const view = render(ui, { wrapper: SignedIn });
  await screen.findByTestId("signed-in");
  supabaseFake.forgetQueries();
  return view;
}

/** `renderHook` com o usuário de `arrangeSession` já conectado. */
export async function renderHookSignedIn<T>(hook: () => T) {
  const view = renderHook(hook, { wrapper: SignedIn });
  await waitFor(() => expect(view.result.current ?? null).not.toBeNull());
  supabaseFake.forgetQueries();
  return view;
}
