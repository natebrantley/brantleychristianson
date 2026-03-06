# System Check & Functionality Audit

**Date:** 2026-03-06  
**Scope:** Databases (Supabase), integrations (Clerk, MailerLite, Repliers), cron jobs, webhooks, and app usage. Goals: ensure full leverage, correct sync, and optimization.

---

## 1. Databases (Supabase)

### 1.1 Tables and usage

| Table | Purpose | Writes | Reads | RLS |
|-------|---------|--------|-------|-----|
| **users** | Identity + profile (Clerk sync); role, assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in | Clerk webhook, sign-in sync, MailerLite webhook, PATCH /api/me/agent, /api/me/lender, PATCH /api/leads/[id] (sync to users when lead has clerk_id) | All dashboards, API me, webhooks | Select/update where auth.jwt()->>'sub' = clerk_id |
| **leads** | CRM leads; clerk_id when signed in; assigned_broker_id / assigned_lender_id | Clerk webhook (bridge), MailerLite webhook (opted_in_email), agent dashboard backfill, PATCH /api/leads/[id], cron sync-leads (read-only for MailerLite push) | Agent/lender dashboards, lead list, lead detail, API leads/[id] | Select where clerk_id or assigned_broker_id or assigned_lender_id = sub; update same |
| **saved_searches** | Client saved searches | POST /api/saved-searches | Agent dashboard (admin), GET /api/saved-searches | Users manage own (clerk_id) |
| **favorites** | Client favorite listings (mls_listing_id) | POST/DELETE /api/favorites | GET /api/favorites, client dashboard | Users manage own (clerk_id) |
| **listings** | MLS/listings cache | Repliers webhook, cron sync-mls | /api/listings, search, Repliers client | N/A (service role / anon read as configured) |
| **webhook_events** | Idempotency for webhooks | Repliers webhook insert | Repliers webhook select | N/A (admin) |

### 1.2 Indexes (existing)

- **leads:** email, clerk_id, assigned_broker_id, assigned_lender_id; composite (assigned_broker_id, created_at DESC), (assigned_lender_id, created_at DESC), (clerk_id, created_at DESC); users table has users_email_lower_idx (from cleanup migration).
- **users:** clerk_id unique, repliers_client_id partial.
- **listings:** status, expiration_date, updated_at, city, price; mls_listing_id unique for upsert.
- **saved_searches:** clerk_id.
- **favorites:** clerk_id; unique (clerk_id, mls_listing_id) for insert conflict.
- **webhook_events:** (source, event_id) unique for idempotency.

### 1.3 Gaps / optimizations

- **Consultation form** (POST /api/consultation): Only sends to MailerLite; does **not** insert into `leads`. So consultation submissions are not visible in the agent dashboard unless they later sign up (Clerk) and get bridged, or are imported elsewhere. **Recommendation:** Optionally insert into `leads` (email, first_name, last_name, phone, source, etc.) with assigned_broker_id null or derived from market/source; then cron or MailerLite webhook can keep MailerLite in sync. Document as optional “consultation → lead” flow.
- **users.email:** MailerLite webhook and bridge match by email. Migration `20260322000000_cleanup_users_table` adds `users_email_lower_idx`. Ensure MailerLite webhook uses lowercase when matching; lead bridge already uses normalized email.
- **leads.opted_in_email:** MailerLite webhook updates both `users.marketing_opt_in` and `leads.opted_in_email` by email. Sync is correct; both columns are used (sync-leads-to-mailerlite respects opted_in_email for status).

---

## 2. Integrations

### 2.1 Clerk

