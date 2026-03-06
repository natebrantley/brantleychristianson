# MailerLite webhook – Supabase alignment

The MailerLite webhook at **POST /api/webhooks/mailerlite** keeps Supabase in sync with MailerLite subscriber state so the app never emails people who have unsubscribed, bounced, or been deleted in MailerLite.

## Setup

1. **Environment**  
   Set `MAILERLITE_WEBHOOK_SECRET` in Vercel (and `.env.local` for local testing). Use the **Secret** from MailerLite: Integrations → Webhooks → your webhook → Manage → Secret.

2. **URL**  
   In MailerLite: Integrations → Webhooks → Create/Generate webhook.  
   **Endpoint URL:** `https://brantleychristianson.com/api/webhooks/mailerlite`  
   (Local: use ngrok or similar and point MailerLite to that URL.)

3. **Events to subscribe**  
   Subscribe to the events that should drive Supabase updates:

   | Event | Effect in Supabase |
   |-------|---------------------|
   | **subscriber.created** | `users.marketing_opt_in = true`, `leads.opted_in_email = 'true'` (by email) |
   | **subscriber.updated** | Same (e.g. confirmation) |
   | **subscriber.added_to_group** | Same |
   | **subscriber.active** | Same |
   | **subscriber.unsubscribed** | `users.marketing_opt_in = false`, `leads.opted_in_email = 'false'` |
   | **subscriber.bounced** | Same |
   | **subscriber.spam_reported** | Same |
   | **subscriber.deleted** | Same |
   | **subscriber.form_submitted** | Same (opt-in) |

   **Event batching:** Enable "Enable event batching" in the webhook so MailerLite can send batched payloads; the handler supports both single and batched events.

   Optional (no DB change): subscriber.removed_from_group, subscriber.automation_triggered, subscriber.automation_completed, campaign.sent, campaign.open, campaign.click.

4. **Verification**  
   MailerLite signs the body with HMAC-SHA256 using the webhook secret. The handler checks the `Signature` header and rejects invalid requests with 401.

## Payload handling

- **Single event:** Root can have `event` or `type`, and `email` or `subscriber.email`.
- **Batched:** `{ "events": [ { "type": "...", "subscriber": { "email": "..." } }, ... ] }`.

The handler normalizes both formats and processes each event. It always returns **200** after parsing so MailerLite does not retry; per-event DB errors are logged but do not change the response.

## Supabase tables updated

| Table | Column | When |
|-------|--------|------|
| **public.users** | marketing_opt_in | Opt-in events → true; opt-out events → false (match by email). |
| **public.leads** | opted_in_email | Same; match by `email` and `email_address`. |

Matching is by **email** (lowercased). If no row is found, the update is a no-op.

## Health check

**GET /api/webhooks/mailerlite** returns `{ status: "ok", webhook: "mailerlite", env: "configured" }` when `MAILERLITE_WEBHOOK_SECRET` is set, or 503 otherwise. It does not expose the secret.

---

## Pushing public.leads to MailerLite

To sync **Supabase public.leads** into MailerLite as subscribers (e.g. after an import):

- **Endpoint:** `GET /api/cron/sync-leads-to-mailerlite`
- **Auth:** Same as other cron routes: `Authorization: Bearer <CRON_SECRET>` or Vercel Cron (`x-vercel-cron: 1`).
- **Env:** `MAILERLITE_API_TOKEN` (required; same as consultation form), optional `MAILERLITE_GROUP_ID`, and `CRON_SECRET` for manual runs.

**Behavior:** Reads leads from `public.leads`, then upserts them to MailerLite using the **batch API** (50 subscribers per request) with a 3s delay between batches to stay under MailerLite’s 120 requests/minute limit. Fields sent: name, last_name, first_name, phone, city, state, zip, source, address, agent. If `opted_in_email` is false / "Opted Out", the subscriber is sent with `status: unsubscribed`.

**Query params:**

| Param   | Default | Description |
|--------|--------|-------------|
| `limit` | 500   | Max leads to sync (1–2000). |
| `since` | *(none)* | Only sync leads updated in the last period: `24h`, `7d`, `2h`, `30m`. When **Vercel Cron** calls the route (hourly), `since` defaults to `2h` so each run only pushes recently updated leads and avoids timeouts/rate limits. Omit for a **full sync**. |

**Full sync (e.g. after a big import):**  
Run manually without `since` so all leads (up to `limit`) are considered. For large tables, use a high limit and run during off-peak, or run multiple times (e.g. `limit=1000` then `limit=1000&since=7d` later for stragglers).

**Manual run (bash / Git Bash):**  
`curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://brantleychristianson.com/api/cron/sync-leads-to-mailerlite?limit=500"`

**Manual run (PowerShell):**  
`Invoke-RestMethod -Uri "https://brantleychristianson.com/api/cron/sync-leads-to-mailerlite?limit=500" -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" }`  
You must include the word **Bearer** and a space before the secret. Replace `YOUR_CRON_SECRET` with your actual `CRON_SECRET` value. If the route is not deployed yet, you’ll get HTML (404) instead of JSON; deploy first, then run.

**Automated:** Vercel Cron runs this every hour (see `vercel.json`). Each cron run uses incremental sync (last 2 hours) by default so new/updated leads stay in sync without hitting rate limits or timeouts.
