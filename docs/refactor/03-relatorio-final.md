# 03 — Relatório final da refatoração

Fase 6 do [PRD](PRD.md). Branch `refactor/clean-architecture`, a partir de
`main` (`095c00c`). Data: 2026-11-14. Base: [code review](01-code-review.md) e
[plano](02-plano.md).

Todas as verificações abaixo foram executadas nesta sessão. O que não pôde ser
executado está marcado como **não verificado**.

## 1. Resultado

O código saiu da organização por tipo de arquivo (`components/`, `hooks/`,
`services/`, `errors/`, `lib/`, `contexts/`) e passou a ser organizado por
módulo de negócio, com camadas cuja regra de dependência é verificada pelo lint:

```text
src/
├── app/            rotas do Next: só metadata e composição
├── screens/        telas que combinam módulos (gestor, corretor, corretores, login, 404)
├── shell/          moldura: AppShell, Header, Sidebar, Brand, ThemeToggle, Providers
├── modules/
│   ├── auth/       sessão, login, logout, perfil, guard, redirecionamento da raiz
│   ├── brokers/    corretores e fila de presença
│   └── leads/      leads, etapas, observações, distribuição, filtros, Kanban
│       └── domain/ application/ infrastructure/ presentation/ composition.ts index.ts
├── shared/         domain (Actor, isOneOf), infrastructure (env, Supabase, falhas), ui
└── test/           cliente Supabase falso, fixtures e wrappers de teste
```

O comportamento observável foi preservado. Rotas, textos, consultas ao banco,
permissões e política de renderização são os mesmos, fixados por 388 testes,
dos quais 250 foram escritos antes de qualquer mudança.

## 2. Mudanças por módulo

| Módulo | O que mudou | Commits principais |
| --- | --- | --- |
| `shared` | `env.ts` (único `process.env`), cliente Supabase `client-only`, classificador único de falhas do PostgREST, `Actor`/`UserRole`, `isOneOf`, UI genérica (componentes, hooks, `format`, `routes`, `FormField`, `usePagination`, mensagens comuns) e primitives do shadcn em `shared/ui/primitives` | `2b97766`, `f351b72`, `7dc7cda`, `745e710`, `1abccd6` |
| `brokers` (piloto) | Domínio da presença com relógio injetado e política `canConfirmPresence`; casos de uso `listBrokers`, `loadOwnPresence` e `confirmPresence`; repositórios Supabase; `brokers-messages`; `User` vira `Broker` | `733c9cd` → `001f0a2` |
| `auth` | `toProfile` no domínio; `signIn` e `restoreSession` concentram "sem perfil válido não há acesso"; gateway Supabase Auth; `auth-messages`; contexto de sessão só com o perfil; `RootRedirect`; o `RoleGuard` deixa de montar o `AppShell` | `46d5410` → `495ac6c` |
| `leads` | Domínio como fonte única de etapas, origens e interesses; `toLeadInput`, `phone`, `lead-policy`, `workload`; sete casos de uso com permissão checada antes da rede; repositório Supabase; `leads-messages`; componentes grandes divididos; código morto e asserções removidos | `f0050d1` → `9ec4608` |
| `shell` e `app/` | Moldura em `src/shell`; `LoginScreen` e `NotFoundScreen` em `screens/`; `app/` só compõe | `ef9b247`, `7df1b87`, `ffd904d` |
| Qualidade | Vitest + Testing Library; regras de fronteira e de ciclos no Biome | `f0ee9a4` → `6596c5d`, `05c1bca`, `5efedec` |

## 3. Métricas: linha de base × final

