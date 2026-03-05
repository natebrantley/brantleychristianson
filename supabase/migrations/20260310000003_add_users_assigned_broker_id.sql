-- Ensure public.users has assigned_broker_id (stores broker slug from agents.json when client chooses an agent).
-- Matches Supabase table editor column name; app reads/writes this for client dashboard "Your agent".
alter table public.users
  add column if not exists assigned_broker_id text;

comment on column public.users.assigned_broker_id is 'Broker slug from agents.json; set when client chooses an agent. Used for client dashboard "your agent" card and contact info.';
