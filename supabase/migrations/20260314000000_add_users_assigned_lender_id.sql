-- Add assigned_lender_id to public.users (lender slug from lenders.json when client chooses a lender).
-- Clerk webhook and sign-in sync preserve this column; app can set via PATCH /api/me/lender.
alter table public.users
  add column if not exists assigned_lender_id text;

comment on column public.users.assigned_lender_id is 'Lender slug from lenders.json; set when client chooses a preferred lender. Used for client dashboard "your lender" card.';
