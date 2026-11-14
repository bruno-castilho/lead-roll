# 02 — Plano de refatoração

Fase 2 do [PRD](PRD.md), a partir do [code review](01-code-review.md). Registro vivo:
marque cada etapa ao concluir e anote desvios na seção 8.

**Estado:** Parada 1 aprovada em 2026-11-14 (todas as perguntas da seção 6 decididas).
Etapas 0 a 7 concluídas em 2026-11-14 (relatório em [03-relatorio-final.md](03-relatorio-final.md)). Em execução: Etapa 8 (`AGENTS.md`).

## 1. Arquitetura-alvo, adaptada ao LeadRoll

O `AGENTS.md` proíbe Server Actions, Route Handlers, `proxy.ts` e `cookies()`, e o
Supabase só roda no navegador (conflito C-02 do review). Por isso:

- **Infraestrutura e composition root rodam no cliente.** Começam com
  `import "client-only"` no lugar de `server-only` (o Next trata o pacote
  internamente; sem dependência nova). `domain` e `application` continuam puros.
- **O cliente Supabase nunca é criado em escopo de módulo.** Os repositórios
  chamam `getSupabaseClient()` dentro de cada método; o composition root só liga
  objetos, sem efeito colateral (regra do `AGENTS.md`: o build passa sem as variáveis).
- **A RLS continua sendo a autoridade.** As políticas de domínio decidem o que a
  interface oferece e barram chamadas indevidas antes da rede, com as mesmas
  mensagens de hoje. Não substituem o banco, e a distribuição continua 100% no banco.

### Estrutura

```text
src/
├── app/                      # rotas do Next: só compõem (screens, shell e providers)
├── screens/                  # telas que combinam mais de um módulo (página = 1 arquivo)
├── shell/                    # moldura do app: AppShell, Header, Sidebar, Providers, ThemeToggle, nav
├── modules/
│   ├── auth/                 # sessão, login, logout, perfil, guard de perfil
│   ├── brokers/              # corretores e presença (fila de 5h)
│   └── leads/                # leads, etapas, observações e distribuição
│       ├── domain/           # entidades, regras e políticas puras (sem React, Next, Supabase, Zod)
│       ├── application/      # casos de uso, portas e erros de aplicação (reason tipado)
│       ├── infrastructure/   # repositórios Supabase (mapeamento linha ↔ entidade, tradução de erros)
│       ├── presentation/     # componentes, hooks, mensagens pt-BR, schemas Zod de formulário
│       ├── composition.ts    # liga portas às implementações ("client-only")
│       └── index.ts          # API pública: tipos, funções de domínio, componentes e hooks
└── shared/
    ├── domain/               # Actor e UserRole (usados pelos três módulos)
    ├── infrastructure/       # env.ts, supabase/client.ts, database.types.ts, classificador de falhas
    └── ui/                   # primitives (shadcn), componentes genéricos, hooks de UI, format, routes, cn
```

### Regra de dependência (verificada pelo Biome)

| De ↓ / pode importar → | `domain` | `application` | `infrastructure` | `composition` | `presentation` | outro módulo (`index`) | `shared/domain` | `shared/infrastructure` | `shared/ui` | libs externas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `domain` | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ | ✘ |
| `application` | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ | ✘ |
| `infrastructure` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ | Supabase |
| `composition.ts` | ✔ | ✔ | ✔ | — | ✘ | ✘ | ✔ | ✔ | ✘ | ✘ |
| `presentation` | ✔ (P-05) | ✔ | ✘ | ✔ | ✔ | ✔ (DAG abaixo) | ✔ | ✘ | ✔ | React, Next, Zod, sonner, dnd-kit… |
| `screens/`, `shell/` | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ | ✔ | React, Next… |
| `app/` | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ | ✔ | Next |

- Entre módulos, só pelo `index.ts` e só nesta direção: `leads → brokers → auth`.
  `auth` não importa outro módulo. As telas que precisariam inverter a direção
  (por exemplo `/gestor/corretores`, que mostra a carga de leads de cada corretor)
  ficam em `screens/`.
