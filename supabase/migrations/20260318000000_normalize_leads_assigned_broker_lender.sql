-- Normalize public.leads.assigned_broker_id and assigned_lender_id to Clerk user IDs (users.clerk_id).
-- Run after users and leads exist and agents/lenders have signed in (so users has clerk_id).
-- Idempotent: only updates rows where the current value is not already a Clerk ID (user_%).
--
-- assigned_broker_id: match by (1) email, (2) full name, (3) agent slug → users.clerk_id (role agent/broker).
-- assigned_lender_id:  match by (1) email, (2) full name, (3) lender slug → users.clerk_id (role lender).

-- ========== ASSIGNED BROKER ==========

-- 1) Broker: by email (users.email = leads.assigned_broker_id)
UPDATE public.leads l
SET assigned_broker_id = u.clerk_id
FROM public.users u
WHERE u.role IN ('agent', 'broker')
  AND l.assigned_broker_id IS NOT NULL
  AND (l.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
  AND lower(trim(l.assigned_broker_id)) = lower(trim(u.email));

-- 2) Broker: by full name (First Last / Last First, case-insensitive)
UPDATE public.leads l
SET assigned_broker_id = u.clerk_id
FROM public.users u
WHERE u.role IN ('agent', 'broker')
  AND l.assigned_broker_id IS NOT NULL
  AND (l.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
  AND (
    lower(trim(l.assigned_broker_id)) = lower(trim(concat_ws(' ', u.first_name, u.last_name)))
    OR lower(trim(l.assigned_broker_id)) = lower(trim(concat_ws(' ', u.last_name, u.first_name)))
  );

-- 3) Broker: by agent slug (slug → email → users.clerk_id)
UPDATE public.leads l
SET assigned_broker_id = u.clerk_id
FROM public.leads l2
JOIN (
  SELECT 'corey-allen' AS slug, 'corey.allen@brantleychristianson.com' AS email UNION ALL
  SELECT 'nate', 'nate@brantleychristianson.com' UNION ALL
  SELECT 'corey-cabrera', 'corey@brantleychristianson.com' UNION ALL
  SELECT 'doug', 'doug@brantleychristianson.com' UNION ALL
  SELECT 'ashley', 'ashley@brantleychristianson.com' UNION ALL
  SELECT 'jet', 'jet@brantleychristianson.com' UNION ALL
  SELECT 'stacia', 'stacia@brantleychristianson.com' UNION ALL
  SELECT 'jessy', 'jessy@brantleychristianson.com' UNION ALL
  SELECT 'hayden', 'hayden@brantleychristianson.com' UNION ALL
  SELECT 'mary', 'mary@brantleychristianson.com' UNION ALL
  SELECT 'kelly', 'kelly@brantleychristianson.com' UNION ALL
  SELECT 'marcus', 'marcus@brantleychristianson.com' UNION ALL
  SELECT 'blake', 'blake@brantleychristianson.com' UNION ALL
  SELECT 'jeremy', 'jeremy@brantleychristianson.com' UNION ALL
  SELECT 'yasamin', 'yaz@brantleychristianson.com' UNION ALL
  SELECT 'kat', 'kat@brantleychristianson.com' UNION ALL
  SELECT 'aaron', 'aaron@brantleychristianson.com' UNION ALL
  SELECT 'jessica', 'jessica@brantleychristianson.com' UNION ALL
  SELECT 'chelsea', 'chelsea@brantleychristianson.com' UNION ALL
  SELECT 'ann', 'ann@brantleychristianson.com' UNION ALL
  SELECT 'jane', 'jane@brantleychristianson.com'
) slug_to_email ON lower(trim(l2.assigned_broker_id)) = slug_to_email.slug
JOIN public.users u ON u.role IN ('agent', 'broker') AND lower(trim(u.email)) = lower(slug_to_email.email)
WHERE l.id = l2.id
  AND l2.assigned_broker_id IS NOT NULL
  AND (l2.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\');

-- ========== ASSIGNED LENDER ==========

-- 4) Lender: by email (users.email = leads.assigned_lender_id)
UPDATE public.leads l
SET assigned_lender_id = u.clerk_id
FROM public.users u
WHERE u.role = 'lender'
  AND l.assigned_lender_id IS NOT NULL
  AND (l.assigned_lender_id NOT LIKE 'user\_%' ESCAPE '\')
  AND lower(trim(l.assigned_lender_id)) = lower(trim(u.email));

-- 5) Lender: by full name (First Last / Last First, case-insensitive)
UPDATE public.leads l
SET assigned_lender_id = u.clerk_id
FROM public.users u
WHERE u.role = 'lender'
  AND l.assigned_lender_id IS NOT NULL
  AND (l.assigned_lender_id NOT LIKE 'user\_%' ESCAPE '\')
  AND (
    lower(trim(l.assigned_lender_id)) = lower(trim(concat_ws(' ', u.first_name, u.last_name)))
    OR lower(trim(l.assigned_lender_id)) = lower(trim(concat_ws(' ', u.last_name, u.first_name)))
  );

-- 6) Lender: by lender slug (slug → email → users.clerk_id)
UPDATE public.leads l
SET assigned_lender_id = u.clerk_id
FROM public.leads l2
JOIN (
  SELECT 'spencer' AS slug, 'sbuck@nexalending.com' AS email UNION ALL
  SELECT 'taylor', 'taylorwinkler@nexamortgage.com' UNION ALL
  SELECT 'madisyn', 'Madisyn@dc-lending.com' UNION ALL
  SELECT 'ian-humphrey', 'ihumphrey@westcapitallending.com'
) slug_to_email ON lower(trim(l2.assigned_lender_id)) = slug_to_email.slug
JOIN public.users u ON u.role = 'lender' AND lower(trim(u.email)) = lower(slug_to_email.email)
WHERE l.id = l2.id
  AND l2.assigned_lender_id IS NOT NULL
  AND (l2.assigned_lender_id NOT LIKE 'user\_%' ESCAPE '\');

-- Comments for future reference
COMMENT ON COLUMN public.leads.assigned_broker_id IS 'Clerk user ID of assigned agent (users.clerk_id). Normalize from name/slug/email: 20260318000000_normalize_leads_assigned_broker_lender.sql';
COMMENT ON COLUMN public.leads.assigned_lender_id IS 'Clerk user ID of assigned lender (users.clerk_id). Normalize from name/slug/email: 20260318000000_normalize_leads_assigned_broker_lender.sql';