- **Webhook:** POST /api/webhooks/clerk. Events: user.created, user.updated, user.deleted. Upserts `users`, preserves assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in. Bridge: sets leads.clerk_id by email. Repliers: creates client on user.created, sets users.repliers_client_id. **MailerLite:** Syncs new user to MailerLite on user.created using `MAILERLITE_API_KEY` (see 2.2).
- **Sign-in sync:** ensureUserInSupabase in sync-clerk-user.ts on dashboard load; same preserve columns. **Issue:** Clerk webhook uses `MAILERLITE_API_KEY` but the rest of the app (consultation, cron sync-leads) uses `MAILERLITE_API_TOKEN`. .env.local has only `MAILERLITE_API_TOKEN`. So **Clerk → MailerLite sync on user.created is currently no-op** unless MAILERLITE_API_KEY is set. **Fix:** Use `MAILERLITE_API_TOKEN` (or support both) in the Clerk webhook so one token drives all MailerLite usage.
- **JWT:** CLERK_JWT_TEMPLATE_SUPABASE must supply `sub` = Clerk user ID for Supabase RLS. Documented in plan and auth docs.

### 2.2 MailerLite

- **Env:** MAILERLITE_API_TOKEN (consultation, cron), MAILERLITE_GROUP_ID, MAILERLITE_WEBHOOK_SECRET. Clerk webhook incorrectly expects MAILERLITE_API_KEY — should use MAILERLITE_API_TOKEN.
- **Consultation:** POST /api/consultation → MailerLite subscribers (POST). Uses MAILERLITE_API_TOKEN. Does not write to Supabase leads.
- **Cron:** GET /api/cron/sync-leads-to-mailerlite (hourly per vercel.json). Reads leads from Supabase, pushes to MailerLite (Bearer MAILERLITE_API_TOKEN). Respects opted_in_email (unsubscribed). Authorized by CRON_SECRET or x-vercel-cron.
- **Webhook:** POST /api/webhooks/mailerlite. Opt-out events → users.marketing_opt_in = false, leads.opted_in_email = 'false' (by email). Opt-in events → true. Signature: HMAC-SHA256 (Signature header). Both users and leads updated for consistency.

### 2.3 Repliers

- **Env:** REPLIERS_API_KEY, REPLIERS_DEFAULT_AGENT_ID (Clerk webhook + client creation), REPLIERS_WEBHOOK_SECRET. .env.local has REPLIERS_API_KEY; REPLIERS_WEBHOOK_SECRET and REPLIERS_DEFAULT_AGENT_ID may be in Vercel only.
- **Clerk webhook:** On user.created, creates Repliers client, sets users.repliers_client_id. Non-blocking.
- **Webhook:** POST /api/webhooks/repliers. Listing events; idempotency via webhook_events; upsert listings by mls_listing_id. Auth: x-repliers-signature / x-hook-secret / Authorization. REPLIERS_WEBHOOK_SECRET must be set in production.
- **Search / NLP / image:** Use REPLIERS_API_KEY. Favorites and saved searches: Supabase only; optional Repliers Favorites API sync per REPLIERS-IMPLEMENTATION-PLAN.md.
- **Cron:** GET /api/cron/sync-mls every 12h. Marks expired listings; optional IDX sync when REPLIERS_API_KEY + REPLIERS_DEFAULT_AGENT_ID set.

---

## 3. Data flow summary

```
Clerk (user.created/updated/deleted)
  → Webhook → users upsert/delete; bridge leads by email; Repliers client create; MailerLite subscribe (if MAILERLITE_API_KEY/TOKEN set)
  → Sign-in sync → users upsert when missing

MailerLite
  → Webhook (opt-in/opt-out) → users.marketing_opt_in, leads.opted_in_email by email
  ← Consultation API → subscribers
  ← Cron sync-leads-to-mailerlite ← leads (Supabase)

Repliers
  → Webhook (listing.*) → listings upsert
  ← Search/NLP/Image APIs ← app
  ← Cron sync-mls → listings (expiration; optional IDX)

Agent dashboard
  → Leads list/detail: RLS + fallback backfill (assigned_broker_id legacy → userId)
  → PATCH /api/leads/[id]: RLS update; rescue backfill; sync to users when lead.clerk_id set
```

---

## 4. Fixes and recommendations

### 4.1 Critical fix (applied)