- Dentro do módulo, imports relativos. De fora, `@/modules/<m>`; caminho
  profundo (`@/modules/<m>/<camada>/…`) é proibido.
- O `index.ts` nunca reexporta `composition.ts` nem `infrastructure/`: assim, um
  Server Component em `app/` importa o índice sem puxar `client-only`.

Configuração prevista (validada na Fase 3, Etapa 1.4), em `biome.json`:

```jsonc
"linter": { "rules": { "suspicious": { "noImportCycles": "error" } } },
"overrides": [
  { "includes": ["src/modules/*/domain/**", "src/shared/domain/**"],
    "linter": { "rules": { "style": { "noRestrictedImports": { "level": "error", "options": { "patterns": [
      { "group": ["react", "react/**", "next", "next/**", "@supabase/**", "zod", "sonner", "@/**", "!@/shared/domain/**", "../application/**", "../infrastructure/**", "../presentation/**", "../composition"],
        "message": "domain só importa TypeScript puro e shared/domain." } ] } } } } } },
  // application, infrastructure, composition, presentation, screens/shell e app: um override cada,
  // seguindo a tabela acima, mais um override por módulo para o DAG leads → brokers → auth.
]
```

## 2. Módulos e destino de cada arquivo

Movimentos (`→`) vão em commits só de movimentação; divisões (`⇒`) vão em
commits de conteúdo depois do movimento.

### `shared`

| Atual | Destino |
| --- | --- |
| `lib/supabase/client.ts` | → `shared/infrastructure/supabase/client.ts` ⇒ leitura das variáveis para `shared/infrastructure/env.ts` |
| `lib/supabase/database.types.ts` | → `shared/infrastructure/supabase/database.types.ts` |
| (novo) | `shared/infrastructure/supabase/postgrest-failure.ts` (M-01) |
| `lib/types.ts` (`UserRole`) | ⇒ `shared/domain/actor.ts` (`UserRole`, `Actor { id, role }`) |
| `components/ui/**` | → `shared/ui/primitives/**` + aliases do `components.json` (P-07) |
| `lib/utils.ts` | → `shared/ui/cn.ts` |
| `components/shared/{empty-state,kbd,loading-state,page-header,pagination,search-input}.tsx` | → `shared/ui/components/` |
| `hooks/{use-hotkey,use-media-query,use-reset-on-hide}.ts` | → `shared/ui/hooks/` |
| `lib/format.ts` | ⇒ datas, `pluralize` e `getInitials` → `shared/ui/format.ts`; `normalize` → `leads/presentation`; telefone → `leads/domain/phone.ts` |
| `lib/constants.ts` | ⇒ `ROUTES` e `HOME_BY_ROLE` → `shared/ui/routes.ts`; `PAGE_SIZES` → `pagination.tsx`; o restante → `leads` |
| `lib/validation.ts` (`fieldErrors`) | ⇒ `shared/ui/form-errors.ts` |

### `auth` (risco alto: login, restauração e guard)

| Atual | Destino |
| --- | --- |
| `services/auth-service.ts` | ⇒ `infrastructure/supabase-auth-gateway.ts` (signIn, signOut, restore, onSignedOut) e `infrastructure/supabase-profile-repository.ts`; a validação de `toProfile` → `domain/profile.ts` |
| `errors/{auth-service,profile,sign-in,sign-out}-error.ts` | ⇒ `application/auth-error.ts` (`reason` tipado) + `presentation/auth-messages.ts` (textos atuais); tradução dos erros do SDK na infraestrutura |
| `login-form.tsx` (orquestração) e `contexts/session.tsx` (restauração) | ⇒ casos de uso `application/sign-in.ts`, `restore-session.ts`, `sign-out.ts`, `watch-signed-out.ts` |
| `contexts/session.tsx`, `hooks/use-session.ts` | → `presentation/session-provider.tsx`, `presentation/use-session.ts` (sem `user`/`session`, M-06) |
| `components/auth/login-form.tsx` | → `presentation/login-form.tsx`; `loginSchema` → `presentation/login-schema.ts` |
| `components/layout/role-guard.tsx` | → `presentation/role-guard.tsx` (deixa de montar o `AppShell`, M-15) |
| `components/layout/user-menu.tsx` | → `presentation/user-menu.tsx` |
| `app/page.tsx` (lógica) | ⇒ `presentation/root-redirect.tsx` |

