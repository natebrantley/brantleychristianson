-- Sync all broker identifiers to canonical first_last slug (users.slug).
-- 1. Backfill users.slug for role = owner (same first_last formula as agent/broker/lender).
-- 2. Normalize leads.assigned_broker_id: where it equals a broker's clerk_id, set to that broker's slug.
-- 3. Normalize users.assigned_broker_id: where it equals a broker's clerk_id, set to that broker's slug.
-- After this, leads and users.assigned_broker_id store first_last (e.g. nate_brantley) when they reference a broker.

-- 1. Backfill slug for owners (same formula: first_last)
UPDATE public.users u
SET slug = nullif(
  trim(both '_' from lower(regexp_replace(
    trim(coalesce(u.first_name, '')) || '_' || trim(coalesce(u.last_name, '')),
    '\s+', '_', 'g'
  ))),
  ''
)
WHERE u.role = 'owner' AND (u.slug IS NULL OR u.slug = '');

-- 2. leads.assigned_broker_id: clerk_id -> users.slug for agent/broker/owner
UPDATE public.leads l
SET assigned_broker_id = u.slug
FROM public.users u
WHERE u.clerk_id = l.assigned_broker_id
  AND u.role IN ('agent', 'broker', 'owner')
  AND u.slug IS NOT NULL
  AND u.slug != '';

-- 3. users.assigned_broker_id (client's chosen agent): clerk_id -> that broker's users.slug
UPDATE public.users u1
SET assigned_broker_id = u2.slug
FROM public.users u2
WHERE u1.assigned_broker_id = u2.clerk_id
  AND u2.role IN ('agent', 'broker', 'owner')
  AND u2.slug IS NOT NULL
  AND u2.slug != '';

COMMENT ON COLUMN public.leads.assigned_broker_id IS 'Canonical broker slug (first_last, e.g. nate_brantley) or legacy clerk_id; RLS matches both. Synced to users.slug by 20260331000000_sync_broker_slugs_first_last.sql.';
