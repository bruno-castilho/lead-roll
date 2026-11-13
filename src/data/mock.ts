import type {
  Lead,
  LeadInterest,
  LeadSource,
  LeadStage,
  Observation,
  UserRole,
} from "@/lib/types";

/**
 * Dados de demonstração (inteiramente fictícios).
 * Substituir por chamadas a serviços reais em uma etapa futura.
 */

/**
 * Presença inicial de cada corretor (ainda local, não vai para o banco).
 * E-mail fora do mapa: corretor começa presente e gestor, ausente.
 */
const INITIAL_PRESENCE_BY_EMAIL: ReadonlyMap<string, boolean> = new Map([
  ["marcos@leadroll.demo", false],
]);

export function initialPresence(email: string, role: UserRole): boolean {
  return (
    INITIAL_PRESENCE_BY_EMAIL.get(email.toLowerCase()) ?? role === "broker"
  );
}

type Seed = {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  interest: LeadInterest;
  stage?: LeadStage;
  /** E-mail do corretor responsável (resolvido para o id do perfil). */
  brokerEmail?: string;
  /** Há quantas horas o lead foi cadastrado. */
  createdHoursAgo: number;
  /** Há quantas horas o lead foi atribuído (quando houver responsável). */
  assignedHoursAgo?: number;
  notes?: { content: string; hoursAgo: number }[];
};

const SEEDS: Seed[] = [
  // Atribuídos — Ana Martins
  {
    name: "Rafael Nogueira",
    phone: "(11) 98234-5610",
    email: "rafael.nogueira@exemplo.com",
    source: "portal",
    interest: "apartment",
    stage: "visit_scheduled",
    brokerEmail: "ana@leadroll.demo",
    createdHoursAgo: 240,
    assignedHoursAgo: 238,
    notes: [
      {
        content:
          "Primeiro contato feito por telefone. Busca 2 dormitórios na zona sul.",
        hoursAgo: 200,
      },
      {
        content:
          "Visita agendada para sábado às 10h no imóvel da Rua das Acácias.",
        hoursAgo: 30,
      },
    ],
  },
  {
    name: "Beatriz Lacerda",
    phone: "(11) 97456-1203",
    source: "instagram",
    interest: "rent",
    stage: "contacted",
    brokerEmail: "ana@leadroll.demo",
    createdHoursAgo: 120,
    assignedHoursAgo: 118,
    notes: [
      {
        content: "Respondeu pelo direct. Prefere contato após as 18h.",
        hoursAgo: 100,
      },
    ],
  },
  {
    name: "Gustavo Prado",
    phone: "(11) 3345-8821",
    email: "gustavo.prado@exemplo.com",
    source: "site",
    interest: "house",
    stage: "new",
    brokerEmail: "ana@leadroll.demo",
    createdHoursAgo: 30,
    assignedHoursAgo: 28,
  },
  {
    name: "Helena Duarte",
    phone: "(11) 99812-4477",
    email: "helena.duarte@exemplo.com",
    source: "referral",
    interest: "buy",
    stage: "won",
    brokerEmail: "ana@leadroll.demo",
    createdHoursAgo: 600,
    assignedHoursAgo: 596,
    notes: [
      { content: "Proposta aceita pelo proprietário.", hoursAgo: 90 },
      { content: "Contrato assinado. Cliente muito satisfeita.", hoursAgo: 48 },
    ],
  },
  // Atribuídos — Carlos Oliveira
  {
    name: "Thiago Ramires",
    phone: "(21) 98877-6655",
    source: "whatsapp",
    interest: "commercial",
    stage: "proposal",
    brokerEmail: "carlos@leadroll.demo",
    createdHoursAgo: 300,
    assignedHoursAgo: 299,
    notes: [
      {
        content: "Interessado em sala comercial de até 60m² no centro.",
        hoursAgo: 280,
      },
    ],
  },
  {
    name: "Larissa Fontes",
    phone: "(21) 99123-4567",
    email: "larissa.fontes@exemplo.com",
    source: "campaign",
    interest: "apartment",
    stage: "new",
    brokerEmail: "carlos@leadroll.demo",
    createdHoursAgo: 20,
    assignedHoursAgo: 19,
  },
  {
    name: "Eduardo Bastos",
    phone: "(21) 3214-9087",
    source: "portal",
    interest: "land",
    stage: "lost",
    brokerEmail: "carlos@leadroll.demo",
    createdHoursAgo: 480,
    assignedHoursAgo: 470,
    notes: [
      {
        content: "Desistiu da compra por enquanto. Retomar contato em 6 meses.",
        hoursAgo: 150,
      },
    ],
  },
  // Atribuídos — Juliana Costa
  {
    name: "Mariana Teixeira",
    phone: "(31) 98456-7788",
    email: "mariana.teixeira@exemplo.com",
    source: "site",
    interest: "rent",
    stage: "contacted",
    brokerEmail: "juliana@leadroll.demo",
    createdHoursAgo: 72,
    assignedHoursAgo: 70,
  },
  {
    name: "Felipe Andrade",
    phone: "(31) 99234-1122",
    source: "referral",
    interest: "house",
    stage: "visit_scheduled",
    brokerEmail: "juliana@leadroll.demo",
    createdHoursAgo: 160,
    assignedHoursAgo: 158,
    notes: [
      {
        content: "Indicação do cliente Paulo Reis. Busca casa com quintal.",
        hoursAgo: 150,
      },
    ],
  },
  {
    name: "Camila Rezende",
    phone: "(31) 3322-5544",
    email: "camila.rezende@exemplo.com",
    source: "instagram",
    interest: "buy",
    stage: "new",
    brokerEmail: "juliana@leadroll.demo",
    createdHoursAgo: 10,
    assignedHoursAgo: 9,
  },
  // Atribuídos — Marcos Souza (ausente)
  {
    name: "Rodrigo Pimentel",
    phone: "(41) 98765-0011",
    source: "whatsapp",
    interest: "apartment",
    stage: "proposal",
    brokerEmail: "marcos@leadroll.demo",
    createdHoursAgo: 360,
    assignedHoursAgo: 355,
    notes: [
      {
        content: "Enviada proposta com entrada de 20%. Aguardando retorno.",
        hoursAgo: 60,
      },
    ],
  },
  {
    name: "Patrícia Moura",
    phone: "(41) 99654-3322",
    email: "patricia.moura@exemplo.com",
    source: "portal",
    interest: "rent",
    stage: "won",
    brokerEmail: "marcos@leadroll.demo",
    createdHoursAgo: 720,
    assignedHoursAgo: 715,
  },
  // Sem responsável (reservatório)
  {
    name: "Lucas Ferreira",
    phone: "(11) 98111-2233",
    email: "lucas.ferreira@exemplo.com",
    source: "site",
    interest: "apartment",
    createdHoursAgo: 8,
  },
  {
    name: "Isabela Ribeiro",
    phone: "(11) 97222-3344",
    source: "whatsapp",
    interest: "rent",
    createdHoursAgo: 7,
  },
  {
    name: "Pedro Almeida",
    phone: "(21) 98333-4455",
    email: "pedro.almeida@exemplo.com",
    source: "instagram",
    interest: "house",
    createdHoursAgo: 6,
  },
  {
    name: "Fernanda Lima",
    phone: "(31) 99444-5566",
    source: "portal",
    interest: "buy",
    createdHoursAgo: 5,
  },
  {
    name: "Bruno Carvalho",
    phone: "(41) 3555-6677",
    email: "bruno.carvalho@exemplo.com",
    source: "campaign",
    interest: "commercial",
    createdHoursAgo: 4,
  },
  {
    name: "Aline Santos",
    phone: "(11) 98666-7788",
    source: "referral",
    interest: "land",
    createdHoursAgo: 3,
  },
  {
    name: "Diego Martins",
    phone: "(21) 99777-8899",
    email: "diego.martins@exemplo.com",
    source: "site",
    interest: "apartment",
    createdHoursAgo: 2,
  },
  {
    name: "Renata Gomes",
    phone: "(31) 98888-9900",
    source: "other",
    interest: "other",
    createdHoursAgo: 1.5,
  },
  {
    name: "Vinícius Rocha",
    phone: "(11) 99000-1122",
    email: "vinicius.rocha@exemplo.com",
    source: "whatsapp",
    interest: "rent",
    createdHoursAgo: 0.5,
  },
];

