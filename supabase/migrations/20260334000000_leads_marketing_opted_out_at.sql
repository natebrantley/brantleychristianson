-- Note unsubscribes and spam complaints from MailerLite in public.leads.
-- When MailerLite webhook receives subscriber.unsubscribed, subscriber.spam_reported,
-- subscriber.bounced, or subscriber.deleted, we set users.marketing_opt_in = false and
-- set leads.marketing_opted_out_at = now() for any lead with that email.
-- Sync-to-MailerLite and dashboard lists exclude rows where marketing_opted_out_at IS NOT NULL.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS marketing_opted_out_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.leads.marketing_opted_out_at IS
  'Set when MailerLite reports unsubscribe, bounce, spam, or deleted for this lead email. Excludes lead from MailerLite sync and from default dashboard lists.';

CREATE INDEX IF NOT EXISTS leads_marketing_opted_out_at_idx
  ON public.leads (marketing_opted_out_at)
  WHERE marketing_opted_out_at IS NOT NULL;
