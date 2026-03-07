# Handling Duplicate Entries in `public.users`

## Current constraints

- **`clerk_id`**: UNIQUE (and unique index). Only one row per Clerk user ID. The Clerk webhook and `ensureUserInSupabase()` use **upsert on `clerk_id`**, so normal flows never create duplicate `clerk_id` rows.
- **`email`**: Not unique. The table allows multiple rows with the same email (e.g. one person with two Clerk accounts).

## 1. Duplicates by `clerk_id` (same Clerk user twice)

**Cause:** Legacy data, manual inserts, or a bug before the unique constraint.

**Handling:**

- Migration **`20260329000000_users_dedupe_clerk_id.sql`** runs a one-time cleanup: for each `clerk_id` it keeps the row with the smallest `id` and deletes the rest.
- The existing UNIQUE constraint on `clerk_id` prevents new duplicates.

Run:

```bash
npx supabase db push
```

(or run that migration in the SQL Editor once).

## 2. Duplicates by email (same email, different `clerk_id`)

**Cause:** Same person signed up twice (e.g. Google and email/password), or multiple Clerk accounts for one email.

**Options:**

### A. Leave as-is (current behavior)

- Two rows can share the same email.
- No DB change; no risk of breaking the webhook.
- Downside: “My leads,” MailerLite, and any email-based lookups can be ambiguous.

### B. One-time cleanup only (no new constraint)

- Run a one-time script or migration that:
  1. Finds groups of rows with the same normalized email `lower(trim(email))`.
  2. Picks a canonical row per email (e.g. oldest `created_at`).
  3. Reassigns references to “duplicate” users to the canonical one:
     - `saved_searches.clerk_id` and `favorites.clerk_id`: set to canonical `clerk_id` where they matched the duplicate’s `clerk_id`.
     - `users.assigned_broker_id` / `users.assigned_lender_id`: if they pointed at the duplicate’s `clerk_id`, set to the canonical `clerk_id`.
  4. Deletes the duplicate user rows.
- New duplicates can still be created later (no unique constraint).

### C. Enforce one row per email (unique + webhook policy)

- Add a UNIQUE constraint on normalized email, e.g.:

  ```sql
  CREATE UNIQUE INDEX users_email_lower_key
  ON public.users (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
  ```

- Then decide how the Clerk webhook should behave when a **new** Clerk user has an email that already exists:
  - **Option C1 – Update existing row:** treat it as “same person, new Clerk account.” On `user.created` / `user.updated`, if a row with that email exists, update that row’s `clerk_id` (and other synced fields) instead of inserting. So the latest Clerk account “owns” the row. Implement by checking for existing email in the webhook and doing an update by `id` (or by email) when found.
  - **Option C2 – Reject duplicate:** do not insert a second row; keep the first. The second Clerk account would have no row in `public.users` until you merge or delete the first (product decision).

Recommendation: start with **migration `20260329000000_users_dedupe_clerk_id.sql`** to clean `clerk_id` duplicates. For email, use **A** unless you need a single row per email, then add a one-time cleanup (B) and optionally enforce with **C** and **C1** so the webhook updates the existing row when the same email appears again.

**Implemented (Option C):** Migration `20260330000000_users_one_row_per_email.sql` does the one-time email dedupe, adds `UNIQUE` on normalized email, and creates RPC `get_user_by_normalized_email`. The Clerk webhook (`src/app/api/webhooks/clerk/route.ts`) checks for an existing row by email; if found with a different `clerk_id`, it updates that row (and reassigns `saved_searches` and `favorites` to the new `clerk_id`) so the latest Clerk account owns the row.