| Métrica | Linha de base (`main`) | Final |
| --- | --- | --- |
| `npm run lint` | falha: 1 erro (formatação de `.devcontainer/devcontainer.json`) | passa: 0 erros, 0 avisos (193 arquivos) |
| `npx tsc --noEmit` | passa | passa |
| Testes | nenhum | 388 testes em 41 arquivos, todos passando |
| Cobertura (statements / branches / funções / linhas) | 0% (sem testes) | 88,88% / 82,92% / 83,51% / 90,51% |
| Referência após a Fase 3 (código antigo + caracterização) | 84,88% / 75,88% / 76,78% / 85,79% | acima nas quatro |
| `npm run build` | passa; 8 rotas estáticas | passa; as mesmas 8 rotas (`diff` vazio) |
| Build sem `NEXT_PUBLIC_SUPABASE_*` | passa | passa |
| `any` / `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| `biome-ignore` | 1 (a11y justificado) | 1 (o mesmo) |
| Asserções `as` no código de produção | 17 | 0 |
| `process.env` | 2, no cliente Supabase | 2, só em `shared/infrastructure/env.ts` |
| Arquivos de produção com mais de 200 linhas | 3 (328, 326, 239) | 0 (maior: `database.types.ts`, 197) |
| Ciclos de import | 0 entre arquivos; 1 entre pastas (`hooks ↔ contexts`) | 0 (`noImportCycles` no lint); pastas antigas não existem |
| Violações da regra de dependência | não verificável (sem regra) | 0 (`noRestrictedImports` por camada no lint) |
| Dependências | — | +4 devDependencies aprovadas (P-02): `vitest@4`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`. `npm audit` igual ao da `main` (6 alertas baixos/moderados preexistentes) |
| Tempo de `npm run lint` | ~0,1 s | ~1 s (custo de `noImportCycles`) |

## 4. Critérios de aceite (seção 8 do PRD)

| # | Critério | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | Lint, typecheck, testes e build passam, sem avisos novos | Atendido | Saídas desta sessão: lint `exit 0` sem avisos; `tsc` `exit 0`; 388 testes; build `exit 0` com e sem variáveis |
| 2 | Nenhum import viola a regra de dependência; sem ciclos | Atendido | Overrides de `noRestrictedImports` por camada e por módulo (DAG `leads → brokers → auth`) e `noImportCycles` em `biome.json`; lint verde. As regras foram provadas com arquivos temporários: cada import proibido falhou, e um ciclo proposital foi detectado (commit `05c1bca`) |
| 3 | `domain` e `application` sem `next`, `react`, ORM ou SDK | Atendido | Imports de `domain/` e `application/`: só arquivos do próprio módulo e `@/shared/domain/actor`. Também `noProcessEnv` e `noRestrictedGlobals` (`fetch`, `window`, `document`, `localStorage`) nessas camadas. Nenhum `Date.now()`/`new Date()` nelas |
| 4 | Sem regra de negócio nem acesso a dados em `app/`, componentes e telas | Atendido | Supabase só aparece em `*/infrastructure/` (e no dublê de teste). Regras de negócio estão no domínio (`isPresenceActive`, `toProfile`, `toLeadInput`, `isUnassigned`, `brokerWorkload`, `canManageLeads`, `isResponsibleFor`). `app/` só tem metadata e composição. Exceção documentada: o teste `role === "broker"` do `Header` (ver 6) |
| 5 | Rotas e contratos idênticos | Atendido | `diff` da lista de rotas do build contra a linha de base: vazio. Variáveis de ambiente: os mesmos dois nomes. Consultas, colunas, filtros, ordenações, RPCs e chamadas de Auth fixadas pelos testes de repositório (mesmas asserções da caracterização dos serviços). Não há endpoints |
| 6 | Achados críticos e altos resolvidos; médios e baixos resolvidos ou registrados | Atendido | Tabela da seção 5: todos os altos resolvidos; pendências médias e baixas justificadas |
| 7 | Nenhum `any`, `@ts-ignore` ou `eslint-disable` novo | Atendido | Contagens da seção 3 (inclusive nos testes: 0) |
| 8 | Domínio e casos de uso com testes; cobertura não inferior | Atendido | Testes de domínio e de caso de uso nos três módulos, sem React nem rede; cobertura acima da linha de base (0%) e da referência da Fase 3 |
| 9 | Sem código morto | Atendido | Varredura de exports sem uso fora do próprio arquivo (só sobram tipos públicos de funções exportadas e valores usados em testes); variante `broker` dos filtros, filtro de interesse, `LoadingState variant="table"`, props sem uso, `user`/`session`/`weakPassword` removidos; todas as dependências do `package.json` têm uso |
| 10 | `AGENTS.md` revisado e validado | Atendido | 353 → 159 linhas, bloco do Next idêntico (`diff` das linhas 1–9 vazio), detalhes em `docs/arquitetura.md` e `docs/produto.md`. Todos os caminhos e símbolos citados conferidos por script. Comandos executados nesta sessão: `npm install`, `npm run lint`, `npx biome check --write src`, `npx tsc --noEmit`, `npm test`, `npx vitest run <arquivo>`, `npm run test:coverage`, `npm run build`, `npx next start -p 3100` (serviu `/login` e `/gestor/leads` com 200) e `npx shadcn@latest add checkbox --dry-run -y` (gera em `src/shared/ui/primitives/`). `npm run dev` não foi executado de novo para não disputar a pasta com o `next dev` do usuário já ativo na porta 3000 |

