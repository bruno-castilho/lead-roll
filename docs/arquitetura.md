# Arquitetura do LeadRoll

Detalhe das regras resumidas no [`AGENTS.md`](../AGENTS.md). Histórico e
motivos da organização atual: [`docs/refactor/`](refactor/).

## Por que tudo roda no navegador

O app não tem Server Actions, Route Handlers, `proxy.ts` nem `cookies()`. O
Supabase é acessado só pelo cliente do navegador, e a segurança fica na RLS e
nos triggers do banco (`supabase/migrations/`). Por isso a infraestrutura e o
composition root começam com `import "client-only"` (o Next trata o pacote
internamente), e não com `server-only`.

## Pastas

```text
src/
├── app/            rotas do Next: metadata e composição de screens/shell/módulos
├── screens/        telas que combinam módulos (uma por página)
├── shell/          moldura: AppShell, Header, Sidebar, Brand, ThemeToggle, Providers, nav-items
├── modules/<m>/    auth · brokers · leads
│   ├── domain/         entidades, valores (`as const`), regras e políticas puras
│   ├── application/    casos de uso (`makeX(deps)`), portas, erro do módulo
│   ├── infrastructure/ repositórios e gateways Supabase ("client-only")
│   ├── presentation/   componentes, hooks, `*-messages.ts`, schemas Zod, rótulos
│   ├── composition.ts  liga portas às implementações ("client-only")
│   └── index.ts        API pública do módulo
├── shared/
│   ├── domain/         Actor, UserRole, isOneOf
│   ├── infrastructure/ env.ts, supabase/client.ts, database.types.ts, postgrest-failure.ts
│   └── ui/             primitives (shadcn), components, hooks, format, routes, cn, error-message, form-errors
└── test/           cliente Supabase falso, fixtures, wrappers e setup do jsdom
```

## Regra de dependência

Verificada por `noRestrictedImports` (um override por camada em `biome.json`) e
por `noImportCycles`. Num override posterior, a configuração da regra substitui
a anterior em vez de somar: cada arquivo de produção precisa cair em um só
override de fronteira. Os arquivos `*.test.ts(x)` ficam fora dessas regras.

| De ↓ pode importar → | domain | application | infrastructure | composition | presentation | outro módulo | shared/domain | shared/infrastructure | shared/ui |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `domain` | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ |
| `application` | ✔ | ✔ | ✘ | ✘ | ✘ | ✘ | ✔ | ✘ | ✘ |
| `infrastructure` | ✔ | ✔ | ✔ | ✘ | ✘ | ✘ | ✔ | ✔ | ✘ |
| `composition.ts` | ✔ | ✔ | ✔ | — | ✘ | ✘ | ✔ | ✔ | ✘ |
| `presentation` | ✔ | ✔ | ✘ | ✔ | ✔ | só `index` | ✔ | ✘ | ✔ |
| `screens/`, `shell/` | ✘ | ✘ | ✘ | ✘ | ✘ | só `index` | ✔ | ✘ | ✔ |
| `app/` | ✘ | ✘ | ✘ | ✘ | ✘ | só `index` | ✔ | ✘ | ✔ |

- Bibliotecas: `domain` e `application` não importam React, Next, Zod, sonner,
  Supabase nem nenhum `@/…` além de `@/shared/domain`; também não usam
  `process.env`, `fetch`, `window`, `document` nem `localStorage`.
  `infrastructure` não importa React nem Next.
- Entre módulos, só pelo `index.ts` e só na direção `leads → brokers → auth`.
  Telas que precisam inverter a direção ficam em `screens/`.
- Dentro do módulo, imports relativos. Caminho profundo de outro módulo
  (`@/modules/<m>/presentation/…`) é proibido.
- A apresentação pode importar valores puros do `domain` (o Biome não
  distingue `import type`).

## Casos de uso, portas e composição

- **Caso de uso**: fábrica `makeX(deps)` que devolve a função. O primeiro
  argumento é o `Actor` quando a operação depende de quem a executa. A
  permissão é checada antes da rede, com a política do domínio
  (`canManageLeads`, `isResponsibleFor`, `canConfirmPresence`), e a falha é o
  mesmo erro que o banco daria (`reason: "forbidden"`).
- **Porta**: interface em `application/ports.ts`. Só existe para entrada e saída
  (banco, Auth). O relógio é a porta `Clock = () => Date`.
- **Repositório/gateway**: em `infrastructure/`, chama `getSupabaseClient()`
  dentro de cada método, nunca em escopo de módulo. Traduz linhas em entidades
  e falhas em erro do módulo com `classifyPostgrestFailure` + `narrowFailure`
  (tabela das classes aceitas por operação).
- **Composition root**: `composition.ts` só liga objetos (sem efeito
  colateral) e exporta os casos de uso prontos. A apresentação importa de
  `../composition` (ou `../../composition`).
- **`index.ts`**: expõe componentes, hooks, tipos e funções puras usados fora do
  módulo. Nunca reexporta `composition.ts` nem `infrastructure/`, porque é
  importado por Server Components em `app/`. Todo arquivo de hook que ele
  reexporta começa com `"use client"`.

## Erros e mensagens

- Cada módulo tem um erro de aplicação (`AuthError`, `BrokersError`,
  `LeadsError`) com `operation` e `reason`, sem texto de interface.
- A apresentação converte em pt-BR com `authErrorMessage`, `brokersErrorMessage`
  e `leadsErrorMessage`. Os textos comuns (`NETWORK_MESSAGE`,
  `SESSION_EXPIRED_MESSAGE`) e o fallback `errorMessage` ficam em
  `shared/ui/error-message.ts`.
- Os textos são contrato: os testes `*-messages.test.ts` fixam cada um.

## Testes

- Vitest 4 (`vitest.config.mts`), fuso fixo `America/Sao_Paulo`. Arquivos
  `*.test.ts(x)` ao lado do código. Componentes e hooks usam
  `// @vitest-environment jsdom` no topo do arquivo.
- `src/test/fake-supabase.ts`: cliente falso que grava cada consulta (tabela ou
  RPC e a cadeia de chamadas) e devolve respostas enfileiradas
  (`respondWith`, opcionalmente com `on: "<tabela|rpc>"`). Use-o com
  `vi.mock("@/shared/infrastructure/supabase/client", …)`, como nos testes
  existentes.
- `src/test/fixtures.ts`: `arrangeSession(MANAGER | BROKER | null)`, `leadRow`,
  `brokerRow`. `src/test/signed-in.tsx`: `renderSignedIn` e
  `renderHookSignedIn` (renderizam com a sessão já restaurada e esquecem a
  consulta do perfil).
- `src/test/app-mocks.ts`: `toast` (sonner) e `router` (next/navigation).
- Domínio e casos de uso são testados sem React nem rede, com portas falsas.
