# Full Website Audit — Brantley Christianson Real Estate

**Date:** March 2025 (updated March 2026)  
**Scope:** Structure, routes, components, data, styles, SEO, accessibility, and issues.

---

## 1. App structure & routes

### Directories (`src/app`)

| Path | Purpose |
|------|--------|
| `/` | Root layout, home, error, not-found |
| `about` | About the brokerage |
| `api` | API routes (consultation) |
| `brokers` | Brokers index + `[slug]` profile |
| `contact` | Contact / consultation |
| `markets` | Markets index; Oregon / Washington; `[state]/[county]/[city]`; Oregon PDX condos |
| `privacy` | Privacy policy |
| `resources` | Resources index + portland-condo-guide |
| `social` | Social / video page |
| `terms` | Terms of use |

### All page routes

| URL pattern | File | Notes |
|-------------|------|--------|
| `/` | `app/page.tsx` | Home |
| `/about` | `app/about/page.tsx` | |
| `/contact` | `app/contact/page.tsx` | |
| `/brokers` | `app/brokers/page.tsx` | |
| `/brokers/[slug]` | `app/brokers/[slug]/page.tsx` | Dynamic: agent slug from `agents.json` |
| `/markets` | `app/markets/page.tsx` | |
| `/markets/oregon` | `app/markets/oregon/page.tsx` | Oregon state; county stack A–Z |
| `/markets/washington` | `app/markets/washington/page.tsx` | Washington state; uses `MarketStack` |
| `/markets/[state]/[county]` | `app/markets/[state]/[county]/page.tsx` | County page; city stack A–Z |
| `/markets/[state]/[county]/[city]` | `app/markets/[state]/[county]/[city]/page.tsx` | City page; Portland gets extra sections |
| `/markets/oregon/pdx/condos/[slug]` | `app/markets/oregon/pdx/condos/[slug]/page.tsx` | Portland condo building detail |
| `/resources` | `app/resources/page.tsx` | |
| `/resources/portland-condo-guide` | `app/resources/portland-condo-guide/page.tsx` | |
| `/social` | `app/social/page.tsx` | |
| `/privacy` | `app/privacy/page.tsx` | |
| `/terms` | `app/terms/page.tsx` | |

**API:** `POST /api/consultation` (MailerLite + rate limit), `GET /api/listings` (public IDX listings), `GET /api/cron/sync-mls` (Vercel Cron, Bearer CRON_SECRET).  
**Webhooks:** `POST /api/webhooks/clerk` (Clerk → Supabase users + optional MailerLite), `POST /api/webhooks/mailerlite` (unsubscribe/bounce → users.marketing_opt_in).  
**Auth:** `/dashboard` (role-based redirect), `/agents`, `/agents/dashboard`, `/clients`, `/clients/dashboard`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` (Clerk; sign-up has VOW disclosure).

**Special:** `error.tsx` (error boundary), `not-found.tsx` (404). Proxy at `src/proxy.ts` (Clerk when keys set).

---

## 2. Layout & global UI

- **Single root layout** (`app/layout.tsx`):
  - `metadataBase`, default metadata, viewport, theme-color.
  - Optional GA4 when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.
  - Skip link (`#main-content`), `SiteHeader`, `#main-content` (tabIndex -1), `SiteFooter`.
  - Imports `@/styles/globals.css` only (no per-page CSS).

---

## 3. Components

### Shared (multi-page)

| Component | Purpose | Used on |
|-----------|---------|--------|
| `Button` | CTA (primary/white/outline/text) | Most pages |
| `Hero` | Page hero (short/condo/etc.) | Most pages |
| `RevealSection` | Scroll-reveal wrapper | Home, about, markets, resources, condo guide |
| `ConsultationForm` | Contact/consultation form | Contact, condo detail |
| `IntelligenceHubs` | Hub cards (e.g. Oregon / Washington) | Home, markets index |
| `LazyYouTube` | Lazy YouTube embed | Home |
| `BrokersList` | Brokers list + filters | Brokers index only |
| `MarketStack` | Stack of market links with images | **Washington state page only** |
| `PortlandCondoGuideList` | Condo guide list | Portland condo guide page only |
| `CondoMapSection` | Map links + embed | Condo detail only |
| `WalkScoreSection` | Walk Score link | Condo detail only |
| `CondoImageWithFallback` | Condo image + fallback | Condo detail only |
| `portland/PortlandMarketHighlights` | Portland stat cards | Portland city page only |
| `portland/PortlandFinancingBreakdown` | Financing breakdown | Portland city page only |
| `portland/PortlandNeighborhoodSpotlight` | Neighborhood spotlight | Portland city page only |

