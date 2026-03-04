# Supabase configuration

This app uses Supabase for the **users** table (synced from Clerk) and for role-based dashboard routing. Follow these steps to configure Supabase correctly.

## Full connection checklist (do in order)

1. **Get your three Supabase values** – Supabase Dashboard → your project → **Settings** (gear) → **API**. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://xxxx.supabase.co`)
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click Reveal) → use as `SUPABASE_SERVICE_ROLE_KEY`
2. **Local** – Put all three in `.env.local`. Restart the dev server (`npm run dev`).
3. **Vercel** – Project → **Settings** → **Environment Variables**. Add the same three for **Production** (and Preview if you use it). **Redeploy** after saving.
4. **Create the table** – Supabase → **SQL Editor**. Paste and run the contents of `supabase/migrations/20240301000000_create_users_table.sql`. Then **Table Editor** → confirm **users** exists with columns `clerk_id`, `email`, `first_name`, `last_name`, `role`.
5. **Test dashboard (local)** – Sign in at `/sign-in`, then go to `/dashboard`. If you see "Error loading user" or redirect issues, check the terminal for the Supabase error message.
6. **Webhook (production)** – Clerk → **Webhooks** → endpoint `https://your-production-domain.com/api/webhooks/clerk`, events **user.created**, **user.updated**, and **user.deleted**. Set `CLERK_WEBHOOK_SECRET` in Vercel to the signing secret from that endpoint. Redeploy. Create a test user and check Clerk webhook Logs (200) and Supabase **users** table (new row).

If something fails, the exact error is in: browser console (client), terminal (local server), or Vercel → Logs (production).

---

## 1. Environment variables

Set these in `.env.local` (local) and in Vercel (production):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon (public) key from same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only; used by Clerk webhook) |

Never expose the service role key to the client.

## 2. Create the `users` table

The app expects a **public.users** table with at least:

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `clerk_id` | text | Unique; Clerk user ID |
| `email` | text | Nullable |
| `first_name` | text | Nullable |
| `last_name` | text | Nullable |
| `role` | text | Nullable; use `'agent'` or `'broker'` for brokers |
| `created_at` | timestamptz | Optional |
| `updated_at` | timestamptz | Optional |

**Option A – SQL Editor (recommended, no CLI needed)**

