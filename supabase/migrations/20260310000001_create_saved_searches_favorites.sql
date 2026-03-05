-- Saved searches and favorites for authenticated users. RLS by clerk_id (Clerk JWT sub).

-- Saved searches: criteria + optional Repliers saved search ID
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null,
  name text,
  criteria jsonb not null default '{}',
  repliers_saved_search_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists saved_searches_clerk_id_idx on public.saved_searches (clerk_id);
comment on table public.saved_searches is 'User saved searches; RLS by clerk_id. Optional sync to Repliers for alerts.';

alter table public.saved_searches enable row level security;

create policy "Users can manage own saved_searches"
  on public.saved_searches
  for all
  using (auth.jwt() ->> 'sub' = clerk_id)
  with check (auth.jwt() ->> 'sub' = clerk_id);

drop trigger if exists saved_searches_updated_at on public.saved_searches;
create trigger saved_searches_updated_at
  before update on public.saved_searches
  for each row execute function public.set_updated_at();

-- Favorites: clerk_id + mls_listing_id
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null,
  mls_listing_id text not null,
  created_at timestamptz default now(),
  unique (clerk_id, mls_listing_id)
);

create index if not exists favorites_clerk_id_idx on public.favorites (clerk_id);
comment on table public.favorites is 'User favorite listings; RLS by clerk_id.';

alter table public.favorites enable row level security;

create policy "Users can manage own favorites"
  on public.favorites
  for all
  using (auth.jwt() ->> 'sub' = clerk_id)
  with check (auth.jwt() ->> 'sub' = clerk_id);
