# Repliers.io Implementation Plan

**Purpose:** Improve and extend our Repliers integration once the data feed is approved, using official Repliers Help Center guidance.

**References (Repliers Help Center):**

- [Repliers API Authentication Guide](https://help.repliers.com/en/article/repliers-api-authentication-guide-1pmm1p2/)
- [API Usage Limits and Overages](https://help.repliers.com/en/article/api-usage-limits-and-overages-1uxlz21/)
- [Utilizing AI-Powered NLP for Real Estate Listing Searches](https://help.repliers.com/en/article/utilizing-ai-powered-nlp-for-real-estate-listing-searches-1fvddra/)
- [AI Image Search Implementation Guide](https://help.repliers.com/en/article/ai-image-search-implementation-guide-mx30ji/)
- [Webhooks Implementation Guide](https://help.repliers.com/en/article/webhooks-implementation-guide-oimchm/)
- [Favorite Listings Implementation Guide](https://help.repliers.com/en/article/favorite-listings-implementation-guide-u9g9u/)
- [Optimizing API Requests with the "fields" Parameter](https://help.repliers.com/en/article/optimizing-api-requests-with-the-fields-parameter-lq416x/)

---

## 1. Current Implementation Summary

| Area | Status | Notes |
|------|--------|------|
| **Auth** | ✅ | `REPLIERS-API-KEY` header used in `repliers.ts`, `repliers-client.ts`, `/api/nlp`; key from env, never client-exposed. |
| **Search** | ✅ | GET `/api/search` → Repliers listings with validation, Supabase fallback, RMLS status stripping. |
| **NLP** | ✅ | POST `/api/nlp` proxies to Repliers `/nlp` with `prompt` + optional `nlpId`; rate limit; 500/429 handled; **406 not yet surfaced**. |
| **AI image search** | ✅ | POST `/api/search/image` with `imageSearchItems`; POST to Repliers `/listings` with body; rate limit; Supabase fallback. Repliers returns `score` per listing—we could expose it in the response. |
| **Listings webhook** | ✅ | POST `/api/webhooks/repliers`; auth via `x-repliers-signature` / `x-hook-secret` / `Authorization`; idempotency via `webhook_events`; upsert `listings` by `mls_listing_id`. |
| **Cron sync** | ✅ | 12h cron marks expired listings, optional Repliers IDX sync. |
| **Client creation** | ✅ | Clerk webhook creates Repliers client on sign-up when `REPLIERS_API_KEY` + `REPLIERS_DEFAULT_AGENT_ID` set; sets `users.repliers_client_id`. |
| **Favorites** | ✅ Supabase only | GET/POST/DELETE `/api/favorites` use Supabase `favorites` table (RLS by `clerk_id`). **No sync to Repliers Favorites API yet.** |
| **Webhook verification** | ⚠️ | We verify incoming requests with a shared secret. Repliers subscription flow sends `X-Hook-Secret` on **first** POST—we do not yet implement the echo-back step for **new** subscription verification (only for ongoing delivery). |

---

## 2. Authentication & Security (Already Aligned)

- **Header auth:** We use `REPLIERS-API-KEY` everywhere; no query-param auth. ([Auth guide](https://help.repliers.com/en/article/repliers-api-authentication-guide-1pmm1p2/))
- **Key storage:** Server-side env only; never in client code.
- **HTTPS:** All Repliers calls to `https://api.repliers.io`.

**Post approval:** Keep key in env; consider separate keys for staging/production if we add a staging Repliers account.

---

## 3. Optimizing Requests with `fields` ([Fields parameter guide](https://help.repliers.com/en/article/optimizing-api-requests-with-the-fields-parameter-lq416x/))

Repliers’ **GET /listings** endpoint supports a **`fields`** query parameter: comma-separated field names so the response only includes what you need.

**Benefits:**

- **Faster responses** – Smaller payloads.
- **Less bandwidth** – Especially useful on mobile or slow connections.
- **Less processing** – Fewer fields to parse and transform.

**Example:** `GET /listings?fields=mlsNumber,listPrice` returns only those two fields per listing.

**Post approval:**

1. **Single-listing fetch:** We use GET `/listings?mlsNumber=...` in `repliers-client.ts` for detail pages. Add a `fields` param with the exact set we use (e.g. mlsNumber, listPrice, address, details, images, status, agents, office, timestamps—no seller_contact, showing_instructions). That keeps payloads small and responses fast.
2. **Search (POST /listings):** The guide documents GET. If Repliers supports a similar restriction for **POST /listings** (search or image search), add it so list views only receive fields needed for cards (e.g. mlsNumber, listPrice, address, images, status). Check Repliers API docs or support for POST + fields.
3. **Define field sets:** Document two sets: (a) **list view** – fields for search results/cards; (b) **detail view** – fields for single listing page. Use the same sets everywhere for consistency and easier tuning.

---

## 4. Rate Limits & Usage

- **Repliers:** 5 req/sec default; 1M requests/month per MLS board; overages billed linearly. User-specific rate limiting when their firewall is implemented. ([Usage limits](https://help.repliers.com/en/article/api-usage-limits-and-overages-1uxlz21/))
- **Our app:** We rate-limit by IP on `/api/nlp`, `/api/search`, `/api/search/image`, and consultation. No per-user Repliers throttling yet.

**Post approval:**

- Monitor usage in [Repliers Developer Portal → Usage](https://login.repliers.com) and Live Tail.
- If we add NLP/image search heavily, consider per-user or per-session limits to stay under 5 req/sec and control monthly usage.
- Document in runbook: overage formula (e.g. 1000 extra requests ≈ $0.20 per $199 plan).

---

## 5. NLP Search ([NLP guide](https://help.repliers.com/en/article/utilizing-ai-powered-nlp-for-real-estate-listing-searches-1fvddra/))

**Current:** POST `/api/nlp` with `{ prompt, nlpId? }` → proxy to Repliers, return `{ request, nlpId }`. We do not handle 406.

**Post approval:**

1. **406 handling:** Repliers returns 406 when the prompt is not listing-search related. Return a clear client message (e.g. “Try a search like ‘3 bed condo in Portland’”) and optional `code: 'NLP_NOT_SEARCH'`.
2. **Use NLP response in UI:** After NLP returns `request.url` (and optional `request.body`), the client can call GET `/api/search` with the parsed query params, or POST `/api/search/image` when `request.body` contains `imageSearchItems`. Document that the NLP response is intended to drive those endpoints.
3. **Conversational search:** We already accept `nlpId`; ensure the UI can store and send `nlpId` for follow-up prompts so Repliers keeps context.
4. **Repliers portal:** Enable NLP for the API key and add OpenAI API key in the Repliers developer portal (NLP incurs OpenAI costs).

---

## 6. AI Image Search ([Image search guide](https://help.repliers.com/en/article/ai-image-search-implementation-guide-mx30ji/))

**Current:** POST `/api/search/image` with `imageSearchItems` (text and/or image URL, boost); we POST to Repliers and return listings. We strip restricted fields and apply RMLS rules.

**Post approval:**

1. **Expose relevance score:** Repliers returns a `score` per listing. Include it in our response (e.g. `listing.score`) so the UI can sort or show “match strength.”
2. **Combine with NLP:** When NLP returns `request.body.imageSearchItems`, the client can send that body to `/api/search/image` (and optionally merge with location/criteria from `request.url`). Document this flow.
3. **Image reordering:** Repliers may reorder listing images by relevance; we can pass through the `images` array as-is so the client shows the first image as the “best match” thumbnail.

---

## 7. Webhooks ([Webhooks guide](https://help.repliers.com/en/article/webhooks-implementation-guide-oimchm/))

**Current:** We accept listing events; verify with `REPLIERS_WEBHOOK_SECRET` (x-repliers-signature / x-hook-secret / Authorization); idempotency via `webhook_events`; support `listing.created`, `listing.updated`, `listing.deleted` (we map payload to our `listings` row).

**Post approval:**

1. **Subscription verification:** When creating a new webhook in Repliers, they send an initial POST with `X-Hook-Secret`. Our endpoint must respond **200** and echo the same `X-Hook-Secret` header to complete subscription. Add a short path: if the request has `X-Hook-Secret` and no body (or minimal), return 200 with that header echoed; otherwise run normal event handling.
2. **Optional filters:** When subscribing via Repliers API, we can send `configuration.filters` (e.g. by `office.brokerageName`) to reduce noise. Document in runbook how we subscribe (curl or portal) and whether we use filters.
3. **listing.updated + previous:** We could use the `previous` object in the payload to log or react to specific field changes (e.g. status A→U). Optional enhancement.
4. **Favorite webhooks (optional):** If we sync favorites to Repliers, we could subscribe to `favorite.created` and `favorite.deleted` to keep our Supabase `favorites` in sync with Repliers, or to notify agents. ([Favorites guide](https://help.repliers.com/en/article/favorite-listings-implementation-guide-u9g9u/)).

---

## 8. Repliers Favorites API ([Favorites guide](https://help.repliers.com/en/article/favorite-listings-implementation-guide-u9g9u/))

**Current:** Favorites live only in Supabase (`favorites` table by `clerk_id` + `mls_listing_id`). We have `users.repliers_client_id` set when the Clerk webhook creates a Repliers client.

**Post approval (optional):**

1. **Sync to Repliers on add:** When a user adds a favorite (POST `/api/favorites`) and `users.repliers_client_id` is set, call Repliers Favorites API to create the favorite (mlsNumber, clientId, boardId if multi-board). Do not block the Supabase write on Repliers success; fire-and-forget or queue.
2. **Sync to Repliers on remove:** When a user removes a favorite (DELETE `/api/favorites`), if we previously synced to Repliers, call Repliers to delete the favorite (by favorite id—we’d need to store Repliers favorite id in our DB or look it up by clientId + mlsNumber). Alternatively, keep favorites only in Supabase and skip Repliers for simplicity.
3. **boardId:** For multi-MLS accounts, Repliers requires `boardId` when creating a favorite; we’d need to derive or configure it per listing/market.
4. **Webhooks:** If we sync both ways, subscribe to `favorite.created` / `favorite.deleted` and update Supabase when Repliers is the source of truth for an agent/CRM action.

---

## 9. Checklist After Data Feed Approval

| Priority | Task | Reference |
|----------|------|-----------|
| High | Add `fields` param to GET /listings (single-listing fetch) with only needed fields | [Fields parameter](https://help.repliers.com/en/article/optimizing-api-requests-with-the-fields-parameter-lq416x/) |
| High | Handle 406 from NLP and return a clear message/code | [NLP guide](https://help.repliers.com/en/article/utilizing-ai-powered-nlp-for-real-estate-listing-searches-1fvddra/) |
| High | Implement X-Hook-Secret echo for new webhook subscription verification | [Webhooks guide](https://help.repliers.com/en/article/webhooks-implementation-guide-oimchm/) |
| Medium | Expose Repliers `score` in `/api/search/image` response | [Image search guide](https://help.repliers.com/en/article/ai-image-search-implementation-guide-mx30ji/) |
| Medium | Enable NLP in Repliers portal and add OpenAI key; document cost impact | [NLP guide](https://help.repliers.com/en/article/utilizing-ai-powered-nlp-for-real-estate-listing-searches-1fvddra/) |
| Medium | Document “NLP → search/image” flow for frontend (use request.url + request.body) | NLP + Image search guides |
| Low | Optional: Sync favorites to Repliers when repliers_client_id present (create/delete) | [Favorites guide](https://help.repliers.com/en/article/favorite-listings-implementation-guide-u9g9u/) |
| Low | Optional: Subscribe to favorite.created / favorite.deleted if we sync favorites | [Favorites guide](https://help.repliers.com/en/article/favorite-listings-implementation-guide-u9g9u/) |
| Low | If POST /listings supports `fields` or similar, restrict search/image-search response fields | [Fields parameter](https://help.repliers.com/en/article/optimizing-api-requests-with-the-fields-parameter-lq416x/) |
| Ongoing | Monitor usage and rate limits in Repliers portal | [Usage limits](https://help.repliers.com/en/article/api-usage-limits-and-overages-1uxlz21/) |

---

## 10. Env & Configuration Summary

| Variable | Purpose |
|----------|---------|
| `REPLIERS_API_KEY` | All Repliers API calls; header `REPLIERS-API-KEY`. |
| `REPLIERS_DEFAULT_AGENT_ID` | Clerk webhook + client creation. |
| `REPLIERS_WEBHOOK_SECRET` | Verify incoming webhook requests. |
| `REPLIERS_TIMEOUT_MS` | Optional; default 18000. |

Optional for future: Repliers Favorites sync, boardId for multi-MLS, separate key for staging.
