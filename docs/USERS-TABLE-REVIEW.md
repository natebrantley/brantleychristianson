# public.users — Table review and alignment

**Source of truth:** Clerk (identity). Rows are created/updated by the Clerk webhook (`user.created`, `user.updated`) and by sign-in sync (`ensureUserInSupabase`). Some columns are app-managed and preserved on webhook upsert.

---

## Field list and sources

| Column | Type | Source | Notes |
|--------|------|--------|--------|
| **id** | uuid | Supabase | PK, default `gen_random_uuid()`. Not used by app for lookups; **clerk_id** is the natural key. |
| **clerk_id** | text NOT NULL UNIQUE | Clerk | Clerk user ID (`user_xxx`). Used for RLS, webhook upsert conflict, and all app lookups. |
| **email** | text | Clerk | Primary email from Clerk; nullable. Used by MailerLite webhook (update by email), lead bridge (match leads by email), and display. |
| **first_name** | text | Clerk | From Clerk profile. |
| **last_name** | text | Clerk | From Clerk profile. |
| **role** | text | Clerk (public_metadata.role) | One of `agent`, `broker`, `lender`, `user`. Drives dashboard routing. Webhook/sync set from metadata or domain fallback (`@brantleychristianson.com` → agent). |
| **created_at** | timestamptz | Supabase | Default `now()`. |
| **updated_at** | timestamptz | Supabase | Set by trigger on update. |
| **assigned_broker_id** | text | App | Clerk user ID of the client’s chosen agent. Preserved on webhook. Aligns with **leads.assigned_broker_id** (Clerk ID or slug). Client dashboard and `/api/me/agent` read/write this. |
| **assigned_lender_id** | text | App | Clerk user ID of the client’s chosen lender. Preserved on webhook. Aligns with **leads.assigned_lender_id**. Client dashboard and `/api/me/lender` read/write this. |
| **repliers_client_id** | integer | App / Repliers | Set by Clerk webhook when creating a Repliers client on `user.created`. Preserved on webhook. Used for saved searches / favorites sync. |
| **marketing_opt_in** | boolean | App / MailerLite | Default `true`. Set to `false` by MailerLite webhook on unsubscribe/bounce/spam/deleted. Preserved on Clerk webhook. Aligns with **leads.opted_in_email** (string 'true'/'false'). |

---

## Legacy / redundant columns (safe to remove)

- **agent** — Legacy; replaced by **assigned_broker_id**. Migration `20260320000000_backfill_users_assigned_broker_id_from_agent.sql` backfilled from `agent`; column can be dropped if it still exists.
- **assigned_broker_slug** — Redundant with **assigned_broker_id**. App and webhook only use **assigned_broker_id** (Clerk ID or slug). Safe to drop.

---

## Integrations alignment

| System | How it uses public.users |
|--------|---------------------------|
| **Clerk** | Webhook upserts by **clerk_id**; sends email, first_name, last_name, role. Preserves assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in. |
| **leads** | **leads.assigned_broker_id** and **leads.assigned_lender_id** store Clerk user IDs (or legacy slug); **leads.clerk_id** set when lead signs in (bridge by email). No foreign key; match by value. |
| **MailerLite** | Webhook updates **users.marketing_opt_in** by **email** (lowercase). Also updates **leads.opted_in_email** by email. |
| **Repliers** | **users.repliers_client_id** stores Repliers client ID; set by Clerk webhook on user creation. |
| **RLS** | Select/update allowed where `auth.jwt()->>'sub' = clerk_id`. Service role bypasses. |

---

## Indexes (current and recommended)

- **users_clerk_id_key** — UNIQUE on `clerk_id` (required for upsert conflict).
- **users_repliers_client_id_idx** — Partial index on `repliers_client_id` where not null.
- **users_email_idx** — Recommended: index on `email` (or `lower(email)` if you normalize) for MailerLite webhook and lead bridge lookups by email.

---

## Constraints

- **users_role_check** — `role` is null or in (`'agent'`,`'broker'`,`'lender'`,`'user'`). Webhook and sync always set role; consider NOT NULL default `'user'` for new rows.

---

## Cleanup and optimization SQL

See **docs/sql/cleanup-users-table.sql** for:

- Dropping legacy columns (`agent`, `assigned_broker_slug`).
- Ensuring role constraint (and optional NOT NULL default).
- Index on email for webhook/bridge lookups.
- Optional: normalize existing **email** to lowercase so MailerLite webhook (which sends lowercase) and lead bridge match reliably.
- Refreshed comments on all columns.

Run that script in the Supabase SQL Editor (or add as a migration) after reviewing.
