-- Owner role: expanded broker with full access to public.leads (all rows) and view of assigned brokers.
-- Assign role = 'owner' in Clerk public_metadata.role for Nate and Ashley (or backfill by email below).
-- RLS: owners can SELECT, UPDATE, INSERT, DELETE any row in leads (god-mode CRM).

-- 1. Allow 'owner' in users.role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IS NULL OR role IN ('agent', 'broker', 'lender', 'user', 'owner'));

COMMENT ON COLUMN public.users.role IS 'Dashboard role: owner (full leads access); agent/broker for staff; lender for preferred lenders; user for clients.';

-- 2. Backfill role = 'owner' for Nate and Ashley (by email from agents.json)
UPDATE public.users
SET role = 'owner'
WHERE lower(trim(email)) IN ('nate@brantleychristianson.com', 'ashley@brantleychristianson.com')
  AND role IN ('agent', 'broker');

-- 3. Leads RLS: owners can read all rows (add to existing SELECT policy via new policy that ORs owner check)
-- Postgres RLS: if ANY policy allows, row is visible. So add a separate "Owners can read all leads" policy.
CREATE POLICY "Owners can read all leads"
  ON public.leads FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt()->>'sub')
        AND u.role = 'owner'
    )
  );

-- 4. Owners can update any lead
CREATE POLICY "Owners can update all leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt()->>'sub')
        AND u.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt()->>'sub')
        AND u.role = 'owner'
    )
  );

-- 5. Owners can insert leads (e.g. manual entry in CRM)
CREATE POLICY "Owners can insert leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt()->>'sub')
        AND u.role = 'owner'
    )
  );

-- 6. Owners can delete leads (full god-mode)
CREATE POLICY "Owners can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.clerk_id = (auth.jwt()->>'sub')
        AND u.role = 'owner'
    )
  );

COMMENT ON TABLE public.leads IS 'CRM leads; RLS: read/update where assigned_broker_id or assigned_lender_id = JWT sub or users.slug; owners (role=owner) have full SELECT/UPDATE/INSERT/DELETE.';
