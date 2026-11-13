-- Exclusão de leads pelo gestor.
-- Depende de 20261113010000_leads.sql (tabela leads) e de is_manager().
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- Só o gestor exclui. Para o corretor, a policy não deixa nenhuma linha
-- visível ao delete, então nada é removido.
create policy "leads_delete_manager"
  on public.leads
  for delete
  to authenticated
  using ((select public.is_manager()));

grant delete on table public.leads to authenticated;
