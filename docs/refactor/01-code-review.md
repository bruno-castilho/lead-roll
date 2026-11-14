# 01 — Linha de base e code review

Fases 0 e 1 do [PRD](PRD.md). Data: 2026-11-14. Commit de referência: `095c00c` (main).
Nenhum arquivo de código foi alterado nestas fases.

## 1. Contexto do projeto (seção 2 do PRD)

| Campo | Valor |
| --- | --- |
| Aplicação e domínio | **LeadRoll**: CRM de leads imobiliários. O gestor cadastra, edita, exclui e distribui leads; o corretor confirma presença (fila de 5h), acompanha os próprios leads num Kanban, muda a etapa e registra observações. |
| Fluxos críticos (deduzidos) | 1. Login (gestor e corretor), restauração da sessão, logout e logout em outra aba. 2. `RoleGuard`: sem sessão → `/login`; perfil errado → página inicial do perfil; conteúdo oculto enquanto `ready` é falso. 3. Gestor: listar, filtrar, paginar, cadastrar, editar e excluir leads. 4. Gestor: distribuir leads (RPC `distribute_leads`). 5. Corretor: confirmar e renovar presença; expiração automática. 6. Corretor: mudar a etapa (arrastar, menu do card, seletor nos detalhes), com reversão se o banco recusar. 7. Corretor: registrar observação. 8. Gestor: ver presença dos corretores. |
| Áreas que não devem ser tocadas (suposição) | `supabase/` (schema, migrations, `config.toml`); bloco `nextjs-agent-rules` do `AGENTS.md`; `.env*`; `next.config.ts` (política de cache/renderização); `.devcontainer/`; conteúdo de `src/components/ui/**` (gerado pelo shadcn; no máximo movido); tokens de `globals.css`. |
| Branch base | `main` (o PRD pede trabalhar em `refactor/clean-architecture`; ver conflito C-01). |
| Next.js, router, TS | Next **16.4.6** (App Router, Turbopack, `cacheComponents` e `partialPrefetching`), React **19.3.0**, TypeScript 5 com `strict`. |
| Bibliotecas | Dados/auth: `@supabase/supabase-js` 2.119 + `@supabase/ssr` 0.12 (só no navegador). Estado: React (contextos e hooks), sem store. UI: shadcn/ui (`radix-ui`), Tailwind v4, lucide, sonner, next-themes, `@dnd-kit/core`. Validação: Zod 4 (+ `react-hook-form` e `@hookform/resolvers` só no login). Testes: **nenhuma**. |
| Gerenciador de pacotes | npm (`package-lock.json`); Node 24.22.3, npm 11.19.1. |
| Comandos | `npm run lint` (`biome check`), `npx tsc --noEmit`, `npm run build`. Não existe script de testes. |

