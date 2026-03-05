-- Fix: "record \"new\" has no field \"updated_at\"" on Clerk webhook.
-- Run once in Supabase Dashboard → SQL Editor (production project).

alter table public.users
  add column if not exists updated_at timestamptz default now();

comment on column public.users.updated_at is 'Set automatically by trigger on row update.';

-- If the trigger is missing, create it:
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
