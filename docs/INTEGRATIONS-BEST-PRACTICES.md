# Integrations: Best Practices & Full Leverage

**Purpose:** Ensure all integrations (Clerk, Supabase, MailerLite, Repliers, Vercel) follow best practices and are fully leveraged.

---

## 1. Clerk

| Practice | Status | Notes |
|----------|--------|------|
| Webhook Svix verification | ✅ | Signature verified; reject invalid/missing headers (400). |
| Sign-in sync to Supabase | ✅ | `ensureUserInSupabase()` when user has no row; webhook is primary, sync is fallback. |
| JWT template for Supabase RLS | Optional | Set `CLERK_JWT_TEMPLATE_SUPABASE=supabase` when using a Clerk JWT template so `createClerkSupabaseClient()` sends the right token. Create template in Clerk → JWT Templates; configure Supabase to validate it. |
| Preserve app-managed columns | ✅ | Webhook and sign-in sync preserve `assigned_broker_id`, `repliers_client_id`, `marketing_opt_in`. |
| Role sync (agent/broker/lender) | ✅ | From `public_metadata.role` or `@brantleychristianson.com` → agent. |

**Leverage:** Use Clerk Dashboard → Users → Public metadata `role` for agent/broker/lender so dashboard routing and Supabase stay in sync. Enable webhook for `user.created`, `user.updated`, `user.deleted`.

---

## 2. Supabase

| Practice | Status | Notes |
|----------|--------|------|
| Service role only server-side | ✅ | Webhooks, cron, `/api/me/agent` use `supabaseAdmin()`; never exposed to client. |
| Anon + Clerk JWT for user-scoped | ✅ | `createClerkSupabaseClient()` for dashboard and favorites/saved-searches APIs. |
| Migrations in version control | ✅ | `supabase/migrations/`; apply via CLI push or Supabase GitHub integration. |
| GitHub integration | Optional | Project Settings → Integrations → GitHub: auto-deploy on push to production branch; optional preview branches for PRs. |
| RLS | Optional | Off by default; enable with policies when Clerk JWT template is configured (see SUPABASE.md). |

**Leverage:** Run migrations after schema changes (`npm run supabase:push` or GitHub integration). Use Table Editor or SQL for one-off fixes; use migrations for repeatable schema.

---

## 3. MailerLite

| Practice | Status | Notes |
|----------|--------|------|
| Consultation form → list | ✅ | `POST /api/consultation` uses `MAILERLITE_API_TOKEN`; rate limit 5/15 min per IP. |
| Clerk sign-ups → list | Optional | Set `MAILERLITE_API_KEY` + `MAILERLITE_GROUP_ID`; webhook adds on `user.created` only. |
| Webhook: opt-out → Supabase | ✅ | `MAILERLITE_WEBHOOK_SECRET`; HMAC-SHA256; set `users.marketing_opt_in = false` on unsubscribe/bounce/spam/delete. |
| Body size limit | ✅ | 512 KB for webhook; 100 KB for consultation. |

**Leverage:** Create MailerLite webhook for `subscriber.unsubscribed`, `subscriber.bounced`, `subscriber.spam_reported`, `subscriber.deleted` → `https://yourdomain.com/api/webhooks/mailerlite`. Use same group for consultation and Clerk sign-ups if you want one list.

---

## 4. Repliers

| Practice | Status | Notes |
|----------|--------|------|
| Webhook: listing events → Supabase | ✅ | Verify `REPLIERS_WEBHOOK_SECRET`; idempotency via `webhook_events`; upsert `listings` by `mls_listing_id`. |
| Cron: expire + full sync | ✅ | `GET /api/cron/sync-mls` every 12 h (vercel.json); mark expired; optional Repliers IDX sync. |
| Client creation on sign-up | Optional | Clerk webhook calls Repliers when `REPLIERS_API_KEY` + `REPLIERS_DEFAULT_AGENT_ID` set; sets `users.repliers_client_id`. |
| Constant-time secret compare | ✅ | `secureCompare()` for webhook and cron auth. |

**Leverage:** Configure Repliers to send listing events to `https://yourdomain.com/api/webhooks/repliers`. Set Vercel Cron (or `CRON_SECRET`) for 12-hour RMLS compliance.

---

## 5. Vercel

| Practice | Status | Notes |
|----------|--------|------|
| Env vars per environment | ✅ | Production (and Preview) get Clerk, Supabase, webhook secrets; never commit secrets. |
| Cron for sync-mls | ✅ | `vercel.json`: `0 */12 * * *` (every 12 hours). |
| Serverless timeouts | ✅ | `maxDuration = 300` on cron route for long sync. |

**Leverage:** Use Preview env for staging; add same webhook URLs in Clerk/MailerLite/Repliers for preview if you need to test webhooks on preview deploys.

---

## 6. Security & resilience

| Practice | Status | Notes |
|----------|--------|------|
| Security headers | ✅ | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control; HSTS on Vercel. |
| Webhook body limits | ✅ | 512 KB (webhook-utils); 413 before reading body. |
| No PII in webhook logs | ✅ | Log event type, svixId, correlationId; no email/name in errors. |
| Rate limit consultation | ✅ | 5 requests / 15 min per IP (in-memory). |
| Typed API errors | ✅ | api-errors.ts; user-facing messages; no stack/Repliers text to client. |

---

## 7. Checklist: “Fully leveraging” each integration

- **Clerk:** Webhook enabled (user.created/updated/deleted); sign-in sync in place; optional JWT template if RLS desired; public metadata `role` for agent/broker/lender.
- **Supabase:** All migrations applied (CLI or GitHub); `users` role constraint includes agent/broker/lender/user; optional RLS + Clerk JWT template when ready.
- **MailerLite:** Consultation uses token + optional group; optional Clerk webhook vars to add sign-ups to same group; MailerLite webhook configured so opt-outs update `users.marketing_opt_in`.
- **Repliers:** Webhook URL configured; cron on 12h; optional Repliers env so Clerk creates client and sets `repliers_client_id`.
- **Vercel:** Required env set for Production (and Preview if needed); cron runs; no secrets in client env.

---

## 8. See also

- **docs/WEBHOOK-CLERK.md** – Clerk webhook and sign-in sync
- **docs/SUPABASE.md** – Supabase setup and RLS
- **docs/VERCEL.md** – Env and deployment
- **docs/WEBHOOKS-INTEGRATIONS-AUDIT.md** – Webhook hardening
- **docs/REDIRECTS-LINKS-WEBHOOKS-SUPABASE.md** – Endpoints and tables
