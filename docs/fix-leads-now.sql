-- 1) Fill assigned_broker_id from agent (name → slug). 2) Drop agent.
-- Run in Supabase SQL Editor. One shot.

-- Map agent name (or existing slug) to slug, then set assigned_broker_id = slug
UPDATE public.leads l
SET assigned_broker_id = m.slug
FROM (
  SELECT 'Corey Allen' AS name, 'corey-allen' AS slug UNION ALL SELECT 'Nate Brantley', 'nate' UNION ALL
  SELECT 'Corey Cabrera', 'corey-cabrera' UNION ALL SELECT 'Doug Carrillo', 'doug' UNION ALL
  SELECT 'Ashley Christianson', 'ashley' UNION ALL SELECT 'Jet Chen', 'jet' UNION ALL
  SELECT 'Stacia Davidson', 'stacia' UNION ALL SELECT 'Jessy Humphrey', 'jessy' UNION ALL
  SELECT 'Hayden Humphrey', 'hayden' UNION ALL SELECT 'Mary Jackson', 'mary' UNION ALL
  SELECT 'Kelly Kerns', 'kelly' UNION ALL SELECT 'Marcus Lathan', 'marcus' UNION ALL
  SELECT 'Blake Nelson', 'blake' UNION ALL SELECT 'Jeremy Schoenberg', 'jeremy' UNION ALL
  SELECT 'Yasamin Strickland', 'yasamin' UNION ALL SELECT 'Kat Uruo', 'kat' UNION ALL
  SELECT 'Aaron Waltemeyer', 'aaron' UNION ALL SELECT 'Jessica Wang', 'jessica' UNION ALL
  SELECT 'Chelsea Wright', 'chelsea' UNION ALL SELECT 'Ann Zheng', 'ann' UNION ALL
  SELECT 'Jane Ye', 'jane'
) m
WHERE l.agent IS NOT NULL AND trim(l.agent) <> ''
  AND lower(trim(l.agent)) = lower(m.name);

-- Also match if agent already contains a slug (e.g. "nate", "corey-allen")
UPDATE public.leads l
SET assigned_broker_id = m.slug
FROM (
  SELECT 'corey-allen' AS slug UNION ALL SELECT 'nate' UNION ALL SELECT 'corey-cabrera' UNION ALL
  SELECT 'doug' UNION ALL SELECT 'ashley' UNION ALL SELECT 'jet' UNION ALL SELECT 'stacia' UNION ALL
  SELECT 'jessy' UNION ALL SELECT 'hayden' UNION ALL SELECT 'mary' UNION ALL SELECT 'kelly' UNION ALL
  SELECT 'marcus' UNION ALL SELECT 'blake' UNION ALL SELECT 'jeremy' UNION ALL SELECT 'yasamin' UNION ALL
  SELECT 'kat' UNION ALL SELECT 'aaron' UNION ALL SELECT 'jessica' UNION ALL SELECT 'chelsea' UNION ALL
  SELECT 'ann' UNION ALL SELECT 'jane'
) m
WHERE l.agent IS NOT NULL AND trim(l.agent) <> ''
  AND (l.assigned_broker_id IS NULL OR trim(l.assigned_broker_id) = '')
  AND lower(trim(l.agent)) = m.slug;

-- Copy over any remaining: agent value -> assigned_broker_id (so we don't lose data), then drop
UPDATE public.leads
SET assigned_broker_id = trim(agent)
WHERE agent IS NOT NULL AND trim(agent) <> '' AND (assigned_broker_id IS NULL OR trim(assigned_broker_id) = '');

ALTER TABLE public.leads DROP COLUMN IF EXISTS agent;
