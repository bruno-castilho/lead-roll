<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LeadRoll

CRM para gerenciamento e distribuição de leads imobiliários entre corretores.
Etapa atual: **somente frontend (UI-first)**. Todos os dados são fictícios e
vivem no estado local do React. A interface e os textos são em português (pt-BR).

## Regras desta etapa

- Não criar backend, banco de dados, API routes, Server Actions, autenticação real
  (JWT/cookies) nem integrações externas (Supabase, Firebase etc.).
- Usar apenas `src/data/mock.ts` e o estado em `src/store`. Ao recarregar a página
  os dados voltam ao estado inicial. Só o id do usuário conectado fica em
  `sessionStorage` (`leadroll:session`).
- Links nativos são permitidos: `tel:`, `mailto:` e `https://wa.me/55<número>`
  (botão "WhatsApp" nos detalhes do lead).
- Não adicionar funcionalidades não pedidas: nada de imóveis, contratos,
  comissões, relatórios ou campanhas. O foco é cadastrar, distribuir e
  acompanhar leads.
- Não deixar código morto. Ao remover uma tela ou recurso, remova também os
  componentes, hooks, constantes, rotas e campos de estado que só existiam por
  causa dele.

## Stack e comandos

- Next.js 16 (App Router, Turbopack, `cacheComponents` e `partialPrefetching`
  ligados em `next.config.ts`), React 19.3 e TypeScript strict.
- Tailwind CSS v4, com tokens definidos em `src/app/globals.css`.
- shadcn/ui (estilo `radix-nova`, base Radix) em `src/components/ui`.
- Lucide (ícones), Zod 4 (validação), sonner (toasts), next-themes (tema) e
  `@dnd-kit/core` (arrastar e soltar no Kanban).
- Fonte Inter via `next/font`, exposta como `--font-inter`.

```bash
npm run dev          # servidor de desenvolvimento (porta 3000)
npm run build        # build de produção (precisa passar)
npm run lint         # biome check
npx biome check --write src   # formata e aplica correções seguras
npx tsc --noEmit
```

Antes de concluir qualquer mudança, rode `npm run lint`, `npx tsc --noEmit` e
`npm run build`.

## Rotas e perfis

| Rota | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | todos | redireciona para `/login` ou para a página inicial do perfil |
| `/login` | público | login simulado, com seletor de contas de demonstração |
| `/gestor` | gestor | redireciona para `/gestor/leads` |
| `/gestor/leads` | gestor | página inicial do gestor: tabela, filtros, CRUD e distribuição |
| `/gestor/corretores` | gestor | presença e carga de leads de cada corretor |
| `/corretor` | corretor | redireciona para `/corretor/leads` |
| `/corretor/leads` | corretor | Kanban com os próprios leads |

- O menu do gestor vem de `src/components/layout/nav-items.ts`, e a página
  inicial de cada perfil vem de `HOME_BY_ROLE`. Os caminhos ficam em
  `ROUTES`, em `src/lib/constants.ts`.
- A tela "Visão geral" (dashboard) foi **removida de propósito**. Não recriar
  sem pedido.
- Contas de demonstração (senha `123456`): `gestor@leadroll.demo`, e para os
  corretores `ana@`, `carlos@`, `juliana@` e `marcos@leadroll.demo`. Marcos
  começa ausente.

## Estrutura de pastas

```
src/
  app/                 rotas (page.tsx fino que só renderiza o componente de página)
  components/
    pages/             telas completas (manager-leads, manager-brokers, broker-leads)
    layout/            AppShell, Sidebar, Header, RoleGuard, PresenceToggle, ThemeToggle, UserMenu
    leads/             tabela, formulário, detalhes, filtros, diálogos de exclusão e distribuição
    kanban/            LeadKanban, KanbanColumn, LeadCard
    observations/      ObservationForm, ObservationList
    brokers/           BrokerCard
    shared/            EmptyState, LoadingState, PageHeader, Pagination, SearchInput, badges, Kbd
    providers/         ThemeProvider, AppStoreProvider, TooltipProvider, Toaster
    ui/                shadcn/ui (gerado; o lint fica desligado aqui)
  store/               reducer.ts (transições puras) e app-store.tsx (Context + ações)
  lib/                 tipos, constantes, distribuição, filtros, formatação, validação (Zod)
  hooks/               useLeadStats, useChangeStage, useHotkey, useMediaQuery, useResetOnHide
  data/mock.ts         usuários e leads fictícios
```

