-- Ensure users.updated_at exists so set_updated_at() trigger does not error.
-- Safe to run if the column already exists (e.g. from 20240301000000_create_users_table.sql).

alter table public.users
  add column if not exists updated_at timestamptz default now();

comment on column public.users.updated_at is 'Set automatically by trigger on row update.';
