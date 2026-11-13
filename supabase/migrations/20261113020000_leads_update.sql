-- Edição de leads pelo gestor.
-- Depende de 20261113010000_leads.sql (tabela leads) e de is_manager().
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- Só o gestor edita, e apenas os dados de contato e interesse (as colunas do
-- formulário). Etapa, responsável e datas ficam de fora.
create policy "leads_update_manager"
  on public.leads
  for update
  to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

-- Os privilégios limitam o update às colunas do formulário, como defesa em
-- profundidade.
grant update (name, phone, email, source, interest)
  on table public.leads to authenticated;
