<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LeadRoll

CRM para gerenciamento e distribuição de leads imobiliários entre corretores.
Etapa atual: **frontend com autenticação real**. O login usa Supabase Auth, e o
perfil (gestor ou corretor) fica na tabela `profiles`, protegida por RLS. Os
corretores são lidos de `profiles` (`BrokersService`). O cadastro e a edição
de leads gravam na tabela `leads` (`LeadsService.createLead` e
`LeadsService.updateLead`), só para o gestor, e a página `/gestor/leads` lista
os leads do banco (`LeadsService.listLeads`). A listagem do corretor, a
exclusão de leads, as observações, a
distribuição e a presença ainda **não têm fonte de dados**: os dados chegam vazios e essas ações
não fazem nada. A interface e os textos são em
português (pt-BR).

## Regras desta etapa

- A autenticação usa **Supabase Auth** (e-mail e senha), só pelo cliente do
  navegador (`src/lib/supabase/client.ts`) e pela camada de serviço
  `AuthService` (`src/services/auth-service.ts`). A sessão fica nos cookies do
  Supabase e, no React, no `SessionProvider` (`src/contexts/session.tsx`).
- Continua proibido criar API routes, Route Handlers, Server Actions,
  `proxy.ts`, leitura de `cookies()` em Server Components e outras integrações
  externas. Nada além das tabelas `profiles` e `leads` vai para o banco nesta
  etapa.
- Não há mocks, store nem implementação local. `manager-leads-page` busca
  `leads` com `useLeads()` (`LeadsService.listLeads`); `manager-brokers-page` e
  `broker-leads-page` ainda declaram `leads` como `[]` e repassam por props;
  `isPresent` é `false`. As páginas do
  gestor buscam `brokers` com `useBrokers()` (`BrokersService.listBrokers`);
  `broker-leads-page` ainda declara `brokers` como `[]`.
  O cadastro e a edição de lead já chamam `LeadsService.createLead` e
  `LeadsService.updateLead` (`LeadForm`). Os pontos que executariam as demais
  ações (excluir lead, mudar etapa,
  adicionar observação, distribuir, alternar presença) estão marcados com
  `// Sem implementação.`, à espera dos serviços reais. Não recriar dados
  fictícios nem lógica local para eles.
- Variáveis de ambiente (modelo em `.env.example`; `.env.local` não é
  versionado): `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A chave `service_role` nunca entra no
  projeto.
- O build precisa passar sem as variáveis. Nunca crie o cliente Supabase em
  escopo de módulo nem durante a renderização: só em efeitos e handlers.
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
npm run build        # build de produção (precisa passar, mesmo sem .env.local)
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
| `/login` | público | login com e-mail e senha (Supabase Auth) |
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
- As contas são criadas no painel do Supabase (Authentication → Users). O
  trigger cria o perfil como corretor; o gestor é promovido por SQL.

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
    providers/         ThemeProvider, SessionProvider, TooltipProvider, Toaster
    ui/                shadcn/ui (gerado; o lint fica desligado aqui)
  contexts/session.tsx SessionProvider: user, session, profile e ready da sessão do Supabase
  services/            auth-service.ts (AuthService: signIn, signOut, getProfile, restoreSession, onSignedOut)
                       brokers-service.ts (BrokersService: listBrokers)
                       leads-service.ts (LeadsService: listLeads, createLead, updateLead)
  errors/              SignInError, SignOutError, ProfileError, BrokersError, LeadsError, CreateLeadError, UpdateLeadError e AuthServiceError
  lib/                 tipos, constantes, filtros, formatação, validação (Zod)
    supabase/          client.ts (getSupabaseClient) e database.types.ts
  hooks/               useSession, useBrokers, useLeads, useLeadStats, useChangeStage, useHotkey, useMediaQuery, useResetOnHide
supabase/migrations/   SQL das tabelas profiles e leads, trigger e RLS
```

## Estado e dados

- Com `cacheComponents`, chamar `Date.now()` ou `new Date()` durante a
  renderização quebra o prerender. Gere datas e ids só em efeitos ou handlers.
- A sessão fica no `SessionProvider` (`useSession()`). Ele restaura a sessão
  (`AuthService.restoreSession`) e assina `onSignedOut` (logout em outra aba,
  sessão revogada), limpando a sessão. O usuário conectado é `profile`
  (`AuthProfile`), usado pelo `RoleGuard`, pelo menu do usuário e pela página
  `/`.
