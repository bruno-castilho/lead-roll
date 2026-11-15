import { describe, expect, it } from "vitest";
import { LeadsError } from "../application/leads-error";
import { leadsErrorMessage } from "./leads-messages";

const NETWORK =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const SESSION = "Sua sessão expirou. Entre novamente.";
const INVALID =
  "Os dados do lead são inválidos. Revise os campos e tente novamente.";

describe("leadsErrorMessage", () => {
  it.each([
    ["listLeads", "network", NETWORK],
    ["listLeads", "auth", SESSION],
    [
      "listLeads",
      "unknown",
      "Não foi possível carregar os leads. Tente novamente.",
    ],
    ["createLead", "forbidden", "Apenas o gestor pode cadastrar leads."],
    ["createLead", "invalid", INVALID],
    [
      "createLead",
      "unknown",
      "Não foi possível cadastrar o lead. Tente novamente.",
    ],
    ["updateLead", "forbidden", "Apenas o gestor pode editar leads."],
    [
      "updateLead",
      "not_found",
      "O lead não foi encontrado. Ele pode ter sido excluído.",
    ],
    ["updateLead", "invalid", INVALID],
    [
      "updateLead",
      "unknown",
      "Não foi possível salvar as alterações do lead. Tente novamente.",
    ],
    ["deleteLead", "forbidden", "Apenas o gestor pode excluir leads."],
    [
      "deleteLead",
      "not_found",
      "O lead não foi encontrado. Ele pode já ter sido excluído.",
    ],
    [
      "deleteLead",
      "unknown",
      "Não foi possível excluir o lead. Tente novamente.",
    ],
    [
      "changeStage",
      "forbidden",
      "Apenas o corretor responsável pode mudar a etapa deste lead.",
    ],
    [
      "changeStage",
      "not_found",
      "O lead não foi encontrado. Ele pode ter sido excluído ou atribuído a outro corretor.",
    ],
    ["changeStage", "invalid", "A etapa escolhida é inválida."],
    [
      "changeStage",
      "unknown",
      "Não foi possível mudar a etapa do lead. Tente novamente.",
    ],
    [
      "addObservation",
      "forbidden",
      "Apenas o corretor responsável pode registrar observações neste lead.",
    ],
    [
      "addObservation",
      "invalid",
      "A observação é inválida. Escreva de 1 a 1000 caracteres.",
    ],
    [
      "addObservation",
      "unknown",
      "Não foi possível adicionar a observação. Tente novamente.",
    ],
    ["distributeLeads", "forbidden", "Apenas o gestor pode distribuir leads."],
    ["distributeLeads", "network", NETWORK],
    [
      "distributeLeads",
      "unknown",
      "Não foi possível distribuir os leads. Tente novamente.",
    ],
  ] as const)("%s / %s", (operation, reason, message) => {
    expect(leadsErrorMessage(new LeadsError(operation, reason))).toBe(message);
  });

  it("erro que não é do módulo mostra a própria mensagem", () => {
    expect(leadsErrorMessage(new Error("falhou"))).toBe("falhou");
  });
});