1. In [Supabase Dashboard](https://supabase.com/dashboard) → select your project → **SQL Editor**.
2. Copy the contents of **supabase/migrations/20240301000000_create_users_table.sql**.
3. Paste and click **Run**.

**Option B – Supabase CLI**

The project includes Supabase CLI config (`supabase/config.toml`) and migrations. To link and push: (1) Run `npm run supabase:link` and when prompted enter your **project ref** (e.g. from `NEXT_PUBLIC_SUPABASE_URL`: `abcdefgh` in `https://abcdefgh.supabase.co`) and **database password**. (2) Run `npm run supabase:push` to apply migrations. If you prefer not to use the CLI, use Option A (SQL Editor) instead.

```bash
npm run supabase:link   # enter project ref + database password when prompted
npm run supabase:push   # apply migrations after linking
```

If you see “Cannot find project ref”, use **Option A** instead (SQL Editor).

**If the table already exists** – Ensure it has a **role** column (text, nullable). If missing, run in SQL Editor:

```sql
alter table public.users add column if not exists role text;
alter table public.users add constraint users_role_check check (role is null or role in ('agent', 'broker'));
```

## 3. Clerk webhook

The webhook at **POST /api/webhooks/clerk** upserts into **users** on `user.created` and `user.updated` (and optionally adds the user to MailerLite). If the user’s email matches a row in **leads** (e.g. from a CSV import or consultation), it sets that lead’s `clerk_id` so the lead is linked to the new account (bridge). On `user.deleted`, it deletes the user row by `clerk_id`.

- **clerk_id**, **email**, **first_name**, **last_name** from Clerk payload
- **role** from Clerk `public_metadata.role` (only if set; `'agent'` or `'broker'`)

Ensure:

1. In Clerk Dashboard → **Webhooks**, the endpoint URL is correct (e.g. `https://yourdomain.com/api/webhooks/clerk`).
2. Events **user.created**, **user.updated**, and **user.deleted** are selected.
3. `CLERK_WEBHOOK_SECRET` in your env matches the signing secret shown in Clerk for that endpoint.

## 4. Row Level Security (optional)

The migration leaves RLS **disabled** so the anon key can read **users** when the request includes the Clerk JWT (your app sends it in `Authorization: Bearer <token>`). If your Supabase project does not use a custom JWT template to validate Clerk tokens, Supabase will not recognize the JWT and RLS would block access. So for the current setup (Clerk JWT passed as Bearer token, no Supabase JWT template), keep RLS **off** on **users**, or add a Clerk JWT template in Supabase and then enable RLS with a policy that allows select where `auth.jwt() ->> 'sub' = clerk_id`.

## 5. Verify configuration

1. **Env** – Restart the app and confirm no startup errors about missing Supabase env.
2. **Table** – In Supabase → **Table Editor** → **users**, confirm the table exists and has the columns above.
3. **Webhook** – In Clerk, create or update a user and check Clerk → Webhooks → Logs for a successful **user.created** / **user.updated** to your endpoint; then check **users** in Supabase for the row (or updated role).
4. **Dashboard** – Sign in and open `/dashboard`; you should be redirected to `/agents` or `/clients` based on **users.role** (see **docs/BROKER-SETUP.md** for marking brokers).

## Troubleshooting

| Issue | Check |
|-------|--------|
| "Error loading user record" / empty `{}` in logs | Use the improved logging (formatSupabaseError); check Supabase URL and anon key; confirm **users** exists and has `clerk_id`. |
| Broker sent to client dashboard | Ensure **users** has `role = 'agent'` or `'broker'` for that user (Clerk public_metadata or Supabase edit). See **BROKER-SETUP.md**. |
| Webhook returns 500 | Check `CLERK_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`; confirm **users** table and unique constraint on **clerk_id**. |

### See why the webhook is failing (500)

1. In **Clerk Dashboard** → **Configure** → **Webhooks** → your endpoint → **Message Attempts**.
2. Click a **Failed** attempt (e.g. `user.updated`).
3. Open the **Response** or **Response body** for that attempt. The app returns a JSON body with an `error` field:
   - **"Missing SUPABASE_SERVICE_ROLE_KEY"** (or `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) → Add that variable in **Vercel** → Settings → Environment Variables for **Production**, then redeploy.
   - **"relation \"public.users\" does not exist"** → Run the **users** table migration in your production Supabase (SQL Editor: paste `supabase/migrations/20240301000000_create_users_table.sql` and run).
   - **"Database sync failed"** or a Supabase error message (e.g. column name, constraint) → Check **Vercel → Logs** for the full detail; fix the **users** table schema in Supabase to match the webhook (see migration files).
4. After fixing env or schema, trigger another user update in Clerk and confirm the next attempt succeeds (200).

| RLS blocking reads | If RLS is enabled, ensure the policy allows the request (e.g. JWT sub = clerk_id) or disable RLS for **users** for the anon key if you are not using a Clerk JWT template in Supabase. |

### Users not syncing from Clerk to Supabase

If sign-ups reach Clerk but no row appears in **users** (or the webhook fails):

1. **Webhook URL** – Clerk can only call a **public** URL. Use your **production** URL (e.g. `https://yourdomain.com/api/webhooks/clerk`). Localhost will not receive webhooks unless you use a tunnel (e.g. ngrok).
2. **Clerk Dashboard → Webhooks** – Confirm the endpoint URL is correct and that **user.created**, **user.updated**, and **user.deleted** are selected. Check **Logs** for each event: 200 = success; 400 = bad request (e.g. invalid signature); 500 = server error (see step 4).
3. **Environment (Vercel)** – In the project that serves the webhook (usually production), set `CLERK_WEBHOOK_SECRET` (from Clerk → Webhooks → your endpoint → Signing secret) and `SUPABASE_SERVICE_ROLE_KEY`. Redeploy after changing env.
4. **Error details** – On 500, the app logs the Supabase error (event, clerkId, supabaseError). Check **Vercel → Project → Logs** (or your host’s function logs) for the exact message (e.g. column constraint, missing column).
5. **Table schema** – The webhook sends `clerk_id`, `email`, `first_name`, `last_name`, and optionally `role`. If **users.email** is NOT NULL in your database, sign-ups without an email will fail; the migration defines **email** as nullable. Fix in Supabase with `ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;` if needed.