## 5. Achados: status

Legenda: **R** resolvido · **P** parcial (justificado) · **D** dívida registrada.

| ID | Status | Como |
| --- | --- | --- |
| A-01 | R | A interface chama casos de uso pelo `composition.ts` de cada módulo; o lint proíbe `infrastructure` em `presentation` |
| A-02 | R | Contexto de sessão sem tipos do SDK (`44cfb49`); erros do SDK traduzidos no gateway |
| A-03 | R | `signIn`/`restoreSession` em `auth/application`, com as condições originais de logout |
| A-04 | R | `isPresenceActive`/`activeUntil` no domínio, relógio injetado |
| A-05 | R | `countLeads`, `brokerWorkload` e `isUnassigned` no domínio |
| A-06 | R | `canManageLeads`, `isResponsibleFor` e `canConfirmPresence` no domínio, checados nos casos de uso (P-06) e usados na interface; `mode` removido de `LeadDetails`. O teste de perfil do `Header` foi mantido de propósito (seção 6) |
| A-07 | R | `toLeadInput` (telefone com máscara, e-mail vazio → `null`) aplicado em `createLead`/`updateLead` |
| A-08 | R | Portas, fábricas e composition root; relógio injetado |
| A-09 | R | 388 testes |
| A-10 | R | Regras de fronteira e de ciclos no Biome |
| M-01 | R | `classifyPostgrestFailure` + `narrowFailure` |
| M-02 | R | Um erro de aplicação por módulo (`operation` + `reason`); textos em `*-messages.ts` com os mesmos textos |
| M-03 | R | Erros nomeados; `errorMessage` único; os dois `catch` intencionais estão documentados (`signOutQuietly`, `onSignedOut` sem variáveis) |
| M-04 | R | Nenhum arquivo de produção acima de 200 linhas |
| M-05 | P | `mode` e `variant` removidos. `overlay`, `draggable` e `droppable` do Kanban continuam: são variantes visuais exigidas pelo dnd-kit (card no `DragOverlay`, colunas no mobile), não regra de negócio |
| M-06 | R | Código morto removido (critério 9) |
| M-07 | R | `constants` e `format` divididos por camada; rotas em `shared/ui/routes` |
| M-08 | R | 17 → 0 asserções |
| M-09 | R | Uma fonte `as const` no domínio para etapas, origens e interesses |
| M-10 | R | `Broker`, `Profile`, `Actor`, `startSession` |
| M-11 | R | `email: string \| null` no domínio |
| M-12 | R | `RootRedirect`, `LoginScreen`, `NotFoundScreen`; `Brand` sem duplicação |
| M-13 | R | `shared/infrastructure/env.ts` |
| M-14 | R | Pastas `hooks/` e `contexts/` deixaram de existir |
| M-15 | R | `RoleGuard` só protege; HTML pré-renderizado comparado: idêntico |
| M-16 | R | Limites de campo no domínio; schemas e mensagens derivados deles |
| M-17 | D | A atualização otimista continua no hook (é comportamento de interface); a corrida está registrada como BUG-04 |
| M-18 | R | README sem `npm run seed:auth`, `scripts/seed-demo-users.mjs` e `SUPABASE_SERVICE_ROLE_KEY`, que não existem; comandos de teste incluídos |
| B-01 a B-07, B-09 | R | Regex legível, `cn.ts`, `<>`, `setField`/`setFilter`, constantes nomeadas, `STAGE_LABEL`, `UnassignedBadge`, `devcontainer.json` formatado |
| B-08 | D | Comentário do template em `next.config.ts`: arquivo de configuração protegido, não tocado |

## 6. Decisões que merecem atenção

