-- Expand listings table for full Repliers sync and detail view.
-- Add users.repliers_client_id for Clerk -> Repliers client lookup (populated by webhook).

-- Listings: new columns (nullable for backfill)
alter table if exists public.listings
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists property_type text,
  add column if not exists lot_size_sqft integer,
  add column if not exists year_built integer,
  add column if not exists parking_spaces integer,
  add column if not exists description text,
  add column if not exists images jsonb;

create index if not exists listings_city_idx on public.listings (city) where city is not null;
create index if not exists listings_price_idx on public.listings (price) where price is not null;

comment on column public.listings.images is 'Array of image URLs from Repliers CDN; do not expose restricted data.';

-- Users: Repliers client ID (set by Clerk webhook after creating Repliers client)
alter table if exists public.users
  add column if not exists repliers_client_id integer;

create index if not exists users_repliers_client_id_idx on public.users (repliers_client_id) where repliers_client_id is not null;
comment on column public.users.repliers_client_id is 'Repliers client ID; set by Clerk webhook on user.created for saved searches/favorites.';
