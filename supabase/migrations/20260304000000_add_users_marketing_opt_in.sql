-- Add marketing_opt_in for MailerLite webhook (unsubscribe/bounce sync).
-- Run in Supabase SQL Editor or via `supabase db push` if using Supabase CLI.

alter table public.users
  add column if not exists marketing_opt_in boolean default true;

comment on column public.users.marketing_opt_in is 'Set to false when MailerLite reports subscriber unsubscribed or bounced.';
