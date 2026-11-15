import { describe, expect, it } from "vitest";
import { HOME_BY_ROLE, loginPath, ROUTES, readReturnPath } from "./routes";

describe("rotas", () => {
  it("caminhos das páginas", () => {
    expect(ROUTES).toEqual({
      login: "/login",
      managerLeads: "/gestor/leads",
      managerBrokers: "/gestor/corretores",
      brokerLeads: "/corretor/leads",
      brokerPresence: "/corretor/presenca",
      kiosk: "/totem",
    });
  });

  it("página inicial de cada perfil", () => {
    expect(HOME_BY_ROLE).toEqual({
      manager: "/gestor/leads",
      broker: "/corretor/leads",
      kiosk: "/totem",
    });
  });
});

describe("loginPath", () => {
  it("guarda o caminho interno para voltar depois do login", () => {
    expect(loginPath("/corretor/presenca?token=abc")).toBe(
      "/login?next=%2Fcorretor%2Fpresenca%3Ftoken%3Dabc",
    );
  });

  it("sem destino útil ou seguro, é só o login", () => {
    expect(loginPath("/")).toBe("/login");
    expect(loginPath("/login?next=/x")).toBe("/login");
    expect(loginPath("//evil.com")).toBe("/login");
    expect(loginPath("https://evil.com")).toBe("/login");
  });
});

describe("readReturnPath", () => {
  it("lê o destino gravado por loginPath", () => {
    const search = loginPath("/corretor/presenca?token=abc").split("?")[1];
    expect(readReturnPath(`?${search}`)).toBe("/corretor/presenca?token=abc");
  });

  it.each([
    ["", null],
    ["?next=", null],
    ["?next=https://evil.com", null],
    ["?next=//evil.com", null],
    ["?next=/%5Cevil.com", null],
    ["?next=/login", null],
    ["?next=/gestor/leads", "/gestor/leads"],
  ])("%s → %s", (search, expected) => {
    expect(readReturnPath(search)).toBe(expected);
  });
});
