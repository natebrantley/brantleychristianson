# Clerk JWT template for Supabase

This app uses **Clerk** for auth and **Supabase** for data. Authenticated API and dashboard requests use a Clerk JWT when talking to Supabase so RLS can identify the user via `auth.jwt()->>'sub'` (must equal `users.clerk_id`).

## 1. Clerk JWT template ("supabase")

Create or edit a JWT template in **Clerk Dashboard → Configure → JWT Templates** (or **Customize → Session token** depending on UI). Use the template name **supabase** (or set `CLERK_JWT_TEMPLATE_SUPABASE` to your template name).

### Required claims

Supabase RLS expects:

- **`sub`** – User ID. Clerk **adds this automatically** (Clerk user ID, e.g. `user_2abc...`). Do **not** add `sub` in the claims editor (Clerk will show "You can't use the reserved claim: sub"). It will be present in the token so `auth.jwt()->>'sub'` matches `users.clerk_id`.
- **`aud`** – Audience. Use **`authenticated`** so Supabase treats the request as authenticated.
- **`role`** – Postgres role. Use **`authenticated`** so RLS runs as the authenticated role.
- **`email`** – Optional but useful; use **`{{user.primary_email_address}}`**.

### Recommended "Customize Session Token" JSON

Paste this into the **Claims** editor for the **supabase** template. Do **not** add `sub`—Clerk includes it automatically (reserved claim).

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "app_metadata": {},
  "user_metadata": {
    "role": "{{user.public_metadata.role}}"
  }
}
```

Optional variant without `user_metadata.role`:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "app_metadata": {},
  "user_metadata": {}
}
```

Clerk adds standard claims (`sub`, `iss`, `exp`, `iat`, etc.) automatically.

### Issuer and JWKS (if Supabase uses JWKS)

- **Issuer:** e.g. `https://clerk.brantleychristianson.com` (your Clerk front-end API or custom domain).
- **JWKS endpoint:** e.g. `https://clerk.brantleychristianson.com/.well-known/jwks.json` (or your custom domain).

If you use **Supabase Third-Party Auth with Clerk**, Supabase will verify the JWT using this JWKS endpoint. The issuer in the JWT must match what you configure in Supabase.

### Custom signing key (HS256)

If you use a **custom signing key** (HS256) in the Clerk template:

1. In Clerk: Configure the template with your chosen secret (Signing key).
2. In **Supabase Dashboard**:  
   **Project → Authentication → Providers** (or **Settings → API**) and set the **JWT secret** (or custom JWT verification) to the **same secret** so Supabase can verify the token.

Do not commit the shared secret to the repo; keep it in env or secrets (e.g. Vercel).

## 2. Environment variable

In `.env.local` (and production env):

```bash
CLERK_JWT_TEMPLATE_SUPABASE=supabase
```

Use the exact template name you created in Clerk. If this is unset, the app falls back to Clerk’s default session token (which may not include `aud`/`role` in the shape Supabase expects).

## 3. Supabase configuration

- **Option A – Third-Party Auth (recommended)**  
  In Supabase: **Authentication → Third-party auth → Add provider → Clerk**.  
  Enter your Clerk issuer and JWKS URL. Supabase will verify tokens using JWKS; no shared secret.

- **Option B – Custom JWT secret**  
  If you use a custom HS256 signing key in Clerk, set Supabase’s JWT secret to that same value (see above).  
  Supabase will verify the JWT signature with that secret.

## 4. How the app uses the JWT

- **`createClerkSupabaseClient()`** (in `src/lib/supabase.ts`) gets a token via `getToken({ template: 'supabase' })` when `CLERK_JWT_TEMPLATE_SUPABASE` is set, and sends it as `Authorization: Bearer <token>` to Supabase.
- RLS policies on `leads` and `users` use `auth.jwt()->>'sub'` to compare with `clerk_id`, `assigned_broker_id`, and `assigned_lender_id`. So `sub` must be the Clerk user ID.

## 5. Checklist

- [ ] Clerk template named **supabase** (or name matching `CLERK_JWT_TEMPLATE_SUPABASE`).
- [ ] Claims include **`sub`** = `{{user.id}}`, **`aud`** = `authenticated`, **`role`** = `authenticated`.
- [ ] `CLERK_JWT_TEMPLATE_SUPABASE=supabase` in env.
- [ ] Supabase verifies the JWT (Third-Party Auth with Clerk JWKS, or same JWT secret if using custom HS256).

References: [Supabase – Clerk](https://supabase.com/docs/guides/auth/third-party/clerk), [Clerk – JWT templates](https://clerk.com/docs/backend-requests/jwt-templates), [Clerk – Supabase integration](https://clerk.com/docs/guides/development/integrations/databases/supabase).
