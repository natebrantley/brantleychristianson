-- Optional: Enable RLS on public.users for Clerk JWT (auth.jwt()->>'sub' = clerk_id).
-- Apply only after: (1) Clerk JWT template "supabase" is configured, (2) CLERK_JWT_TEMPLATE_SUPABASE=supabase is set.
-- Requires Clerk JWT template with role 'authenticated' and Supabase configured to verify it.
-- Service role (webhooks, /api/me/agent) bypasses RLS.

alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select to authenticated
  using ((auth.jwt()->>'sub') = clerk_id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update to authenticated
  using ((auth.jwt()->>'sub') = clerk_id)
  with check ((auth.jwt()->>'sub') = clerk_id);

comment on table public.users is 'Synced from Clerk via webhook; RLS: authenticated can read/update own row by clerk_id.';