### RMLS / IDX components (`src/components/rmls/`)

| Component | Purpose |
|-----------|---------|
| `RMLSDisclaimer` | Required disclaimer + RMLS logo/fallback; used on condo detail and in PropertyDetails |
| `ListingAttribution` | Displays `listing_firm_name` (and optional agent) adjacent to property details |
| `PropertyCard` | IDX listing card with attribution; for future listing grids |
| `PropertyDetails` | Wrapper: attribution + content + disclaimer; for future listing detail pages |

### Unused / reserved components

| Component | Status |
|-----------|--------|
| `BrokerGrid.tsx` | Not imported (brokers section removed from home) |
| `FeaturedListingCard.tsx` | Not imported |
| (Legacy `PropertyCard`) | AUDIT previously noted removal; IDX grids use `rmls/PropertyCard.tsx` |

---

## 4. Data & config

### Data (`src/data`)

| File | Exports / role |
|------|----------------|
| `markets.ts` | Oregon/Washington markets, counties, cities; helpers for `generateStaticParams` |
| `agents.ts` + `agents.json` | Agent list, `getAgentBySlug`, filters (license, city, language) |
| `site.ts` | Email, social links (Instagram, Facebook, LinkedIn, YouTube) |
| `portland-condo-guide.ts` + `.json` | Portland condo guide entries; slugs; neighborhood helpers |
| `portland-condo-guide-types.ts` | Types and condition color legend |
| `portland-market.ts` | Portland stats, financing, neighborhoods (March 2026) |
| `condos.ts` | Legacy condo list (Eliot Tower, etc.); PDX condos use portland-condo-guide |
| `types.ts` | `Agent` interface |

### Config (`src/config`)

| File | Exports |
|------|--------|
| `site.ts` | `SITE_URL`, `SITE_NAME`, `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE` |
| `theme.ts` | `theme`, `assetPaths`, `CONDO_FALLBACK_IMAGE`, `stackGapMap` |

**Note:** `config/site.ts` = SEO/defaults; `data/site.ts` = contact/social links.

---

## 5. Styles

- **Entry:** Only `globals.css` is imported (in root layout).
- **Design tokens:** `variables.css` (colors, spacing, fonts, shadows, radius, theme surfaces).
- **Imported by globals (order):** variables → header → footer → hero → cards → buttons → hubs → forms → broker-grid → contact → brokers-page → condo-guide → condo-detail → featured-listing → markets → portland-market.

All pages rely on the same design system; no page-specific CSS imports.

---

## 6. SEO & metadata

- **Root layout:** `metadataBase`, title template `%s | Brantley Christianson Real Estate`, default description, OG/Twitter, robots index/follow.
- **Static metadata:** Home, about, contact, brokers index, markets index, Oregon, Washington, resources, portland-condo-guide, social, privacy, terms.
- **Dynamic metadata:** County page, city page, broker `[slug]`, condo `[slug]` (each uses `generateMetadata` with params).
- **Structured data:** Home (RealEstateAgent JSON-LD); county/city/condo pages (BreadcrumbList; condo also has Residence/Condominium).

**Canonical / OG URLs:** Used on county, city, and condo detail pages; domain from `config/site.ts` (`SITE_URL`).

---

## 7. Accessibility

- **Skip link:** Present; targets `#main-content`.
- **Landmark / headings:** Main content in `<main>`; sections use `aria-labelledby` / `aria-label` where appropriate.
- **Focus:** Buttons/links and `.reveal-item` use visible focus styles (e.g. `:focus-visible`).
- **Images:** Hero uses `imageAlt` (default `''` in Hero). **Issue:** Several pages pass **empty `imageAlt=""`** for Hero or hub images:
  - `app/markets/page.tsx` (Hero)
  - `app/brokers/page.tsx` (Hero)
  - `app/resources/page.tsx` (Hero)
  - `app/resources/portland-condo-guide/page.tsx` (imageAlt)
