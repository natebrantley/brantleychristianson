-- Update RLS on leads so lenders can read rows where assigned_lender_id = their clerk_id.
-- Run after 20260315000000_add_leads_assigned_lender_id.sql.
drop policy if exists "Users can read own or assigned leads" on public.leads;
create policy "Users can read own or assigned leads"
  on public.leads for select to authenticated
  using (
    (auth.jwt()->>'sub') = clerk_id
    or (auth.jwt()->>'sub') = assigned_broker_id
    or (auth.jwt()->>'sub') = assigned_lender_id
  );

comment on table public.leads is 'CRM leads; RLS: authenticated can read rows where clerk_id, assigned_broker_id, or assigned_lender_id = JWT sub.';
