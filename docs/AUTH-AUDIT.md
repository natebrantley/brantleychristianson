# Login and Auth Audit

**Date:** March 2026  
**Scope:** Clerk authentication, Supabase user sync, protected routes, sign-in/sign-up flows, API auth, and related resources.

---

## 1. Auth Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Identity** | [Clerk](https://clerk.com) | Sign-in, sign-up, session, JWT, UserButton, SignInButton |
| **User records** | Supabase `public.users` | Synced from Clerk via webhook; role, assigned_broker_id, Repliers/MailerLite linkage |
| **API auth** | Clerk `auth()` + optional proxy | `userId` from session; protected routes redirect unauthenticated users |
| **Supabase RLS** | Clerk JWT in `Authorization` | `createClerkSupabaseClient()` passes Clerk token; Supabase validates for RLS (favorites, saved_searches) |

---

## 2. Entry Points and Flows

### Sign-in

- **Route:** `/sign-in` → `src/app/sign-in/[[...sign-in]]/page.tsx`
- **Component:** `<SignIn />` from `@clerk/nextjs` (client component)
- **Redirect after sign-in:** `fallbackRedirectUrl="/dashboard"` (overridable via `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`)
- **Header:** When Clerk is configured, `SiteHeader` shows `<SignInButton mode="modal">` when signed out; when signed in, shows Dashboard link and `<UserButton />`

### Sign-up

- **Route:** `/sign-up` → `src/app/sign-up/[[...sign-up]]/page.tsx`
- **Flow:** VOW (MLS) disclosure must be acknowledged (checkbox) before `<SignUp />` is shown. Required for MLS data terms compliance.
- **Redirect after sign-up:** `fallbackRedirectUrl="/dashboard"`
- **Link to sign-in:** “Already have an account? Sign in” at bottom

### Dashboard routing

- **Route:** `/dashboard` → `src/app/dashboard/page.tsx`
- **Behavior:** If not signed in → `redirect('/sign-in')`. If signed in: load role from Supabase (or Clerk `public_metadata.role` fallback); if broker/agent → `redirect('/agents')`, if lender → `redirect('/lenders/dashboard')`, else → `redirect('/clients')`. If no Supabase row exists, the app syncs the user from Clerk via `ensureUserInSupabase()` (see **Sign-in sync** below) then redirects by role.
- **Role source of truth:** Supabase `users.role` (synced by Clerk webhook or sign-in sync); fallback to Clerk `public_metadata.role` before sync has run.

### Agent, lender, and client dashboards

- **`/agents`** (`src/app/agents/dashboard/page.tsx`): Requires `userId`; allows access only if `isBrokerRole(user.role)` or `isBrokerRole(roleFromClerk)`. Otherwise redirects to `/clients` or `/lenders/dashboard` by role.
- **`/lenders/dashboard`** (`src/app/lenders/dashboard/page.tsx`): Requires `userId`; allows access only if `isLenderRole(user.role)` or `isLenderRole(roleFromClerk)`. Otherwise redirects to `/agents` or `/clients`.
- **`/clients`** (`src/app/clients/dashboard/page.tsx`): Requires `userId`; if `isBrokerRole(user.role)` redirects to `/agents`; if `isLenderRole(user.role)` redirects to `/lenders/dashboard`. Shows assigned agent, saved homes placeholder, saved searches placeholder, consultation requests (leads linked by `clerk_id`).

---

## 3. Protected Routes (Proxy)

**File:** `src/proxy.ts` (Next.js 16 “proxy” convention; replaces `middleware.ts`)

**Condition:** Clerk runs only when `CLERK_SECRET_KEY` is set. Otherwise `NextResponse.next()` (no auth, no redirect).

**Protected path matcher:**

