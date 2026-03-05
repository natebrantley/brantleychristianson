-- RMLS IDX/VOW listings table. Data must be refreshed at least every 12 hours (see cron /api/cron/sync-mls).
-- Restricted fields (seller_contact, showing_instructions) must NEVER be exposed to public/IDX; VOW-only.

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
  -- RMLS restricted: do NOT expose to public IDX; only to authenticated VOW users when permitted.
  seller_contact text,
  showing_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists listings_mls_listing_id_key on public.listings (mls_listing_id);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_expiration_date_idx on public.listings (expiration_date);
create index if not exists listings_updated_at_idx on public.listings (updated_at);

comment on table public.listings is 'RMLS IDX/VOW listings; sync at least every 12h; restrict seller_contact and showing_instructions to VOW.';
comment on column public.listings.seller_contact is 'RMLS restricted: never expose to public IDX.';
comment on column public.listings.showing_instructions is 'RMLS restricted: never expose to public IDX.';

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();
