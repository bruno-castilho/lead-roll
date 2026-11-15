<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LeadRoll

CRM de leads imobiliários: o gestor cadastra, edita, exclui e distribui leads; o
corretor confirma presença (fila de 5h), acompanha os próprios leads num Kanban,
muda a etapa e registra observações. Next.js 16 (App Router, `cacheComponents`),
React 19.3, TypeScript strict, Tailwind v4, shadcn/ui e Supabase (Auth + Postgres
com RLS), tudo no navegador. Interface e textos em pt-BR.

Regras de produto e de interface: [`docs/produto.md`](docs/produto.md).
Arquitetura em detalhe: [`docs/arquitetura.md`](docs/arquitetura.md).

## Comandos

```bash
npm install                    # dependências (npm, package-lock.json)
npm run dev                    # desenvolvimento em http://localhost:3000
npm run build                  # build de produção (precisa passar sem .env.local)
npm run lint                   # Biome: formatação, lint e regras de fronteira
npx biome check --write src    # formata e aplica correções seguras
npx tsc --noEmit               # tipos
npm test                       # todos os testes (Vitest)
npx vitest run <arquivo>       # um arquivo de teste
npm run test:coverage          # testes com cobertura
```

Variáveis (modelo em `.env.example`; `.env.local` não é versionado):
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Arquitetura

```text
src/app/        rotas: só metadata e composição
src/screens/    telas que combinam módulos (uma por página)
src/shell/      moldura do app (AppShell, Header, Sidebar, Providers)
src/modules/    auth · brokers · leads, cada um com
                domain/ application/ infrastructure/ presentation/ composition.ts index.ts
src/shared/     domain (Actor) · infrastructure (env, Supabase) · ui (primitives, componentes, hooks)
src/test/       dublês e helpers de teste
```

- Dependências apontam para dentro: `presentation → application → domain`;
  `infrastructure` implementa as portas de `application`; só `composition.ts`
  conhece as duas pontas. O lint (`biome.json`) falha se a regra for violada.
- Entre módulos, só pelo `index.ts` e só na direção `leads → brokers → auth`.
- `app/`, `screens/` e `shell/` importam módulos só pelo `index.ts`.

## Onde colocar código novo

| Situação | Local |
| --- | --- |
| Regra de negócio, valor ou política (quem pode o quê) | `src/modules/<m>/domain/` (TypeScript puro, com teste) |
| Operação do app (cadastrar, distribuir, entrar…) | caso de uso `makeX(deps)` em `src/modules/<m>/application/` |
| Acesso ao Supabase (tabela, RPC, Auth) | `src/modules/<m>/infrastructure/` + porta em `application/ports.ts` + ligação em `composition.ts` |
| Componente, hook ou texto de uma funcionalidade | `src/modules/<m>/presentation/` (exponha no `index.ts` só o que for usado fora) |
| Texto de erro mostrado ao usuário | `src/modules/<m>/presentation/<m>-messages.ts` |
| Tela que junta módulos | `src/screens/` (a página em `src/app/` só a renderiza) |
| Componente, hook ou formatação sem regra de negócio | `src/shared/ui/` |
| Componente do shadcn | `npx shadcn@latest add <nome> -y` (gera em `src/shared/ui/primitives/`) |
| Variável de ambiente | `src/shared/infrastructure/env.ts` |
| Nova tabela, coluna, policy ou função | migration em `supabase/migrations/` (só com pedido explícito) |

## Convenções

- Todo caso de uso que depende de quem age recebe o `Actor` e checa a política
  do domínio antes de chamar a porta.
- Erros: cada módulo lança o próprio erro (`AuthError`, `BrokersError`,
  `LeadsError`) com `operation` e `reason`, sem texto. A apresentação mostra
  `<m>ErrorMessage(error)`. Nunca monte mensagem de usuário em `domain`,
  `application` ou `infrastructure`.
- Falhas do PostgREST: `classifyPostgrestFailure` + `narrowFailure`, com as
  classes que a operação aceita.
- Repositórios chamam `getSupabaseClient()` dentro dos métodos; infraestrutura e
  `composition.ts` começam com `import "client-only"`.
- O `index.ts` de um módulo nunca reexporta `composition.ts` nem
  `infrastructure/`; todo hook que ele reexporta começa com `"use client"`.
- Datas e ids só em efeitos ou handlers (com `cacheComponents`, `Date.now()`
  durante a renderização quebra o prerender). No domínio, o relógio é injetado
  (`now: Date` ou a porta `Clock`).