function hoursAgo(now: number, hours: number): string {
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

/**
 * Cria o estado inicial dos leads com datas relativas a `now`.
 * `brokerIdByEmail` liga os seeds aos perfis carregados; e-mail desconhecido
 * (ou perfil não visível) deixa o lead sem responsável.
 */
export function createMockLeads(
  now: number,
  brokerIdByEmail: ReadonlyMap<string, string>,
): Lead[] {
  return SEEDS.map((seed, index) => {
    const id = `lead_${String(index + 1).padStart(3, "0")}`;
    const brokerId = seed.brokerEmail
      ? (brokerIdByEmail.get(seed.brokerEmail) ?? null)
      : null;
    const observations: Observation[] = (seed.notes ?? [])
      .map((note, i) => ({
        id: `${id}_obs_${i + 1}`,
        content: note.content,
        createdAt: hoursAgo(now, note.hoursAgo),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      id,
      name: seed.name,
      phone: seed.phone,
      email: seed.email,
      source: seed.source,
      interest: seed.interest,
      stage: brokerId ? (seed.stage ?? "new") : "new",
      brokerId,
      createdAt: hoursAgo(now, seed.createdHoursAgo),
      assignedAt:
        brokerId && seed.assignedHoursAgo !== undefined
          ? hoursAgo(now, seed.assignedHoursAgo)
          : null,
      observations,
    };
  });
}
