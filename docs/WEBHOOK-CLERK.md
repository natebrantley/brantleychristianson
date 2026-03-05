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

## Setting the agent/broker role in Clerk

The webhook reads **Public metadata** from the Clerk user and syncs it to Supabase `users.role`. The app uses `users.role` for dashboard routing (agent/broker → `/agents`, everyone else → `/clients`).

**In Clerk Dashboard:**

1. Go to **User & authentication** → **Users** (or **Configure** → **Users**).
2. Open the user who should be an agent/broker.
3. Find **Public metadata** and add a field:
   - **Key:** `role` (exactly)
   - **Value:** `agent` or `broker` (lowercase is fine; the webhook normalizes it)
4. Save. Clerk will send a **user.updated** webhook; the handler will upsert the user with `role: 'agent'` or `role: 'broker'` into Supabase.

**Check that it’s relayed:**

- In **Vercel** → your project → **Logs**, trigger a sign-in or update that user again (or change metadata and save). Look for a log line: `Clerk webhook: role resolved { eventType, svixId, resolvedRole: 'agent', fromMetadata: 'agent' }`. If you see `fromMetadata: 'none'`, the payload did not include `public_metadata.role` — confirm the key is exactly `role` and that you saved.
- In **Supabase** → **Table Editor** → **users**, find the row by `clerk_id` (or email) and confirm the **role** column is `agent` or `broker`.

If role is set in Clerk but stays `user` in Supabase, the webhook may be failing (check Clerk → Webhooks → Message Attempts) or the metadata key might be different (e.g. `userRole` instead of `role`). The webhook only looks for `public_metadata.role`.

**Fallback:** If `public_metadata.role` is missing but the user’s primary email domain is `@brantleychristianson.com`, the webhook sets `role` to `agent` so team emails always get agent access. To fix existing rows that were synced before metadata or fallback existed, run the migration `20260307000000_backfill_agent_role_by_domain.sql` in the Supabase SQL Editor (or `supabase db push`).

## See also

- **docs/SUPABASE.md** – Full Supabase and webhook setup
- **docs/VERCEL.md** – Env and redirect_uri_mismatch
