-- Deduplicate public.users by clerk_id (keep one row per clerk_id).
-- clerk_id is already UNIQUE; this cleans up any legacy duplicates (e.g. before constraint or manual inserts).
-- Keeps the row with the smallest id per clerk_id; deletes the rest.

DELETE FROM public.users u
USING public.users u2
WHERE u.clerk_id = u2.clerk_id
  AND u.id > u2.id;
