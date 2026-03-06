# Clerk OAuth (e.g. Google) configuration

Use this when configuring the **bcre** OAuth application in Clerk (Configure tab) and Google Cloud Console.

## 1. Redirect URIs in Clerk

Your Clerk OAuth application must list the redirect URI that the identity provider (e.g. Google) will use. **Right now the list is empty—add one.**

- In the Clerk Dashboard, open **User & Authentication → SSO connections** and select **Google** (or the provider this “bcre” app is for).
- On that connection’s page, Clerk shows an **“Authorized redirect URI”** (or “Redirect URI”). Copy it exactly.
- Back on the **Configure** tab of your OAuth application (**bcre**):
  - Under **Redirect URIs**, paste that URI into “Enter URI” and click **Add URI**.
  - Use the **exact** value (e.g. `https://sleepy-prawn-23.clerk.accounts.dev/...`). No trailing slash unless Clerk shows one.

If you don’t see a redirect URI on the SSO connection page, use your Clerk frontend API base as a reference. Your Discovery URL is:

`https://sleepy-prawn-23.clerk.accounts.dev/.well-known/openid-configuration`

So the OAuth callback is often:

`https://sleepy-prawn-23.clerk.accounts.dev/oauth_callback`

Add that in **Redirect URIs**; if Clerk shows a different URI on the Google connection page, use that one instead.

## 2. Google Cloud Console (for Google sign-in)

- In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**, create or open your **OAuth 2.0 Client ID** (Web application).
- In **Authorized redirect URIs**, add the **same** redirect URI you added in Clerk (the one Clerk shows for the Google connection).
- In **Authorized JavaScript origins**, add:
  - Production: `https://brantleychristianson.com` (and `https://www.brantleychristianson.com` if you use www)
  - Local: `http://localhost:3000` (or the port you use for `npm run dev`)

## 3. Clerk Configure tab – summary

| Field | What to do |
|-------|------------|
| **Redirect URIs** | Add the Authorized redirect URI from Clerk’s Google (SSO) connection page (or `https://sleepy-prawn-23.clerk.accounts.dev/oauth_callback` if that’s what Clerk uses). |
| **Client ID** | From Google Cloud Console (OAuth client). You paste it here so Clerk can use your custom Google app. |
| **Client Secret** | From Google Cloud Console (same OAuth client). Regenerate in Google if you need a new one. |
| **Scopes** | Your current set (email, offline_access, profile) is typical for sign-in. |
| **Consent screen** | Leave on so users see the Google permission screen. |

## 4. After changing redirect URIs

- Save in Clerk, then in Google Cloud Console ensure the redirect URI matches exactly.
- Test sign-in at `/sign-in` (or your Clerk Account Portal sign-in URL). If you see “redirect_uri_mismatch”, the URI in Google does not exactly match the one in Clerk.


## 5. Troubleshooting redirect_uri_mismatch

When Google shows **Error 400: redirect_uri_mismatch**, use the URI Google actually received:

1. On the Google error page, click **"Error details"** (or "See error details") if shown.
2. Or look at the browser address bar: the OAuth URL contains `redirect_uri=...`. Copy that value (it's URL-encoded; e.g. `https%3A%2F%2Fsomething.clerk.accounts.dev%2Fv1%2Foauth_callback` decodes to `https://something.clerk.accounts.dev/v1/oauth_callback`).
3. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → your OAuth client → **Authorized redirect URIs**, add that **exact** URI (same path, no trailing slash, `https`).
4. **Path detail:** Clerk often uses `/v1/oauth_callback` (with `v1`). If your doc shows `/oauth_callback` without `v1`, try adding both in Google, or use the one from the error.

**Local vs production:** With **development** Clerk keys (`pk_test_...`) on localhost, the redirect URI is your Clerk **development** host (e.g. `https://<instance>.clerk.accounts.dev/v1/oauth_callback`). With **production** keys (`pk_live_...`), it's your custom domain (e.g. `https://clerk.brantleychristianson.com/v1/oauth_callback`). Ensure the URI in Google matches the keys you use in `.env.local`.

## Reference

- [Clerk: Add Google as a social connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [Clerk: Customize redirect URLs](https://clerk.com/docs/guides/custom-redirects)
