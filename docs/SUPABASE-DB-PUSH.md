# Supabase DB push setup

Use this to apply migrations (e.g. `users`, `leads`, `assigned_broker_slug`, `listings`) to your **remote** Supabase project via the CLI.

## 1. One-time: log in to Supabase CLI

The CLI needs an access token before you can link or push. From the project root:

```bash
npx supabase login
```

This opens your browser to sign in to Supabase (or gives you a URL to paste a token). You only need to do this once per machine.

## 2. One-time: link the project

```bash
npm run supabase:link
```

When prompted:

- **Project ref** — From your Supabase Dashboard: **Settings → General**, or from your project URL:  
  `https://XXXXXXXX.supabase.co` → the ref is `XXXXXXXX`.
- **Database password** — The password you set when you created the project. If you don’t remember it, use **Settings → Database** in the Dashboard to reset it.

Linking saves the project ref under `supabase/.temp/` (gitignored). You only need to do this once per machine.

## 3. Push migrations

```bash
npm run supabase:push
```

This applies all files in `supabase/migrations/` in order to your remote database. You’ll be prompted for the database password again unless you’ve stored it (e.g. via `SUPABASE_DB_PASSWORD` env or Supabase CLI config).

## 4. Optional: non-interactive push (CI or scripts)

To avoid typing the password each time:

1. **Option A** — Set the database password in an env var before running:
   ```bash
   set SUPABASE_DB_PASSWORD=your-database-password
   npm run supabase:push
   ```
   (Use `export SUPABASE_DB_PASSWORD=...` on macOS/Linux.)

2. **Option B** — After linking, the CLI may cache the connection; run `supabase db push` and enter the password once.

## If you prefer not to use the CLI

Run each migration manually in the Supabase Dashboard:

1. **SQL Editor** → New query.
2. Copy the contents of each `.sql` file in `supabase/migrations/` in order (oldest first).
3. Run them one by one.

Migrations that affect this app:

- `20240301000000_create_users_table.sql` — users table
- `20260304000000_add_users_marketing_opt_in.sql` — marketing opt-in
- `20260305000000_create_leads_table.sql` — leads table
- `20260306000000_allow_user_role.sql` — role constraint
- `20260307000000_backfill_agent_role_by_domain.sql` — backfill
- `20260307000001_add_users_updated_at_if_missing.sql` — updated_at column
- `20260308000000_create_listings_table_rmls.sql` — RMLS listings
- `20260309000000_add_users_assigned_broker_slug.sql` — assigned broker for clients
