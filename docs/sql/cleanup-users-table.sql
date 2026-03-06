-- public.users: cleanup and optimize
-- Aligns with Clerk (source of truth), leads, MailerLite, and Repliers.
-- Run in Supabase SQL Editor or via supabase db push (as migration).
-- Review docs/USERS-TABLE-REVIEW.md first.

BEGIN;

-- ========== 1. Drop legacy columns ==========

-- Legacy: agent was replaced by assigned_broker_id (backfilled in 20260320000000).
ALTER TABLE public.users DROP COLUMN IF EXISTS agent;

-- Redundant: app only uses assigned_broker_id (Clerk ID or slug).
ALTER TABLE public.users DROP COLUMN IF EXISTS assigned_broker_slug;

-- ========== 2. Role constraint and default ==========

-- Ensure role is one of the four allowed values (idempotent).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('agent', 'broker', 'lender', 'user'));

-- Set null role to 'user' so we can enforce NOT NULL (optional; uncomment if desired).
-- UPDATE public.users SET role = 'user' WHERE role IS NULL;
-- ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
-- ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';

-- ========== 3. Indexes for lookups ==========

-- MailerLite webhook and lead bridge look up by email (lowercase).
CREATE INDEX IF NOT EXISTS users_email_lower_idx
  ON public.users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

-- Optional: simple index on email for exact match (if you prefer eq('email', x)).
-- CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email) WHERE email IS NOT NULL;

-- ========== 4. Optional: normalize email to lowercase ==========

-- Uncomment to normalize existing rows (matches how webhook and bridge store email).
-- UPDATE public.users
-- SET email = lower(trim(email))
-- WHERE email IS NOT NULL AND email <> lower(trim(email));

-- ========== 5. Comments (align with Clerk + integrations) ==========

COMMENT ON TABLE public.users IS
  'Synced from Clerk via webhook (clerk_id, email, first_name, last_name, role). App columns: assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in. RLS: auth.jwt()->>''sub'' = clerk_id.';

COMMENT ON COLUMN public.users.id IS
  'Primary key; prefer clerk_id for lookups.';

COMMENT ON COLUMN public.users.clerk_id IS
  'Clerk user ID (user_xxx). Unique; used for webhook upsert and RLS.';

COMMENT ON COLUMN public.users.email IS
  'Primary email from Clerk. Used by MailerLite webhook (update by email), lead bridge (leads.clerk_id by email).';

COMMENT ON COLUMN public.users.first_name IS
  'From Clerk profile.';

COMMENT ON COLUMN public.users.last_name IS
  'From Clerk profile.';

COMMENT ON COLUMN public.users.role IS
  'Dashboard role: agent | broker | lender | user. Set by Clerk webhook from public_metadata.role or domain fallback.';

COMMENT ON COLUMN public.users.created_at IS
  'Set on insert (default now()).';

COMMENT ON COLUMN public.users.updated_at IS
  'Set by trigger on update.';

COMMENT ON COLUMN public.users.assigned_broker_id IS
  'Clerk user ID of client’s chosen agent. Preserved on webhook. Aligns with leads.assigned_broker_id.';

COMMENT ON COLUMN public.users.assigned_lender_id IS
  'Clerk user ID of client’s chosen lender. Preserved on webhook. Aligns with leads.assigned_lender_id.';

COMMENT ON COLUMN public.users.repliers_client_id IS
  'Repliers client ID; set by Clerk webhook on user.created. Preserved on webhook.';

COMMENT ON COLUMN public.users.marketing_opt_in IS
  'MailerLite alignment: false on unsubscribe/bounce/spam/deleted. Preserved on webhook.';

COMMIT;

-- Optional: refresh statistics (run separately if needed).
-- ANALYZE public.users;
