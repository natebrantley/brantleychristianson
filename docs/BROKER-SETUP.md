# Marking a user as a broker

Users are **clients** unless they have `role = 'agent'` or `role = 'broker'` in Supabase. Brokers are routed to the agent dashboard; everyone else to the client dashboard.

## Option 1: Clerk public metadata (recommended)

The Clerk webhook syncs `public_metadata.role` into Supabase on **user.created** and **user.updated**.

1. In [Clerk Dashboard](https://dashboard.clerk.com) → **Users** → select the broker.
2. Under **Public metadata**, add:
   ```json
   { "role": "agent" }
   ```
   or `{ "role": "broker" }`.
3. Save. Clerk sends a **user.updated** webhook; the app syncs the role to Supabase.
4. The next time that user hits `/dashboard`, they’ll be redirected to the agent dashboard.

If you remove the `role` key (or set it to something other than `agent`/`broker`), the webhook will set Supabase `role` to `null` and they’ll be treated as a client.

## Option 2: Supabase directly

1. In [Supabase Dashboard](https://supabase.com/dashboard) → **Table Editor** → **users**.
2. Find the row by `clerk_id` (or email).
3. Set **role** to `agent` or `broker`.
4. Save.

No webhook is involved; the change is used on the next dashboard load.

## Troubleshooting

- **Broker still sent to client dashboard**  
  - Confirm the **users** row has `role` = `agent` or `broker` (check in Supabase).  
  - If using Clerk metadata, confirm the webhook is configured and that **user.updated** runs after saving metadata (check Clerk → Webhooks → Logs).

- **Webhook not updating role**  
  - Ensure `CLERK_WEBHOOK_SECRET` and Supabase env vars are set in the environment that receives the webhook.  
  - Public metadata must be a JSON object with a string `role` field; values are normalized to lowercase.
