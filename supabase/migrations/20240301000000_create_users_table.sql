-- Users table synced from Clerk (webhook) and used for dashboard role routing.
-- Run this in Supabase SQL Editor or via `supabase db push` if using Supabase CLI.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text,
  first_name text,
  last_name text,
  role text check (role is null or role in ('agent', 'broker')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists users_clerk_id_key on public.users (clerk_id);

comment on table public.users is 'Synced from Clerk via webhook; role drives dashboard routing (agent/broker → agent dashboard).';

-- Optional: updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- RLS: enable if you want row-level security (see docs/SUPABASE.md for JWT template).
-- alter table public.users enable row level security;
-- create policy "Users can read own row" on public.users for select using (auth.jwt() ->> 'sub' = clerk_id);
