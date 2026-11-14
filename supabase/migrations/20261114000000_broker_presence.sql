-- Presença dos corretores em fila.
-- Depende de 20261113000000_profiles.sql (tabela profiles e is_manager()).
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.
--
-- Uma linha por corretor. O corretor está presente enquanto
-- `expires_at > now()`; a expiração é calculada na leitura, sem job. A fila é
-- a ordem de `queued_at` entre os presentes.

-- 1. Esquema -----------------------------------------------------------------

create table public.broker_presence (
  broker_id uuid primary key references public.profiles (id) on delete cascade,
  queued_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.broker_presence is
  'Presença dos corretores. Presente enquanto expires_at > now(); a fila segue queued_at. Escrita só por confirm_presence().';

create index broker_presence_queue_idx on public.broker_presence (queued_at);

-- 2. RLS -----------------------------------------------------------------------

alter table public.broker_presence enable row level security;

-- Leitura: a própria presença, ou todas para o gestor.
create policy "broker_presence_select_own_or_manager"
  on public.broker_presence
  for select
  to authenticated
  using (broker_id = (select auth.uid()) or (select public.is_manager()));

-- Sem escrita direta: o corretor não pode forjar `queued_at` e furar a fila.
revoke all on table public.broker_presence from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.broker_presence from authenticated;
grant select on table public.broker_presence to authenticated;

-- 3. Confirmação de presença ----------------------------------------------------
-- Ausente (sem linha ou expirado): entra no final da fila por 5h.
-- Presente: o prazo passa a ser agora + 5h e a posição na fila é mantida.
-- Um único upsert evita corrida entre cliques ou abas simultâneos.

create function public.confirm_presence()
returns public.broker_presence
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.broker_presence;
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'broker'
  ) then
    raise exception 'Apenas corretores confirmam presença.'
      using errcode = '42501';
  end if;

  insert into public.broker_presence as p (broker_id, queued_at, expires_at)
  values ((select auth.uid()), now(), now() + interval '5 hours')
  on conflict (broker_id) do update
    set queued_at = case
          when p.expires_at > now() then p.queued_at
          else excluded.queued_at
        end,
        expires_at = excluded.expires_at
  returning * into result;

  return result;
end;
$$;

revoke execute on function public.confirm_presence() from public, anon;
grant execute on function public.confirm_presence() to authenticated;
