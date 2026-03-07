-- Canonical broker slug is first_last hyphen (e.g. nate-brantley), aligned with agents.json and URLs.
-- Convert existing users.slug from underscore to hyphen for agent/broker/owner.
UPDATE public.users
SET slug = replace(slug, '_', '-')
WHERE role IN ('agent', 'broker', 'owner')
  AND slug IS NOT NULL
  AND slug != ''
  AND slug LIKE '%_%';

COMMENT ON COLUMN public.users.slug IS 'Canonical broker/agent slug: first_last hyphen (e.g. nate-brantley). Matches agents.json and /agents/[slug].';