- **Teste de perfil no `Header`**: parecia duplicado (o `PresenceToggle` já checa a
  política), mas não é. O `PresenceProvider` só existe na área do corretor, e
  durante a restauração da sessão a área do gestor é renderizada oculta com um
  perfil que já pode ser de corretor. Sem o teste, o `usePresence` lançaria um
  erro. Mantido e comentado no código (`ffd904d`).
- **Arraste no Kanban**: o lead arrastado passou a ser buscado pelo id na lista,
  em vez de lido do payload do dnd-kit. É equivalente, mas o arraste não roda no
  jsdom, então isso está **não verificado no navegador**.
- **Testes adaptados sem perder asserções**: os testes de hooks e diálogos de
  leads passaram a renderizar com a sessão restaurada (`SignedIn`), porque os
  casos de uso exigem o ator. Nenhum `expect` foi removido (conferido no diff).
  O teste de `useBrokers` deixou de esperar `role: "broker"`, campo que ninguém
  lia. Os testes do filtro de interesse saíram junto com o código morto.

## 7. Bugs encontrados (não corrigidos, P-09)

Todos continuam como estavam e estão fixados por testes de caracterização quando
observáveis. Cada correção pede aprovação e um commit próprio.

| ID | Prioridade sugerida | Resumo |
| --- | --- | --- |
| BUG-01 | Alta | `/gestor/corretores` mostra sempre 0 em "Leads atribuídos" e "Em atendimento" (`screens/manager-brokers-screen.tsx`, `const leads: Lead[] = []`). A correção é usar `useLeads()` ali |
| BUG-03 | Média | Enquanto os corretores carregam, ou se a busca falha, leads distribuídos aparecem como "Sem responsável" na tabela e nos detalhes |
| BUG-02 | Média | Falha no logout mostra "**Error** ao fazer logout…" e perde o motivo (texto em `auth-messages.ts`, marcado) |
| BUG-05 | Baixa | Depois de uma falha ao buscar a presença, o corretor vê "Você está ausente" |
| BUG-04 | Baixa | Duas mudanças de etapa seguidas: a reversão da primeira pode desfazer a segunda na tela |
| BUG-06 | Baixa | O painel de lead pode ser fechado durante o envio (os diálogos de exclusão e distribuição bloqueiam) |

## 8. Dívida técnica priorizada

1. **Corrigir os bugs da seção 7**, começando por BUG-01 e BUG-03.
2. **Percurso no navegador não verificado** (decisão P-03: nada contra o Supabase
   real). Falta percorrer login, guard, CRUD, distribuição, presença, Kanban
   (inclusive o arraste), observações, 360/390px, modo escuro e console sem erros.
3. **Tipos do banco escritos à mão** (`database.types.ts`). Gerar com
   `npx supabase gen types typescript` quando houver acesso ao projeto.
4. **`client-only` vem transitivamente** (`next → styled-jsx`). O Next o trata
   internamente no build, mas, se deixar de vir, adicione-o como dependência.
5. **"Apresentação importa o domínio só como tipo" não é verificável** pelo
   Biome (P-05). Ficou permitido importar valores puros do domínio.
6. **`noImportCycles` ignora imports só de tipo** (padrão do Biome). A direção
   entre módulos é garantida pelo `noRestrictedImports`.
7. **`"use client"` no nível das telas** e busca de dados no cliente (C-03):
   restrição do `AGENTS.md`; mudar alteraria a renderização.
8. **Variantes visuais do Kanban** (`overlay`, `draggable`, `droppable`, M-05).
9. **B-08**: comentário do template em `next.config.ts`.

## 9. Suposições

- Branch base `main`; fluxos críticos e áreas proibidas deduzidos do
  `AGENTS.md`, do código e das migrations (seção 1 do review).
- Mensagens e textos atuais, inclusive os com defeito, são contrato.
- O guard e a RLS continuam como estão: as checagens novas nos casos de uso são
  defesa adicional, com as mesmas mensagens que o banco produziria.
- Mover arquivos em commits próprios: sempre que possível. Três exceções foram
  registradas no plano, porque separar deixaria um commit vermelho:
  `lib/lead-filters` e `lib/validation` entraram no módulo no mesmo commit do
  domínio; `use-presence` e `use-session` ganharam `"use client"` no commit de
  movimentação.
