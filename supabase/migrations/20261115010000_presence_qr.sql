-- Presença por QR code: o totem exibe um código que muda a cada 5 minutos, e
-- o corretor só confirma presença com o token de um código ainda válido.
-- Depende de 20261115000000_kiosk_role.sql (perfil 'kiosk') e de
-- 20261114000000_broker_presence.sql (fila e confirm_presence()).
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- 1. Tokens ---------------------------------------------------------------------
-- Cada QR code aponta para /corretor/presenca?token=<token>. O token vale por
-- 5 minutos a partir da emissão e pode ser usado por vários corretores nesse
-- intervalo (todos leem o mesmo código na tela). Depois disso não marca
-- presença: a validade é conferida no banco, na hora da confirmação.

create table public.presence_tokens (
  token uuid primary key default gen_random_uuid(),
  issued_by uuid not null references public.profiles (id) on delete cascade,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.presence_tokens is
  'Tokens dos QR codes de presença (5 min). Lidos e escritos só por issue_presence_token() e confirm_presence(uuid).';

create index presence_tokens_expires_at_idx
  on public.presence_tokens (expires_at);

-- Sem policies e sem privilégios: ninguém lê os tokens diretamente (um
-- corretor fora da empresa não pode buscar o token atual).
alter table public.presence_tokens enable row level security;
revoke all on table public.presence_tokens from anon, authenticated;

-- 2. Emissão (só o totem) -------------------------------------------------------

create function public.issue_presence_token()
returns public.presence_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.presence_tokens;
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'kiosk'
  ) then
    raise exception 'Apenas o totem emite QR codes de presença.'
      using errcode = '42501';
  end if;

  -- Limpeza: tokens vencidos não servem para nada.
  delete from public.presence_tokens where expires_at <= now();

  insert into public.presence_tokens (issued_by, expires_at)
  values ((select auth.uid()), now() + interval '5 minutes')
  returning * into result;

  return result;
end;
$$;

revoke execute on function public.issue_presence_token() from public, anon;
grant execute on function public.issue_presence_token() to authenticated;

-- 3. Confirmação com token ------------------------------------------------------
-- Substitui confirm_presence() sem argumentos: sem um token válido não há
-- como entrar na fila. A regra da fila não muda (ausente entra no fim por 5h;
-- presente renova por 5h e mantém a posição).

drop function public.confirm_presence();

create function public.confirm_presence(p_token uuid)
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

  if not exists (
    select 1
    from public.presence_tokens
    where token = p_token
      and expires_at > now()
  ) then
    raise exception 'QR code de presença expirado ou inválido.'
      using errcode = '22023';
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

revoke execute on function public.confirm_presence(uuid) from public, anon;
grant execute on function public.confirm_presence(uuid) to authenticated;

comment on table public.broker_presence is
  'Presença dos corretores. Presente enquanto expires_at > now(); a fila segue queued_at. Escrita só por confirm_presence(uuid), com o token de um QR code válido.';
