-- Drop deprecated columns from public.leads.
ALTER TABLE public.leads DROP COLUMN IF EXISTS house_to_sell;
ALTER TABLE public.leads DROP COLUMN IF EXISTS pre_qualified_for_mortgage;
