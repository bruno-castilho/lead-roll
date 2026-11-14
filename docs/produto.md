# Produto: regras de negócio e de interface

Complementa o [`AGENTS.md`](../AGENTS.md). As regras que valem no banco estão
em `supabase/migrations/`; o domínio de cada módulo reflete as que a interface
precisa conhecer.

## Rotas e perfis

| Rota | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | todos | redireciona para `/login` ou para a página inicial do perfil (`RootRedirect`) |
| `/login` | público | login com e-mail e senha (`LoginScreen`) |
| `/gestor` | gestor | redireciona para `/gestor/leads` |
| `/gestor/leads` | gestor | totais, filtros, tabela, CRUD e distribuição (`ManagerLeadsScreen`) |
| `/gestor/corretores` | gestor | presença e carga de cada corretor (`ManagerBrokersScreen`) |
| `/corretor` | corretor | redireciona para `/corretor/leads` |
| `/corretor/leads` | corretor | Kanban com os próprios leads (`BrokerLeadsScreen`) |

- Caminhos e página inicial por perfil: `ROUTES` e `HOME_BY_ROLE` em
  `src/shared/ui/routes.ts`; menu do gestor em `src/shell/nav-items.ts`.
- O perfil (`manager` ou `broker`) vem sempre da tabela `profiles`
  (`toProfile`), nunca de `user.role` do Supabase (papel do Postgres) nem de
  `user_metadata`.
- Contas são criadas no painel do Supabase; o trigger cria o perfil como
  corretor, e o gestor é promovido por SQL (veja o `README.md`).
- A tela "Visão geral" (dashboard) foi removida de propósito.

## Leads

- Etapas, na ordem do funil: `new`, `contacted`, `visit_scheduled`,
  `proposal`, `won`, `lost` (`LEAD_STAGES`). "Em atendimento" =
  `ACTIVE_STAGES` (contato, visita e proposta).
- Cadastro e edição (só o gestor) gravam só nome, telefone (com a máscara
  brasileira), e-mail (opcional; vazio vira `null`), origem e interesse
  (`toLeadInput`). O lead nasce em `new`, sem responsável.
- Exclusão: só o gestor. Nenhuma linha removida = `not_found`.
- Mudança de etapa e observações: só o corretor responsável
  (`isResponsibleFor`). A mudança de etapa é otimista e volta à etapa anterior
  se o banco recusar. Observações não são editadas nem excluídas.
- O corretor vê só os leads com `brokerId` igual ao dele (RLS + filtro da
  consulta + filtro da tela).

## Presença (fila)

- `broker_presence` tem uma linha por corretor. Ele está presente enquanto
  `expires_at > agora` (`isPresenceActive`); não há job, a expiração é
  calculada na leitura.
- "Confirmar presença" (`confirm_presence`, só corretores): ausente entra no
  fim da fila por 5h; presente renova por 5h e mantém a posição. Não existe
  "desativar presença".
- O `PresenceProvider` existe só na área do corretor e vira "ausente" sozinho
  no fim do prazo.

## Distribuição

- Toda a regra fica no banco (`distribute_leads`, só o gestor): entram os leads
  sem responsável, dos mais antigos para os mais novos, e os corretores
  presentes. Cada lead vai para o primeiro da fila, que volta para o fim; o lead
  recebe `stage: "new"` e `assignedAt`. Um advisory lock impede distribuições
  simultâneas.
- O diálogo mostra contagens do cliente, mas quem decide é o banco; se nada for
  distribuído, mostra um aviso informativo.
- Não recrie lógica de distribuição no cliente.

## Interface

- Textos em pt-BR. Toda ação mostra um toast (sonner); listas vazias usam
  `EmptyState`, e o carregamento usa `LoadingState`, `TableSkeleton` ou `Spinner`.
- Visual limpo (inspirado em Linear e Vercel), com o índigo `--primary` como
  destaque. Light e dark mode por tokens em `src/app/globals.css` (inclusive
  `--success` e `--warning`); não use cor fixa quando houver token.
- Hierarquia de texto: título de página 22–24px (`PageHeader`), seção 16px,
  texto 14px, auxiliar 12–13px.
- Mobile-first: gestor com tabela a partir de `md` e cards abaixo; corretor com
  Kanban em colunas a partir de `md` e, abaixo, grade de etapas com 2 colunas
  (3 a partir de 480px) e lista vertical; menu fixo a partir de `lg` (248px,
  recolhível) e Sheet abaixo. Nada pode causar rolagem horizontal em 360–390px.
- Largura de Sheet: use as variantes com prefixo
  (`data-[side=right]:w-full data-[side=right]:sm:max-w-lg`); classes simples
  perdem para o estilo base do shadcn.
- Atalhos: `Ctrl/Cmd+K` foca a busca e `N` abre o cadastro de lead (em
  `/gestor/leads`), sempre por `useHotkey`.
- Links nativos permitidos: `tel:`, `mailto:` e `https://wa.me/55<número>`.
- Listas com `.map` usam `key` única e estável.
- Validação: schemas Zod na apresentação, com limites do domínio
  (`LEAD_NAME_MIN_LENGTH`, `OBSERVATION_MAX_LENGTH`, `isValidPhone`) e
  mensagens em pt-BR; `fieldErrors` converte os erros por campo.

### Ajustes já pedidos pelo usuário (não reverter)

- `/corretor/leads` não tem a linha de resumo nem a barra de busca e filtros.
- A tela de login não tem seletor nem lista de contas de demonstração.
- O formulário de observação não mostra a dica de atalhos de teclado.
- O botão de contato nos detalhes do lead é "WhatsApp" (não "Ligar").
- Não adicionar imóveis, contratos, comissões, relatórios nem campanhas.
