# Vercel deployment

Set these **environment variables** in the Vercel project (Settings → Environment Variables) for **Production** (and **Preview** if you use branch deploys).

**Note:** The app can build and run without Clerk/Supabase keys (public header, no auth). For full auth and dashboard, set the keys below.

## Required for auth and dashboard

| Variable | Where to get it |
|----------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys) — use **production** key (`pk_live_...`) for Production |
| `CLERK_SECRET_KEY` | Same page (secret key; `sk_live_...` for Production) |

- **Middleware** lives at `src/middleware.ts`. Clerk middleware runs only when `CLERK_SECRET_KEY` is set; otherwise requests pass through (no 500).
- **Layout** uses full auth header when the publishable key is set; otherwise uses a public header.

## Required for user sync (Clerk → Supabase)

| Variable | Where to get it |
|----------|------------------|
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → your endpoint → Signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server-only; used by webhook) |

## Optional

- **MailerLite** (consultation form): `MAILERLITE_API_TOKEN`, optional `MAILERLITE_GROUP_ID`
- **Analytics**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

After adding variables, redeploy (or push a new commit). Clear the build cache and redeploy if a previous build failed due to missing keys.

## Local development

Use **development** Clerk keys (`pk_test_...`, `sk_test_...`) in `.env.local`. Production keys (`pk_live_...`, `sk_live_...`) are restricted to your production domain and will fail on `http://localhost:3000`.
