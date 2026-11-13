-- Observações do atendimento de cada lead.
-- Depende de 20261113010000_leads.sql (tabela leads) e de is_manager().
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- 1. Esquema -----------------------------------------------------------------

create table public.lead_observations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);

comment on table public.lead_observations is
  'Observações do atendimento. Registradas pelo corretor responsável pelo lead.';

create index lead_observations_lead_id_idx
  on public.lead_observations (lead_id, created_at);
create index lead_observations_author_id_idx
  on public.lead_observations (author_id);

-- 2. RLS -----------------------------------------------------------------------

alter table public.lead_observations enable row level security;

-- Leitura: o gestor vê todas; o corretor, só as dos leads atribuídos a ele.
create policy "lead_observations_select_manager_or_own_lead"
  on public.lead_observations
  for select
  to authenticated
  using (
    (select public.is_manager())
    or exists (
      select 1
      from public.leads l
      where l.id = lead_id
        and l.broker_id = (select auth.uid())
    )
  );

-- Registro: só o corretor responsável pelo lead, em nome próprio.
create policy "lead_observations_insert_own_broker"
  on public.lead_observations
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.leads l
      where l.id = lead_id
        and l.broker_id = (select auth.uid())
    )
  );

-- Sem policies de update/delete: o histórico não é alterado.
-- Os privilégios limitam o insert às colunas do formulário (o resto usa os
-- defaults), como defesa em profundidade.
revoke all on table public.lead_observations from anon;
revoke all on table public.lead_observations from authenticated;
grant select on table public.lead_observations to authenticated;
grant insert (lead_id, content)
  on table public.lead_observations to authenticated;
