# Redirects, Links, Webhooks & Supabase – Audit

**Date:** March 2026  
**Scope:** All redirects (config + code), internal/external links, webhook endpoints, and Supabase usage.

---

## 1. Redirects

### 1.1 Next.js config (`next.config.js`)

| Source | Destination | Type | Notes |
|--------|-------------|------|--------|
| `/brokers` | `/agents` | 301 permanent | Legacy URL; ensures old links and bookmarks land on agents. |
| `/brokers/:slug` | `/agents/:slug` | 301 permanent | Same for agent profile URLs. |

**Note:** `src/app/brokers/page.tsx` still exists; it is never reached in production because the config redirect runs first. Safe to keep for consistency or remove to avoid confusion.

### 1.2 Code-based redirects (server)

| File | Condition | Redirect to |
|------|-----------|-------------|
| `src/app/dashboard/page.tsx` | No `userId` | `/sign-in` |
| `src/app/dashboard/page.tsx` | Has `userId`, broker role (Supabase or Clerk) | `/agents/dashboard` |
| `src/app/dashboard/page.tsx` | Has `userId`, lender role (Supabase or Clerk) | `/lenders/dashboard` |
| `src/app/dashboard/page.tsx` | Has `userId`, not broker/lender | `/clients/dashboard` |
| `src/app/agents/dashboard/page.tsx` | No `userId` | `/sign-in` |
| `src/app/agents/dashboard/page.tsx` | Has `userId`, not broker role | `/clients/dashboard` or `/lenders/dashboard` by role |
| `src/app/clients/dashboard/page.tsx` | No `userId` | `/sign-in` |
| `src/app/clients/dashboard/page.tsx` | Has `userId`, broker role | `/agents/dashboard` |
| `src/app/clients/dashboard/page.tsx` | Has `userId`, lender role | `/lenders/dashboard` |
| `src/app/lenders/dashboard/page.tsx` | No `userId` | `/sign-in` |
| `src/app/lenders/dashboard/page.tsx` | Has `userId`, not lender role | `/agents/dashboard` or `/clients/dashboard` by role |

All redirect targets are internal paths; no open redirects.

### 1.3 Clerk / auth redirects

| Location | Redirect | Override (env) |
|----------|----------|----------------|
| `SignIn` component (`sign-in/[[...sign-in]]/page.tsx`) | `fallbackRedirectUrl="/dashboard"` | `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` |
| `SignUp` component (`sign-up/[[...sign-up]]/page.tsx`) | `fallbackRedirectUrl="/dashboard"` | `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` |
| `SignInButton` in `SiteHeader.tsx` | `fallbackRedirectUrl="/dashboard"` | Same env as above |

Dashboard then routes by role to `/agents/dashboard`, `/lenders/dashboard`, or `/clients/dashboard`. No external redirect URLs in code.

### 1.4 Client-side navigation

| File | Behavior |
|------|----------|
| `AssignAgentButton.tsx` | After successful `PATCH /api/me/agent`, sets `window.location.href = '/dashboard'` so role-based router sends user to the correct dashboard. |
| `AssignLenderButton.tsx` | After successful `PATCH /api/me/lender`, sets `window.location.href = '/dashboard'` so role-based router sends user to the correct dashboard. |
| `BrokersList.tsx` | Uses `window.history.replaceState` to update URL for filter state (no redirect). |

---

## 2. Links

### 2.1 Internal routes (Link / Button `href`)

**Navigation (header/footer):**  
`/`, `/markets`, `/agents`, `/lenders`, `/about`, `/dashboard`, `/sign-in`, `/privacy`, `/terms`.

**Key internal paths used in app:**

- **Markets:** `/markets`, `/markets/oregon`, `/markets/washington`, `/markets/oregon/region/:slug`, `/markets/:state/:county`, `/markets/:state/:county/:city`, `/markets/oregon/pdx/condos/:slug`, `/markets/oregon/multnomah/portland`, `/resources/portland-condo-guide`.
- **Agents:** `/agents`, `/agents/:slug` (from `BrokersList` with `basePath="/agents"` and from `AgentProfile`).
- **Lenders:** `/lenders`, `/lenders/:slug`.
- **Other:** `/contact`, `/listings`, `/listings/:mlsNumber`, `/resources`, `/social`, `/about`, `/error`, `/not-found`.

**Listings:**  
`detailUrl` in listing cards is built as `/listings/${encodeURIComponent(mlsId)}` in `ListingsSearchClient.tsx` – safe.

**Hub / market cards:**  
`IntelligenceHubs` and markets index use `href` from:

- Home: hardcoded `/markets/oregon`, `/markets/washington`.
- Markets page: `allMarkets` from `src/data/markets.ts` (`oregonMarket.href`, `washingtonMarket.href` = `/markets/oregon`, `/markets/washington`).

No user-controlled internal `href`; all from config or static data.

### 2.2 Same-page anchors