- `ready` (no `useSession()`) indica que a restauração da sessão terminou.
  Como depende da rede, o `LoadingState` pode aparecer por mais tempo.
- Login: `AuthService.signIn({ email, password })` retorna
  `{ user, session, weakPassword }` ou lança `SignInError` (mensagem pronta em
  pt-BR). O perfil é buscado depois, por `AuthService.getProfile(user.id)`
  (lança `ProfileError`), e então chama-se `onSession(user, session, profile)`.
  A restauração da sessão faz o mesmo no `SessionProvider`. O
  redirecionamento usa `HOME_BY_ROLE[profile.role]`. **Nunca** use `user.role`
  do Supabase: é o papel do Postgres (`"authenticated"`), não gestor/corretor.
- Logout: `clearSession()` limpa o estado na hora e depois
  `AuthService.signOut()` avisa o servidor (lança `SignOutError` se ele não
  confirmou; o usuário sai mesmo assim).
- O perfil vem **sempre** da tabela `profiles`, nunca de `user_metadata` (o
  usuário pode alterá-lo). A RLS deixa o gestor ler todos os perfis e o
  corretor só o próprio.
- Listagem: `LeadsService.listLeads()` devolve os leads do mais recente para o
  mais antigo (a RLS filtra por perfil) e lança `LeadsError` (mensagem pronta
  em pt-BR). `useLeads()` busca quando há `profile`; enquanto carrega, a
  página mostra `TableSkeleton`. O lead cadastrado entra na lista pelo
  `onCreated` do `LeadForm` (`addLead`), sem buscar tudo de novo.
- Cadastro: `LeadsService.createLead(input)` insere só os campos do
  formulário; o banco gera `id` e `createdAt`, e o lead nasce com
  `stage: "new"` e sem responsável. Lança `CreateLeadError` (mensagem pronta
  em pt-BR). Durante o envio, o botão do `LeadForm` fica desabilitado com
  `Spinner`.
- Edição (só gestor): `LeadsService.updateLead(id, input)` atualiza só os
  campos do formulário (nome, telefone, e-mail, origem e interesse); etapa,
  responsável e datas não mudam. Lança `UpdateLeadError` (mensagem pronta em
  pt-BR; `not_found` quando nenhuma linha foi atualizada). O lead salvo
  substitui o antigo na lista pelo `onUpdated` do `LeadForm` (`replaceLead`).
- O responsável do lead é guardado como `brokerId`. O nome vem da lista
  `brokers` recebida por props.
- Etapas (`LeadStage`): `new`, `contacted`, `visit_scheduled`, `proposal`,
  `won`, `lost`. Os rótulos e as cores de cada etapa estão em `constants.ts`.
  `ACTIVE_STAGES` define o que conta como "em atendimento".

### Distribuição (round-robin)

- A confirmação da distribuição ainda está vazia; a regra fica para o serviço real. O
  diálogo só mostra quantos leads estão sem responsável e quantos corretores
  estão com `isPresent`.
- Regra esperada: entram somente leads sem responsável (os mais antigos
  primeiro) e corretores presentes, em rodízio que continua do último corretor
  atendido. Cada lead distribuído recebe `stage: "new"` e `assignedAt`.

## Permissões

- A segurança real está no banco (RLS em `profiles`: `select` do próprio
  perfil ou de todos para o gestor; nenhuma escrita por `anon` ou
  `authenticated`. RLS em `leads`: o gestor lê todos e o corretor só os
  próprios; só o gestor insere, na etapa `new`, sem responsável, e apenas as
  colunas do formulário; só o gestor faz `update`, e apenas nas colunas do
  formulário; ainda sem `delete`). Novos usuários entram como `broker` pelo trigger; gestores
  são promovidos por SQL. O guard no cliente é UX.
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
- O corretor vê apenas leads com `brokerId === profile.id`. Ele não
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
  - A tela de login **não tem** seletor nem lista de contas de demonstração.
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

Não há suíte de testes no repositório. Para validar fluxos, configure um
projeto Supabase em `.env.local` (veja o `README.md`), crie as contas,
rode `npm run build` e `npx next start -p <porta>` e use Playwright (instalado fora do projeto) para
percorrer login, logout, guard de perfil, estados vazios, mobile (360/390px),
dark mode e console sem erros. Não encerre um `next dev` do usuário que já esteja rodando na porta 3000.
