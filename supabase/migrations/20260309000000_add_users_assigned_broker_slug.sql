-- Let clients assign themselves a broker (by slug) for quick access from dashboard.
alter table public.users
  add column if not exists assigned_broker_slug text;

comment on column public.users.assigned_broker_slug is 'Broker slug from agents.json; set by client from /brokers. Used for client dashboard "your agent" card and quick call.';