- `#main-content` (skip link in layout).
- `#consultation` (contact page).
- `#request-assistance` (condo detail page).

### 2.3 External / special schemes

- **mailto:** Agent, lender, and client dashboard contact links use `mailto:${email}`.
- **tel:** Phone links use `tel:${phone.replace(/\D/g, '')}` (digits only).
- **Lender “Visit website”:** Rendered only when `lender.url` is truthy; empty string in data hides the button (`lenders.json`).
- **Agent profile / “View profile”:** `assignedAgent.url` from `getAgentBySlug()` (agents.json). Ensure every agent has a valid `url` in data.
- **Condo guide cards:** `condo.url` from Portland condo guide data (internal path like `/markets/oregon/pdx/condos/:slug`).
- **CondoMapSection:** `googleMapsUrl` and `osmUrl` – built from address; external maps.
- **WalkScoreSection:** `searchUrl` – external Walk Score.
- **Social page:** `site.social` from `src/data/site.ts` (instagram, facebook, linkedin, youtube). Links are filtered with `.filter((s) => s.href)` so missing hrefs are not rendered.

**Recommendation:** Keep agent `url` in `agents.json` valid (internal path or full URL). Social URLs are centralized in `src/data/site.ts`.

### 2.4 Broker list agent links

- With `basePath="/agents"`: link is `/agents/${agent.slug}` (internal).
- Without `basePath`: link is `agent.url` (from data – can be external). Used when linking “off site” to broker profile.

---

## 3. Webhooks

### 3.1 Clerk – `POST /api/webhooks/clerk`

