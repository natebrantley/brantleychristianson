# Webhooks & Integrations – Audit & Hardening

**Date:** March 2026  
**Scope:** All webhook endpoints, cron job, and external integrations (Clerk, MailerLite, Repliers, Supabase). Security and robustness improvements applied.

---

## 1. Webhook endpoints summary

| Endpoint | Method | Verification | Body limit | Idempotency / notes |
|----------|--------|--------------|------------|----------------------|
| `/api/webhooks/clerk` | POST | Svix (svix-id, svix-timestamp, svix-signature) | 512 KB | Per-event; user upsert/delete by clerk_id |
| `/api/webhooks/clerk` | GET | — | — | Health check; no secrets |
| `/api/webhooks/mailerlite` | POST | HMAC-SHA256 (Signature header) | 512 KB | Per-event; update users.marketing_opt_in by email (lowercase) |
| `/api/webhooks/mailerlite` | GET | — | — | Health check; no secrets |
| `/api/webhooks/repliers` | POST | Bearer / x-repliers-signature / x-hook-secret (constant-time) | 512 KB | webhook_events table by event_id |
| `/api/webhooks/repliers` | GET | — | — | Health check; no secrets |

---

## 2. Hardening applied

### 2.1 Body size limits

- **Constant:** `MAX_WEBHOOK_BODY_BYTES = 512 * 1024` (512 KB) in `src/lib/webhook-utils.ts`.
- **Check:** `isBodySizeAllowed(request)` uses `Content-Length` header; if over limit, respond **413 Payload Too Large** before reading body.
- **Applied in:** Clerk POST, MailerLite POST, Repliers POST.

Reduces risk of DoS via very large payloads and encourages providers to send reasonable payload sizes.

### 2.2 Signature / secret verification

- **Clerk:** Svix verification (required headers); invalid signature → 400, no DB write.
- **MailerLite:** HMAC-SHA256 with `MAILERLITE_WEBHOOK_SECRET`; `crypto.timingSafeEqual` for comparison. Invalid → 400.
- **Repliers:** Secret in header; **constant-time compare** via `secureCompare()` so timing does not leak the secret. Unauthorized → 401.
- **Cron (`/api/cron/sync-mls`):** Vercel Cron header or `Authorization: Bearer <CRON_SECRET>`; Bearer token compared to `CRON_SECRET` with **constant-time compare**.

### 2.3 Email normalization (MailerLite)

- Subscriber email from payload is trimmed and **lowercased** before updating `users.marketing_opt_in`.
- Ensures match when app stores emails in lowercase (e.g. consultation form, Clerk sync).

### 2.4 Health checks (GET)

- **Clerk:** GET returns `{ status, message? }`; 503 if required env missing (no secrets).
- **MailerLite:** GET returns `{ status, webhook, env? }`; 503 if `MAILERLITE_WEBHOOK_SECRET` missing.
- **Repliers:** GET returns `{ status, webhook, env? }`; 503 if `REPLIERS_WEBHOOK_SECRET` missing.

Use for monitoring/uptime checks without exposing secrets.

### 2.5 Shared utilities

- **`src/lib/webhook-utils.ts`:** `MAX_WEBHOOK_BODY_BYTES`, `isBodySizeAllowed(request)`, `secureCompare(a, b)`.
- Repliers and cron use `secureCompare` for secret comparison; Repliers uses `crypto.randomUUID()` (with `import crypto from 'crypto'`) for correlation IDs.

---

## 3. Other integrations

### 3.1 Consultation API (`POST /api/consultation`)

- **Rate limit:** In-memory, 5 requests per 15 minutes per client IP (see `src/lib/rateLimit.ts`).
- **Body size:** 100 KB max (Content-Length check).
- **Validation:** Email required, format + length; name/phone/message and tag fields length-capped.
- **Outbound:** MailerLite API (subscribers); uses `MAILERLITE_API_TOKEN`. Errors not exposed to client.

### 3.2 Cron (`GET /api/cron/sync-mls`)

- **Auth:** `x-vercel-cron: 1` or `Authorization: Bearer <CRON_SECRET>` with constant-time compare.
- **Actions:** Mark expired listings; optional Repliers IDX sync. `maxDuration = 300`.

---

## 4. Environment variables (webhooks & integrations)

| Variable | Used by | Purpose |
|----------|---------|---------|
| `CLERK_WEBHOOK_SECRET` | Clerk webhook | Svix signature verification |
| `MAILERLITE_WEBHOOK_SECRET` | MailerLite webhook | HMAC-SHA256 verification |
| `REPLIERS_WEBHOOK_SECRET` | Repliers webhook | Header secret (constant-time) |
| `CRON_SECRET` | Cron sync-mls | Bearer token (constant-time) |
| `MAILERLITE_API_KEY` | Clerk webhook (optional) | Add new users to MailerLite group |
| `MAILERLITE_API_TOKEN` | Consultation API | Add consultation contacts to MailerLite |
| `MAILERLITE_GROUP_ID` | Clerk + consultation | Optional group ID |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Clerk webhook, MailerLite, Repliers, cron | Supabase admin operations |

---

## 5. Recommendations

- **Rate limiting:** Consultation uses in-memory limit; for multi-instance deploys, consider Redis/Upstash for webhooks or high-traffic APIs if needed.
- **Replay:** Clerk uses Svix (includes timestamp); MailerLite/Repliers do not enforce replay window. If required, add idempotency or timestamp checks per provider docs.
- **Logging:** Webhooks log success and errors without PII; keep correlation IDs (e.g. Repliers) for tracing.

---

## 6. Quick reference – files

| File | Purpose |
|------|---------|
| `src/lib/webhook-utils.ts` | Body size limit, secureCompare |
| `src/app/api/webhooks/clerk/route.ts` | Clerk user lifecycle → Supabase (+ optional MailerLite/Repliers) |
| `src/app/api/webhooks/mailerlite/route.ts` | MailerLite opt-out events → users.marketing_opt_in |
| `src/app/api/webhooks/repliers/route.ts` | Repliers listing events → listings upsert; idempotency via webhook_events |
| `src/app/api/cron/sync-mls/route.ts` | Expire old listings; optional Repliers sync |
| `src/app/api/consultation/route.ts` | Contact form → MailerLite; rate limit, validation |
