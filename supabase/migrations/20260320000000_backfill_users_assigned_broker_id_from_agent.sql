-- Backfill public.users.assigned_broker_id from public.users.agent (when agent is populated, assigned_broker_id is null).
-- Matches agent value (name, slug, or email) to users.clerk_id for role in ('agent','broker').
-- Safe when users.agent column does not exist (no-op). Run after agents have signed in so users has their clerk_id.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'agent'
  ) THEN
    -- By email (users.agent = broker's email)
    UPDATE public.users u
    SET assigned_broker_id = u2.clerk_id
    FROM public.users u2
    WHERE u2.role IN ('agent', 'broker')
      AND u.agent IS NOT NULL
      AND trim(u.agent) <> ''
      AND (u.assigned_broker_id IS NULL OR u.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
      AND lower(trim(u.agent)) = lower(trim(u2.email));

    -- By full name (First Last / Last First)
    UPDATE public.users u
    SET assigned_broker_id = u2.clerk_id
    FROM public.users u2
    WHERE u2.role IN ('agent', 'broker')
      AND u.agent IS NOT NULL
      AND trim(u.agent) <> ''
      AND (u.assigned_broker_id IS NULL OR u.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
      AND (
        lower(trim(u.agent)) = lower(trim(concat_ws(' ', u2.first_name, u2.last_name)))
        OR lower(trim(u.agent)) = lower(trim(concat_ws(' ', u2.last_name, u2.first_name)))
      );

    -- By agent slug (slug → email → users.clerk_id)
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
      AND u.agent IS NOT NULL
      AND trim(u.agent) <> ''
      AND (u.assigned_broker_id IS NULL OR u.assigned_broker_id NOT LIKE 'user\_%' ESCAPE '\')
      AND lower(trim(u.agent)) = slug_to_email.slug;
  END IF;
END $$;
