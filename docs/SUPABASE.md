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

If something fails, the exact error is in: browser console (client), terminal (local server), or Vercel → Logs (production). See **docs/INTEGRATIONS-BEST-PRACTICES.md** for a best-practices checklist across all integrations.

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

The webhook at **POST /api/webhooks/clerk** is **self-contained**: it does not import `@/lib/supabase`, so it will not throw at load time if the anon key is missing. It only needs `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. It upserts into **users** on `user.created` and `user.updated` (and optionally adds the user to MailerLite). **Sign-in sync:** if a user signs in and has no row in **users** (e.g. webhook missed), the app upserts them when they hit `/dashboard` or any dashboard page via `src/lib/sync-clerk-user.ts`. If the user’s email matches a row in **leads** (e.g. from a CSV import or consultation), the webhook sets that lead’s `clerk_id` so the lead is linked to the new account (bridge). On `user.deleted`, it deletes the user row by `clerk_id`.

- **clerk_id**, **email**, **first_name**, **last_name** from Clerk payload
- **role** from Clerk `public_metadata.role` (only if set; `'agent'` or `'broker'`)

Ensure:

1. In Clerk Dashboard → **Webhooks**, the endpoint URL is correct (e.g. `https://yourdomain.com/api/webhooks/clerk`).
2. Events **user.created**, **user.updated**, and **user.deleted** are selected.
3. `CLERK_WEBHOOK_SECRET` in your env matches the signing secret shown in Clerk for that endpoint.

## 4. Row Level Security (optional)

The migration leaves RLS **disabled** so the anon key can read **users** when the request includes the Clerk JWT (your app sends it in `Authorization: Bearer <token>`). If your Supabase project does not use a custom JWT template to validate Clerk tokens, Supabase will not recognize the JWT and RLS would block access. So for the current setup (Clerk JWT passed as Bearer token, no Supabase JWT template), keep RLS **off** on **users**, or use the optional JWT template below and then enable RLS.

### 4.1 Optional: Clerk JWT template for RLS

To enable RLS on `users`, `favorites`, or `saved_searches` while still using the Clerk token as the Bearer token, use a **Clerk JWT template** that Supabase can verify. The app already supports this: set `CLERK_JWT_TEMPLATE_SUPABASE=supabase` (or your template name) and create the template in Clerk as follows.

**1. Get Supabase JWT secret**

- Supabase Dashboard → **Project Settings** → **API** → **JWT Settings** → **JWT Secret** (copy the secret).

**2. Create JWT template in Clerk**

- Clerk Dashboard → **Configure** → **JWT Templates** → **New template**.
- **Name:** `supabase` (or any name; use that same name in `CLERK_JWT_TEMPLATE_SUPABASE`).
- **Signing key:** Paste the **Supabase JWT secret** from step 1. Supabase will verify the token with this same key.
- **Claims:** Add only the claims Supabase needs that are not already in the session token. **Do not add `sub`** — Clerk reserves it and includes the user ID automatically; Supabase RLS uses `auth.jwt()->>'sub'` and it will match `clerk_id`. Add `role` (and optionally `aud`) so RLS policies with `TO authenticated` apply.

Example claims in Clerk (if editing JSON):

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "app_metadata": {},
  "user_metadata": {}
}
```

Save the template.

**3. Set env and use in app**

In `.env.local` and Vercel:

```bash
CLERK_JWT_TEMPLATE_SUPABASE=supabase
```

The app uses it here (`src/lib/supabase.ts`):

```ts
const template = process.env.CLERK_JWT_TEMPLATE_SUPABASE?.trim();
const token = await getToken(template ? { template } : undefined);
// ... token is sent as Authorization: Bearer <token>
```

**4. Enable RLS and add policies**

In Supabase SQL Editor (or a migration), enable RLS and allow access where the JWT `sub` matches your table’s Clerk ID column. For `public.users` the column is `clerk_id`; for `favorites` / `saved_searches` it’s also `clerk_id`.

Example for **users** (users can read/update their own row):

```sql
alter table public.users enable row level security;

create policy "Users can read own row"
on public.users for select
to authenticated
using (auth.jwt()->>'sub' = clerk_id);

create policy "Users can update own row"
on public.users for update
to authenticated
using (auth.jwt()->>'sub' = clerk_id);
```

Example for **favorites** (users can only see/insert/delete their own):

```sql
alter table public.favorites enable row level security;

create policy "Users can read own favorites"
on public.favorites for select to authenticated
using (auth.jwt()->>'sub' = clerk_id);

