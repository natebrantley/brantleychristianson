# public.leads — Cleanup & Optimization Guide

Use this guide to clean existing data and optimize **public.leads** for correct behavior with agent/lender dashboards, RLS, and email matching.

---

## 1. Ensure proper functionality (run in order)

### 1.1 Normalize assignment IDs to Clerk IDs

Leads must use **Clerk user IDs** in `assigned_broker_id` and `assigned_lender_id` so RLS and dashboards work.

- Run **leads** normalization (name/slug/email → clerk_id):  
  `supabase/migrations/20260318000000_normalize_leads_assigned_broker_lender.sql`
- Run **users** normalization if clients have slug in users:  
  `supabase/migrations/20260319000000_normalize_users_assigned_broker_lender.sql`
- If **users** has an **agent** column that was populated before **assigned_broker_id**:  
  `supabase/migrations/20260320000000_backfill_users_assigned_broker_id_from_agent.sql`

After this, agent and lender dashboards will see leads where `assigned_broker_id` / `assigned_lender_id` match their `clerk_id`.

### 1.2 Normalize email for matching

The app matches leads by **email** (e.g. Clerk webhook `bridgeLeadsByEmail`, MailerLite updates). Use a single canonical form: **trimmed, lowercase**.

Run once in Supabase SQL Editor:

```sql
-- Trim and lowercase email (and email_address if you keep it in sync)
UPDATE public.leads
SET
  email = lower(trim(email)),
  email_address = lower(trim(coalesce(email_address, email)))
WHERE email IS NOT NULL
  AND (trim(email) <> trim(lower(email)) OR email_address IS DISTINCT FROM lower(trim(coalesce(email_address, email))));
```

Optional: keep **email_address** in sync with **email** so legacy code that uses `email_address` (e.g. bridge) still works:

```sql
UPDATE public.leads SET email_address = email WHERE email IS NOT NULL AND (email_address IS NULL OR email_address <> email);
```

### 1.3 Fix empty or invalid email

Leads with null or empty email break lookups and should be fixed or removed.

```sql
-- Count bad rows (run first to inspect)
SELECT count(*) FROM public.leads WHERE email IS NULL OR trim(email) = '' OR email NOT LIKE '%@%';

-- Optional: set email_address = email for any row where email is valid but email_address is null
UPDATE public.leads SET email_address = email WHERE email IS NOT NULL AND trim(email) <> '' AND email LIKE '%@%' AND email_address IS NULL;

-- Optional: delete or archive leads with no valid email (uncomment and run only if you want to remove them)
-- DELETE FROM public.leads WHERE email IS NULL OR trim(email) = '' OR email NOT LIKE '%@%';
```

---

## 2. Index optimizations

Existing indexes: `leads_email_idx`, `leads_clerk_id_idx`, `leads_assigned_broker_id_idx`, `leads_assigned_lender_id_idx`. These support `WHERE` filters. For dashboard queries that also **order by created_at desc**, composite indexes can help.

Run in Supabase SQL Editor (optional, for large tables):

```sql
-- Agent dashboard: .eq('assigned_broker_id', userId).order('created_at', { ascending: false })
CREATE INDEX CONCURRENTLY IF NOT EXISTS leads_assigned_broker_created_idx
  ON public.leads (assigned_broker_id, created_at DESC NULLS LAST)
  WHERE assigned_broker_id IS NOT NULL;

-- Lender dashboard: .eq('assigned_lender_id', userId).order('created_at', { ascending: false })
CREATE INDEX CONCURRENTLY IF NOT EXISTS leads_assigned_lender_created_idx
  ON public.leads (assigned_lender_id, created_at DESC NULLS LAST)
  WHERE assigned_lender_id IS NOT NULL;

-- Client dashboard / bridge: .eq('clerk_id', userId).order('created_at', ...)
CREATE INDEX CONCURRENTLY IF NOT EXISTS leads_clerk_created_idx
  ON public.leads (clerk_id, created_at DESC NULLS LAST)
  WHERE clerk_id IS NOT NULL;
```

Use `CONCURRENTLY` so the table stays writable during creation; drop `CONCURRENTLY` if your environment doesn't support it.

---

## 3. Optional: enforce email format and assignment format

Only add these **after** cleanup and normalization so existing rows comply.

```sql
-- Reject empty email (optional)
-- ALTER TABLE public.leads ADD CONSTRAINT leads_email_nonempty CHECK (trim(email) <> '');

-- Reject invalid assignment IDs after normalization (optional; only if all values are clerk_id or null)
-- ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_broker_format CHECK (assigned_broker_id IS NULL OR assigned_broker_id LIKE 'user_%');
-- ALTER TABLE public.leads ADD CONSTRAINT leads_assigned_lender_format CHECK (assigned_lender_id IS NULL OR assigned_lender_id LIKE 'user_%');
```

---

## 4. Optional: trigger to keep email normalized

Keeps **email** (and optionally **email_address**) trimmed and lowercase on insert/update so future data stays consistent.

```sql
CREATE OR REPLACE FUNCTION public.leads_normalize_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN
    NEW.email := lower(trim(NEW.email));
    IF NEW.email_address IS NULL OR trim(NEW.email_address) = '' THEN
      NEW.email_address := NEW.email;
    ELSE
      NEW.email_address := lower(trim(NEW.email_address));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_normalize_email_trigger ON public.leads;
CREATE TRIGGER leads_normalize_email_trigger
  BEFORE INSERT OR UPDATE OF email, email_address ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_normalize_email();
```

---

## 5. Data quality checks (queries to run periodically)

```sql
-- Leads with assigned_broker_id not in Clerk ID form (should be 0 after normalization)
SELECT count(*) AS non_clerk_broker
FROM public.leads
WHERE assigned_broker_id IS NOT NULL AND assigned_broker_id NOT LIKE 'user_%';

-- Leads with assigned_lender_id not in Clerk ID form
SELECT count(*) AS non_clerk_lender
FROM public.leads
WHERE assigned_lender_id IS NOT NULL AND assigned_lender_id NOT LIKE 'user_%';

-- Leads with empty or invalid email
SELECT count(*) AS bad_email FROM public.leads WHERE email IS NULL OR trim(email) = '' OR email NOT LIKE '%@%';

-- Duplicate emails (informational; multiple leads per email is allowed)
SELECT email, count(*) AS cnt FROM public.leads WHERE email IS NOT NULL GROUP BY email HAVING count(*) > 1 ORDER BY cnt DESC LIMIT 20;
```

---

## 6. Summary: minimal cleanup for proper functionality

1. Run normalization migrations so **assigned_broker_id** and **assigned_lender_id** are Clerk IDs.
2. Run the one-time **email** (and **email_address**) trim/lowercase UPDATE.
3. Optionally add composite indexes for dashboard queries and the email-normalization trigger for new data.

After that, agent/lender dashboards, RLS, and email-based linking (Clerk bridge, MailerLite) will behave correctly.
