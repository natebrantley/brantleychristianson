-- Backfill leads.assigned_broker_id from agent name (or slug) to Clerk user ID.
-- Use when leads were imported with full name (e.g. "Nate Brantley") or slug (e.g. "nate")
-- instead of Clerk ID; agents see no leads until assigned_broker_id matches their clerk_id.
--
-- Matching: (1) by full name from public.users (first_name + last_name), (2) by slug via
-- known agent emails so we can map slug -> users.clerk_id for users with role agent/broker.

-- 1) Update where leads.assigned_broker_id equals a broker's "First Last" or "Last First" from users
update public.leads l
set assigned_broker_id = u.clerk_id
from public.users u
where u.role in ('agent', 'broker')
  and l.assigned_broker_id is not null
  and (l.assigned_broker_id not like 'user\_%')
  and (
    trim(l.assigned_broker_id) = trim(concat_ws(' ', u.first_name, u.last_name))
    or trim(l.assigned_broker_id) = trim(concat_ws(' ', u.last_name, u.first_name))
    or lower(trim(l.assigned_broker_id)) = lower(trim(concat_ws(' ', u.first_name, u.last_name)))
  );

-- 2) Update where leads.assigned_broker_id is an agent slug (e.g. "nate", "corey-allen")
--    Map slug -> email via inline list, then email -> users.clerk_id.
--    (Lead table must be in FROM so it can be referenced in the JOIN condition.)
update public.leads l
set assigned_broker_id = u.clerk_id
from public.leads l2
join (
  select 'corey-allen' as slug, 'corey.allen@brantleychristianson.com' as email union all
  select 'nate', 'nate@brantleychristianson.com' union all
  select 'corey-cabrera', 'corey@brantleychristianson.com' union all
  select 'doug', 'doug@brantleychristianson.com' union all
  select 'ashley', 'ashley@brantleychristianson.com' union all
  select 'jet', 'jet@brantleychristianson.com' union all
  select 'stacia', 'stacia@brantleychristianson.com' union all
  select 'jessy', 'jessy@brantleychristianson.com' union all
  select 'hayden', 'hayden@brantleychristianson.com' union all
  select 'mary', 'mary@brantleychristianson.com' union all
  select 'kelly', 'kelly@brantleychristianson.com' union all
  select 'marcus', 'marcus@brantleychristianson.com' union all
  select 'blake', 'blake@brantleychristianson.com' union all
  select 'jeremy', 'jeremy@brantleychristianson.com' union all
  select 'yasamin', 'yaz@brantleychristianson.com' union all
  select 'kat', 'kat@brantleychristianson.com' union all
  select 'aaron', 'aaron@brantleychristianson.com' union all
  select 'jessica', 'jessica@brantleychristianson.com' union all
  select 'chelsea', 'chelsea@brantleychristianson.com' union all
  select 'ann', 'ann@brantleychristianson.com' union all
  select 'jane', 'jane@brantleychristianson.com'
) slug_to_email on lower(trim(l2.assigned_broker_id)) = slug_to_email.slug
join public.users u on u.role in ('agent', 'broker') and u.email = slug_to_email.email
where l.id = l2.id
  and l2.assigned_broker_id is not null
  and (l2.assigned_broker_id not like 'user\_%');

comment on column public.leads.assigned_broker_id is 'Clerk user ID of assigned agent; must match users.clerk_id for agent dashboard and RLS. Backfill from name/slug: 20260317000000_backfill_leads_assigned_broker_id_from_agent_name.sql';
