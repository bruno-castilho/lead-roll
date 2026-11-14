-- Distribuição dos leads sem responsável entre os corretores presentes.
-- Depende de 20261113010000_leads.sql (tabela leads), de
-- 20261113040000_leads_stage.sql (trigger leads_enforce_update_columns), de
-- 20261114000000_broker_presence.sql (fila) e de is_manager().
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- 1. Trigger de update ---------------------------------------------------------
-- O gestor continua sem mudar a etapa, exceto na distribuição: o lead sem
-- responsável recebe um corretor e volta para "new". Só distribute_leads()
-- grava `broker_id` (o gestor não tem privilégio nessa coluna).

create or replace function public.enforce_lead_update_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select public.is_manager()) then
    if new.stage is distinct from old.stage
      and not (
        old.broker_id is null
        and new.broker_id is not null
        and new.stage = 'new'
      )
    then
      raise exception 'Apenas o corretor responsável altera a etapa do lead.'
        using errcode = '42501';
    end if;
  elsif (to_jsonb(new) - 'stage') is distinct from (to_jsonb(old) - 'stage') then
    raise exception 'O corretor só pode alterar a etapa do lead.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- 2. Distribuição --------------------------------------------------------------
-- Entram os leads sem responsável, dos mais antigos para os mais novos, e os
-- corretores presentes (confirmaram presença nas últimas 5h: expires_at >
-- now()). Cada lead vai para o primeiro da fila (menor queued_at), que então
-- volta para o final da fila. Devolve os leads distribuídos.

create function public.distribute_leads()
returns setof public.leads
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_row public.leads;
  next_broker uuid;
  queue_end timestamptz;
begin
  if not (select public.is_manager()) then
    raise exception 'Apenas o gestor distribui leads.'
      using errcode = '42501';
  end if;

  -- Uma distribuição por vez: duas simultâneas disputariam a mesma fila.
  perform pg_advisory_xact_lock(hashtext('public.distribute_leads'));

  for lead_row in
    select *
    from public.leads
    where broker_id is null
    order by created_at, id
    for update
  loop
    select p.broker_id
      into next_broker
      from public.broker_presence p
      join public.profiles pr on pr.id = p.broker_id and pr.role = 'broker'
     where p.expires_at > now()
     order by p.queued_at, p.broker_id
     limit 1
       for update of p;

    exit when next_broker is null;

    update public.leads
       set broker_id = next_broker,
           stage = 'new',
           assigned_at = now()
     where id = lead_row.id
    returning * into lead_row;

    -- Vai para o final da fila. now() é fixo na transação, então o novo
    -- queued_at fica sempre depois do último da fila, sem empates.
    select greatest(now(), max(queued_at) + interval '1 microsecond')
      into queue_end
      from public.broker_presence;

    update public.broker_presence
       set queued_at = queue_end
     where broker_id = next_broker;

    return next lead_row;
  end loop;
end;
$$;

revoke execute on function public.distribute_leads() from public, anon;
grant execute on function public.distribute_leads() to authenticated;
