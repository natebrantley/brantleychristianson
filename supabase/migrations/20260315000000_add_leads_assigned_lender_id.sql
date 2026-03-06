-- Add assigned_lender_id to leads so agents can assign referral leads to a lender.
-- Lenders see leads where assigned_lender_id = their clerk_id (RLS updated in next migration).
alter table public.leads
  add column if not exists assigned_lender_id text;

create index if not exists leads_assigned_lender_id_idx on public.leads (assigned_lender_id) where assigned_lender_id is not null;

comment on column public.leads.assigned_lender_id is 'Clerk user id of the lender this lead is assigned to for follow-up.';
