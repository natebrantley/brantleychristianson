-- Idempotency store for Repliers webhook: deduplicate by event_id.

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_id text not null,
  created_at timestamptz default now(),
  unique (source, event_id)
);

create index if not exists webhook_events_source_event_id_idx on public.webhook_events (source, event_id);
comment on table public.webhook_events is 'Idempotency for webhooks (e.g. Repliers); do not process same event_id twice.';