| Path pattern | Purpose |
|--------------|---------|
| `/dashboard(.*)` | All dashboard routes (e.g. `/dashboard`, `/agents`, `/clients`, `/lenders/dashboard`) |
| `/api/favorites` | GET/POST/DELETE favorites; requires auth |
| `/api/saved-searches` | GET/POST saved searches; requires auth |
| `/api/me/agent` | PATCH assign agent; requires auth (proxy + handler 401) |
| `/listings/saved` | Reserved for future “saved listings” page; no page exists yet |

**Note:** `/api/me/agent` is included in the proxy matcher so unauthenticated requests are handled by Clerk (redirect or 401); the handler also returns 401 when `userId` is missing.

---

## 4. API Routes Using Auth

| Route | Methods | Auth | Behavior |
|-------|---------|------|----------|
| `/api/favorites` | GET, POST, DELETE | `auth()` → `userId` | 401 if no `userId`; uses `createClerkSupabaseClient()` for RLS |
| `/api/saved-searches` | GET, POST | `auth()` → `userId` | 401 if no `userId`; uses `createClerkSupabaseClient()`; max 20 saved searches |
| /api/me/agent | PATCH | `auth()` → `userId` | 401 if no `userId`; uses `supabaseAdmin()` to update `users.assigned_broker_id` by `clerk_id`; protected by proxy |

All return proper status codes and use `apiErrorResponse` / typed errors where applicable.

---

## 5. Clerk → Supabase Sync (Webhook + Sign-in sync)

**Webhook endpoint:** `POST /api/webhooks/clerk`  
**File:** `src/app/api/webhooks/clerk/route.ts`

**Verification:** Svix signature using `CLERK_WEBHOOK_SECRET`; invalid signature → 400.

**Events:**

- **user.created / user.updated:** Upsert into `public.users` (clerk_id, email, first_name, last_name, role). Role from `public_metadata.role` (agent/broker/lender) or `@brantleychristianson.com` email → agent, else user. Preserves `assigned_broker_id`, `repliers_client_id`, `marketing_opt_in`. Optional: MailerLite subscribe on user.created; optional: bridge `leads` by email to set `clerk_id`; optional: create Repliers client and set `repliers_client_id` on user.created.
- **user.deleted:** Delete row in `public.users` where `clerk_id` = payload id.

**Sign-in sync** (`src/lib/sync-clerk-user.ts`): When a signed-in user hits `/dashboard` or any of `/clients/dashboard`, `/agents/dashboard`, or `/lenders/dashboard` and has **no row** in `public.users`, the server calls `ensureUserInSupabase(clerkUser)` to upsert from Clerk (same role and preserve-column logic as the webhook). This ensures sign-ins are always reflected in Supabase even if the webhook was delayed or failed.

**Health check:** `GET /api/webhooks/clerk` returns `{ status, message? }` and 503 if required env is missing (no secrets exposed).

**Required env:** `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`  
**Optional:** `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`; Repliers env for client creation.

---

## 6. Supabase + Clerk JWT

- **Server-side “user-scoped” client:** `createClerkSupabaseClient()` in `src/lib/supabase.ts` uses `auth().getToken()` and passes the token as `Authorization: Bearer <token>`. For RLS, Supabase must be configured to accept Clerk JWTs (e.g. Clerk JWT template named `supabase` and Supabase JWT secret).
- **Admin client:** `supabaseAdmin()` uses `SUPABASE_SERVICE_ROLE_KEY`; used by webhook and by `/api/me/agent` (updates by `clerk_id`).
- **Build-time:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required at load (supabase.ts throws if missing). Service role is only used server-side.

---

## 7. Layout and Header Behavior

**Root layout** (`src/app/layout.tsx`):

- If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is **not** set: Renders without `ClerkProvider`; uses `SiteHeaderPublic` (no Clerk components; “Sign in” is a plain link to `/sign-in`, “Dashboard” links to `/dashboard`).
- If set: Wraps with `<ClerkProvider publishableKey={...}>` and uses `SiteHeader` (SignInButton modal when signed out, UserButton and Dashboard when signed in).

