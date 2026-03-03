# Vercel deployment

Builds require these **environment variables** to be set in the Vercel project (Settings → Environment Variables). Add them for **Production** (and **Preview** if you use branch deploys).

## Required for auth and dashboard

| Variable | Where to get it |
|----------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys) |
| `CLERK_SECRET_KEY` | Same page (secret key) |

Without these, the build fails with: **Missing publishableKey**.

## Required for user sync (Clerk → Supabase)

| Variable | Where to get it |
|----------|------------------|
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → your endpoint → Signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same (server-only; used by webhook) |

## Optional

- **Mailchimp** (consultation form): `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`
- **Analytics**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

After adding variables, redeploy (or push a new commit). Clear the build cache and redeploy if a previous build failed due to missing keys.