### `brokers` (piloto)

| Atual | Destino |
| --- | --- |
| `lib/types.ts` (`User`) | ⇒ `domain/broker.ts` (`Broker`, M-10) |
| regra de presença (`contexts/presence.tsx:32-37`, `brokers-service.ts:27-35`) | ⇒ `domain/presence.ts` (`BrokerPresence`, `isPresenceActive(presence, now)`, `activeExpiry`) |
| `services/brokers-service.ts` | → `infrastructure/supabase-broker-repository.ts` |
| `services/presence-service.ts` | → `infrastructure/supabase-presence-repository.ts` |
| (novo) | `application/ports.ts` (`BrokerRepository`, `PresenceRepository`, `Clock`), `list-brokers.ts`, `get-own-presence.ts`, `confirm-presence.ts` (só corretor, P-06) |
| `errors/{brokers,presence,confirm-presence}-error.ts` | ⇒ `application/brokers-error.ts` + `presentation/brokers-messages.ts` |
| `contexts/presence.tsx`, `hooks/use-presence.ts` | → `presentation/presence-provider.tsx`, `presentation/use-presence.ts` |
| `hooks/use-brokers.ts` | → `presentation/use-brokers.ts` |
| `layout/presence-toggle.tsx`, `shared/presence-badge.tsx`, `brokers/broker-card.tsx` | → `presentation/` |
| `components/pages/manager-brokers-page.tsx` | → `screens/manager-brokers-screen.tsx` (combina corretores e carga de leads) |

### `leads` (maior volume)

| Atual | Destino |
| --- | --- |
| `lib/types.ts` (`Lead`, `LeadStage`, `Observation`, `LeadInput`…) | ⇒ `domain/lead.ts`, `domain/observation.ts`, `domain/lead-input.ts` (uma fonte `as const` para etapas, origens e interesses, M-09; limites de campo, M-16) |
| `lib/constants.ts` (ordem das etapas, `ACTIVE_STAGES`) | ⇒ `domain/lead.ts` |
| `lib/constants.ts` (rótulos, `STAGE_DOT`) | ⇒ `presentation/lead-labels.ts` |
| `hooks/use-lead-stats.ts` | ⇒ `domain/workload.ts` (`isUnassigned`, `brokerWorkload`, `leadCounts`) + hook fino |
| (novo) | `domain/lead-policy.ts` (`canCreateLead`, `canEditLead`, `canDeleteLead`, `canChangeStage`, `canAddObservation`, `canDistribute`, `isVisibleTo`) |
| `services/leads-service.ts` | → `infrastructure/supabase-lead-repository.ts` (colunas, mapeamento, tradução de erros) |
| (novo) | `application/` `list-leads`, `create-lead`, `update-lead`, `delete-lead`, `change-stage`, `add-observation`, `distribute-leads`, `ports.ts`, `leads-error.ts` |
| `errors/{leads,create-lead,update-lead,delete-lead,change-stage,add-observation,distribute-leads}-error.ts` | ⇒ `application/leads-error.ts` + `presentation/leads-messages.ts` (textos atuais) |
| `hooks/{use-leads,use-change-stage,use-add-observation}.ts` | → `presentation/` |
| `lib/lead-filters.ts` | → `presentation/lead-filters.ts` (estado de filtro da tela; sem a parte morta, M-06) |
| `lib/validation.ts` (`leadSchema`, `observationSchema`) | ⇒ `presentation/lead-form-schema.ts`, `presentation/observation-schema.ts` |
| `components/leads/*`, `components/kanban/*`, `components/observations/*` | → `presentation/` (subpastas `table/`, `form/`, `details/`, `kanban/`, `observations/`, `dialogs/`) |
| `components/pages/manager-leads-page.tsx` | → `screens/manager-leads-screen.tsx` ⇒ extrair `QuickFilters` e `LeadsToolbar` para `leads/presentation` (M-04) |
| `components/pages/broker-leads-page.tsx` | → `screens/broker-leads-screen.tsx` |

