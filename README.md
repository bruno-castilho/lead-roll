# LeadRoll

CRM para cadastrar, distribuir e acompanhar leads imobiliários entre
corretores. O login usa **Supabase Auth**, e o perfil de cada usuário (gestor
ou corretor) fica na tabela `profiles`, protegida por RLS. O gestor já cadastra,
edita, exclui e lista os leads (tabela `leads`). O corretor vê os próprios
leads, muda a etapa e registra observações neles (tabela
`lead_observations`). O corretor confirma presença lendo com o celular o QR
code exibido num totem da empresa (renovado a cada 5 minutos) e entra numa
fila por 5h (tabelas `presence_tokens` e `broker_presence`), e o gestor
distribui os leads sem responsável seguindo essa fila (função
`distribute_leads`).

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui e Supabase (`@supabase/ssr`). O código é organizado por módulos de
negócio (`auth`, `brokers`, `leads`) em camadas; veja
[`docs/arquitetura.md`](docs/arquitetura.md).

## Configuração

### 1. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com). Em
**Project Settings → API**, anote a URL do projeto e a chave pública
(publishable/anon). A chave `service_role` não é usada pelo projeto.

### 2. Aplicar as migrations

Aplique, nesta ordem:

1. `supabase/migrations/20261113000000_profiles.sql`, que cria a tabela
   `profiles`, o trigger que gera o perfil de cada usuário novo e as policies
   de RLS;
2. `supabase/migrations/20261113010000_leads.sql`, que cria a tabela `leads` e
   as policies de RLS (só o gestor cadastra);
3. `supabase/migrations/20261113020000_leads_update.sql`, que permite ao
   gestor editar os dados de contato e interesse dos leads;
4. `supabase/migrations/20261113030000_leads_delete.sql`, que permite ao
   gestor excluir leads;
5. `supabase/migrations/20261113040000_leads_stage.sql`, que permite ao
   corretor responsável mudar a etapa dos próprios leads;
6. `supabase/migrations/20261113050000_lead_observations.sql`, que cria a
   tabela `lead_observations` (só o corretor responsável registra
   observações);
7. `supabase/migrations/20261114000000_broker_presence.sql`, que cria a
   tabela `broker_presence` e a função `confirm_presence` (fila de presença
   dos corretores, 5h por confirmação);
8. `supabase/migrations/20261114010000_distribute_leads.sql`, que cria a
   função `distribute_leads` (o gestor distribui os leads sem responsável
   entre os corretores presentes, seguindo a fila);
9. `supabase/migrations/20261115000000_kiosk_role.sql`, que cria o perfil
   `kiosk` (totem);
10. `supabase/migrations/20261115010000_presence_qr.sql`, que cria a tabela
    `presence_tokens` e a função `issue_presence_token` (QR code de 5 min,
    só o totem) e troca `confirm_presence()` por `confirm_presence(p_token)`
    (a presença só vale com o token de um QR code válido).

As migrations 9 e 10 precisam ser aplicadas em transações separadas (o
Postgres só deixa usar o valor novo do enum depois do commit). O
`supabase db push` já faz isso; no SQL Editor, rode um arquivo de cada vez.

Há duas formas:

- com a CLI: `supabase link --project-ref <ref>` e depois `supabase db push`;
- ou colando o conteúdo do arquivo no **SQL Editor** do painel.

### 3. Configurar a autenticação no painel

Em **Authentication**:

- **Sign In / Providers → Email:** habilitado.
- **Allow new users to sign up:** **desabilitado** (não há cadastro público).
- **Senha mínima:** 6 caracteres ou mais (em produção, use senhas fortes).
- **URL Configuration → Site URL:** `http://localhost:3000`.

### 4. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave pública (publishable/anon) |

As variáveis `NEXT_PUBLIC_*` são embutidas no build: depois de alterá-las,
reinicie o `npm run dev` ou gere o build de novo.

### 5. Criar as contas

Crie os usuários no painel (**Authentication → Users**). Todo usuário novo
entra como corretor (o trigger cria o perfil). Para promover alguém a gestor,
rode no SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'pessoa@empresa.com';
```

O totem é uma conta própria (por exemplo, `totem@empresa.com`), aberta no
navegador da tela da empresa. Depois de criá-la, rode:

```sql
update public.profiles set role = 'kiosk' where email = 'totem@empresa.com';
```

Ao entrar, o totem vai para `/totem` e exibe o QR code de presença. O
corretor lê o código com o celular; se não estiver conectado, entra e volta
para o link automaticamente.

### 6. Rodar

```bash
npm install
npm run dev    # http://localhost:3000
```

## Comandos

```bash
npm run dev            # servidor de desenvolvimento
npm run build          # build de produção (funciona mesmo sem .env.local)
npm run lint           # Biome (formatação, lint e fronteiras entre camadas)
npx tsc --noEmit       # checagem de tipos
npm test               # testes (Vitest)
npm run test:coverage  # testes com cobertura
```

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
