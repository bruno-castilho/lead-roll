import { describe, expect, it } from "vitest";
import { HOME_BY_ROLE, ROUTES } from "./routes";

describe("rotas", () => {
  it("caminhos das páginas", () => {
    expect(ROUTES).toEqual({
      login: "/login",
      managerLeads: "/gestor/leads",
      managerBrokers: "/gestor/corretores",
      brokerLeads: "/corretor/leads",
    });
  });

  it("página inicial de cada perfil", () => {
    expect(HOME_BY_ROLE).toEqual({
      manager: "/gestor/leads",
      broker: "/corretor/leads",
    });
  });
});
