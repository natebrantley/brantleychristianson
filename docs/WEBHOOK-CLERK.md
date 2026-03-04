# Clerk webhook (POST /api/webhooks/clerk)

Handles Clerk user lifecycle: syncs **user.created** / **user.updated** to Supabase `users`, optionally to MailerLite (on create only), and links **leads** by email. On **user.deleted**, removes the user from Supabase.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLERK_WEBHOOK_SECRET` | Yes | Signing secret from Clerk → Webhooks → your endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `MAILERLITE_API_KEY` | No | MailerLite API key; when set, new users are added to the group on **user.created** only |
| `MAILERLITE_GROUP_ID` | No | MailerLite group ID (required if `MAILERLITE_API_KEY` is set) |

## Health check

**GET** `/api/webhooks/clerk` returns:

- **200** `{ status: 'ok', webhook: 'clerk', env: 'configured' }` when required env is set
- **503** `{ status: 'error', message: 'Missing …' }` when a required variable is missing

Use this for uptime monitoring; it does not reveal secrets.

## Runbook (failures)

| Symptom | Action |
|---------|--------|
| Clerk shows **500** | In Clerk → Webhooks → Message Attempts, open a failed attempt and read the **response body**. If it says `Missing X`, add that env var in Vercel (Production) and redeploy. |
| `relation "public.users" does not exist` | Run the users table migration in Supabase SQL Editor: `supabase/migrations/20240301000000_create_users_table.sql`, then `20260306000000_allow_user_role.sql`. |
| `Database sync failed` or Supabase error in body | Check Vercel → Logs for the full error. Fix the `users` table schema (e.g. role constraint, column names) to match the webhook. |
| **400** Invalid signature | Confirm `CLERK_WEBHOOK_SECRET` in Vercel matches the signing secret in Clerk for this endpoint. |
| Lead bridge not linking | Ensure `public.leads` has column `clerk_id` and either `email` or `email_address`. The webhook tries both column names. |

## Events

- **user.created** – Upsert user in Supabase; add to MailerLite (if configured); bridge leads by email.
- **user.updated** – Upsert user in Supabase; bridge leads. MailerLite is not called (avoids duplicate adds).
- **user.deleted** – Delete user from Supabase by `clerk_id`.
- Other events (e.g. **role.\***) – Return 200 with no action.

## See also

- **docs/SUPABASE.md** – Full Supabase and webhook setup
- **docs/VERCEL.md** – Env and redirect_uri_mismatch
