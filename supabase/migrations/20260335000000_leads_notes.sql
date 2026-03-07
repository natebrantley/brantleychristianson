-- Add notes column to public.leads for agent/owner CRM notes.
-- Notes are synced from the lead detail page and stored in public.leads.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

COMMENT ON COLUMN public.leads.notes IS 'CRM notes (agent/owner) for this lead; editable on lead detail page.';