## 2. Linha de base (Fase 0, executada nesta sessão)

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | **Falha (exit 1)**: 1 erro de formatação em `.devcontainer/devcontainer.json`. Nenhum erro em `src/`. 111 arquivos checados. |
| `npx tsc --noEmit` | Passa (exit 0), sem avisos. |
| `npm run build` (com `.env.local`) | Passa. 8 rotas, todas `○ (Static)`. |
| `next build` com `NEXT_PUBLIC_SUPABASE_*` vazias | Passa (requisito do `AGENTS.md`). |
| Testes | Não há framework nem testes. Cobertura: **inexistente (0%)**. |
| Ciclos de import (`biome lint --only=suspicious/noImportCycles src`) | 0 ciclos entre arquivos. Entre pastas há o ciclo `hooks ↔ contexts` (M-14). |
| `any` / `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | 0 / 0 / 0 / 0 |
| `biome-ignore` | 1 (`src/components/leads/lead-table.tsx:91`, justificado: a11y) |
| Asserções `as` | 17 (M-08) |
| Non-null `!` | 0 |
| `process.env` | 2 (`src/lib/supabase/client.ts:24-25`) |
| `Date.now()`/`new Date()`/`Date.parse()` | 8 (formatação, presença e serviço de corretores) |
| `console.*`, `TODO`/`FIXME` | 0 |
| Segredos | Nenhum valor de chave no histórico do git (busca por `eyJhbGci`, `sb_secret_` e `service_role`). `.env.local` é ignorado. |

### Contratos a preservar

- **Rotas** (saída do build): `/`, `/_not-found`, `/login`, `/gestor`, `/gestor/leads`, `/gestor/corretores`, `/corretor`, `/corretor/leads`. Todas estáticas.
- **Metadados**: título padrão `LeadRoll`, modelo `%s · LeadRoll`; páginas `Entrar`, `Leads`, `Corretores`, `Meus leads`; `themeColor` claro e escuro.
- **Endpoints**: nenhum. Não há API routes, Route Handlers, Server Actions, `middleware.ts` nem `proxy.ts` (proibidos pelo `AGENTS.md`).
- **Variáveis de ambiente**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Contrato com o Supabase**: tabelas `profiles`, `leads`, `lead_observations` e `broker_presence`; RPCs `confirm_presence` e `distribute_leads`; Auth com `signInWithPassword`, `signOut({ scope: "local" })`, `getSession` e `onAuthStateChange("SIGNED_OUT")`; colunas e ordenações das consultas (`created_at desc`; corretores por `name asc`).
- **Textos**: todas as mensagens de erro, toasts e rótulos pt-BR atuais (inclusive os com defeito, como em BUG-02).
- **Atalhos**: `Ctrl/Cmd+K` e `N`.

## 3. Mapa de dependências entre pastas

Contagem de imports por par de pastas (sem `react`, `lucide-react` e `components/ui`):

```text
app                 → next(10) components/layout(4) components/pages(3) lib(3) components/auth contexts hooks providers
components/auth     → errors(2) services lib hooks components/layout components/shared react-hook-form
components/layout   → lib(13) hooks(4) components/shared(2) services sonner next-themes
components/leads    → lib(24) components/shared(8) hooks(3) services(3) sonner(3) components/observations(2)
components/pages    → hooks(14) components/shared(11) components/leads(7) lib(4) kanban brokers layout
components/kanban   → lib(10) components/shared(4) @dnd-kit(3) hooks
contexts            → services(2) sonner(2) errors @supabase/supabase-js hooks lib
hooks               → lib(7) sonner(4) services(4) contexts(2)
services            → errors(14) lib(8) @supabase/supabase-js(2)
errors              → @supabase/supabase-js lib
lib                 → @supabase/ssr @supabase/supabase-js zod cn
```

O que o mapa mostra:

- Componentes, contextos e hooks importam `services` direto (7 arquivos), e `services` importa o SDK. A interface depende da infraestrutura (A-01).
- `errors` importa o SDK do Supabase, e a interface importa `errors` (A-02).
- Ciclo entre pastas `hooks ↔ contexts` (M-14).
- `lib` mistura domínio, apresentação e infraestrutura: tipos, constantes com classes Tailwind, Zod e o cliente Supabase (M-07).

## 4. Os dez arquivos de maior risco

Critérios: tamanho, acoplamento (imports e dependentes) e frequência de mudança (commits em `git log`).

| # | Arquivo | Linhas | Commits | Por quê |
| --- | --- | --- | --- | --- |
| 1 | `src/services/leads-service.ts` | 228 | 8 | 7 operações, mapeamento de linhas, tradução de erros; usado por 6 arquivos de UI |
| 2 | `src/components/pages/manager-leads-page.tsx` | 328 | 7 | 20 imports, 6 estados de UI, filtros, paginação e 4 diálogos |
| 3 | `src/components/leads/lead-form.tsx` | 326 | 5 | validação, normalização, cadastro e edição na mesma função |
| 4 | `src/contexts/session.tsx` | 100 | 2 | raiz da autenticação; fluxo de restauração e logout forçado |
| 5 | `src/components/auth/login-form.tsx` | 156 | 2 | fluxo de login orquestrado no componente |
| 6 | `src/components/layout/role-guard.tsx` | 51 | 2 | comportamento sutil (`<div hidden>`, "segment was dropped") |
| 7 | `src/contexts/presence.tsx` | 125 | 1 | relógio, `setTimeout` e regra de presença |
| 8 | `src/hooks/use-leads.ts` | 88 | 5 | estado da lista de leads das duas páginas |
| 9 | `src/components/pages/broker-leads-page.tsx` | 96 | 6 | filtro de permissão no cliente; compõe 7 hooks |
| 10 | `src/components/leads/lead-details.tsx` | 239 | 4 | flags `mode` e callbacks opcionais decidem o que aparece |

## 5. Achados

Severidade conforme a seção 7 do PRD. Status inicial de todos: **aberto**.

### Crítico

Nenhum. Não há segredo versionado, chave `service_role` no código, `dangerouslySetInnerHTML` nem acesso a dados fora da RLS. A chave publicável é pública por design, e a autorização real está nas policies e nos triggers do banco.

### Alto

| ID | Categoria | Arquivo:linha | Evidência | Impacto | Correção proposta |
| --- | --- | --- | --- | --- | --- |
| A-01 | Dependência | `components/auth/login-form.tsx:16,45-46`; `components/layout/user-menu.tsx:19,31`; `components/leads/delete-lead-dialog.tsx:20,52`; `components/leads/distribution-dialog.tsx:23,60`; `components/leads/lead-form.tsx:30,158,166`; `hooks/use-leads.ts:7`; `hooks/use-brokers.ts:7`; `hooks/use-change-stage.ts:7`; `hooks/use-add-observation.ts:6`; `contexts/session.tsx:14`; `contexts/presence.tsx:14-17` | Componentes, hooks e contextos chamam `AuthService`, `LeadsService`, `BrokersService` e `PresenceService`, que usam o Supabase direto | Nenhuma tela pode ser testada sem o Supabase; mudar a fonte de dados exige mexer na interface | Casos de uso em `application/` atrás de portas; a apresentação chama o composition root |
| A-02 | Dependência | `contexts/session.tsx:3,18-19,22`; `errors/sign-in-error.ts:1-5` (importado por `login-form.tsx:13`) | Tipos `Session` e `User` do SDK no contexto React; o erro de login importa `@supabase/supabase-js` e `lib/supabase/client` | O SDK vaza para a apresentação; trocar ou mockar o Supabase afeta a UI | Erros e tipos de domínio sem SDK; o adaptador traduz os erros do SDK |
| A-03 | Regra na UI | `login-form.tsx:42-61`; `contexts/session.tsx:37-73` | A regra "sem perfil válido não há acesso" (entrar → buscar perfil → sair se falhar) está no componente e de novo no provider, com condições diferentes (o login sai com qualquer `ProfileError`; a restauração só com `missing` ou `auth`) | Regra de acesso duplicada e não testável | Casos de uso `signIn` e `restoreSession` em `auth/application`, preservando as duas condições |
| A-04 | Regra duplicada | `contexts/presence.tsx:32-37,81`; `services/brokers-service.ts:27-35` | "Presente enquanto `expiresAt > agora`" está escrita duas vezes, com `Date.now()` embutido | Regra de negócio fora do domínio, com relógio não injetável | `isPresenceActive(presence, now)` no domínio, com relógio injetado |
| A-05 | Regra na UI | `hooks/use-lead-stats.ts:7-27`; `distribution-dialog.tsx:43-46,72`; `lib/lead-filters.ts:41-42` | A carga do corretor ("em atendimento" = `ACTIVE_STAGES`) e "lead pendente = sem responsável" são calculadas em hook e componente; "sem responsável" aparece em 3 lugares | Regra de negócio espalhada pela interface | Funções de domínio `isUnassigned` e `brokerWorkload`, com testes |
| A-06 | Autorização na UI | `components/pages/broker-leads-page.tsx:36-39`; `leads/lead-details.tsx:40,131,140,151,225`; `layout/header.tsx:32`; `layout/presence-toggle.tsx:24-25` | O que cada perfil pode fazer é decidido por flags (`mode`, `role ===`, callbacks opcionais) e por um filtro na página | Viola a regra 4 do Next no PRD (autorização é regra de negócio); a política fica implícita | Política de domínio (`canEditLead`, `canChangeStage(actor, lead)` etc.) usada pelos casos de uso e pela UI; a RLS continua sendo a autoridade |
| A-07 | Regra na UI | `leads/lead-form.tsx:132-177` (normalização em `147-153`) | O formulário valida, normaliza o telefone para a máscara (que é o formato gravado), converte e-mail vazio em `undefined` e decide entre cadastrar e editar | Regra de gravação do lead dentro do componente | Casos de uso `createLead` e `updateLead` recebem o DTO; normalização no domínio |
| A-08 | Testabilidade | `lib/supabase/client.ts:14-28`; `services/*.ts`; `contexts/presence.tsx:34,81` | Singleton do cliente importado direto pelos serviços, sem ponto de injeção; relógio global | Sem como testar os serviços e as regras sem rede ou monkey-patch | Portas + fábricas no composition root; `now()` injetado |
| A-09 | Testes | `package.json` | Nenhum framework, script ou teste | A refatoração não tem rede de segurança | Fase 3 (dependência a aprovar; ver plano) |
| A-10 | Verificação | `biome.json` | Sem regras de fronteira nem de ciclos | A regra de dependência seria só convenção | `noRestrictedImports` por pasta (overrides) e `noImportCycles`, ambos já disponíveis no Biome 2.4.2 |

### Médio

| ID | Categoria | Arquivo:linha | Evidência | Correção proposta |
| --- | --- | --- | --- | --- |
| M-01 | Duplicação | `services/auth-service.ts:77-84`; `brokers-service.ts:19-26`; `leads-service.ts:52-64,79-86`; `presence-service.ts:23-30,45-55` | A classificação de falhas do PostgREST (`status 0`, `401`/`PGRST30x`, `403`/`42501`, `23514`/`22P02`) está copiada 6 vezes | Um classificador em `shared/infrastructure` |
| M-02 | Duplicação / camadas | `src/errors/*.ts` (13 classes) | Mesma estrutura em 11 classes; "Sua sessão expirou" repetida 11 vezes e "Não foi possível conectar" 13 vezes; mensagens de UI montadas em erros lançados pela infraestrutura (regra 8 do Next no PRD) | Erros de aplicação com `reason`; mapa `reason → mensagem` na apresentação, com os mesmos textos |
| M-03 | Erros | `errors/sign-in-error.ts:7-15`; `errors/sign-out-error.ts:1`; `services/auth-service.ts:41,49,58-62,112-114`; `contexts/session.tsx:51`; `login-form.tsx:52`; 11 ocorrências de `error instanceof Error ? error.message : String(error)` | Erros sem `name`, reembrulho circular, `catch {}` que descarta o erro original, falha de configuração engolida | Erros nomeados, conversão única `toErrorMessage`; documentar os `catch` intencionais |
| M-04 | Tamanho | `manager-leads-page.tsx` (328), `lead-form.tsx` (326), `lead-details.tsx` (239) | Componentes acima de ~200 linhas com várias responsabilidades | Extrair `QuickFilters`, `useLeadForm`, seções dos detalhes |
| M-05 | Flags | `lead-details.tsx:40`; `lead-filters.tsx:72`; `kanban/lead-card.tsx:33-35`; `kanban/kanban-column.tsx:19` | Props `mode`, `variant`, `overlay` e `droppable` mudam o comportamento | Capacidades vindas da política (A-06); remover a variante morta (M-06) |
| M-06 | Código morto | `lead-filters.tsx:71-72,104-112` e `lib/lead-filters.ts` (`interest`); `shared/loading-state.tsx:54-72` (`variant="table"`); `contexts/session.tsx:18-19,22` (`user`, `session`); `auth-service.ts:46` (`weakPassword`); exports sem uso: `matchesQuery`, `SortOrder`, `NavItem`, 9 tipos `*Failure`, 4 aliases `*Enum` | A variante `broker` dos filtros não é usada (a página do corretor não tem filtros, por pedido do usuário); `user`, `session` e `weakPassword` nunca são lidos | Remover |
| M-07 | Coesão | `lib/constants.ts`; `lib/format.ts`; `components/layout/nav-items.ts:21-24` | `constants.ts` mistura domínio (ordem das etapas, `ACTIVE_STAGES`), apresentação (rótulos, classes Tailwind em `STAGE_DOT`, `PAGE_SIZES`) e rotas; `format.ts` mistura telefone, datas, busca e plural; `HOME_BY_ROLE` (regra de navegação) fica num arquivo de layout e é importado por `app/page.tsx`, pelo login e pelo guard | Separar por camada e módulo |
| M-08 | Tipos | 17 `as`: `validation.ts:6-13`; `constants.ts:12-14,43-45,57-59`; `kanban/lead-kanban.tsx:29-30,53,58-59`; `lead-filters.tsx:101,109,119,153`; `stage-select.tsx:29`; `lead-card.tsx:84`; `manager-brokers-page.tsx:43` | Asserções para valores vindos de `Select` e `dnd-kit` e para montar `Record` | Tuplas `as const` + type guards (`isLeadStage`) |
| M-09 | Tipos duplicados | `lib/types.ts:12-56`; `lib/supabase/database.types.ts:6-29`; `lib/constants.ts:3-59`; `lib/validation.ts:6-13` | Etapa, origem e interesse escritos à mão em 4 lugares | Uma fonte no domínio (`as const`); tipos, Zod e rótulos derivados dela; tipos do banco só na infraestrutura |
| M-10 | Nomes | `lib/types.ts:3`; `services/auth-service.ts:14`; `layout/user-menu.tsx:22`; `contexts/session.tsx:22` | `User` significa "corretor com presença" e colide com `User` do Supabase; `AuthProfile`, `User` e `currentUser` nomeiam a mesma pessoa; `onSession` é um setter com nome de evento | `Broker`, `Profile` e `Actor`; `startSession` |
| M-11 | Tipos | `lib/types.ts:30,36`; `leads-service.ts:40,101,124` | `email?: string` contra `assignedAt: string \| null`: dois padrões de ausência | Padronizar (decisão no plano) |
| M-12 | `app/` grosso | `app/page.tsx:1-20`; `app/login/page.tsx:9-19` | A página raiz é Client Component com lógica de redirecionamento; o login tem marcação da marca duplicada de `Brand` (`layout/sidebar.tsx:68-82`) | Mover para componentes de apresentação; `app/` só compõe |
| M-13 | Ambiente | `lib/supabase/client.ts:24-26` | Variáveis lidas e validadas no cliente do banco | `shared/infrastructure/env.ts`, com leitura literal (exigida pelo Next para `NEXT_PUBLIC_*`) |
| M-14 | Ciclo de pastas | `hooks/use-session.ts:2`; `contexts/presence.tsx:12` | `hooks → contexts → hooks` | Hook junto do provider no módulo |
| M-15 | Responsabilidade | `layout/role-guard.tsx:9,47` | O guard também monta o `AppShell` | Compor `RoleGuard` e `AppShell` no layout da rota, mantendo o mesmo DOM |
| M-16 | Validação | `lib/validation.ts:2,15-39,52-56`; `errors/add-observation-error.ts:26` | O schema depende de constantes da UI; limites (nome 3–80, telefone 10/11 dígitos, observação 1–1000) repetidos em schema, mensagens e SQL | Constantes de limite no domínio; schema e mensagens derivados delas |
| M-17 | Estado | `hooks/use-change-stage.ts:17-28` | Atualização otimista e reversão com um retrato capturado na chamada (BUG-04) | Caso de uso + hook de apresentação; registrar o bug |
| M-18 | Documentação | `README.md:69-95,117,128` | Documenta `npm run seed:auth`, `scripts/seed-demo-users.mjs` e `SUPABASE_SERVICE_ROLE_KEY`, que não existem no repositório | Corrigir na Fase 7 (texto de documentação, não de produto) |

### Baixo

| ID | Arquivo:linha | Evidência | Correção |
| --- | --- | --- | --- |
| B-01 | `lib/format.ts:78` | Regex com caracteres combinantes literais (`/[̀-ͯ]/g`), ilegível | `/[̀-ͯ]/g` |
| B-02 | `lib/utils.ts:1` | `utils.ts` genérico que só reexporta `cn` | `shared/ui/cn.ts` |
| B-03 | `leads/lead-table.tsx:3,29` | `Fragment` explícito sem `key` | `<>` |
| B-04 | `leads/lead-form.tsx:127`; `leads/lead-filters.tsx:82` | Helpers chamados `set` | `setField`, `setFilter` |
| B-05 | `kanban/lead-kanban.tsx:43,49`; `manager-leads-page.tsx:81` | Números mágicos: `768px`, `distance: 6`, tamanho de página `10` fora de `PAGE_SIZES` | Constantes nomeadas |
| B-06 | `kanban/lead-kanban.tsx:65` | Busca o rótulo em `LEAD_STAGES` em vez de `STAGE_LABEL` | Usar o mapa |
| B-07 | `leads/broker-cell.tsx:10-12`; `leads/lead-details.tsx:102-104` | Badge "Sem responsável" duplicado | Componente único |
| B-08 | `next.config.ts:4` | Comentário do template `/* config options here */` | Remover (arquivo protegido; só com aprovação) |
| B-09 | `.devcontainer/devcontainer.json` | Lint da linha de base falha por formatação | Formatar em commit separado (pede aprovação) |

## 6. Bugs suspeitos (não corrigidos)

| ID | Onde | Evidência | Efeito observável |
| --- | --- | --- | --- |
| BUG-01 | `components/pages/manager-brokers-page.tsx:16-17` | `const leads: Lead[] = []` | Em `/gestor/corretores`, "Leads atribuídos" e "Em atendimento" mostram sempre 0. O `AGENTS.md` já registra isso como pendência. |
| BUG-02 | `services/auth-service.ts:58-62` | O `throw` dentro do `try` é capturado pelo próprio `catch`, que descarta a mensagem do servidor e lança "**Error** ao fazer logout…" | Se o logout falha no servidor, o toast mostra o texto com erro de português e sem o motivo real |
| BUG-03 | `leads/lead-table.tsx:26` + `leads/broker-cell.tsx:8-14`; `leads/lead-details.tsx:197-201` | `brokers.find(...)` sem resultado vira "Sem responsável" | Enquanto os corretores carregam, ou se a busca falhar, leads distribuídos aparecem como "Sem responsável" na tabela e nos detalhes |
| BUG-04 | `hooks/use-change-stage.ts:18,26` | A reversão usa o lead capturado na chamada | Com duas mudanças seguidas, se a primeira falhar depois que a segunda deu certo, a tela volta para a etapa original enquanto o banco guarda a segunda |
| BUG-05 | `contexts/presence.tsx:64-67` + `pages/broker-leads-page.tsx:45` | Erro ao buscar a presença deixa `expiresAt = null` | Depois de uma falha de rede, o corretor vê o aviso "Você está ausente" mesmo que esteja presente |
| BUG-06 | `leads/lead-form.tsx:185,306-311` | "Cancelar", `Esc` e o overlay continuam ativos durante o envio, ao contrário dos diálogos de exclusão e de distribuição | O painel fecha no meio do envio; o lead é salvo mesmo assim (inconsistência, talvez intencional) |

## 7. Conflitos entre PRD, `AGENTS.md` e memória

| ID | Conflito | Encaminhamento |
| --- | --- | --- |
| C-01 | O PRD (regra 6) manda trabalhar na branch `refactor/clean-architecture`; a memória do projeto diz "commitar na main, sem criar branch" | Pergunta na Parada 1 (recomendo a branch do PRD) |
| C-02 | O PRD supõe composition root e infraestrutura `server-only` e Server Actions; o `AGENTS.md` proíbe Server Actions, Route Handlers, `proxy.ts` e `cookies()`, e o Supabase só roda no navegador | Prevalece a restrição do `AGENTS.md` (regra 10 do PRD). Composition root e infraestrutura marcados com `import "client-only"` (tratado pelo próprio Next, sem dependência nova) |
| C-03 | O PRD pede `"use client"` só nas folhas e nenhum `useEffect` buscando dados que o servidor poderia entregar; aqui toda a busca é no cliente por decisão do `AGENTS.md` | Mantido; mover a fronteira mudaria a renderização (fora do escopo). Registrado como decisão |
| C-04 | O PRD permite `domain` na apresentação "só com `import type`"; o `noRestrictedImports` do Biome não distingue `import type` | Pergunta na Parada 1 |
| C-05 | A estrutura de pastas e os nomes de serviços citados no `AGENTS.md` vão mudar | Atualização na Fase 7 |