### `shell` e `app`

| Atual | Destino |
| --- | --- |
| `components/layout/{app-shell,header,sidebar,nav-items,theme-toggle}.tsx` | → `shell/` |
| `components/providers/providers.tsx` | → `shell/providers.tsx` |
| `app/gestor/layout.tsx`, `app/corretor/layout.tsx` | compõem `RoleGuard` + `AppShell` (mesmo DOM de hoje) |
| `app/login/page.tsx` | marcação → `auth/presentation/login-screen.tsx` (usa `Brand`) |
| `app/*/page.tsx` | continuam: `metadata` + render da tela; redirecionamentos de `/gestor` e `/corretor` sem mudança |

Pastas antigas removidas ao final: `src/components`, `src/contexts`, `src/errors`,
`src/hooks`, `src/lib` e `src/services`.

## 3. Piloto: `brokers`

- **Por quê:** é pequeno (cerca de 400 linhas), percorre todas as camadas (consulta, RPC,
  regra de domínio com relógio, contexto com timer, erros e telas) e tem um fluxo
  crítico (confirmar e renovar presença, e a expiração) que dá para cobrir com
  testes sem React.
- **Fora do piloto:** `manager-brokers-screen` continua usando `useLeadStats`
  antigo até a etapa de `leads` (desvio temporário, registrado na seção 8).

## 4. Ordem e etapas

Ordem dos módulos, do menor para o maior risco: **brokers (piloto) → auth → leads**,
seguidos de shell e `app/`. `auth` vem antes de `leads` porque `leads` depende de `useSession`.

Cada etapa: um commit por mudança lógica; movimentos separados de conteúdo;
`npm run lint`, `npx tsc --noEmit` e `npm test` a cada commit; `npm run build` ao
fim da etapa.

| # | Etapa | Arquivos | Risco | Testes que protegem | Critério de conclusão |
| --- | --- | --- | --- | --- | --- |
| 0 | Branch e documentos | `docs/refactor/*` | Nenhum | — | Branch criada (P-01); PRD, review e plano commitados |
| 1.1 | Infra de testes (Fase 3) | `package.json`, `vitest.config.ts` | Baixo | — | `npm test` e `npm run test:coverage` rodam; `TZ=America/Sao_Paulo` fixo |
| 1.2 | Caracterização: funções puras | `lib/format.ts`, `lib/lead-filters.ts`, `lib/validation.ts`, `lib/constants.ts` | Baixo | os próprios testes | Máscara de telefone, datas, busca, filtros, ordenação e todas as mensagens Zod fixadas |
| 1.3 | Caracterização: serviços com cliente Supabase falso | `services/*.ts`, `errors/*.ts` | Baixo | os próprios testes | Para cada método: consulta enviada (tabela, colunas, filtros e ordem), mapeamento de linha e cada `reason` com o texto exato |
| 1.4 | Caracterização: hooks e providers (se P-02b aprovado) | `contexts/*.tsx`, `hooks/use-change-stage.ts`, `login-form.tsx` | Médio | os próprios testes | Restauração com e sem perfil, login com falha de perfil, reversão otimista, expiração da presença |
| 1.5 | Regras de fronteira e ciclos | `biome.json` | Baixo | `npm run lint` | Overrides para `modules/`, `shared/`, `screens/`, `shell/` e `app/`; `noImportCycles` ligado; um import proibido de propósito falha (verificado e desfeito) |
| 2 | Fundação `shared` | `lib/supabase/*`, `components/ui`, `components/shared`, hooks de UI, `lib/utils.ts` | Médio (muitos imports) | 1.2, 1.3, build | Movimentos + `env.ts` + classificador de falhas (M-01) |
| 3 | **Piloto `brokers`** | ver seção 2 | Médio | 1.3, 1.4 + testes unitários do domínio e dos casos de uso | Camadas criadas, sem `services/brokers-service.ts` e `presence-service.ts`; lint, tipos, testes e build verdes |
| — | **Parada 2** | | | | Estrutura, diff e verificações apresentados; aprovação |
| 4 | `auth` | ver seção 2 | Alto | 1.3, 1.4 + unitários | Login, restauração, logout e guard idênticos; `user` e `session` fora do contexto |
| 5a | `leads`: domínio, rótulos e política | `lib/types.ts`, `lib/constants.ts`, `use-lead-stats.ts` | Médio | 1.2 + unitários | Uma fonte por enum; nenhum `as` em `constants` e `validation` |
| 5b | `leads`: repositório e casos de uso | `services/leads-service.ts`, `errors/*` | Alto | 1.3 + unitários | Os 7 casos de uso via composition; `LeadsService` removido |
| 5c | `leads`: apresentação | `components/{leads,kanban,observations}`, hooks | Médio | 1.4 + build | Componentes acima de 200 linhas divididos; filtro morto removido; telas em `screens/` |
| 6 | Shell, `app/` e limpeza | `components/layout`, `providers`, `app/**` | Médio | build + rotas | Pastas antigas removidas; `app/` só compõe |
| 7 | Validação final (Fase 6) | — | — | tudo | Métricas comparadas com a linha de base; `03-relatorio-final.md` |
| 8 | `AGENTS.md` (Fase 7) | `AGENTS.md`, `README.md` (M-18) | Baixo | comandos citados executados | Abaixo de 200 linhas; caminhos e comandos validados |

