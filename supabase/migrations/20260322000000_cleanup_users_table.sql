-- public.users: cleanup and optimize
-- Aligns with Clerk (source of truth), leads, MailerLite, and Repliers.
-- See docs/USERS-TABLE-REVIEW.md and docs/sql/cleanup-users-table.sql.

-- ========== 1. Drop legacy columns ==========

ALTER TABLE public.users DROP COLUMN IF EXISTS agent;
ALTER TABLE public.users DROP COLUMN IF EXISTS assigned_broker_slug;

-- ========== 2. Role constraint ==========

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('agent', 'broker', 'lender', 'user'));

-- ========== 3. Indexes for lookups ==========

CREATE INDEX IF NOT EXISTS users_email_lower_idx
  ON public.users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

-- ========== 4. Comments (align with Clerk + integrations) ==========

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
  'Clerk user ID of client''s chosen agent. Preserved on webhook. Aligns with leads.assigned_broker_id.';

COMMENT ON COLUMN public.users.assigned_lender_id IS
  'Clerk user ID of client''s chosen lender. Preserved on webhook. Aligns with leads.assigned_lender_id.';

COMMENT ON COLUMN public.users.repliers_client_id IS
  'Repliers client ID; set by Clerk webhook on user.created. Preserved on webhook.';

COMMENT ON COLUMN public.users.marketing_opt_in IS
  'MailerLite alignment: false on unsubscribe/bounce/spam/deleted. Preserved on webhook.';
