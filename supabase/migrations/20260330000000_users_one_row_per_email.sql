-- Option C: One row per email. One-time dedupe by email, then enforce UNIQUE on normalized email.
-- Canonical row per email = smallest id (oldest). Reassign saved_searches, favorites, and users.assigned_* to canonical clerk_id; delete duplicate user rows.

-- 1. Reassign saved_searches and favorites to canonical clerk_id for each duplicate email
WITH normalized AS (
  SELECT id, clerk_id, lower(trim(email)) AS email_norm
  FROM public.users
  WHERE email IS NOT NULL AND trim(email) <> ''
),
canonical AS (
  SELECT DISTINCT ON (email_norm) id AS canonical_id, clerk_id AS canonical_clerk_id, email_norm
  FROM normalized
  ORDER BY email_norm, id
),
duplicate_rows AS (
  SELECT n.id, n.clerk_id, n.email_norm, c.canonical_clerk_id
  FROM normalized n
  JOIN canonical c ON c.email_norm = n.email_norm AND c.canonical_id <> n.id
)
UPDATE public.saved_searches s
SET clerk_id = d.canonical_clerk_id
FROM duplicate_rows d
WHERE s.clerk_id = d.clerk_id;

WITH normalized AS (
  SELECT id, clerk_id, lower(trim(email)) AS email_norm
  FROM public.users
  WHERE email IS NOT NULL AND trim(email) <> ''
),
canonical AS (
  SELECT DISTINCT ON (email_norm) id AS canonical_id, clerk_id AS canonical_clerk_id, email_norm
  FROM normalized
  ORDER BY email_norm, id
),
duplicate_rows AS (
  SELECT n.id, n.clerk_id, n.email_norm, c.canonical_clerk_id
  FROM normalized n
  JOIN canonical c ON c.email_norm = n.email_norm AND c.canonical_id <> n.id
)
UPDATE public.favorites f
SET clerk_id = d.canonical_clerk_id
FROM duplicate_rows d
WHERE f.clerk_id = d.clerk_id;

-- 2. Reassign users.assigned_broker_id and assigned_lender_id to canonical clerk_id where they point at a duplicate
WITH normalized AS (
  SELECT id, clerk_id, lower(trim(email)) AS email_norm
  FROM public.users
  WHERE email IS NOT NULL AND trim(email) <> ''
),
canonical AS (
  SELECT DISTINCT ON (email_norm) id AS canonical_id, clerk_id AS canonical_clerk_id, email_norm
  FROM normalized
  ORDER BY email_norm, id
),
duplicate_rows AS (
  SELECT n.id, n.clerk_id, n.email_norm, c.canonical_clerk_id
  FROM normalized n
  JOIN canonical c ON c.email_norm = n.email_norm AND c.canonical_id <> n.id
)
UPDATE public.users u
SET assigned_broker_id = d.canonical_clerk_id
FROM duplicate_rows d
WHERE u.assigned_broker_id = d.clerk_id;

WITH normalized AS (
  SELECT id, clerk_id, lower(trim(email)) AS email_norm
  FROM public.users
  WHERE email IS NOT NULL AND trim(email) <> ''
),
canonical AS (
  SELECT DISTINCT ON (email_norm) id AS canonical_id, clerk_id AS canonical_clerk_id, email_norm
  FROM normalized
  ORDER BY email_norm, id
),
duplicate_rows AS (
  SELECT n.id, n.clerk_id, n.email_norm, c.canonical_clerk_id
  FROM normalized n
  JOIN canonical c ON c.email_norm = n.email_norm AND c.canonical_id <> n.id
)
UPDATE public.users u
SET assigned_lender_id = d.canonical_clerk_id
FROM duplicate_rows d
WHERE u.assigned_lender_id = d.clerk_id;

-- 3. Delete duplicate user rows (keep canonical per email)
WITH normalized AS (
  SELECT id, clerk_id, lower(trim(email)) AS email_norm
  FROM public.users
  WHERE email IS NOT NULL AND trim(email) <> ''
),
canonical AS (
  SELECT DISTINCT ON (email_norm) id AS canonical_id, email_norm
  FROM normalized
  ORDER BY email_norm, id
),
duplicate_rows AS (
  SELECT n.id
  FROM normalized n
  JOIN canonical c ON c.email_norm = n.email_norm AND c.canonical_id <> n.id
)
DELETE FROM public.users
WHERE id IN (SELECT id FROM duplicate_rows);

-- 4. Replace non-unique email index with UNIQUE index
DROP INDEX IF EXISTS public.users_email_lower_idx;
CREATE UNIQUE INDEX users_email_lower_key
  ON public.users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

COMMENT ON COLUMN public.users.email IS
  'Primary email from Clerk. Unique per row (normalized). Used by MailerLite webhook, lead bridge, and Clerk webhook (one row per email; latest Clerk account wins).';

-- RPC for webhook: find user by normalized email (one row per email; used to update existing row when same email, new clerk_id)
CREATE OR REPLACE FUNCTION public.get_user_by_normalized_email(norm_email text)
RETURNS TABLE (id uuid, clerk_id text, email text, first_name text, last_name text, role text, slug text, assigned_broker_id text, assigned_lender_id text, repliers_client_id bigint, marketing_opt_in boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.clerk_id, u.email, u.first_name, u.last_name, u.role, u.slug,
         u.assigned_broker_id, u.assigned_lender_id, u.repliers_client_id, u.marketing_opt_in
  FROM public.users u
  WHERE u.email IS NOT NULL AND lower(trim(u.email)) = lower(trim(norm_email))
  LIMIT 1;
$$;