Convenções que valem em todas as etapas:

- **Caso de uso:** fábrica `makeX(deps)` que devolve uma função `(actor, input)`;
  o composition root exporta as instâncias prontas. Sem framework de DI.
- **Erros:** um erro de aplicação por módulo (`operation` + `reason`); a
  apresentação converte em texto com um mapa que reproduz as mensagens atuais
  (fixadas pelos testes 1.3).
- **Relógio:** `now: () => Date` injetado; nenhum `Date.now()` em `domain` ou `application`.
- **Ausência de valor:** `null` no domínio (`email: string | null`), sem mudar o que a tela mostra (M-11).

## 5. Verificação manual (Parada 2 e Fase 6)

- Rotas: a lista do `next build` precisa ser idêntica à da linha de base (8 rotas estáticas).
- Build sem as variáveis `NEXT_PUBLIC_SUPABASE_*`.
- Percurso no navegador: login de gestor e de corretor, guard de perfil,
  logout, CRUD de lead, distribuição, presença, Kanban (arrastar, menu, detalhes),
  observação, 360/390px, modo escuro e console sem erros. **Por decisão P-03,
  nada roda contra o Supabase real:** este percurso fica com o usuário, e o
  relatório o marca como "não verificado". Os testes automatizados usam só
  cliente Supabase falso.

## 6. Perguntas e aprovações pendentes (Parada 1)

