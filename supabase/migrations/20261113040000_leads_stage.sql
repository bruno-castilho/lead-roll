-- Mudança de etapa pelo corretor responsável pelo lead.
-- Depende de 20261113010000_leads.sql (tabela leads), de
-- 20261113020000_leads_update.sql (update pelo gestor) e de is_manager().
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- O corretor só atualiza os leads atribuídos a ele, e o lead continua dele.
create policy "leads_update_own_broker"
  on public.leads
  for update
  to authenticated
  using (broker_id = (select auth.uid()))
  with check (broker_id = (select auth.uid()));

grant update (stage) on table public.leads to authenticated;

-- Os privilégios de coluna valem para o papel `authenticated` inteiro, e as
-- policies de update se somam. O trigger separa o que cada perfil pode mudar:
-- o corretor, só a etapa; o gestor, tudo menos a etapa.
create function public.enforce_lead_update_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select public.is_manager()) then
    if new.stage is distinct from old.stage then
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

revoke execute on function public.enforce_lead_update_columns()
  from public, anon, authenticated;

create trigger leads_enforce_update_columns
  before update on public.leads
  for each row execute function public.enforce_lead_update_columns();