- **Clerk webhook MailerLite env:** In `src/app/api/webhooks/clerk/route.ts`, the webhook now uses `MAILERLITE_API_TOKEN` with fallback to `MAILERLITE_API_KEY`. New sign-ups are added to MailerLite when `MAILERLITE_API_TOKEN` is set (same as consultation and cron). No second env var required.

### 4.2 Optional optimizations

- **Consultation → leads:** If you want every consultation form submission to appear in the agent dashboard, add an optional step in POST /api/consultation that inserts (or upserts by email) into `leads` with source = "consultation" and assigned_broker_id null or from context. Then existing cron can push to MailerLite; no change to MailerLite-first flow.
- **Repliers Favorites sync:** Per REPLIERS-IMPLEMENTATION-PLAN.md, when a user adds/removes a favorite and users.repliers_client_id is set, optionally call Repliers Favorites API so agents see favorites in Repliers too. Low priority; Supabase remains source of truth unless you adopt two-way sync.
- **Repliers webhook subscription verification:** Handle X-Hook-Secret echo for new subscription verification (see Repliers webhooks guide).
- **NLP 406:** Return a clear message when Repliers returns 406 (prompt not listing-related).

### 4.3 Already in good shape

- **Leads RLS + backfill:** Agent/lender can see and update only assigned leads; legacy assigned_broker_id (email/name/slug) is backfilled on list and detail and in PATCH rescue.
- **Lead ↔ user sync:** PATCH /api/leads/[id] updates users (first_name, last_name, email) when lead has clerk_id.
- **Bridge:** Clerk webhook and bridge-leads set leads.clerk_id by email; both email and email_address columns updated by MailerLite webhook for leads.
- **Cron:** sync-mls (12h) and sync-leads-to-mailerlite (hourly) are configured in vercel.json and use correct env (REPLIERS_*, MAILERLITE_API_TOKEN, CRON_SECRET).
- **Idempotency:** Repliers webhook uses webhook_events; Clerk uses Svix id; MailerLite processes events by type and email.

---

## 5. Environment checklist

| Variable | Used by | Status (from .env.local / docs) |
|---------|--------|----------------------------------|
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY | All Supabase client | Set |
| SUPABASE_SERVICE_ROLE_KEY | Webhooks, cron, server admin | Set |
| CLERK_WEBHOOK_SECRET, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Auth + webhook | Set |
| CLERK_JWT_TEMPLATE_SUPABASE | createClerkSupabaseClient (RLS) | Set |
| MAILERLITE_API_TOKEN | Consultation, cron sync-leads | Set |
| MAILERLITE_API_KEY | Clerk webhook only | **Not set** — use MAILERLITE_API_TOKEN in code |
| MAILERLITE_GROUP_ID | Consultation, cron, Clerk (when key set) | Set |
| MAILERLITE_WEBHOOK_SECRET | MailerLite webhook | Set |
| CRON_SECRET | Cron routes | Set |
| REPLIERS_API_KEY | Search, NLP, image, cron sync-mls, Repliers client | Set |
| REPLIERS_DEFAULT_AGENT_ID | Clerk webhook (Repliers client) | Not in .env.local; set in Vercel if used |
| REPLIERS_WEBHOOK_SECRET | Repliers webhook | Not in .env.local; set in Vercel for production |

---

## 6. Summary

- **Databases:** All core tables (users, leads, saved_searches, favorites, listings, webhook_events) are used consistently with RLS and indexes. Optional: consultation → leads insert; users.email index already added in cleanup migration.
- **Clerk:** Webhook and sign-in sync are correct; fix MailerLite env to use MAILERLITE_API_TOKEN so new users are synced to MailerLite.
- **MailerLite:** Consultation and cron use MAILERLITE_API_TOKEN; webhook keeps users and leads opt-in state in sync.
- **Repliers:** Webhook, search, NLP, image, cron, and client creation are wired; REPLIERS_WEBHOOK_SECRET and REPLIERS_DEFAULT_AGENT_ID should be set in production. Optional: Favorites API sync, X-Hook-Secret verification, NLP 406 handling.

Applying the Clerk webhook MailerLite token fix ensures all integrations are fully leveraged with a single MailerLite token.
