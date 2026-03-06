# Comprehensive Audit & Systems Check

**Date:** 2026-03-04  
**Project:** Brantley Christianson Real Estate (Next.js 16, Clerk, Supabase)

---

## Build & type check

| Check | Status |
|-------|--------|
| `npm run build` | Pass (Next.js 16.1.6, Turbopack) |
| `npx tsc --noEmit` | Pass |
| Static/SSG/dynamic routes | 391 pages generated; all route types present |

---

## Security (dependencies)

| Check | Status |
|-------|--------|
| `npm audit` | **0 vulnerabilities** (after `npm audit fix`) |
| Previous | 2 high (tar in Supabase CLI) — resolved by safe fix |

---

## Schema & data consistency

| Item | Status |
|------|--------|
| **users.assigned_broker_id** | App and Clerk webhook use this column (slug stored as value). Matches Supabase table. |
| **leads.assigned_broker_id** | Used on leads table for agent assignment; distinct from users. |
| Docs | `docs/run-all-migrations.sql` and `docs/SUPABASE-DB-PUSH.md` updated to reference `assigned_broker_id`. |

---

## Key systems

| System | Notes |
|--------|------|
| **Auth** | Clerk; webhook syncs user.created/updated/deleted to `public.users`; sign-in sync (`src/lib/sync-clerk-user.ts`) upserts when user has no row on dashboard access; preserves `assigned_broker_id`, `repliers_client_id`, `marketing_opt_in`. |
| **Dashboard routing** | Role from Supabase (or Clerk metadata fallback); agent/broker → `/agents/dashboard`, lender → `/lenders/dashboard`, client → `/clients/dashboard`. Assigned lender/agent shown on each dashboard for easy contact. |
| **Agent assignment** | PATCH `/api/me/agent` writes `assigned_broker_id`; full-page nav to `/clients/dashboard` for fresh data; dashboard shows agent + phone/email. |
| **API routes** | 16 route handlers (consultation, cron, favorites, listings, search, webhooks clerk/mailerlite/repliers, etc.). |
| **Security headers** | next.config: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. |

---

## Environment (.env.example)

- Clerk (auth + webhook), Supabase, MailerLite, Repliers, optional: Google Maps, GA, Walk Score, CRON_SECRET.
- All referenced in comments; no secrets committed.

---

## Lint

- `npm run lint` (Next.js 16): known issue — Next 16 CLI may not expose `next lint`; command can fail with “Invalid project directory.” Use `eslint .` or wait for framework update if needed.

---

## Recommendations

1. **Migrations** — Run `npm run supabase:push` (or apply migrations manually) so remote DB has `assigned_broker_id` and any other new migrations.
2. **Realtime (optional)** — If you want live updates in the dashboard when data changes, enable Realtime for `public.users` in Supabase.
3. **Lint** — If `next lint` keeps failing, add a script that runs `eslint .` with an appropriate config.

---

*Generated as part of a one-time audit. Re-run build, audit, and type check after major changes.*