create policy "Users can insert own favorites"
on public.favorites for insert to authenticated
with check (auth.jwt()->>'sub' = clerk_id);

create policy "Users can delete own favorites"
on public.favorites for delete to authenticated
using (auth.jwt()->>'sub' = clerk_id);
```

Same pattern applies to **saved_searches** (replace table name and use `clerk_id`).

**5. Service role unchanged**

Webhooks and server-only admin code use `supabaseAdmin()` (service role), which bypasses RLS. Only requests that use `createClerkSupabaseClient()` and the Clerk token are subject to these policies.

**6. RLS site-wide (maximize integration)**

| Table | RLS | Who can access (with Clerk JWT) |
|-------|-----|---------------------------------|
| **users** | Optional migration 20260313000000 | Authenticated: read/update own row (`clerk_id = sub`) |
| **leads** | Optional migration 20260313000001 | Authenticated: read rows where `clerk_id = sub` (own) or `assigned_broker_id = sub` (assigned to broker) |
| **favorites** | In 20260310000001 | Authenticated: all operations on own rows (`clerk_id = sub`) |
| **saved_searches** | In 20260310000001 | Authenticated: all operations on own rows (`clerk_id = sub`) |
| **listings** | No RLS | Public read or admin; no user-scoped RLS |

To leverage RLS everywhere: (1) Configure Clerk JWT template "supabase" and set `CLERK_JWT_TEMPLATE_SUPABASE=supabase` in `.env.local` and Vercel. (2) Apply migrations 20260313000000 and 20260313000001 (`npm run supabase:push` or Supabase GitHub integration). Then every dashboard page and `/api/favorites` / `/api/saved-searches` request uses the same JWT and is restricted by these policies.

**Note:** Clerk now recommends Supabase’s native third-party auth (Clerk as IdP) for new setups. The JWT template approach above is still valid for this app’s “Clerk token as Bearer to Supabase” flow. See [Clerk + Supabase](https://clerk.com/docs/guides/development/integrations/databases/supabase) and [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security).

## 5. Realtime

Supabase Realtime is enabled for the following tables (configure in Dashboard → Database → Realtime):

| Table | Use |
|-------|-----|
| **public.users** | Live user/role updates; clients can subscribe to their row to react to role or profile changes. |
| **public.leads** | Live lead updates for agent dashboards (new leads, assignment changes). |
| **public.saved_properties** | Live updates to saved properties; use with a client subscription if the app exposes this table. |

The app does not yet subscribe to these channels; you can add `supabase.channel().on('postgres_changes', ...)` in client components when you need live updates.

## 6. Verify configuration

1. **Env** – Restart the app and confirm no startup errors about missing Supabase env.
2. **Table** – In Supabase → **Table Editor** → **users**, confirm the table exists and has the columns above.
3. **Webhook** – In Clerk, create or update a user and check Clerk → Webhooks → Logs for a successful **user.created** / **user.updated** to your endpoint; then check **users** in Supabase for the row (or updated role).
4. **Dashboard** – Sign in and open `/dashboard`; you should be redirected to `/agents/dashboard`, `/clients/dashboard`, or `/lenders/dashboard` based on **users.role** (see **docs/BROKER-SETUP.md** for marking brokers).

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
2. **Sign-in sync** – Even if the webhook failed, once the user signs in and visits `/dashboard` (or any dashboard page), the app will upsert them into **users** via `src/lib/sync-clerk-user.ts`. Check that `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are set in the environment that serves the app.
3. **Clerk Dashboard → Webhooks** – Confirm the endpoint URL is correct and that **user.created**, **user.updated**, and **user.deleted** are selected. Check **Logs** for each event: 200 = success; 400 = bad request (e.g. invalid signature); 500 = server error (see step 5).
4. **Environment (Vercel)** – In the project that serves the webhook (usually production), set `CLERK_WEBHOOK_SECRET` (from Clerk → Webhooks → your endpoint → Signing secret) and `SUPABASE_SERVICE_ROLE_KEY`. Redeploy after changing env.
5. **Error details** – On 500, the app logs the Supabase error (event, clerkId, supabaseError). Check **Vercel → Project → Logs** (or your host’s function logs) for the exact message (e.g. column constraint, missing column).
6. **Table schema** – The webhook sends `clerk_id`, `email`, `first_name`, `last_name`, and optionally `role`. If **users.email** is NOT NULL in your database, sign-ups without an email will fail; the migration defines **email** as nullable. Fix in Supabase with `ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;` if needed.
