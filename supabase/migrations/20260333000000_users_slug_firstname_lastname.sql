-- Canonical broker slug is firstname_lastname (underscore). Align with agents.json and /agents/[slug].
UPDATE public.users
SET slug = replace(slug, '-', '_')
WHERE role IN ('agent', 'broker', 'owner')
  AND slug IS NOT NULL
  AND slug != ''
  AND slug LIKE '%-%';

COMMENT ON COLUMN public.users.slug IS 'Canonical broker/agent slug: firstname_lastname (e.g. nate_brantley). Matches agents.json and /agents/[slug].';