- Valores de `<Select>` e do dnd-kit: estreite com `isOneOf`/`isLeadStage`, sem `as`.
- Estados transitórios de tela (diálogo aberto, "enviando") são limpos com
  `useResetOnHide` (as páginas não desmontam ao navegar).
- Atalhos de teclado só com `useHotkey`. Leia a URL em handlers com
  `window.location`; evite `useSearchParams`.
- Nomes de negócio: `Broker`, `Profile`, `Actor`, `Lead`; booleanos com `is`/`has`/`can`.

## Testes

- Todo arquivo novo de `domain/` e `application/` tem teste unitário, sem React e
  sem rede (portas falsas).
- Repositórios: teste com `src/test/fake-supabase.ts` (consulta enviada,
  mapeamento e `reason` de cada falha).
- Textos de erro: tabela em `<m>-messages.test.ts`.
- Componentes e hooks: `// @vitest-environment jsdom`, Testing Library e
  `renderSignedIn`/`renderHookSignedIn` (`src/test/signed-in.tsx`).
- Testes ficam ao lado do código, como `*.test.ts(x)`.

## Proibições

- Nada de API routes, Route Handlers, Server Actions, `proxy.ts` ou `cookies()`.
- Nada de `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable` ou `as` para
  calar o compilador; não afrouxe regras do `biome.json` nem apague testes.
- Nunca crie o cliente Supabase em escopo de módulo nem durante a renderização.
- Nunca use `user.role` do Supabase nem `user_metadata` como perfil: o papel vem
  de `profiles`.
- A chave `service_role` nunca entra no projeto; nada sensível com `NEXT_PUBLIC_`.
- Não recrie lógica de distribuição no cliente; a regra fica no banco.
- Não adicione dependência sem aprovação.
- Não reverta os ajustes pedidos pelo usuário listados em `docs/produto.md`.
- Não deixe código morto: ao remover um recurso, remova componentes, hooks,
  exports e testes que só existiam por ele.
- Não encerre um `next dev` do usuário que já esteja rodando na porta 3000.
- Não edite o bloco `nextjs-agent-rules` deste arquivo.

## Definição de pronto

1. `npm run lint` sem erros nem avisos, `npx tsc --noEmit`, `npm test` e
   `npm run build` passam.
2. A regra de dependência foi respeitada (o lint verifica) e não há ciclos.
3. Regra de negócio nova tem teste no domínio ou no caso de uso.
4. Este arquivo e os de `docs/` foram atualizados se uma convenção mudou.

## Armadilhas conhecidas

- **Páginas preservadas entre navegações (React Activity)**: limpe estados
  transitórios com `useResetOnHide`. O botão de login travava depois do logout.
- **`RoleGuard`**: enquanto `ready` é falso (inclusive no servidor), renderiza a
  página dentro de `<div hidden>`. O Next precisa disso para validar a
  navegação instantânea ("segment was dropped"); `<Activity mode="hidden">` não
  resolve. Os layouts de `app/` compõem `RoleGuard` + `AppShell`.
- **`Header` só mostra a presença na área do corretor** (`role === "broker"`):
  o `PresenceProvider` só existe lá, e a área do gestor pode renderizar oculta
  com um perfil de corretor durante a restauração da sessão.
- **Overrides do Biome não somam**: a configuração de uma regra num override
  posterior substitui a anterior. Mantenha um override de fronteira por camada.
- **`role="..."` literal numa prop** é tomado como atributo ARIA pelo lint
  (por isso `AppShell` recebe `userRole`).
- **`NEXT_PUBLIC_*` só é embutida quando escrita por extenso**
  (`process.env.NEXT_PUBLIC_X`), por isso a leitura literal em `env.ts`.
- **Largura do Sheet do shadcn**: use variantes com prefixo `data-[side=…]:`.
- **Login no Supabase**: não faça `await` de outras chamadas do Supabase dentro
  de `onAuthStateChange` (risco de deadlock).
- **Verificação no navegador**: use `npm run build` + `npx next start -p <porta>`
  com Playwright instalado fora do projeto; ele grava dados no Supabase
  configurado, então só rode com autorização.

## Dívida técnica

Pendências, bugs registrados e métricas: [`docs/refactor/03-relatorio-final.md`](docs/refactor/03-relatorio-final.md).
Plano e decisões da refatoração: [`docs/refactor/02-plano.md`](docs/refactor/02-plano.md).
