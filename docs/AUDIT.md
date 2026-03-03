# Codebase Audit (Summary)

Last updated: 2026-03. Focus: security, APIs, auth, config, and high-impact improvements.

## What Was Audited

- **App structure** – App Router, layouts, dashboard/agents/clients routes, loading states.
- **Auth & Clerk** – `src/middleware.ts` (Clerk when keys set), conditional layout/SiteHeaderPublic, `auth()` / `getToken()` in server components, role logic (`isBrokerRole`), redirects.
- **APIs** – Consultation (Mailchimp), Clerk webhook (Svix + Supabase sync).
- **Data** – Supabase (Clerk JWT client, admin, webhook sync), static data in `src/data`.
- **Security** – Headers, rate limiting, input validation, webhook verification, env/config.
- **Error handling** – Global error and not-found, API error responses and logging.

## Findings & Status

| Area | Status | Notes |
|------|--------|--------|
| Middleware | OK | `src/middleware.ts`; runs Clerk only when `CLERK_SECRET_KEY` is set; else `NextResponse.next()`. Matcher excludes static assets. |
| Auth & roles | OK | Client-by-default; broker = `agent` or `broker` in Supabase. |
| Consultation API | Hardened | Rate limit, body size cap, email validation, field length caps, tag length caps. |
| Clerk webhook | OK | Svix verification; syncs users; no PII in logs. |
| Security headers | OK | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |
| Env/config | OK | `.env.example` documents Clerk, Supabase, Mailchimp, optional services. |
| SEO | OK | Contact page uses absolute `SITE_URL` for OpenGraph url. |

## Improvements Made

1. **Consultation API** – Reject body &gt; 100KB; validate email format; cap lengths (name 200, phone 50, message 2000); cap tag values (100 chars) to avoid abuse.
2. **Security** – Added `Permissions-Policy` in `next.config.js`.
3. **Contact metadata** – OpenGraph `url` set to `${SITE_URL}/contact`.
4. **.env.example** – Added Clerk and Supabase (and Clerk webhook) so new devs know required env.

## Optional Follow-ups

- **Rate limiting** – If you scale to multiple instances, consider Redis/Upstash instead of in-memory.
- **Clerk redirect** – Prefer env vars `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / sign-up equivalent if you want to stop using component props.
- **Supabase RLS** – If you add RLS and validate Clerk JWTs in Supabase, use a Clerk JWT template and `getToken({ template: 'supabase' })`.
