-- Allow agents (and lenders) to update leads assigned to them.
-- SELECT already allows clerk_id, assigned_broker_id, assigned_lender_id match.

drop policy if exists "Agents and lenders can update assigned leads" on public.leads;
create policy "Agents and lenders can update assigned leads"
  on public.leads for update to authenticated
  using (
    (auth.jwt()->>'sub') = assigned_broker_id
    or (auth.jwt()->>'sub') = assigned_lender_id
  )
  with check (
    (auth.jwt()->>'sub') = assigned_broker_id
    or (auth.jwt()->>'sub') = assigned_lender_id
  );

comment on table public.leads is 'CRM leads; RLS: read/update where clerk_id, assigned_broker_id, or assigned_lender_id = JWT sub.';
