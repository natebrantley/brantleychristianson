-- Allow 'user' in users.role for webhook default (agent | broker | user).
-- Run in Supabase SQL Editor or via supabase db push.

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role is null or role in ('agent', 'broker', 'user'));

comment on column public.users.role is 'Dashboard role: agent/broker for staff; user for clients. Set by Clerk webhook from public_metadata.role or default user.';
