# MailerLite webhook – Supabase alignment

The MailerLite webhook at **POST /api/webhooks/mailerlite** keeps Supabase in sync with MailerLite subscriber state so the app never emails people who have unsubscribed, bounced, or been deleted in MailerLite.

## Setup

1. **Environment**  
   Set `MAILERLITE_WEBHOOK_SECRET` in Vercel (and `.env.local` for local testing). Use the **Secret** from MailerLite: Integrations → Webhooks → your webhook → Manage → Secret.

2. **URL**  
   In MailerLite: Integrations → Webhooks → Generate webhook (or edit existing).  
   URL: `https://your-domain.com/api/webhooks/mailerlite`  
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
   | **subscriber.deleted** | Same (use batchable: true if required by MailerLite) |

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
