# LeadRoll

CRM para cadastrar, distribuir e acompanhar leads imobiliários entre
corretores. O login usa **Supabase Auth**, e o perfil de cada usuário (gestor
ou corretor) fica na tabela `profiles`, protegida por RLS. O gestor já cadastra,
edita, exclui e lista os leads (tabela `leads`). A listagem do corretor, as
observações, a distribuição e a presença ainda não estão
implementadas: as telas aparecem vazias.

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui e Supabase (`@supabase/ssr`).

## Configuração

### 1. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com). Em
**Project Settings → API**, anote a URL do projeto, a chave pública
(publishable/anon) e a chave `service_role`.

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
   corretor responsável mudar a etapa dos próprios leads.

Há duas formas:

- com a CLI: `supabase link --project-ref <ref>` e depois `supabase db push`;
- ou colando o conteúdo do arquivo no **SQL Editor** do painel.

### 3. Configurar a autenticação no painel

Em **Authentication**:

- **Sign In / Providers → Email:** habilitado.
- **Allow new users to sign up:** **desabilitado** (não há cadastro público).
- **Senha mínima:** 6 caracteres ou mais. As contas de demonstração usam
  `123456`. Em produção, use senhas fortes e não rode o seed.
- **URL Configuration → Site URL:** `http://localhost:3000`.

### 4. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave pública (publishable/anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **somente** para o script de seed. Nunca use o prefixo `NEXT_PUBLIC_` |

As variáveis `NEXT_PUBLIC_*` são embutidas no build: depois de alterá-las,
reinicie o `npm run dev` ou gere o build de novo.

### 5. Criar as contas de demonstração

```bash
npm install
npm run seed:auth
```

O script é idempotente e cria (ou atualiza) estas contas, todas com a senha
`123456`:

| E-mail | Perfil |
| --- | --- |
| `gestor@leadroll.demo` | gestor |
| `ana@leadroll.demo` | corretora |
| `carlos@leadroll.demo` | corretor |
| `juliana@leadroll.demo` | corretora |
| `marcos@leadroll.demo` | corretor |

Todo usuário criado de outra forma (pelo painel, por exemplo) entra como
corretor. Para promover alguém a gestor, rode no SQL Editor:

```sql
update public.profiles set role = 'manager' where email = 'pessoa@empresa.com';
```

### 6. Rodar

```bash
npm run dev    # http://localhost:3000
```

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção (funciona mesmo sem .env.local)
npm run lint         # Biome
npx tsc --noEmit     # checagem de tipos
npm run seed:auth    # contas de demonstração no Supabase
```

## Segurança

- O perfil (`role`) vem sempre da tabela `profiles`, nunca de
  `user_metadata`, que o próprio usuário pode alterar.
- A RLS permite que cada usuário leia apenas o próprio perfil, e o gestor leia
  todos. Ninguém altera perfis pelo app: não há policies de escrita para
  `anon` ou `authenticated`.
- A chave `service_role` só é usada em `scripts/seed-demo-users.mjs` e nunca
  chega ao navegador.
- Na tabela `leads`, o gestor lê todos os leads e o corretor só os próprios.
  Só o gestor cadastra, e o lead nasce na etapa "Novo", sem responsável. Só o
  gestor edita, e apenas os dados de contato e interesse. Só o corretor
  responsável muda a etapa, e apenas dos próprios leads. Só o gestor exclui.
- O controle de acesso às rotas (`RoleGuard`) é feito no cliente e serve à
  experiência de uso. A proteção dos dados está na RLS.
