import { describe, expect, it } from "vitest";
import { BrokersError } from "../application/brokers-error";
import { brokersErrorMessage } from "./brokers-messages";

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";

describe("brokersErrorMessage", () => {
  it.each([
    ["listBrokers", "network", NETWORK],
    ["listBrokers", "auth", SESSION],
    [
      "listBrokers",
      "unknown",
      "Não foi possível carregar os corretores. Tente novamente.",
    ],
    ["loadPresence", "network", NETWORK],
    ["loadPresence", "auth", SESSION],
    [
      "loadPresence",
      "unknown",
      "Não foi possível carregar sua presença. Tente novamente.",
    ],
    ["confirmPresence", "network", NETWORK],
    ["confirmPresence", "auth", SESSION],
    [
      "confirmPresence",
      "forbidden",
      "Apenas corretores podem confirmar presença.",
    ],
    [
      "confirmPresence",
      "invalid_token",
      "Este QR code expirou. Escaneie o código que está na tela da empresa agora.",
    ],
    [
      "confirmPresence",
      "unknown",
      "Não foi possível confirmar sua presença. Tente novamente.",
    ],
    ["issuePresenceToken", "network", NETWORK],
    ["issuePresenceToken", "auth", SESSION],
    [
      "issuePresenceToken",
      "forbidden",
      "Apenas o totem pode gerar o QR code de presença.",
    ],
    [
      "issuePresenceToken",
      "unknown",
      "Não foi possível gerar o QR code de presença.",
    ],
  ] as const)("%s / %s", (operation, reason, message) => {
    expect(brokersErrorMessage(new BrokersError(operation, reason))).toBe(
      message,
    );
  });

  it("motivo sem texto próprio usa o texto genérico da operação", () => {
    expect(
      brokersErrorMessage(new BrokersError("listBrokers", "forbidden")),
    ).toBe("Não foi possível carregar os corretores. Tente novamente.");
  });

  it("erro que não é do módulo mostra a própria mensagem", () => {
    expect(brokersErrorMessage(new Error("falhou"))).toBe("falhou");
    expect(brokersErrorMessage("texto")).toBe("texto");
  });
});