| ID | Pergunta | Recomendação |
| --- | --- | --- |
| P-01 | Branch `refactor/clean-architecture` (PRD, regra 6) ou commits direto na `main` (memória do projeto)? | **Decidido (2026-11-14): branch `refactor/clean-architecture`** |
| P-02a | Dependências de teste: `vitest` e `@vitest/coverage-v8` (devDependencies). Motivo: não há runner, e a Fase 3 exige testes. Alternativa nativa: `node --test` do Node 24 (remove tipos sozinho), mas exige extensão `.ts` em todos os imports, `allowImportingTsExtensions`, não aceita `@/` nem parameter properties e não testa componentes | **Decidido: aprovado** |
| P-02b | Para caracterizar hooks e providers (login, restauração, reversão otimista, timer de presença): `jsdom` e `@testing-library/react`. Sem eles, esses fluxos ficam protegidos só por teste manual até virarem casos de uso testados sem React | **Decidido: aprovado** |
| P-03 | Teste ponta a ponta: o Playwright não está instalado nesta máquina, e o percurso grava dados no seu projeto Supabase (cadastra, distribui e exclui leads). Posso instalar o Playwright fora do projeto e rodar contra o seu Supabase com as contas de demonstração? | **Decidido (2026-11-14): não rodar contra o Supabase.** Verificação no navegador fica com o usuário; relatório marca "não verificado" |
| P-04 | Composition root e infraestrutura no cliente com `import "client-only"` no lugar de `server-only` (C-02) | **Decidido: aprovado** |
| P-05 | A apresentação pode importar valores do `domain` (funções puras e constantes), já que o Biome não distingue `import type`? A alternativa é reexportar pela `application`, o que só adiciona arquivos de passagem | **Decidido: permitir valores do `domain` na apresentação** |
| P-06 | Checagem de permissão nos casos de uso (por exemplo, só o gestor cadastra), além da RLS. Mesmas mensagens; nenhum fluxo legítimo muda | **Decidido: aprovado** |
| P-07 | Mover `src/components/ui` para `src/shared/ui/primitives` e ajustar os aliases do `components.json` (o `npx shadcn add` passa a gerar lá) | **Decidido: mover** |
| P-08 | Lint da linha de base falha por formatação de `.devcontainer/devcontainer.json`. Formatar (só espaços, commit separado) para o critério 1 ficar verde? | **Decidido: formatar** |
| P-09 | Bugs BUG-01 a BUG-06: corrigir depois da refatoração, um commit cada, ou só registrar? | **Decidido: só registrar** |
| P-10 | Três módulos (`auth`, `brokers` com presença, `leads` com observações e distribuição) + `screens/` e `shell/` para a composição entre módulos | **Decidido: aprovado** |

## 7. Progresso

- [x] Fase 0 — Reconhecimento (linha de base em `01-code-review.md`)
- [x] Fase 1 — Code review (`01-code-review.md`)
- [x] Fase 2 — Plano (este arquivo)
- [x] Parada 1 — aprovação (2026-11-14)
- [x] Etapa 0 — branch e documentos
- [x] Etapas 1.1–1.5 — rede de segurança (Fase 3)
- [x] Etapa 2 — fundação `shared`
- [x] Etapa 3 — piloto `brokers`
- [x] Parada 2 — aprovação (2026-11-14)
- [x] Etapa 4 — `auth`
- [x] Etapas 5a–5c — `leads`
- [x] Etapa 6 — shell, `app/` e limpeza
- [x] Etapa 7 — validação final e relatório
- [ ] Etapa 8 — `AGENTS.md`

## 8. Desvios e decisões

