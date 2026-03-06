# Clerk webhook (POST /api/webhooks/clerk)

Handles Clerk user lifecycle: syncs **user.created** / **user.updated** to Supabase `users`, optionally to MailerLite (on create only), and links **leads** by email. On **user.deleted**, removes the user from Supabase.

**Sign-in sync:** On every visit to `/dashboard` or to `/clients/dashboard`, `/agents/dashboard`, or `/lenders/dashboard`, the server runs `ensureUserInSupabase(clerkUser)` (see `src/lib/sync-clerk-user.ts`), so Clerk is the source of truth for role. If the webhook missed a **user.updated** (e.g. when an admin sets role to agent in Clerk), the next dashboard load will sync the role and the user will be redirected to the correct dashboard.

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
| `relation "public.users" does not exist` | Run the users table migration in Supabase SQL Editor: `supabase/migrations/20240301000000_create_users_table.sql`, then `20260306000000_allow_user_role.sql`, then `20260312000000_allow_lender_role.sql` if using lender role. |
| `Database sync failed` or Supabase error in body | Check Vercel → Logs for the full error. Fix the `users` table schema (e.g. role constraint, column names) to match the webhook. |
| **400** Invalid signature | Confirm `CLERK_WEBHOOK_SECRET` in Vercel matches the signing secret in Clerk for this endpoint. |
| Lead bridge not linking | Ensure `public.leads` has column `clerk_id` and either `email` or `email_address`. The webhook tries both column names. |

## Events

- **user.created** – Upsert user in Supabase; add to MailerLite (if configured); bridge leads by email.
- **user.updated** – Upsert user in Supabase; bridge leads. MailerLite is not called (avoids duplicate adds).
- **user.deleted** – Delete user from Supabase by `clerk_id`.
- Other events (e.g. **role.\***) – Return 200 with no action.

## Setting the agent/broker role in Clerk

The webhook reads **Public metadata** from the Clerk user and syncs it to Supabase `users.role`. The app uses `users.role` for dashboard routing (agent/broker → `/agents/dashboard`, lender → `/lenders/dashboard`, everyone else → `/clients/dashboard`).

**In Clerk Dashboard:**

1. Go to **User & authentication** → **Users** (or **Configure** → **Users**).
2. Open the user who should be an agent, broker, or lender.
3. Find **Public metadata** and add a field:
   - **Key:** `role` (exactly)
   - **Value:** `agent`, `broker`, or `lender` (lowercase is fine; the webhook normalizes it)
4. Save. Clerk will send a **user.updated** webhook; the handler will upsert the user with the correct role into Supabase.

**Check that it’s relayed:**

- In **Vercel** → your project → **Logs**, trigger a sign-in or update that user again (or change metadata and save). Look for a log line: `Clerk webhook: role resolved { eventType, svixId, resolvedRole: 'agent', fromMetadata: 'agent' }`. If you see `fromMetadata: 'none'`, the payload did not include `public_metadata.role` — confirm the key is exactly `role` and that you saved.
- In **Supabase** → **Table Editor** → **users**, find the row by `clerk_id` (or email) and confirm the **role** column is `agent`, `broker`, or `lender`.

If role is set in Clerk but stays `user` in Supabase, the webhook may be failing (check Clerk → Webhooks → Message Attempts) or the metadata key might be different (e.g. `userRole` instead of `role`). The webhook only looks for `public_metadata.role`.

**Fallback:** If `public_metadata.role` is missing but the user’s primary email domain is `@brantleychristianson.com`, the webhook sets `role` to `agent` so team emails always get agent access. To fix existing rows that were synced before metadata or fallback existed, run the migration `20260307000000_backfill_agent_role_by_domain.sql` in the Supabase SQL Editor (or `supabase db push`).

## Clerk + Supabase role sync troubleshooting

If a user is set to **agent** (or broker/lender) in Clerk but still sees the **client dashboard**:

1. **Confirm role in Clerk**  
   In Clerk Dashboard → Users → that user → **Public metadata** → ensure key `role` (string) is set to `agent`, `broker`, or `lender`. Save if you change it.

2. **Trigger a sync**  
   The app syncs role from Clerk to Supabase on every visit to `/dashboard` and to each dashboard page. Have the user open **`/dashboard`** once (e.g. click "Dashboard" in the nav or go to `/dashboard`). That request runs `ensureUserInSupabase(clerkUser)` and updates `public.users.role` from Clerk. No sign-out is required.

3. **Check Supabase**  
   In Supabase → Table Editor → **users**, find the row with that user's `clerk_id`. The **role** column should now be `agent` (or `broker`/`lender`). If it is still `user`, go to step 4.

4. **If role is still wrong**  
   - In **Clerk** → Webhooks → your endpoint → **Message Attempts**, check for failed **user.updated** attempts when you changed the role. Fix any env or schema errors (see Runbook above).  
   - Confirm the app is calling the sync: in `src/app/dashboard/page.tsx` and each dashboard page, the code calls `ensureUserInSupabase(clerkUser)` when the user is signed in.  
   - Ensure the webhook uses the **service role** key (it does via `createSupabaseAdmin()`); RLS does not block the webhook.

5. **Optional logging**  
   In Vercel Logs, look for `Clerk webhook: role resolved` when the webhook runs, and for any `Could not sync Clerk user to Supabase` warnings when the user hits `/dashboard`.

## See also

- **docs/SUPABASE.md** – Full Supabase and webhook setup
- **docs/VERCEL.md** – Env and redirect_uri_mismatch
- **docs/INTEGRATIONS-BEST-PRACTICES.md** – Best practices and full leverage for all integrations
