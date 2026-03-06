-- Allow leads RLS to match by slug as well as Clerk ID.
-- 1. Add users.slug so we can resolve JWT sub -> slug in RLS.
-- 2. Update leads policies so agents/lenders can read/update when assigned_broker_id or
--    assigned_lender_id equals either (auth.jwt()->>'sub') or (SELECT slug FROM users WHERE clerk_id = auth.jwt()->>'sub').

-- 1. Slug used for RLS and for matching leads.assigned_broker_id / assigned_lender_id when they store slug (e.g. nate_brantley).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS slug text;

COMMENT ON COLUMN public.users.slug IS 'Canonical slug for this user (e.g. first_last); used in leads RLS when assigned_broker_id/assigned_lender_id is slug.';

-- Backfill slug from first_name + last_name for existing agent/broker/lender rows (format: first_last)
UPDATE public.users u
SET slug = nullif(
  trim(both '_' from lower(regexp_replace(
    trim(coalesce(u.first_name, '')) || '_' || trim(coalesce(u.last_name, '')),
    '\s+', '_', 'g'
  ))),
  ''
)
WHERE u.role IN ('agent', 'broker', 'lender') AND u.slug IS NULL;

-- 2. Leads SELECT: allow when JWT sub matches, or when assigned_broker_id/assigned_lender_id equals current user slug
DROP POLICY IF EXISTS "Users can read own or assigned leads" ON public.leads;
CREATE POLICY "Users can read own or assigned leads"
  ON public.leads FOR SELECT TO authenticated
  USING (
    (auth.jwt()->>'sub') = assigned_broker_id
    OR assigned_broker_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
    OR (auth.jwt()->>'sub') = assigned_lender_id
    OR assigned_lender_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
  );

-- 3. Leads UPDATE: same conditions
DROP POLICY IF EXISTS "Agents and lenders can update assigned leads" ON public.leads;
CREATE POLICY "Agents and lenders can update assigned leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (
    (auth.jwt()->>'sub') = assigned_broker_id
    OR assigned_broker_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
    OR (auth.jwt()->>'sub') = assigned_lender_id
    OR assigned_lender_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
  )
  WITH CHECK (
    (auth.jwt()->>'sub') = assigned_broker_id
    OR assigned_broker_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
    OR (auth.jwt()->>'sub') = assigned_lender_id
    OR assigned_lender_id = (SELECT slug FROM public.users WHERE clerk_id = auth.jwt()->>'sub' AND slug IS NOT NULL LIMIT 1)
  );

COMMENT ON TABLE public.leads IS 'CRM leads; RLS: read/update where assigned_broker_id or assigned_lender_id = JWT sub or matching users.slug.';
