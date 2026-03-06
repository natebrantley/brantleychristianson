# Instructions for Preparing Data to Upload to Supabase `public.leads`

Use this document to prepare a database or dataset so it can be uploaded into the Supabase table **`public.leads`**. Follow the schema, rules, and examples below exactly.

**Schema source:** Pulled from linked Supabase project via `supabase gen types typescript --linked`. Re-run that command to refresh after any table changes.

---

## 1. Target table: `public.leads` — full field list (from Supabase)

| Column | Type | Nullable | Notes |
|--------|------|----------|--------|
| **id** | uuid | NO (PK) | Omit on insert to auto-generate. |
| **email** | text | NO | **Required.** |
| **address** | text | YES | |
| **agent** | text | YES | Display name of assigned agent from your system (e.g. "Nate Brantley"). Shown when **assigned_broker_id** is not set or not found in **users**. |
| **assigned_broker_id** | text | YES | **Clerk user ID** of the assigned agent/broker (e.g. `user_2abc...`). Must match a **users.clerk_id** so the agent sees the lead and RLS allows access. Use **agent** for display name if you don't have Clerk ID. |
| **assigned_lender_id** | text | YES | Clerk user ID of assigned lender. |
| **average_price** | number | YES | |
| **buyer_seller** | text | YES | |
| **city** | text | YES | |
| **clerk_id** | text | YES | Clerk user ID after lead signs in. |
| **created_at** | timestamptz | YES | Omit for server default. |
| **email_address** | text | YES | |
| **favorite_city** | text | YES | |
| **favorite_properties** | number | YES | |
| **first_name** | text | YES | |
| **house_to_sell** | text | YES | |
| **last_login** | text | YES | Timestamp. |
| **last_name** | text | YES | |
| **login_count** | number | YES | |
| **median_price** | number | YES | |
| **notes** | text | YES | |
| **notes_2** | text | YES | |
| **opted_in_email** | text | YES | |
| **opted_in_text** | text | YES | |
| **phone** | text | YES | |
| **pre_qualified_for_mortgage** | text | YES | |
| **property_inquiries** | number | YES | |
| **property_views** | number | YES | |
| **registered** | text | YES | Timestamp. |
| **saved_searches** | number | YES | |
| **source** | text | YES | |
| **state** | text | YES | |
| **timeframe** | text | YES | |
| **zip** | text | YES | |

**Full field list (names only):**  
`id`, `email`, `address`, `agent`, `assigned_broker_id`, `assigned_lender_id`, `average_price`, `buyer_seller`, `city`, `clerk_id`, `created_at`, `email_address`, `favorite_city`, `favorite_properties`, `first_name`, `house_to_sell`, `last_login`, `last_name`, `login_count`, `median_price`, `notes`, `notes_2`, `opted_in_email`, `opted_in_text`, `phone`, `pre_qualified_for_mortgage`, `property_inquiries`, `property_views`, `registered`, `saved_searches`, `source`, `state`, `timeframe`, `zip`

---

## 2. Data preparation rules

### 2.1 Required field

- **email**  
  - Must be non-empty after trim.  
  - Normalize: trim whitespace, lowercase.  
  - Reject or fix rows with invalid or empty email (no insert for those).

### 2.2 Optional fields (may be null or omitted)

Every column except **email** may be null or omitted on insert.

- **id** — Omit to auto-generate. If supplied, use a valid UUID string.
- **clerk_id**, **assigned_broker_id**, **assigned_lender_id** — Clerk user IDs (e.g. `user_2abc...`). Leave null if unknown. For **assigned_broker_id**: use the agent’s **Clerk user ID** so that agent sees the lead on their dashboard and RLS works; the app resolves that ID to a display name from **public.users**. Use **agent** (text) for the agent’s display name from your system; it is used as a fallback when the broker isn’t in **users** or **assigned_broker_id** is null.
- **created_at**, **last_login**, **registered** — Use ISO 8601 with timezone; omit for defaults where applicable.
- **Text columns** (e.g. **address**, **agent**, **first_name**, **last_name**, **phone**, **city**, **state**, **zip**, **source**, **notes**, **timeframe**, **buyer_seller**, **house_to_sell**, **pre_qualified_for_mortgage**, **opted_in_email**, **opted_in_text**, **email_address**, **favorite_city**) — Any string or null.
- **Numeric columns** (**average_price**, **median_price**, **favorite_properties**, **login_count**, **property_inquiries**, **property_views**, **saved_searches**) — Number or null.