## Estado e dados

- Há **uma única fonte de verdade**: `AppStoreProvider` (`src/store/app-store.tsx`).
  Os componentes leem e alteram dados apenas por `useAppStore()`. Não criar
  estados paralelos de leads ou usuários.
- As mudanças passam pelo `appReducer`, que é puro. Para um recurso novo, crie a
  ação no reducer e exponha um método no store. Isso mantém fácil trocar os mocks
  por serviços reais no futuro.
- Os leads são criados no `useEffect` de inicialização (`app/init`), não no
  initializer do `useState`. Com `cacheComponents`, chamar `Date.now()` ou
  `new Date()` durante a renderização quebra o prerender. Gere datas e ids só
  em efeitos ou handlers.
- `ready` indica que a sessão foi restaurada no navegador. Antes disso o estado
  está vazio.
- O responsável do lead é guardado como `brokerId`. Para obter o nome, use
  `getUser(id)`.
- Etapas (`LeadStage`): `new`, `contacted`, `visit_scheduled`, `proposal`,
  `won`, `lost`. Os rótulos e as cores de cada etapa estão em `constants.ts`.
  `ACTIVE_STAGES` define o que conta como "em atendimento".

### Distribuição (round-robin)

- Toda a lógica fica em `src/lib/distribution.ts`. `planDistribution` gera a
  prévia e `applyDistribution` aplica o resultado. O diálogo e o reducer usam
  as mesmas funções, para que a prévia e o resultado nunca divirjam.
- Entram somente leads sem responsável (os mais antigos primeiro) e corretores
  com `isPresent`. Cada lead distribuído recebe `stage: "new"` e `assignedAt`.
- `roundRobinCursor` guarda o último corretor que recebeu um lead. A próxima
  distribuição começa no corretor seguinte da lista completa.

## Permissões (simuladas)

- `RoleGuard` (`components/layout/role-guard.tsx`) é usado em
  `app/gestor/layout.tsx` e `app/corretor/layout.tsx`. Não remover o
  comportamento abaixo:
  - Enquanto `ready` é falso (inclusive no servidor), a página é renderizada
    **oculta** (`<div hidden>`). O Next precisa disso para validar a
    "instant navigation". Se a página não for renderizada, o dev mostra o erro
    "segment was dropped". `<Activity mode="hidden">` **não** resolve, porque
    não é renderizado no servidor.
  - Sem sessão, o guard redireciona para `/login`. Com o perfil errado,
    redireciona para a página inicial do próprio perfil, e o conteúdo protegido
    não é renderizado.
- O corretor vê apenas leads com `brokerId === currentUser.id`. Ele não
  cadastra, não exclui, não muda o responsável e não distribui leads.
- O gestor não altera a etapa de um lead. Nos detalhes, ele vê as observações
  apenas para leitura.

## Armadilhas do Next 16 já encontradas

- **Estado preservado entre navegações (React Activity):** as páginas não são
  desmontadas ao trocar de rota. Estados transitórios, como diálogos abertos e
  indicadores de "enviando", precisam ser limpos com
  `useResetOnHide(() => ...)` (`src/hooks/use-reset-on-hide.ts`). O botão de
  login ficava travado depois do logout por causa disso.
- `usePathname` funciona sem `<Suspense>` porque todas as rotas são estáticas.
  Evite `useSearchParams`, que exige `<Suspense>` com `cacheComponents`. Se
  precisar ler a URL dentro de um handler, use `window.location`.