| Data | Decisão ou desvio | Motivo |
| --- | --- | --- |
| 2026-11-14 | `"use client"` continua no nível das telas, e a busca de dados continua em efeitos no cliente (C-03) | Restrição do `AGENTS.md`; mudar alteraria a renderização |
| 2026-11-14 | Documentos da Fase 0–2 escritos sem commit, aguardando P-01 | Não escolher a branch antes da aprovação |
| 2026-11-14 | Branch `refactor/clean-architecture` criada a partir de `main` (`095c00c`); documentos commitados nela | Decisão P-01 do usuário |
| 2026-11-14 | Nenhuma execução contra o Supabase real (sem Playwright, sem login na app) | Decisão P-03 do usuário |
| 2026-11-14 | P-02 (Vitest + jsdom + Testing Library) e P-04 a P-10 aprovados conforme as recomendações | Resposta do usuário na Parada 1 |
| 2026-11-14 | `vitest@4.1.12` em vez do 5.x | O 5.x exige `@types/node` >= 22; atualizar `@types/node` seria upgrade fora do escopo. `npm audit` igual ao da `main` (6 alertas baixos/moderados preexistentes) |
| 2026-11-14 | Testes de caracterização passam pela pilha real até um cliente Supabase falso (`src/test/fake-supabase.ts`), não por mocks dos serviços | Sobrevivem à refatoração: só o caminho do `vi.mock` do cliente muda quando ele for movido |
| 2026-11-14 | Cobertura de referência após a Fase 3: statements 84,88%, branches 75,88%, funções 76,78%, linhas 85,79% (linha de base sem testes: 0%) | Critério 8: a cobertura final não pode ficar abaixo disso |
| 2026-11-14 | Overrides de fronteira são disjuntos, e há um override de `presentation` por módulo | No Biome, um override posterior substitui a configuração da regra em vez de somar |
| 2026-11-14 | Arquivos `*.test.ts(x)` ficam fora das regras de fronteira | Testes precisam de dublês (`@/test/*`, `vi.mock`); a regra vale para o código de produção |
| 2026-11-14 | `npm run lint` passou de ~0,1 s para ~1 s | Custo do `noImportCycles` (grafo de módulos) |
| 2026-11-14 | O classificador de falhas do PostgREST entrou com o piloto, não na Etapa 2 | Evita export sem uso; o piloto é o primeiro consumidor |
| 2026-11-14 | `lib/format.ts` foi movido inteiro para `shared/ui/format.ts` | A máscara de telefone também é formatação genérica; o que for regra do lead sai dali na Etapa 5a |
| 2026-11-14 | Arquivos de hook reexportados pelo `index.ts` de um módulo levam `"use client"` (ex.: `use-presence.ts`) | O `index` é importado por Server Components (`app/corretor/layout.tsx`); sem a diretiva, o hook entraria no grafo do servidor |
| 2026-11-14 | `Broker` não tem mais o campo `role` (sempre `"broker"`); o teste de caracterização de `useBrokers` deixou de esperá-lo | Ninguém lia o campo (busca registrada no commit `37031d3`); não é comportamento observável |
| 2026-11-14 | Imports transitórios aceitos até as próximas etapas: `useSession` de `@/hooks/use-session` em `brokers/presentation` (sai na Etapa 4) e `useLeadStats`/`Lead` de `@/hooks`/`@/lib` em `screens/manager-brokers-screen.tsx` (sai na Etapa 5) | Os módulos `auth` e `leads` ainda não existem; as regras de fronteira não bloqueiam as pastas antigas |
| 2026-11-14 | Verificação da Parada 2: lint, tipos, 290 testes, build com e sem variáveis; rotas idênticas à linha de base; cobertura 85,40% statements / 76,64% branches / 77,58% funções / 86,22% linhas (acima da referência) | Comandos rodados nesta sessão |
| 2026-11-14 | `RoleGuard` deixou de montar o `AppShell`; os layouts de `app/` compõem os dois | Quebra o ciclo `auth → shell → brokers → auth` (M-15). HTML pré-renderizado de `/gestor/leads` e `/corretor/leads` comparado antes e depois: idêntico |
| 2026-11-14 | A prop do `AppShell` passou de `role` para `userRole` | O lint (`useValidAriaRole`) toma `role="manager"` literal como atributo ARIA |
| 2026-11-14 | A remoção de `user`/`session` do contexto de sessão veio antes da movimentação de `auth` | A apresentação não pode importar o SDK; mover primeiro deixaria o commit vermelho |
| 2026-11-14 | `signIn` e `restoreSession` mantêm as condições antigas de logout: no login, qualquer falha ao buscar o perfil; na restauração, só perfil ausente ou sessão recusada | Comportamento preservado (testes de caso de uso e de caracterização; mutação removendo o logout é detectada) |
| 2026-11-14 | `lib/lead-filters` e `lib/validation` entraram no módulo `leads` no mesmo commit da troca para o domínio (`3ec446d`) | Separar movimento e conteúdo deixaria um commit vermelho (tipos antigos × novos) |
| 2026-11-14 | Hooks e diálogos de leads leem o ator da sessão; os testes passaram a renderizar com `SignedIn` | Os casos de uso exigem o ator (P-06). Nenhuma asserção removida |
| 2026-11-14 | O teste `role === "broker"` do `Header` foi mantido e comentado | Sem ele, a área do gestor renderizada oculta durante a restauração pediria o `PresenceProvider`, que só existe na área do corretor |
| 2026-11-14 | Testes de caracterização extras (menu, `PresenceToggle`, `RootRedirect`, `SearchInput`) na validação final | A cobertura de branches tinha ficado abaixo da referência da Fase 3 (73,41% × 75,88%) porque os `switch` das classes de erro antigas viraram mapas; com os testes, 82,92% |