- **Error page:** `Hero` used without `imageSrc`/`imageAlt`; Hero supports no image (no runtime error), but alt remains empty when image is present elsewhere.
- **Lists:** `role="list"` used where needed (e.g. city stack, not-found links).

**Recommendation:** Replace every `imageAlt=""` with a short, accurate description (e.g. “Oregon and Washington markets”, “Brokers team”, “Portland condo guide”).

---

## 8. External URLs & assets

- **Domain:** `https://brantleychristianson.com` in `config/site.ts` and in metadata/canonical/JSON-LD and contact copy.
- **Third-party:** GA4, Repliers API, MailerLite (consultation), Google Maps/OSM (CondoMapSection), Walk Score, YouTube (LazyYouTube, social), social links from `data/site.ts`.
- **Assets:** All under `public/media/`; paths via `config/theme.ts` (`assetPaths`: brokers, listings, hubs, markets, stock, condos, logos). Condo fallback: `stock/living.jpeg`.

**Internal links:** Key nav (Markets, Contact, Brokers, Resources, etc.) and in-content links (e.g. `/brokers/ashley`) are consistent; broker slug `ashley` exists in `agents.json`.

---

## 9. Consistency & potential issues

### Oregon vs Washington state page

- **Oregon:** County list uses same “city-stack” pattern as county pages (expanded cards, vertical, A–Z), with breadcrumb.
- **Washington:** Still uses `MarketStack` and a different card layout (`.market-stack`).
- **Recommendation:** Align Washington state page with Oregon (breadcrumb + county stack A–Z using `.city-stack`) for consistency.

### Duplicate path representations

