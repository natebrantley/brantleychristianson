# Integrations, Webhooks & Database — Best Practices

This document captures how the codebase implements world-class practices for webhooks, integrations, and database usage. Use it for onboarding and audits.

---

## 1. Webhooks

### 1.1 Security (all webhook routes)

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Verify request signature** | Done | Clerk: Svix SDK; MailerLite: HMAC-SHA256 of raw body, `crypto.timingSafeEqual`; Repliers: `secureCompare(header, REPLIERS_WEBHOOK_SECRET)`. |
| **Reject oversized body** | Done | `isBodySizeAllowed(request)` before reading body; 413 if &gt; 512 KB (`MAX_WEBHOOK_BODY_BYTES`). Used in all three webhooks. |
| **Constant-time secret compare** | Done | `webhook-utils.ts`: `secureCompare()`; MailerLite uses `crypto.timingSafeEqual` for hex digests. Cron routes use `secureCompare` for `CRON_SECRET`. |
| **No secrets in logs** | Done | Logs use correlation IDs, event types, counts; no PII or tokens. |
| **Return 2xx on success** | Done | Clerk expects 200 with no body; MailerLite/Repliers return 200. Idempotent handlers so retries are safe. |

### 1.2 Idempotency & reliability

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Idempotent processing** | Done | Repliers: `webhook_events` table deduplicates by `(source, event_id)` before applying. Clerk: upsert by `clerk_id`. MailerLite: updates by email; multiple events for same email are safe. |
| **Read body once** | Done | `request.text()` then `JSON.parse`; no double read. |
| **Structured logging** | Done | Clerk: `logSuccess({ durationMs, eventType, svixId })`; Repliers: `correlationId`, `eventId`, `listingCount`. |

### 1.3 Health checks

- **GET** on each webhook returns env status without revealing secrets (200 when configured, 503 when secret missing).
- Used for monitoring and debugging without exposing keys.

---

## 2. Database (Supabase)

### 2.1 Authorization & RLS

| Practice | Status | Implementation |
|----------|--------|----------------|
| **RLS enabled on user data** | Done | `users`, `leads`, `saved_searches`, `favorites`: policies use `auth.jwt()->>'sub'` (Clerk JWT sub = `clerk_id`). |
| **Service role only server-side** | Done | `supabaseAdmin()` throws in browser; used in webhooks, cron, `/api/me/*`, agent dashboard for saved_searches. |
| **User-scoped reads with JWT** | Done | `createClerkSupabaseClient()` passes Clerk token; RLS restricts to own row or assigned leads. |
| **Single source of truth for identity** | Done | Clerk is source of truth; webhook + `ensureUserInSupabase()` on dashboard load keep `users` in sync. |

### 2.2 Schema & data quality

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Normalized identifiers** | Done | `leads.assigned_broker_id`, `leads.assigned_lender_id`, `users.assigned_broker_id`, `users.assigned_lender_id` store Clerk user IDs (`user_%`). Migrations normalize from name/slug/email. |
| **Canonical email** | Done | Leads cleanup migration: `email` and `email_address` trimmed and lowercased for matching (bridge, MailerLite). |
| **Indexes for hot paths** | Done | Leads: `email`, `clerk_id`, `assigned_broker_id`, `assigned_lender_id`; composite indexes on `(assigned_broker_id, created_at DESC)`, etc. See `docs/LEADS-CLEANUP-OPTIMIZATION.md`. |

### 2.3 Admin client

- **Cached in process** so multiple calls in the same request/render reuse one client.
- **Never exposed to client**; `supabaseAdmin()` throws if called in browser.

---

## 3. Integrations

### 3.1 Clerk

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Webhook for user lifecycle** | Done | `user.created`, `user.updated`, `user.deleted` → Supabase `users` upsert/delete; preserve app-managed columns. |
| **Sign-in sync fallback** | Done | `ensureUserInSupabase(clerkUser)` on dashboard load so users created in Clerk appear in Supabase even if webhook missed. |
| **Lead linking** | Done | After user upsert, `bridgeLeadsByEmail(admin, clerkId, email)` sets `leads.clerk_id` where email matches. |
| **JWT for Supabase** | Optional | `CLERK_JWT_TEMPLATE_SUPABASE`; fallback to default JWT if template missing. |

### 3.2 MailerLite

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Webhook for opt-out/opt-in** | Done | Unsubscribe/bounce/spam/deleted → `users.marketing_opt_in = false`, `leads.opted_in_email`; created/updated/added_to_group → true. |
| **Signature verification** | Done | HMAC-SHA256 of raw body; timing-safe compare. |
| **Consultation API** | Done | Rate limit (per IP), body size cap (100 KB), email validation, field length caps. |

### 3.3 Repliers (listings)

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Webhook idempotency** | Done | `webhook_events` table; skip if `(source, event_id)` already processed. |
| **Upsert by stable ID** | Done | Listings upsert on `mls_listing_id`. |
| **Cron for expiry** | Done | `sync-mls` marks past `expiration_date` as Expired; optional full sync. |

### 3.4 Cron jobs

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Auth** | Done | Vercel Cron (`x-vercel-cron: 1`) or `Authorization: Bearer CRON_SECRET`; `secureCompare` for secret. |
| **Max duration** | Done | `maxDuration = 300` where needed for long syncs. |

---

## 4. API design

| Practice | Status | Implementation |
|----------|--------|----------------|
| **Rate limiting** | Done | Consultation: in-memory per IP (e.g. 5/15 min). Scale: consider Redis/Upstash for multi-instance. |
| **Body size limits** | Done | Consultation: 100 KB; webhooks: 512 KB. |
| **Typed errors** | Done | `api-errors.ts`: codes, user-facing messages, HTTP status; no stack or internal details to client. |
| **Cache revalidation** | Done | PATCH `/api/me/agent` and `/api/me/lender` call `revalidatePath('/clients/dashboard', '/dashboard')`. |

---

## 5. Env & config

- **Required at build**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (validated in `supabase.ts`).
- **Runtime-only**: `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_*`, `MAILERLITE_*`, `REPLIERS_*`, `CRON_SECRET`. Missing keys yield 500/503 or throw in server code; no client exposure.
- **`.env.example`** documents required and optional vars for local dev.

---

## 6. References

- **Auth & security audit**: `docs/AUDIT.md`
- **Leads schema & cleanup**: `docs/SUPABASE-LEADS-UPLOAD-INSTRUCTIONS.md`, `docs/LEADS-CLEANUP-OPTIMIZATION.md`
- **Webhook utilities**: `src/lib/webhook-utils.ts`
- **Supabase client**: `src/lib/supabase.ts`
