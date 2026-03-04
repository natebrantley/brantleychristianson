# Supabase configuration

This app uses Supabase for the **users** table (synced from Clerk) and for role-based dashboard routing. Follow these steps to configure Supabase correctly.

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

Only if you use the CLI and have already linked the project:

```bash
npx supabase link   # one-time: enter project ref and database password when prompted
npx supabase db push
```

If you see “Cannot find project ref”, use **Option A** instead (SQL Editor).

**If the table already exists** – Ensure it has a **role** column (text, nullable). If missing, run in SQL Editor:

```sql
alter table public.users add column if not exists role text;
alter table public.users add constraint users_role_check check (role is null or role in ('agent', 'broker'));
```

## 3. Clerk webhook

The webhook at **POST /api/webhooks/clerk** upserts into **users** on `user.created` and `user.updated`:

- **clerk_id**, **email**, **first_name**, **last_name** from Clerk payload
- **role** from Clerk `public_metadata.role` (only if set; `'agent'` or `'broker'`)

Ensure:

1. In Clerk Dashboard → **Webhooks**, the endpoint URL is correct (e.g. `https://yourdomain.com/api/webhooks/clerk`).
2. Events **user.created** and **user.updated** are selected.
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
| RLS blocking reads | If RLS is enabled, ensure the policy allows the request (e.g. JWT sub = clerk_id) or disable RLS for **users** for the anon key if you are not using a Clerk JWT template in Supabase. |
