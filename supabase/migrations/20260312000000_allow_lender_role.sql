-- Allow 'lender' in users.role for lender dashboard (agent | broker | lender | user).
-- Run in Supabase SQL Editor or via supabase db push.

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role is null or role in ('agent', 'broker', 'lender', 'user'));

comment on column public.users.role is 'Dashboard role: agent/broker for staff; lender for preferred lenders; user for clients. Set by Clerk webhook from public_metadata.role or default user.';
