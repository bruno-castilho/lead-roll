-- Perfis dos usuários do LeadRoll (gestor × corretor).
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.

-- 1. Esquema -----------------------------------------------------------------

create type public.user_role as enum ('manager', 'broker');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  email text not null,
  role public.user_role not null default 'broker',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de cada usuário. O papel (role) só pode ser alterado com a service role ou por SQL.';

-- 2. Criação automática do perfil ----------------------------------------------
-- Todo usuário novo entra como corretor. O papel NUNCA é lido de
-- raw_user_meta_data, que o próprio usuário pode alterar.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Usuário'
      ),
      80
    ),
    coalesce(new.email, ''),
    'broker'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RLS -----------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Verifica o papel sem passar pela RLS de profiles (evita recursão na policy).
create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'manager'
  );
$$;

revoke execute on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

-- Leitura: o próprio perfil, ou todos para o gestor.
create policy "profiles_select_own_or_manager"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_manager()));

-- Sem policies de insert/update/delete: anon e authenticated não escrevem.
-- Os privilégios também são revogados como defesa em profundidade.
revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
