-- Align public.leads with remote Supabase schema (from gen types --linked).
-- Adds columns that exist in remote but were not in repo migrations. Safe to run multiple times (IF NOT EXISTS).
-- Run after: 20260315000001_update_rls_leads_include_lender.sql

alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists agent text;
alter table public.leads add column if not exists average_price numeric(12, 2);
alter table public.leads add column if not exists buyer_seller text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists email_address text;
alter table public.leads add column if not exists favorite_city text;
alter table public.leads add column if not exists favorite_properties integer;
alter table public.leads add column if not exists first_name text;
alter table public.leads add column if not exists house_to_sell text;
alter table public.leads add column if not exists last_login timestamptz;
alter table public.leads add column if not exists last_name text;
alter table public.leads add column if not exists login_count integer;
alter table public.leads add column if not exists median_price numeric(12, 2);
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists notes_2 text;
alter table public.leads add column if not exists opted_in_email text;
alter table public.leads add column if not exists opted_in_text text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists pre_qualified_for_mortgage text;
alter table public.leads add column if not exists property_inquiries integer;
alter table public.leads add column if not exists property_views integer;
alter table public.leads add column if not exists registered timestamptz;
alter table public.leads add column if not exists saved_searches integer;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists state text;
alter table public.leads add column if not exists timeframe text;
alter table public.leads add column if not exists zip text;

comment on table public.leads is 'CRM leads; schema aligned with remote via 20260316000000_align_leads_with_remote.sql';