### 2.3 Syncing assigned agent names so they resolve correctly

- **assigned_broker_id** on leads must be the **Clerk user ID** of the agent (from Clerk / **public.users.clerk_id**). Then the app shows the agent’s name from **users** (first_name, last_name) on the agent and lender dashboards.
- **agent** (text) is used as a fallback display name when **assigned_broker_id** is null or the user isn’t in **users**.
- If your source data has agent **names** (e.g. "Nate Brantley") but not Clerk IDs:  
  1. Populate **agent** with that name so it displays.  
  2. Optionally backfill **assigned_broker_id**: match agent name (or email) to **public.users** where **role** is `agent` or `broker`, then set **leads.assigned_broker_id** = **users.clerk_id** for that agent. That way the lead appears on the correct agent’s dashboard and the resolved name stays in sync.

**If leads were already imported with agent full name or slug in assigned_broker_id:** Run the migration `supabase/migrations/20260317000000_backfill_leads_assigned_broker_id_from_agent_name.sql` in the Supabase SQL Editor (or `supabase db push`). It maps full name (from **public.users** first_name + last_name) and known agent slugs to **users.clerk_id** and updates **leads.assigned_broker_id** so each agent’s dashboard shows their assigned leads.

**Preferred: normalize both broker and lender in one step.** Run `supabase/migrations/20260318000000_normalize_leads_assigned_broker_lender.sql` (or `supabase db push`). It sets **assigned_broker_id** and **assigned_lender_id** to **users.clerk_id** by matching current values to agent/lender **email**, **full name**, or **slug** (case-insensitive). Only rows that are not already Clerk IDs (`user_%`) are updated. Run after agents and lenders have signed in so **public.users** has their **clerk_id**.

### 2.4 Validation before upload

1. **Email**  
   - Not empty after trim.  
   - Reasonable format (e.g. contains `@`, has domain).  
   - No duplicate emails in the same batch if you require uniqueness (the table allows duplicates; dedupe in app if needed).

2. **IDs**  
   - If you supply **id**, must be valid UUID.  
   - If you supply **clerk_id**, **assigned_broker_id**, or **assigned_lender_id**, they must be non-empty strings (Clerk IDs, e.g. `user_...`).

3. **Timestamps**  
   - If you supply **created_at** or **updated_at**, use ISO 8601 with timezone so Postgres can parse as `timestamptz`.

4. **Types**  
   - **id** and timestamp columns: use strings (UUID, ISO 8601).  
   - Numeric columns (**average_price**, **median_price**, **favorite_properties**, **login_count**, **property_inquiries**, **property_views**, **saved_searches**): use numbers in JSON; in SQL use numeric/integer types.

---

## 3. Example row (JSON for API insert)

Minimal (only required field):

```json
{
  "email": "lead@example.com"
}
```

Full (all optional fields populated):

```json
{
  "email": "lead@example.com",
  "clerk_id": "user_2abc123def456",
  "assigned_broker_id": "user_2xyz789",
  "assigned_lender_id": null,
  "created_at": "2025-03-01T10:00:00Z"
}
```

Omit **id** and **updated_at** for insert; let the database set them.

---

## 4. Example SQL insert

Use the **service role** key (or a role that can insert into `public.leads`); RLS may restrict access for other keys.

```sql
-- Single row (id and timestamps optional)
INSERT INTO public.leads (email, clerk_id, assigned_broker_id, assigned_lender_id, created_at)
VALUES (
  'lead@example.com',
  NULL,
  'user_2xyz789',
  NULL,
  '2025-03-01T10:00:00Z'
);

-- Or omit created_at to use now()
INSERT INTO public.leads (email, assigned_broker_id)
VALUES ('newlead@example.com', 'user_2xyz789');
```

