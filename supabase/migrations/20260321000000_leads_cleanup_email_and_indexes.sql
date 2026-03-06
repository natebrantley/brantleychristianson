-- One-time cleanup and indexes for public.leads (see docs/LEADS-CLEANUP-OPTIMIZATION.md).
-- 1) Normalize email (trim, lowercase) and sync email_address so bridge/MailerLite matching works.
-- 2) Add composite indexes for dashboard queries (assigned_broker_id + created_at, etc.).

-- Ensure updated_at exists (trigger set_updated_at may reference it)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 1. Normalize email
UPDATE public.leads
SET email = lower(trim(email))
WHERE email IS NOT NULL AND trim(email) <> '' AND email <> lower(trim(email));

-- Sync email_address to email (canonical source for matching)
UPDATE public.leads
SET email_address = email
WHERE email IS NOT NULL AND trim(email) <> '' AND (email_address IS NULL OR email_address <> email);

-- 2. Composite indexes for dashboard list queries (filter + order by created_at desc)
CREATE INDEX IF NOT EXISTS leads_assigned_broker_created_idx
  ON public.leads (assigned_broker_id, created_at DESC NULLS LAST)
  WHERE assigned_broker_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_assigned_lender_created_idx
  ON public.leads (assigned_lender_id, created_at DESC NULLS LAST)
  WHERE assigned_lender_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_clerk_created_idx
  ON public.leads (clerk_id, created_at DESC NULLS LAST)
  WHERE clerk_id IS NOT NULL;