- Antes de usar uma API do Next, consulte a documentação em
  `node_modules/next/dist/docs/`.

## UI e estilo

- O visual é limpo e minimalista (inspirado em Linear e Vercel): bordas
  discretas, quase sem sombras e com o índigo (`--primary`) como cor de
  destaque. Light e dark mode funcionam por tokens no `:root` e em `.dark`, em
  `globals.css`, incluindo os tokens extras `--success` e `--warning`. Não use
  cores fixas quando existir um token.
- Hierarquia de texto: título de página com 22–24px (`PageHeader`), seção com
  16px, texto com 14px e texto auxiliar com 12–13px.
- **Abordagem mobile-first:**
  - **Gestor:** tabela a partir de `md`, cards abaixo disso.
  - **Corretor:** Kanban com colunas a partir de `md`. Abaixo disso, uma grade
    de etapas com 2 colunas (3 a partir de 480px) e lista vertical. Não use
    faixas com rolagem horizontal no mobile.
  - **Menu:** fixo a partir de `lg` (248px, recolhível); abaixo disso, um Sheet.
  - **Geral:** nada pode causar rolagem horizontal da página em 360–390px.
- **Largura do Sheet:** o estilo base do shadcn usa
  `data-[side=right]:w-3/4 sm:max-w-sm`, que tem precedência sobre classes
  simples. Para mudar a largura, use as variantes com prefixo, por exemplo
  `data-[side=right]:w-full data-[side=right]:sm:max-w-lg`.
- **Feedback:** toda ação mostra um toast (sonner). Listas vazias usam
  `EmptyState`, e o carregamento usa `LoadingState`, `TableSkeleton` ou
  `Spinner`.
- `prefers-reduced-motion` já é respeitado globalmente.
- **Atalhos:** `Ctrl/Cmd+K` foca a busca (`SearchInput`) e `N` abre o
  formulário de novo lead (em `/gestor/leads`). `Esc` e `Enter` seguem o
  comportamento nativo de dialogs e forms. Use `useHotkey`, que ignora a tecla
  quando o usuário está digitando ou quando há um diálogo aberto.
- **Ajustes já pedidos pelo usuário (não reverter):**
  - A página `/corretor/leads` **não tem** a linha de resumo nem a barra de
    busca e filtros.
  - O formulário de observação **não mostra** a dica de atalhos de teclado.
  - O botão de contato nos detalhes do lead é "WhatsApp" (não "Ligar").
- Listas renderizadas com `.map` precisam de `key` única e estável. Nunca use
  como chave um valor que pode se repetir.

## Validação

- Os schemas Zod ficam em `src/lib/validation.ts`, com mensagens em português.
  Para mapear os erros para os campos, use `fieldErrors()`.
- O telefone usa a máscara brasileira (`formatPhone`) e aceita 10 ou 11 dígitos.
  O e-mail é opcional e só é validado quando preenchido.

## Lint e formatação

- Biome (`biome.json`): 2 espaços, organização de imports e diretivas Tailwind
  habilitadas no parser de CSS. O lint fica desligado em `src/components/ui/**`
  (código gerado pelo shadcn), e `noImportantStyles` fica desligado em
  `globals.css` (regra de reduced motion).
- Para adicionar componentes shadcn:
  `npx shadcn@latest add <nome> -y`. Eles importam `cn` do pacote `cn`; no
  código do app, use `@/lib/utils`.

## Verificação manual

Não há suíte de testes no repositório. Para validar fluxos, rode `npm run build`
e `npx next start -p <porta>` e use Playwright (instalado fora do projeto) para
percorrer login, cadastro, distribuição, Kanban (arrastar e menu "Mover para"),
observações, guard de perfil, mobile (360/390px), dark mode e console sem
erros. Não encerre um `next dev` do usuário que já esteja rodando na porta 3000.
