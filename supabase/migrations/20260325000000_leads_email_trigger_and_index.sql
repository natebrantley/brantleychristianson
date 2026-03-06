-- Ongoing email normalization for public.leads (schema has email_address only).
-- See docs/LEADS-CLEANUP-OPTIMIZATION.md.

-- 1. Index for lookups by email_address
CREATE INDEX IF NOT EXISTS leads_email_address_idx ON public.leads (email_address) WHERE email_address IS NOT NULL;

-- 2. Trigger: keep email_address trimmed and lowercase on insert/update
CREATE OR REPLACE FUNCTION public.leads_normalize_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email_address IS NOT NULL AND trim(NEW.email_address) <> '' THEN
    NEW.email_address := lower(trim(NEW.email_address));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_normalize_email_trigger ON public.leads;
CREATE TRIGGER leads_normalize_email_trigger
  BEFORE INSERT OR UPDATE OF email_address ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_normalize_email();
