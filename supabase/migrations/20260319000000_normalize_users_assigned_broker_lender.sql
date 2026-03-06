-- Normalize public.users.assigned_broker_id and assigned_lender_id from slug to Clerk user ID (users.clerk_id).
-- Aligns with public.leads where these columns store clerk_id. Run after agents/lenders have signed in (users has their clerk_id).
-- Idempotent: only updates rows where current value is not already a Clerk ID (user_%).

-- ========== USERS: ASSIGNED BROKER (slug → clerk_id) ==========

UPDATE public.users u
SET assigned_broker_id = u2.clerk_id
FROM public.users u2
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
) slug_to_email ON lower(trim(u2.email)) = lower(slug_to_email.email)
WHERE u2.role IN ('agent', 'broker')
  AND u.assigned_broker_id IS NOT NULL
  AND (u.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
  AND lower(trim(u.assigned_broker_id)) = slug_to_email.slug;

-- ========== USERS: ASSIGNED LENDER (slug → clerk_id) ==========

UPDATE public.users u
SET assigned_lender_id = u2.clerk_id
FROM public.users u2
JOIN (
  SELECT 'spencer' AS slug, 'sbuck@nexalending.com' AS email UNION ALL
  SELECT 'taylor', 'taylorwinkler@nexamortgage.com' UNION ALL
  SELECT 'madisyn', 'Madisyn@dc-lending.com' UNION ALL
  SELECT 'ian-humphrey', 'ihumphrey@westcapitallending.com'
) slug_to_email ON lower(trim(u2.email)) = lower(slug_to_email.email)
WHERE u2.role = 'lender'
  AND u.assigned_lender_id IS NOT NULL
  AND (u.assigned_lender_id NOT LIKE 'user\_%' ESCAPE '\')
  AND lower(trim(u.assigned_lender_id)) = slug_to_email.slug;

COMMENT ON COLUMN public.users.assigned_broker_id IS 'Clerk user ID of assigned agent (users.clerk_id). Normalize from slug: 20260319000000_normalize_users_assigned_broker_lender.sql';
COMMENT ON COLUMN public.users.assigned_lender_id IS 'Clerk user ID of assigned lender (users.clerk_id). Normalize from slug: 20260319000000_normalize_users_assigned_broker_lender.sql';
