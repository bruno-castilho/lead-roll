-- Leads imobiliários do LeadRoll.
-- Depende de 20261113000000_profiles.sql (tabela profiles e is_manager()).
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- 1. Esquema -----------------------------------------------------------------

create type public.lead_stage as enum (
  'new', 'contacted', 'visit_scheduled', 'proposal', 'won', 'lost'
);

create type public.lead_source as enum (
  'site', 'whatsapp', 'instagram', 'referral', 'portal', 'campaign', 'other'
);

create type public.lead_interest as enum (
  'buy', 'rent', 'apartment', 'house', 'land', 'commercial', 'other'
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 80),
  -- Guardado com a máscara brasileira; 10 ou 11 dígitos com DDD.
  phone text not null
    check (char_length(regexp_replace(phone, '\D', '', 'g')) in (10, 11)),
  email text check (email is null or char_length(email) between 3 and 254),
  source public.lead_source not null,
  interest public.lead_interest not null,
  stage public.lead_stage not null default 'new',
  broker_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  assigned_at timestamptz
);

comment on table public.leads is
  'Leads imobiliários. Cadastrados pelo gestor, sem responsável, e depois distribuídos aos corretores.';

create index leads_broker_id_idx on public.leads (broker_id);
create index leads_created_at_idx on public.leads (created_at);

-- 2. RLS -----------------------------------------------------------------------

alter table public.leads enable row level security;

-- Leitura: o gestor vê todos; o corretor, só os leads dele.
create policy "leads_select_manager_or_own"
  on public.leads
  for select
  to authenticated
  using ((select public.is_manager()) or broker_id = (select auth.uid()));

-- Cadastro: só o gestor, e o lead nasce na etapa "new", sem responsável.
create policy "leads_insert_manager"
  on public.leads
  for insert
  to authenticated
  with check (
    (select public.is_manager())
    and stage = 'new'
    and broker_id is null
    and assigned_at is null
  );

-- Sem policies de update/delete por enquanto.
-- Os privilégios limitam o insert às colunas do formulário (o resto usa os
-- defaults), como defesa em profundidade.
revoke all on table public.leads from anon;
revoke all on table public.leads from authenticated;
grant select on table public.leads to authenticated;
grant insert (name, phone, email, source, interest)
  on table public.leads to authenticated;
