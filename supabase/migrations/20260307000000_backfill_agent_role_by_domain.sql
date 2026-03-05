-- Backfill: set role = 'agent' for users with @brantleychristianson.com email.
-- Clerk metadata is correct for these users but may not have been synced to Supabase.

update public.users
set role = 'agent'
where (email is not null and lower(trim(email)) like '%@brantleychristianson.com')
  and (role is null or role = 'user');
