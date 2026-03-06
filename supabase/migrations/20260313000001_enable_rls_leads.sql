-- Optional: Enable RLS on public.leads: clients see own leads (clerk_id), brokers see leads assigned to them (assigned_broker_id).
-- Apply after enabling RLS on users and setting CLERK_JWT_TEMPLATE_SUPABASE.
-- Requires Clerk JWT template with role 'authenticated'.
-- Service role (Clerk webhook, etc.) bypasses RLS.

alter table public.leads enable row level security;

drop policy if exists "Users can read own or assigned leads" on public.leads;
create policy "Users can read own or assigned leads"
  on public.leads for select to authenticated
  using (
    (auth.jwt()->>'sub') = clerk_id
    or (auth.jwt()->>'sub') = assigned_broker_id
  );

comment on table public.leads is 'CRM leads; RLS: authenticated can read rows where clerk_id or assigned_broker_id = JWT sub.';
