-- Profiles table and RLS policies for Aircraft Temps app users.
-- Run this in your Supabase project's SQL editor or through migrations.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('Admin', 'User')),
  station text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

comment on table public.profiles is 'App-specific user info linked to Supabase Auth users';

create or replace function public.is_admin() returns boolean
  language sql
  security definer
  set search_path = public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'Admin'
      and p.is_active = true
  );
$$;

alter table public.profiles enable row level security;

-- Admins can do anything on profiles
create policy "Admins can manage all profiles"
  on public.profiles
  for all
  using (is_admin())
  with check (is_admin());

-- Allow active users to read their own row
create policy "Users can read their active profile"
  on public.profiles
  for select
  using (auth.uid() = id and is_active);

-- Allow active users to create/update their own profile while keeping role non-admin
create policy "Users can maintain their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id and is_active and role = 'User');

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id and is_active)
  with check (auth.uid() = id and is_active and role = 'User');