- Some paths appear with both `/` and `\` in grep (e.g. `src\app\...` vs `src/app/...`). This is filesystem/editor display; no duplicate route files found.

### Portland condo guide vs condo detail route

- List: `/resources/portland-condo-guide`
- Building detail: `/markets/oregon/pdx/condos/[slug]`
- Breadcrumb on detail includes Markets → Oregon → Portland → Condo Guide → Building. Logic is consistent.

### Rate limiting & API

- Consultation API uses `@/lib/rateLimit` and returns 429 with a clear message; fallback email (info@…) is documented in the API response.

---

## 10. Build & env

- **Stack:** Next 16, React 18.
- **Scripts:** `dev`, `build`, `start`, `lint`.
- **Env:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `MAILERLITE_*`, and any Repliers/API keys (see `api/consultation/route.ts` and `lib/`).

---

## 11. Audit update — March 2026

### Checks performed

- **Build:** `npm run build` — ✅ Success (Next.js 16.1.6, 362 static pages).
- **Dependencies:** `npm audit` — ✅ 0 vulnerabilities.
- **Lint:** `next lint` may report "Invalid project directory provided" when run via `npm run lint` on some environments (Next CLI interprets the script name as a directory). TypeScript and build validate the codebase; run `npm run build` for a full check.
- **Assets:** `public/media/img/` contains `markets/`, `stock/`, `condos/`. Folders `brokers/` and `logos/` are referenced in code but image files are not in the repo (add headshots and `BCRE-White-Trans.png` per READMEs in those folders, or deploy from CDN).

### Fixes applied (March 2026)

1. **Orphan file removed:** Root `css/main.css` (unused duplicate of design tokens) deleted; app uses `src/styles/globals.css` and `variables.css` only.
2. **Asset structure documented:** Added `public/media/img/brokers/README.md` and `public/media/img/logos/README.md` so the expected paths and filenames are clear for deploy or future assets.

### Current status

| Area | Status |
|------|--------|
| Routes & structure | ✅ |
| Layout & global UI | ✅ |
| Components | ✅ |
| Data & config | ✅ |
| Styles | ✅ (single entry; orphan `css/main.css` removed) |
| SEO & metadata | ✅ |
| Accessibility | ✅ (meaningful `imageAlt` in use) |
| Security headers | ✅ (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) |
| Static assets | ⚠️ Brokers and logos dirs present with READMEs; add images per README or deploy elsewhere. |

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| Routes & structure | ✅ | Clear app-router layout; static + dynamic routes and one API route. |
| Layout & global UI | ✅ | Single layout, skip link, header/footer. |
| Components | ✅ | Unused components removed (BrokerGrid, FeaturedListingCard, PropertyCard, MarketStack). |
| Data & config | ✅ | Centralized markets, agents, site, theme; static generation used correctly. |
| Styles | ✅ | Single entry, design tokens; dead broker-grid.css removed; root css/main.css removed (Mar 2026). |
| SEO & metadata | ✅ | Layout + per-page/dynamic metadata; JSON-LD where needed. |
| Accessibility | ✅ | Meaningful `imageAlt` added on markets, brokers, resources, portland-condo-guide, error. |
| State page consistency | ✅ | Washington state page rebuilt to match Oregon (breadcrumb + county stack, A–Z). |

**Fixes applied (post-audit):**  
1. Added meaningful `imageAlt` on markets, brokers, resources, portland-condo-guide; error page given image + alt.  
2. Removed unused components and MarketStack; removed broker-grid.css.  
3. Washington state page rebuilt with breadcrumb + city-stack (alphabetical counties).  
4. Error page Hero given `imageSrc` and `imageAlt`.  
5. TypeScript: optional `highlight`/`sub` in Portland components guarded with `'highlight' in item` / `'sub' in card`.  
6. **March 2026:** Removed orphan `css/main.css`; added brokers/logos READMEs for asset expectations.

---

## 12. Audit — Post-push (March 2026)

**Scope:** Full site after commits through `1f3d450` (client dashboard optimization, webhook hardening, Turbopack parse fix, VERCEL redirect_uri_mismatch docs).

### Build & tooling

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Success (Next.js 16.1.6 Turbopack, 369 static pages) |
| `npm audit` | ✅ 0 vulnerabilities |
| `next lint` | ⚠️ Fails with "Invalid project directory provided" when run as `npm run lint` (Next CLI treats "lint" as path). Run `npx next lint` from project root for ESLint. |

### Routes & auth (current)

| URL | Purpose |
|-----|---------|
| `/` | Home |
| `/dashboard` | Role-based redirect → `/agents` or `/clients` |
| `/agents`, `/agents/dashboard` | Agent dashboard (broker role only) |
| `/clients`, `/clients/dashboard` | Client dashboard (non-broker) |
| `/sign-in/[[...sign-in]]` | Clerk sign-in |
| `/api/consultation` | MailerLite consultation form; rate-limited |
| `/api/webhooks/clerk` | Clerk user sync → Supabase (+ optional MailerLite); Svix-verified; MailerLite best-effort; lead bridge try/catch |
| `/api/webhooks/mailerlite` | Unsubscribe/bounce → `users.marketing_opt_in`; signature-verified |
| `GET /api/listings` | Public IDX listings (Active/Pending only; no seller_contact/showing_instructions) |
| `GET /api/cron/sync-mls` | Vercel Cron every 12h; CRON_SECRET; expiration + Repliers IDX sync when configured |

### Security

| Area | Status |
|------|--------|
| Env / secrets | ✅ `.env`, `.env*.local` in `.gitignore`; no secrets in repo; server-only keys (CLERK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, webhook secrets) not exposed to client |
| Headers | ✅ `next.config.js`: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy |
| Auth | ✅ Clerk; proxy (`src/proxy.ts`) only when CLERK_SECRET_KEY set; dashboard pages use `auth()` + role check and redirect |
| Webhooks | ✅ Clerk: Svix verification, 400 on invalid/missing headers. MailerLite: HMAC SHA-256 timing-safe verify |
| Consultation API | ✅ Rate limit (per IP), body size cap, email validation; no raw secrets in responses |

### Documentation fixes applied

- **docs/VERCEL.md:** "Middleware" → "Proxy"; clarified that Next.js 16 uses `src/proxy.ts` (not `middleware.ts`).
- **AUDIT.md:** Routes section updated with webhooks and auth routes; proxy reference corrected.

### Known minor issues (non-blocking)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Lint script | `package.json` `"lint": "next lint"` | Run `npx next lint` from project root; in some environments the script may report "Invalid project directory" (Next CLI quirk). |

### Client dashboard (post-optimization)

- Supabase: `select('first_name, last_name, email, role')` (no `select('*')`).
- Welcome block: `displayName` helper; quick actions (Explore markets, Request consultation) in header.
- Getting started: two cards in `dashboard-card-grid` (responsive).
- Ternary for `displayName` written with explicit `: null` to satisfy Turbopack parser.

---

## RMLS & IDX / VOW compliance audit

**Scope:** Listing attribution, disclaimers, VOW terms, 12-hour sync, restricted data.  
**Reference:** `docs/RMLS-COMPLIANCE.md`.

### 1. UI: listing attribution & disclaimers

| Check | Status | Notes |
|-------|--------|--------|
| Listing firm name adjacent to details | ✅ | `ListingAttribution` shows `listing_firm_name`; used in `PropertyCard` and `PropertyDetails` |
| RMLS disclaimer (exact text + brokerage name) | ✅ | `RMLSDisclaimer` in `src/components/rmls/RMLSDisclaimer.tsx`; brokerage configurable |
| Disclaimer on property/listings content | ✅ | Rendered at bottom of condo detail (`/markets/oregon/pdx/condos/[slug]`); `PropertyDetails` includes it for future listing pages |
| RMLS logo | ⚠️ | Expects `public/media/img/logos/rmls-logo.png`; fallback text "RMLS" if missing |

### 2. VOW terms (Clerk sign-up)

| Check | Status | Notes |
|-------|--------|--------|
| Required disclosure on registration | ✅ | `/sign-up` shows exact VOW text and required checkbox before Clerk form |
| Terms of Use include MLS/VOW language | ✅ | `/terms` has "MLS data (VOW)" paragraph |
| Checkbox blocks form until agreed | ✅ | Sign-up form only shown when `agreed === true` |

### 3. Data freshness (12-hour sync)

| Check | Status | Notes |
|-------|--------|--------|
| Cron schedule | ✅ | `vercel.json`: `0 */12 * * *` → `/api/cron/sync-mls` |
| Cron auth | ✅ | `CRON_SECRET` Bearer token; 401 if missing/wrong |
| Expiration cleanup | ✅ | Listings with `expiration_date` &lt; today set to Expired |
| IDX feed source | ✅ | Repliers.io via `syncRepliersListingsToSupabase` when `REPLIERS_API_KEY` + `REPLIERS_DEFAULT_AGENT_ID` set |
| Off-market handling | ✅ | Active/Pending listings not in current Repliers response marked Expired |

### 4. Restricted data (no seller info to public)

| Check | Status | Notes |
|-------|--------|--------|
| Public API omits seller_contact, showing_instructions | ✅ | `GET /api/listings` selects explicit columns; neither included |
| listings-rmls helpers | ✅ | `toPublicListing` strips restricted fields; `filterPublicListings` enforces Active/Pending |
| DB schema | ✅ | `listings` has seller_contact, showing_instructions with comments; sync sets them null, never from Repliers to public |
| No other listing endpoints expose restricted | ✅ | Only `api/listings` and cron/sync touch listings; cron uses admin, not public |

### 5. Gaps / recommendations

| Item | Priority | Action |
|------|----------|--------|
| RMLS logo asset | Medium | Add `public/media/img/logos/rmls-logo.png` or keep text fallback |
| Sign-up entry point | Low | Ensure nav/CTAs link to `/sign-up` for new VOW users |
| Listings table + RLS | Low | Migration creates `listings`; RLS not enabled. If enabling RLS later, add policy for anon SELECT on non-restricted columns only |
| Repliers POST /listings | Low | Uses query params (status=A, pageNum, resultsPerPage); if Repliers expects body params, adjust `fetchRepliersListingsPage` |
| Rate limit on GET /api/listings | Low | Consider rate limit if listing API is hit by anonymous traffic |

---

### Summary

| Area | Status |
|------|--------|
| Build & deploy | ✅ |
| Dependencies | ✅ No vulnerabilities |
| Routes & auth | ✅ Dashboards, webhooks, sign-up, cron documented |
| Security (headers, env, webhooks) | ✅ |
| RMLS / IDX / VOW | ✅ Attribution, disclaimer, VOW terms, 12h sync, restricted data enforced |
| Docs | ✅ VERCEL + AUDIT + RMLS-COMPLIANCE |
| Accessibility | ✅ Empty alt texts fixed (logo, broker/lender/condo images) |
| Lint | ⚠️ Use `npx next lint` from project root |
