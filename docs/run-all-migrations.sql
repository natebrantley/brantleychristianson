-- Run this in Supabase Dashboard → SQL Editor (one-time or when skipping CLI push).
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS where possible).

-- 1. set_updated_at() – used by users, leads, listings
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Users table (if missing)
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

-- 3. Users columns and trigger
alter table public.users add column if not exists marketing_opt_in boolean default true;
alter table public.users add column if not exists updated_at timestamptz default now();
alter table public.users add column if not exists assigned_broker_id text;

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role is null or role in ('agent', 'broker', 'user'));

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

comment on column public.users.updated_at is 'Set automatically by trigger on row update.';
comment on column public.users.assigned_broker_id is 'Broker slug from agents.json; set when client chooses an agent.';

-- 4. Leads table (if missing)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  clerk_id text,
  assigned_broker_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_clerk_id_idx on public.leads (clerk_id) where clerk_id is not null;
create index if not exists leads_assigned_broker_id_idx on public.leads (assigned_broker_id) where assigned_broker_id is not null;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- 5. Listings table (RMLS IDX/VOW)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  mls_listing_id text not null unique,
  status text not null check (status in ('Active', 'Pending', 'Expired', 'Withdrawn', 'Canceled', 'Sold')),
  address text,
  city text,
  state text,
  zip text,
  price numeric(12, 2),
  beds integer,
  baths numeric(4, 2),
  sqft integer,
  listing_firm_name text not null,
  listing_agent_name text,
  image_url text,
  expiration_date date,
  seller_contact text,
  showing_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists listings_mls_listing_id_key on public.listings (mls_listing_id);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_expiration_date_idx on public.listings (expiration_date);
create index if not exists listings_updated_at_idx on public.listings (updated_at);

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- 6. Optional backfill: set role = 'agent' for @brantleychristianson.com emails
update public.users
set role = 'agent'
where (email is not null and lower(trim(email)) like '%@brantleychristianson.com')
  and (role is null or role = 'user');
