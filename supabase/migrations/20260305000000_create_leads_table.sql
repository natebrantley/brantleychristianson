-- Leads table for CRM: consultation/import leads. When a lead signs in via Clerk,
-- the webhook links them by setting clerk_id where email matches (see Clerk webhook).
-- Run in Supabase SQL Editor or via `supabase db push`.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  clerk_id text,
  assigned_broker_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Repair: if leads was created with a different schema, add missing columns so indexes can be created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'email') THEN
      ALTER TABLE public.leads ADD COLUMN email text DEFAULT '' NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'clerk_id') THEN
      ALTER TABLE public.leads ADD COLUMN clerk_id text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'assigned_broker_id') THEN
      ALTER TABLE public.leads ADD COLUMN assigned_broker_id text;
    END IF;
  END IF;
END $$;

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_clerk_id_idx on public.leads (clerk_id) where clerk_id is not null;
create index if not exists leads_assigned_broker_id_idx on public.leads (assigned_broker_id) where assigned_broker_id is not null;

comment on table public.leads is 'CRM leads; clerk_id set by webhook when lead signs in (email match).';

-- Optional: updated_at trigger (reuse existing function if present)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
