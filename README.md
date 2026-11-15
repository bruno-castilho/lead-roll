# LeadRoll

CRM para cadastrar, distribuir e acompanhar leads imobiliários entre
corretores.

- O **gestor** cadastra, edita, exclui e distribui os leads.
- O **corretor** confirma presença lendo com o celular o QR code do totem da
  empresa (renovado a cada 5 minutos) e entra numa fila por 5h. Acompanha os
  próprios leads num Kanban, muda a etapa e registra observações.
- O **totem** é uma conta própria, aberta numa tela da empresa, que exibe o QR
  code de presença.
- A distribuição segue a fila de presença e é feita no banco (função
  `distribute_leads`).

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui e Supabase (Auth + Postgres com RLS). O código é organizado por
módulos de negócio (`auth`, `brokers`, `leads`) em camadas; veja
[`docs/arquitetura.md`](docs/arquitetura.md) e [`docs/produto.md`](docs/produto.md).

## Quick start

O caminho recomendado é desenvolver no **devcontainer** com um **Supabase
local**, no Docker. Assim nada toca o banco de produção.

### 1. Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) rodando na máquina.
- [VS Code](https://code.visualstudio.com/) com a extensão
  [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

### 2. Abrir no devcontainer

1. Clone o repositório e abra a pasta no VS Code.
2. Rode **Dev Containers: Reopen in Container** (paleta de comandos).

O VS Code constrói a imagem (`.devcontainer/Dockerfile`: Node, Docker CLI,
`psql` e Claude Code) e já instala as extensões do Biome e do Docker. O
repositório fica montado em `/workspace`.

O container usa o **Docker do host** (pelo socket `/var/run/docker.sock`) e a
**rede do host** (`network_mode: host`). Por isso o Supabase local, que sobe em
containers irmãos, fica acessível em `127.0.0.1` tanto de dentro do container
quanto do navegador da sua máquina.

> **Permissão no socket do Docker.** O `docker-compose.yml` adiciona o usuário
> ao grupo `984`, que é o GID do socket na máquina em que o projeto foi
> configurado. Se `docker ps` falhar dentro do container com *permission
> denied*, descubra o GID na sua máquina com
> `stat -c %g /var/run/docker.sock`, troque o valor em `group_add` e
> reconstrua o container (**Dev Containers: Rebuild Container**).

### 3. Instalar as dependências

```bash
npm install
```

### 4. Subir o Supabase local

```bash
npx supabase start
```

Na primeira vez, a CLI baixa as imagens (demora alguns minutos). Ela lê
[`supabase/config.toml`](supabase/config.toml) e aplica todas as migrations de
[`supabase/migrations/`](supabase/migrations/) num banco novo. Ao terminar,
mostra as URLs e chaves do ambiente local:

| Serviço | Endereço |
| --- | --- |
| API (URL do Supabase) | http://127.0.0.1:54321 |
| Studio (painel) | http://127.0.0.1:54323 |
| Mailpit (e-mails enviados) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Para ver as chaves de novo a qualquer momento: `npx supabase status`.

### 5. Apontar o app para o Supabase local

Crie o arquivo `.env.development.local` na raiz (não é versionado) com a URL e
a chave **publishable** mostradas pelo `supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use só a chave publishable. A `secret`/`service_role` nunca entra no projeto.

### 6. Criar as contas

O cadastro público está desligado (`enable_signup = false`), então os usuários
são criados pelo Studio:

1. Abra http://127.0.0.1:54323 → **Authentication → Users → Add user →
   Create new user**.
2. Informe e-mail e senha (mínimo de 6 caracteres) e marque **Auto Confirm
   User**.

Todo usuário novo entra como corretor (um trigger cria o perfil em
`profiles`). Crie pelo menos um gestor, um corretor e um totem, e ajuste os
papéis no **SQL Editor** do Studio ou com o `psql` do container:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres <<'SQL'
update public.profiles set role = 'manager' where email = 'gestor@exemplo.com';
update public.profiles set role = 'kiosk'   where email = 'totem@exemplo.com';
SQL
```

### 7. Rodar o app

```bash
npm run dev    # http://localhost:3000
```

Entre com cada conta para ver as três áreas: o gestor cai na lista de leads, o
corretor no Kanban e o totem em `/totem`, com o QR code de presença. O
corretor lê o código com o celular; se não estiver conectado, entra e volta
para o link automaticamente.

> Para ler o QR code com um celular de verdade, ele precisa alcançar a
> máquina: abra o app pelo IP da máquina na rede local em vez de `localhost`.

## Configuração

### Variáveis de ambiente

O modelo está em [`.env.example`](.env.example).

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (local ou nuvem) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave pública (publishable/anon) |

O Next carrega os arquivos `.env*` nesta ordem de prioridade, o que permite
manter os dois ambientes lado a lado:

| Arquivo | Vale para | Uso sugerido |
| --- | --- | --- |
| `.env.development.local` | `npm run dev` | Supabase local |
| `.env.local` | `dev`, `build` e `start` | Supabase em nuvem |

Com os dois arquivos, o `npm run dev` usa o local e o `npm run build` /
`npx next start` usam a nuvem. Apague ou renomeie o `.env.development.local`
para desenvolver contra a nuvem.

As variáveis `NEXT_PUBLIC_*` são embutidas no bundle: depois de alterá-las,
reinicie o `npm run dev` ou gere o build de novo. O `npm run build` funciona
mesmo sem nenhum `.env`.

### Supabase local: comandos do dia a dia

```bash
npx supabase start           # sobe os containers (mantém os dados)
npx supabase stop            # para os containers (mantém os dados)
npx supabase status          # URLs e chaves
npx supabase db reset        # recria o banco e reaplica todas as migrations (apaga os dados, inclusive usuários)
npx supabase migration new <nome>   # cria um arquivo em supabase/migrations/
npx supabase db push         # aplica migrations pendentes no banco local
```

Sem `--remote`, os comandos `db` atuam no banco **local**.

### Supabase em nuvem

Para produção (ou para desenvolver contra um projeto remoto):

1. **Projeto.** Crie um projeto em [supabase.com](https://supabase.com) e
   anote, em **Project Settings → API**, a URL e a chave publishable.
2. **Migrations.** `npx supabase link --project-ref <ref>` e depois
   `npx supabase db push --remote`. Pelo **SQL Editor** do painel também
   funciona: cole cada arquivo de `supabase/migrations/`, em ordem e um por
   vez (as migrations `kiosk_role` e `presence_qr` precisam de transações
   separadas, porque o Postgres só deixa usar um valor novo de enum depois do
   commit).
3. **Autenticação** (em **Authentication**):
   - **Sign In / Providers → Email:** habilitado.
   - **Allow new users to sign up:** desabilitado.
   - **Senha mínima:** 6 caracteres ou mais (em produção, use senhas fortes).
   - **URL Configuration → Site URL:** a URL pública do app.
4. **Variáveis.** `cp .env.example .env.local` e preencha.
5. **Contas.** Crie os usuários em **Authentication → Users** e ajuste os
   papéis com o mesmo `update public.profiles ...` do quick start.

### Migrations

| Arquivo | O que faz |
| --- | --- |
| `20261113000000_profiles` | tabela `profiles`, trigger do perfil de usuário novo e RLS |
| `20261113010000_leads` | tabela `leads` (só o gestor cadastra) |
| `20261113020000_leads_update` | gestor edita contato e interesse |
| `20261113030000_leads_delete` | gestor exclui leads |
| `20261113040000_leads_stage` | corretor responsável muda a etapa |
| `20261113050000_lead_observations` | tabela `lead_observations` |
| `20261114000000_broker_presence` | tabela `broker_presence` (fila de 5h) |
| `20261114010000_distribute_leads` | função `distribute_leads` |
| `20261115000000_kiosk_role` | perfil `kiosk` (totem) |
| `20261115010000_presence_qr` | tabela `presence_tokens`, `issue_presence_token` e `confirm_presence(p_token)` |

## Comandos

```bash
npm run dev                  # servidor de desenvolvimento (http://localhost:3000)
npm run build                # build de produção
npx next start -p <porta>    # serve o build
npm run lint                 # Biome: formatação, lint e fronteiras entre camadas
npx biome check --write src  # aplica formatação e correções seguras
npm run typecheck            # next typegen + tsc --noEmit
npm test                     # testes (Vitest)
npx vitest run <arquivo>     # um arquivo de teste
npm run test:coverage        # testes com cobertura
```

Os testes não dependem do Supabase (usam portas e clientes falsos).

## CI e deploy

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo
pull request e em todo push na `main`:

1. **checks**: `npm ci`, lint, tipos, testes e `npm run build`.
2. **deploy**: só em push na `main` e só se `checks` passar. Usa a Vercel CLI
   (`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`).

O deploy automático da integração Git da Vercel fica desligado no
[`vercel.json`](vercel.json) (`git.deploymentEnabled: false`); assim nada é
publicado sem os testes passarem.

Configuração (uma vez):

- No GitHub (Settings → Secrets and variables → Actions), crie os secrets
  `VERCEL_TOKEN` (Vercel → Account Settings → Tokens), `VERCEL_ORG_ID` e
  `VERCEL_PROJECT_ID` (rode `npx vercel link` e copie de `.vercel/project.json`).
- Na Vercel, cadastre `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente **Production**; o
  `vercel pull` as baixa antes do build.
- Para impedir merge com testes quebrados, marque o job
  "Lint, tipos, testes e build" como obrigatório na proteção da `main`.

## Segurança

- O perfil (`role`) vem sempre da tabela `profiles`, nunca de
  `user_metadata`, que o próprio usuário pode alterar.
- A RLS permite que cada usuário leia apenas o próprio perfil, e o gestor leia
  todos. Ninguém altera perfis pelo app: não há policies de escrita para
  `anon` ou `authenticated`.
- A chave `service_role` não entra no projeto; o app usa só a chave pública.
- Na tabela `leads`, o gestor lê todos os leads e o corretor só os próprios.
  Só o gestor cadastra, e o lead nasce na etapa "Novo", sem responsável. Só o
  gestor edita, e apenas os dados de contato e interesse. Só o corretor
  responsável muda a etapa, e apenas dos próprios leads. Só o gestor exclui.
- Na tabela `lead_observations`, só o corretor responsável pelo lead registra
  observações, sempre em nome próprio. O gestor lê todas; o corretor, só as
  dos próprios leads. Observações não são editadas nem excluídas.
- A presença só é confirmada com o token de um QR code emitido pelo totem há
  menos de 5 minutos; o banco confere a validade. A tabela `presence_tokens`
  não pode ser lida por ninguém pelo app, só pelas funções
  `issue_presence_token` (apenas o totem) e `confirm_presence` (apenas
  corretores).
- O controle de acesso às rotas (`RoleGuard`) é feito no cliente e serve à
  experiência de uso. A proteção dos dados está na RLS.
