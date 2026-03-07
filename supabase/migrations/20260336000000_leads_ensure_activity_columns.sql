-- Ensure activity columns exist on public.leads so LEADS_SELECT and owner/agent CRM work.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_login timestamptz;

COMMENT ON COLUMN public.leads.created_at IS 'When the lead was created; used for pulse/activity.';
COMMENT ON COLUMN public.leads.updated_at IS 'When the lead was last updated; trigger set_updated_at.';
COMMENT ON COLUMN public.leads.last_login IS 'Last sign-in for linked users; used for pulse/activity.';