Bulk insert example:

```sql
INSERT INTO public.leads (email, assigned_broker_id)
VALUES
  ('lead1@example.com', 'user_2xyz789'),
  ('lead2@example.com', NULL),
  ('lead3@example.com', 'user_2xyz789');
```

---

## 5. Upload via Supabase REST API (PostgREST)

- **Endpoint:** `POST https://<PROJECT_REF>.supabase.co/rest/v1/leads`  
- **Headers:**  
  - `apikey: <SUPABASE_SERVICE_ROLE_KEY>`  
  - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`  
  - `Content-Type: application/json`  
  - `Prefer: return=minimal` (or `return=representation` if you need the inserted row back)

- **Body:** JSON object or array of objects matching the schema (e.g. `{ "email": "lead@example.com" }` or `[{ "email": "a@x.com" }, { "email": "b@x.com" }]`).

Use the **service role** key so RLS does not block inserts. Do not expose the service role key in client-side or public code.

---

## 6. CSV preparation for import

If you use a CSV (e.g. for Supabase Dashboard import or a script):

1. **Header row:**  
   Use exact column names: `email`, `clerk_id`, `assigned_broker_id`, `assigned_lender_id`, `created_at`.  
   Omit `id` and `updated_at` unless you have a specific reason to set them.

2. **Email column:**  
   Required; no empty cells.

3. **Optional columns:**  
   Leave empty or use `NULL` for null; for timestamps use ISO 8601 with timezone.

4. **Encoding:**  
   UTF-8.

5. **Example CSV:**

```csv
email,clerk_id,assigned_broker_id,assigned_lender_id,created_at
lead1@example.com,,user_2xyz789,,2025-03-01T10:00:00Z
lead2@example.com,,,,2025-03-02T12:00:00Z
```

---

## 7. Checklist before upload

- [ ] **email** is present, trimmed, and valid for every row.  
- [ ] **id** is omitted (or valid UUID) so DB can generate.  
- [ ] **clerk_id**, **assigned_broker_id**, **assigned_lender_id** are either null/empty or valid Clerk user IDs.  
- [ ] **created_at** / **updated_at** are omitted or valid ISO 8601 with timezone.  
- [ ] No invalid types (e.g. numbers for id or dates).  
- [ ] Inserts use a key/role that can write to `public.leads` (e.g. service role).  
- [ ] If RLS is enabled, the inserting role is allowed to insert (e.g. service role bypasses RLS).

---

## 8. App behavior reference

- **Client dashboard:** Shows leads where `clerk_id = current user` (leads linked after sign-in).  
- **Agent dashboard:** Shows leads where `assigned_broker_id = current user` or null.  
- **Lender dashboard:** Shows leads where `assigned_lender_id = current user`.  

So when preparing data:

- Set **assigned_broker_id** to the agent’s Clerk user id so they see the lead on their dashboard.  
- Set **assigned_lender_id** to the lender’s Clerk user id so they see it under “Leads needing attention.”  
- Set **clerk_id** only when the lead has signed in and been linked (e.g. by webhook); otherwise leave null.

---

## 9. Quick reference: column list for insert

**Required:** `email`

**Optional (all others):**  
`id`, `address`, `agent`, `assigned_broker_id`, `assigned_lender_id`, `average_price`, `buyer_seller`, `city`, `clerk_id`, `created_at`, `email_address`, `favorite_city`, `favorite_properties`, `first_name`, `house_to_sell`, `last_login`, `last_name`, `login_count`, `median_price`, `notes`, `notes_2`, `opted_in_email`, `opted_in_text`, `phone`, `pre_qualified_for_mortgage`, `property_inquiries`, `property_views`, `registered`, `saved_searches`, `source`, `state`, `timeframe`, `zip`

Omit **id** on insert to auto-generate. Omit **created_at** to use server time when applicable.

---

## 10. Refreshing this schema

To pull the latest `public.leads` schema from your linked Supabase project and regenerate types:

```bash
npx supabase gen types typescript --linked
```

Then update Section 1 and Section 9 above to match the printed `public.leads` Row/Insert types.
