create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('member', 'mentor', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.trade_direction as enum ('long', 'short');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.bias_direction as enum ('bullish', 'bearish', 'neutral');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trade_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  pair text not null check (char_length(pair) between 1 and 24),
  setup text not null check (char_length(setup) <= 80),
  direction public.trade_direction not null,
  entry_price numeric,
  stop_loss numeric,
  take_profit numeric,
  risk_percent numeric check (risk_percent is null or (risk_percent >= 0 and risk_percent <= 100)),
  result_r numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_biases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  market text not null check (char_length(market) between 1 and 40),
  direction public.bias_direction not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trade_journals_user_date_idx on public.trade_journals (user_id, trade_date desc);
create index if not exists daily_biases_created_idx on public.daily_biases (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trade_journals_set_updated_at on public.trade_journals;
create trigger trade_journals_set_updated_at
before update on public.trade_journals
for each row execute function public.set_updated_at();

drop trigger if exists daily_biases_set_updated_at on public.daily_biases;
create trigger daily_biases_set_updated_at
before update on public.daily_biases
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, role)
select
  users.id,
  coalesce(users.raw_user_meta_data->>'full_name', split_part(users.email, '@', 1)),
  'member'
from auth.users
left join public.profiles on profiles.id = users.id
where profiles.id is null;

create or replace function public.current_user_role()
returns public.app_role
security definer
set search_path = public
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.trade_journals enable row level security;
alter table public.daily_biases enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile except role" on public.profiles;
create policy "Users can update their own profile except role"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

drop policy if exists "Users can read their own trade journals" on public.trade_journals;
create policy "Users can read their own trade journals"
on public.trade_journals for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own trade journals" on public.trade_journals;
create policy "Users can insert their own trade journals"
on public.trade_journals for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own trade journals" on public.trade_journals;
create policy "Users can update their own trade journals"
on public.trade_journals for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own trade journals" on public.trade_journals;
create policy "Users can delete their own trade journals"
on public.trade_journals for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated users can read daily biases" on public.daily_biases;
create policy "Authenticated users can read daily biases"
on public.daily_biases for select
to authenticated
using (true);

drop policy if exists "Admins and mentors can insert daily biases" on public.daily_biases;
create policy "Admins and mentors can insert daily biases"
on public.daily_biases for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_user_role() in ('admin', 'mentor')
);

drop policy if exists "Admins and mentors can update daily biases" on public.daily_biases;
create policy "Admins and mentors can update daily biases"
on public.daily_biases for update
to authenticated
using (public.current_user_role() in ('admin', 'mentor'))
with check (public.current_user_role() in ('admin', 'mentor'));

drop policy if exists "Admins and mentors can delete daily biases" on public.daily_biases;
create policy "Admins and mentors can delete daily biases"
on public.daily_biases for delete
to authenticated
using (public.current_user_role() in ('admin', 'mentor'));

-- Jalankan manual untuk mengangkat role user tertentu:
-- update public.profiles set role = 'admin' where id = 'USER_UUID';
-- update public.profiles set role = 'mentor' where id = 'USER_UUID';
