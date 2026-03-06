# Vercel deployment

Set these **environment variables** in the Vercel project (Settings → Environment Variables) for **Production** (and **Preview** if you use branch deploys).

**Note:** The app can build and run without Clerk/Supabase keys (public header, no auth). For full auth and dashboard, set the keys below.

## Required for auth and dashboard

| Variable | Where to get it |
|----------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys) — use **production** key (`pk_live_...`) for Production |
| `CLERK_SECRET_KEY` | Same page (secret key; `sk_live_...` for Production) |

- **Proxy** (Next.js 16) lives at `src/proxy.ts`. Clerk runs only when `CLERK_SECRET_KEY` is set; otherwise requests pass through (no 500).
- **Layout** uses full auth header when the publishable key is set; otherwise uses a public header.

## Required for user sync (Clerk → Supabase)

| Variable | Where to get it |
|----------|------------------|
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → your endpoint → Signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server-only; used by webhook and sign-in sync) |

Sign-in sync (`src/lib/sync-clerk-user.ts`) also uses the same Supabase env when a user has no row on dashboard access; no extra variables needed.

## Optional

- **Clerk redirect overrides:** `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` (e.g. `/dashboard`)
- **Clerk JWT for Supabase RLS:** `CLERK_JWT_TEMPLATE_SUPABASE=supabase` (only if you use a Clerk JWT template; see docs/INTEGRATIONS-BEST-PRACTICES.md)
- **MailerLite** (consultation form): `MAILERLITE_API_TOKEN`, optional `MAILERLITE_GROUP_ID`
- **MailerLite** (Clerk webhook – add new sign-ups to list): `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`
- **MailerLite webhook** (unsubscribe/bounce → users.marketing_opt_in): `MAILERLITE_WEBHOOK_SECRET`
- **MailerLite** (push leads to list): `GET /api/cron/sync-leads-to-mailerlite` uses `MAILERLITE_API_TOKEN` + optional `MAILERLITE_GROUP_ID`; protect with `CRON_SECRET` (see docs/WEBHOOK-MAILERLITE.md)
- **Repliers** (IDX/CRM): `REPLIERS_API_KEY`, `REPLIERS_DEFAULT_AGENT_ID`; webhook: `REPLIERS_WEBHOOK_SECRET`
- **Cron** (sync-mls): `CRON_SECRET`
- **Analytics:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`

After adding variables, redeploy (or push a new commit). Clear the build cache and redeploy if a previous build failed due to missing keys.

## Local development

Use **development** Clerk keys (`pk_test_...`, `sk_test_...`) in `.env.local`. Production keys (`pk_live_...`, `sk_live_...`) are restricted to your production domain and will fail on `http://localhost:3000`.

## Error: redirect_uri_mismatch on test/preview

If you see **Error 400: redirect_uri_mismatch** when signing in on a test or preview URL (e.g. a Vercel preview deployment), Clerk does not yet allow that URL as a redirect target.

**Fix:** In [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **Domains**, add your test server URL as an allowed domain:

1. Click **Add domain**.
2. Enter the full origin of your test server (e.g. `https://your-app-git-branch-username.vercel.app` for a Vercel preview, or `https://staging.yoursite.com`).
3. Save.

Use the exact URL shown in the browser (no path). After adding the domain, try signing in again on the test server.
