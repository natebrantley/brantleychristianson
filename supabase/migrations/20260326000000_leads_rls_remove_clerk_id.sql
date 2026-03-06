-- RLS: leads table no longer has clerk_id; update SELECT policy to only use assigned_broker_id and assigned_lender_id.
drop policy if exists "Users can read own or assigned leads" on public.leads;
create policy "Users can read own or assigned leads"
  on public.leads for select to authenticated
  using (
    (auth.jwt()->>'sub') = assigned_broker_id
    or (auth.jwt()->>'sub') = assigned_lender_id
  );

comment on table public.leads is 'CRM leads; RLS: read/update where assigned_broker_id or assigned_lender_id = JWT sub.';