| Aspect | Detail |
|--------|--------|
| **Verification** | Svix: `svix-id`, `svix-timestamp`, `svix-signature` with `CLERK_WEBHOOK_SECRET`. |
| **Events** | `user.created`, `user.updated`, `user.deleted`. Others return 200 and are ignored. |
| **Actions** | user.created/updated: upsert `public.users` (role, preserve assigned_broker_id, assigned_lender_id, repliers_client_id, marketing_opt_in); optional MailerLite subscribe; optional lead bridge (`leads.clerk_id` by email); optional Repliers client create. user.deleted: delete from `users` by `clerk_id`. |
| **Sign-in sync** | If a user has no row in Supabase when they hit `/dashboard` or any dashboard page, the app upserts them from Clerk via `src/lib/sync-clerk-user.ts` (same role/preserve logic). Ensures sign-ins are always synced even if the webhook missed. |
| **Health** | `GET /api/webhooks/clerk` returns env status (no secrets). |
| **Env** | Required: `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: MailerLite, Repliers. |

**Supabase:** Uses its own `createClient(url, serviceRoleKey)` in the route (no anon key), so webhook works even if app Supabase client is not configured.

### 3.2 MailerLite – `POST /api/webhooks/mailerlite`

| Aspect | Detail |
|--------|--------|
| **Verification** | `Signature` header, HMAC-SHA256 with `MAILERLITE_WEBHOOK_SECRET`. |
| **Events** | `subscriber.unsubscribed`, `subscriber.bounced`, `subscriber.spam_reported`, `subscriber.deleted`. |
| **Action** | Set `users.marketing_opt_in = false` where `users.email` matches subscriber email. |
| **Env** | `MAILERLITE_WEBHOOK_SECRET` required. Uses `supabaseAdmin()`. |

### 3.3 Repliers – `POST /api/webhooks/repliers`

| Aspect | Detail |
|--------|--------|
| **Verification** | `REPLIERS_WEBHOOK_SECRET` compared to `x-repliers-signature`, `x-hook-secret`, or `Authorization: Bearer <secret>`. Constant-time compare. |
| **Idempotency** | `webhook_events` table (source `repliers`, `event_id`); duplicate event id returns 200 without re-processing. |
| **Action** | Map payload to listing row; upsert `listings` by `mls_listing_id`. |
| **Env** | `REPLIERS_WEBHOOK_SECRET`. Uses `supabaseAdmin()`. |
| **Note** | Uses global `crypto.randomUUID()` (Node 19+); no import needed. |

---

## 4. Supabase integrations

### 4.1 Client types and usage

| Export | File | When used | Env |
|--------|------|-----------|-----|
| `supabase` | `src/lib/supabase.ts` | Anonymous client (e.g. `api/listings` public read). | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required at load). |
| `createClerkSupabaseClient()` | Same | Server-only; uses Clerk JWT for RLS. Used by dashboard pages, `/api/favorites`, `/api/saved-searches`. | Same + Clerk session. |
| `supabaseAdmin()` | Same | Server-only; service role. Used by webhooks, `/api/me/agent`, `/api/listings/[mlsNumber]`, `/api/search`, `/api/search/image`, `/api/cron/sync-mls`, Repliers webhook, MailerLite webhook, `repliers-listings.ts`. | Plus `SUPABASE_SERVICE_ROLE_KEY`. |

Clerk webhook does **not** use `@/lib/supabase`; it creates its own Supabase client with service role so it can run even when anon key is missing.

### 4.2 Tables and usage

| Table | Used by | Operations |
|-------|--------|------------|
| **users** | Dashboard pages, Clerk webhook, sign-in sync (`sync-clerk-user.ts`), MailerLite webhook, `/api/me/agent`, `/api/me/lender` | Select by `clerk_id` (role, profile, assigned_broker_id, assigned_lender_id); upsert/delete by webhook; sign-in sync upserts when no row; update `assigned_broker_id`, `assigned_lender_id`, `marketing_opt_in`. |
| **leads** | Agent/client dashboards, Clerk webhook | Select (by assigned_broker_id or clerk_id); webhook updates `leads.clerk_id` by email (bridge). |
| **favorites** | `/api/favorites` | Select/insert/delete by `clerk_id` (Clerk JWT client). |
| **saved_searches** | `/api/saved-searches` | Select/insert by `clerk_id`; cap 20 per user. |
| **listings** | `/api/listings`, `/api/listings/[mlsNumber]`, `/api/search`, `/api/search/image`, cron sync, Repliers webhook, `repliers-listings.ts` | Public read (anon) or admin upsert/read. Repliers and cron sync upsert by `mls_listing_id`. |
| **webhook_events** | Repliers webhook | Insert + select by `source` + `event_id` for idempotency. |

### 4.3 Cross-reference: files → tables

- **users:** `dashboard/page.tsx`, `agents/dashboard/page.tsx`, `clients/dashboard/page.tsx`, `lenders/dashboard/page.tsx`, `api/webhooks/clerk/route.ts`, `api/webhooks/mailerlite/route.ts`, `api/me/agent/route.ts`, `api/me/lender/route.ts`, `lib/sync-clerk-user.ts`.
- **leads:** `agents/dashboard/page.tsx`, `clients/dashboard/page.tsx`, `api/webhooks/clerk/route.ts`.
- **favorites:** `api/favorites/route.ts`.
- **saved_searches:** `api/saved-searches/route.ts`.
- **listings:** `api/listings/route.ts`, `api/listings/[mlsNumber]/route.ts`, `api/search/route.ts`, `api/search/image/route.ts`, `api/cron/sync-mls/route.ts`, `api/webhooks/repliers/route.ts`, `lib/repliers-listings.ts`, `lib/repliers-client.ts` (fallback queries).
- **webhook_events:** `api/webhooks/repliers/route.ts`.

### 4.4 RLS and tokens

- **Clerk JWT:** `createClerkSupabaseClient()` passes the token in `Authorization: Bearer <token>`. Supabase must be configured to validate Clerk JWTs (e.g. JWT template) if RLS is used on `favorites` and `saved_searches`.
- **Service role:** Bypasses RLS; used only in server routes and webhooks.

---

## 5. Findings and recommendations

| Item | Status | Recommendation |
|------|--------|----------------|
| Config redirects | OK | `/brokers` → `/agents`; no open redirects. |
| Code redirects | OK | All to `/sign-in`, `/agents/dashboard`, `/clients/dashboard`, or `/lenders/dashboard`. |
| Clerk redirect URLs | OK | All to `/dashboard`; override via env. |
| Internal links | OK | From config or static data; listing URLs built safely. |
| Lender empty URL | OK | “Visit website” only when `lender.url` is set. |
| Agent URL | Verify | Ensure each entry in `agents.json` has a valid `url`. |
| Social links | OK | Centralized in `site.ts`; filtered by presence of href. |
| Clerk webhook | OK | Svix verification; own Supabase client; no anon key dependency. |
| MailerLite webhook | OK | HMAC verification; updates `users.marketing_opt_in`. |
| Repliers webhook | OK | Secret check; idempotency; upserts listings. |
| Supabase tables | Documented | users, leads, favorites, saved_searches, listings, webhook_events. |
| /brokers page | Optional | Unreachable due to redirect; can remove or keep for reference. |
| `src/data/condos.ts` | Unused | Not imported anywhere. If ever used, fix hrefs: they use `/markets/:slug` but the real route is `/markets/oregon/pdx/condos/:slug`. Portland condo guide uses `portland-condo-guide.json` and correct URLs. |

---

## 6. Quick reference – webhook endpoints and env

| Endpoint | Method | Secret env | Purpose |
|----------|--------|------------|---------|
| `/api/webhooks/clerk` | POST | `CLERK_WEBHOOK_SECRET` | User lifecycle → Supabase (and optional MailerLite/Repliers). |
| `/api/webhooks/clerk` | GET | — | Health; no secrets. |
| `/api/webhooks/mailerlite` | POST | `MAILERLITE_WEBHOOK_SECRET` | Unsubscribe/bounce/spam/delete → `users.marketing_opt_in = false`. |
| `/api/webhooks/repliers` | POST | `REPLIERS_WEBHOOK_SECRET` | Listing events → upsert `listings`; idempotent via `webhook_events`. |