This allows the app to build and run without any Clerk keys (e.g. static export or preview without auth).

---

## 8. Environment Variables (Auth-Related)

| Variable | Required for | Purpose |
|----------|--------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client auth UI | Clerk provider + header |
| `CLERK_SECRET_KEY` | Proxy + server auth | Proxy runs Clerk protect; server `auth()` |
| `CLERK_WEBHOOK_SECRET` | Webhook | Svix verification for `/api/webhooks/clerk` |
| `NEXT_PUBLIC_SUPABASE_URL` | App + webhook | Supabase client and webhook |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App | Supabase anon client (and Clerk JWT client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook, /api/me/agent | Admin Supabase (webhook sync, PATCH me/agent) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Optional | Override sign-in redirect (e.g. `/dashboard`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Optional | Override sign-up redirect |

See `.env.example` and `docs/VERCEL.md` for full list and deployment notes.

---

## 9. Client-Side Auth Usage

- **`AssignAgentButton`** (`src/components/AssignAgentButton.tsx`): Uses `useAuth().isSignedIn`; only renders when signed in; calls `PATCH /api/me/agent` and then `window.location.href = '/clients/dashboard'`.
- **Clerk components:** `SignIn`, `SignUp`, `SignInButton`, `UserButton`, `Show` (when="signed-in" / "signed-out") are from `@clerk/nextjs` and used in layout/header and auth pages.

---

## 10. Findings and Recommendations

| Item | Status | Recommendation |
|------|--------|----------------|
| Proxy protection | OK | Protects dashboard and key APIs including `/api/me/agent`. |
| Sign-in / sign-up pages | OK | Layouts set `robots: { index: false, follow: false }` so auth pages are not indexed. |
| Role resolution | OK | Supabase first, Clerk public_metadata fallback; agent domain fallback for webhook |
| Webhook security | OK | Svix verification; no PII in logs; GET health check does not leak secrets |
| API error responses | OK | Typed codes and user-facing messages in `api-errors.ts`; 401 for unauthenticated |
| /listings/saved | Placeholder | In proxy matcher but no page yet; either add a stub/redirect or document as “reserved” |
| Redirect URLs | OK | Component props used; optional: prefer env vars for fallback redirects (see AUDIT.md) |

---

## 11. Quick Reference: Auth-Related Files

| File | Purpose |
|------|---------|
| `src/proxy.ts` | Route protection (Clerk when CLERK_SECRET_KEY set) |
| `src/app/layout.tsx` | ClerkProvider, header switch (SiteHeader vs SiteHeaderPublic) |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Sign-in page |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Sign-up page + VOW disclosure |
| `src/app/dashboard/page.tsx` | Dashboard router (role-based redirect; triggers sign-in sync when no Supabase row) |
| `src/app/agents/dashboard/page.tsx` | Agent dashboard (broker-only) |
| `src/app/clients/dashboard/page.tsx` | Client dashboard |
| `src/app/lenders/dashboard/page.tsx` | Lender dashboard |
| `src/app/api/webhooks/clerk/route.ts` | Clerk webhook (user sync) |
| `src/lib/sync-clerk-user.ts` | Sign-in sync: ensureUserInSupabase() for dashboard when no Supabase row |
| `src/app/api/favorites/route.ts` | Favorites API (auth required) |
| `src/app/api/saved-searches/route.ts` | Saved searches API (auth required) |
| `src/app/api/me/agent/route.ts` | Assign agent (auth required; protected by proxy) |
| `src/lib/supabase.ts` | createClerkSupabaseClient, supabaseAdmin |
| `src/lib/roles.ts` | isBrokerRole, isLenderRole |
| `src/layout/SiteHeader.tsx` | Header with Clerk (SignInButton, UserButton) |
| `src/layout/SiteHeaderPublic.tsx` | Header without Clerk (link to /sign-in) |
| `src/components/AssignAgentButton.tsx` | Client component calling PATCH /api/me/agent |
