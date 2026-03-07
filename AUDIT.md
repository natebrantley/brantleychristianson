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

---

## 13. Comprehensive audit — March 7, 2026

**Scope:** Full codebase check: build, typecheck, dependencies, routes, security, accessibility, and tooling.

### Tooling results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass (Next.js 16.1.6 Turbopack, 375 static pages) |
| `npm audit` | ✅ 0 vulnerabilities |
| `npm run lint` / `npx next lint` | ⚠️ On Windows, `npm run lint` can fail with "Invalid project directory provided" (Next CLI treats `lint` as path). CI runs `npm run lint` on Linux; if CI passes, treat as environment quirk. |
| E2E | `e2e/smoke.spec.ts`: homepage 200, title, main content; run with `npm run test:e2e` after `npx playwright install` |

### Stack & config

- **Node:** `.nvmrc` = 20
- **Next:** 16.1.6 (Turbopack). **React:** 19
- **Env:** `.env.example` documents all vars; `.gitignore` covers `.env`, `.env*.local`. No secrets in repo.
- **Security headers:** `next.config.js` — X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control; HSTS only when `VERCEL === '1'`.

### Routes (current)

**Pages:** `/`, `/about`, `/contact`, `/markets` (index, oregon, washington, [state]/[county], [state]/[county]/[city], oregon/pdx/condos/[slug], oregon/region/[slug]), `/agents`, `/agents/[slug]`, `/agents/dashboard`, `/agents/dashboard/leads`, `/agents/dashboard/leads/[id]`, `/clients`, `/clients/dashboard`, `/lenders`, `/lenders/[slug]`, `/lenders/dashboard`, `/listings`, `/listings/[mlsNumber]`, `/owners/dashboard`, `/owners/dashboard/leads`, `/owners/dashboard/leads/[id]`, `/resources`, `/resources/portland-condo-guide`, `/resources/oregon-coast-guide`, `/resources/market-synthesis-feb2026`, `/sign-in`, `/sign-up`, `/social`, `/privacy`, `/terms`, `/dashboard` (role redirect).

**API:** `POST /api/consultation` (rate-limited, MailerLite); `GET /api/listings`, `GET /api/listings/[mlsNumber]` (public IDX; no seller/showing data); `GET /api/market/stats`, `GET /api/nlp` (Repliers when configured); `GET/POST /api/favorites`, `GET/POST/DELETE /api/saved-searches`; `GET /api/me/agent`, `GET /api/me/lender`; `GET/PATCH /api/leads/[id]`; `GET /api/search`, `GET /api/search/image`; `POST /api/webhooks/clerk` (Svix), `POST /api/webhooks/mailerlite` (HMAC), `POST /api/webhooks/repliers`; `GET /api/cron/sync-mls` (12h), `GET /api/cron/sync-leads-to-mailerlite` (hourly); both cron routes require `CRON_SECRET` Bearer.

### Security snapshot

| Area | Status |
|------|--------|
| Env / secrets | ✅ Server-only keys not exposed; client only sees `NEXT_PUBLIC_*` |
| Webhooks | ✅ Clerk: Svix + rawBody verify; MailerLite: HMAC SHA-256 + rawBody; Repliers: secret check |
| Consultation | ✅ Rate limit, body size cap, email validation, generic error messages |
| Listings API | ✅ Explicit select; no seller_contact/showing_instructions |
| Auth | ✅ Clerk; dashboard routes use `auth()` + role; proxy only when Clerk key set |

### Accessibility

- **Skip link:** `#main-content` in root layout.
- **Hero images:** Component default is `imageAlt = ''`; all page-level `<Hero>` usages pass an explicit `imageAlt` (markets, brokers, resources, dashboards, contact, error, etc.).
- **IntelligenceHubs:** Uses `hub.imageAlt ?? hub.title` for alt.
- **Focus:** Visible focus styles on interactive elements.

### Data / Supabase

- **Count-only queries:** Several dashboard/count endpoints use `.select('*', { count: 'exact', head: true })` — no row data fetched, appropriate for totals.
- **Client dashboard:** Uses limited columns (e.g. `first_name, last_name, email, role`) per prior audit.

### Cron (vercel.json)

- `/api/cron/sync-mls`: `0 */12 * * *` (every 12h)
- `/api/cron/sync-leads-to-mailerlite`: `0 * * * *` (hourly)

### Recommendations

| Priority | Item |
|----------|------|
| Low | Add RMLS logo at `public/media/img/logos/rmls-logo.png` or keep text fallback. |
| Low | Consider rate limit on `GET /api/listings` if exposed to heavy anonymous traffic. |
| Low | If lint fails on Windows, run `npx next lint` from project root or rely on CI. |
| Done | Build, typecheck, audit, security headers, webhook verification, and RMLS/VOW compliance are in good shape. |

---

## 14. Owner CRM audit — pathways, slugs, integrations, wiring (March 7, 2026)

**Scope:** Owner dashboard routes, URL parameters, auth, integrations (Clerk, Supabase, MailerLite), and data flow for the owner CRM.

### 1. Pathways and slugs

| Pathway | File | Purpose |
|---------|------|--------|
| `/dashboard` | `app/dashboard/page.tsx` | Role-based redirect: `owner` → `/owners/dashboard`; broker/agent → `/agents/dashboard`; lender → `/lenders/dashboard`; else → `/clients/dashboard`. Source of role: Supabase (after Clerk sync) then Clerk `public_metadata.role` fallback. |
| `/owners/dashboard` | `app/owners/dashboard/page.tsx` | Owner home: welcome block, CRM quick links (My leads / All leads), resources (Share resources, Browse team). |
| `/owners/dashboard/leads` | `app/owners/dashboard/leads/page.tsx` | Leads list: All leads (default) or My leads when `?scope=mine`. Supports `?page`, `?q`, `?sort`, `?debug=1`. |
| `/owners/dashboard/leads/[id]` | `app/owners/dashboard/leads/[id]/page.tsx` | Lead detail: view/edit contact info; owner-only reassign (Assigned to dropdown). Back link → `/owners/dashboard/leads`. |

**URL parameters (leads list):**

| Param | Values | Default | Notes |
|-------|--------|--------|--------|
| `scope` | `mine` \| `all` | `all` | Invalid values (e.g. `scope=foo`) redirect to canonical URL without `scope` (All leads). |
| `page` | positive int | `1` | Pagination; page size 50. |
| `q` | string (max 100) | `''` | Search: `first_name`, `last_name`, `email_address` ILIKE. |
| `sort` | `first_name-asc` \| `first_name-desc` | `first_name-asc` | Labels: Name A–Z / Name Z–A. |
| `debug` | `1` | — | When `scope=mine` and 0 leads, shows debug panel (broker IDs, DB counts, distinct assigned_broker_id). |

**Canonical URLs:**

- All leads: `/owners/dashboard/leads` (no `scope` or `scope=all`).
- My leads: `/owners/dashboard/leads?scope=mine`.
- Search/sort append to current scope; invalid `scope` redirects to `/owners/dashboard/leads?...` (no invalid `scope` in address bar).

**Navigation (wiring):**

- Header: "Dashboard" → `/dashboard` → redirect to `/owners/dashboard` for owners.
- Owner dashboard: "My leads (N)" → `/owners/dashboard/leads?scope=mine`; "All leads (N)" → `/owners/dashboard/leads`.
- Leads list: "← Back to dashboard" → `/owners/dashboard`; "My leads" / "All leads" quick links preserve `page`, `q`, `sort`; "Back to leads" on detail → `/owners/dashboard/leads`.
- Lead detail: "← Back to leads" → `backHref="/owners/dashboard/leads"`; table "View" → `/owners/dashboard/leads/[id]`.

**Protected routes (proxy):** `src/proxy.ts` includes `/owners/dashboard(.*)` in `isProtectedRoute`; Clerk `auth.protect()` runs when `CLERK_SECRET_KEY` is set.

---

### 2. Auth and role wiring

| Check | Location | Notes |
|-------|----------|--------|
| Owner role | `lib/roles.ts` | `isOwnerRole(role)` true only for `role === 'owner'` (case-insensitive). |
| Page guard | All three owner pages | After `auth()`, redirect to `/sign-in` if no `userId`. Then load user from Supabase by `clerk_id`; resolve role from Supabase then Clerk `public_metadata.role`. If not owner, redirect: broker → `/agents/dashboard`, lender → `/lenders/dashboard`, else → `/clients/dashboard`. |
| Sync before read | All three owner pages | `ensureUserInSupabase(clerkUser)` called so Supabase `users` row exists before querying leads/counts. |
| API PATCH lead | `api/leads/[id]/route.ts` | `isOwnerRole(userRow?.role)` → owners use `supabaseAdmin()` and can PATCH `assigned_broker_id`; revalidatePath for `/owners/dashboard/leads` and `/owners/dashboard/leads/${id}`. |

**"My leads" identity:** `lib/owner-my-leads-ids.ts` — `buildMyLeadsBrokerIds(user, clerkUserId, clerkUser)` returns a list of IDs that mean "this user": Clerk ID, `users.slug`, derived slug from first/last name, agent slug by email (`data/agents`), full name variants, and case variants. Leads with `assigned_broker_id` in that list count as "My leads". Canonical broker identifier in DB is `users.slug` (e.g. `firstname_lastname`); owner detail reassign dropdown uses `users.slug` (or `clerk_id` if no slug).

---

### 3. Integrations

| System | Use in owner CRM | Wiring |
|--------|-------------------|--------|
| **Clerk** | Auth, role in `public_metadata` | Sign-in → `/dashboard` → redirect. Proxy protects `/owners/dashboard(.*)`. All owner pages use `auth()`, `currentUser()`, and optional `ensureUserInSupabase(clerkUser)`. |
| **Supabase** | Users, leads | Owner pages use `supabaseAdmin()` for leads and user lookups. Leads: `LEADS_SELECT` from `lib/leads-fields`. Counts: `count: 'exact', head: true`. Assigned broker names: resolve `assigned_broker_id` via `users` by `clerk_id` and by `slug`. |
| **MailerLite** | Not used on owner UI | Consultation form and cron sync are separate: consultation creates/updates lead in Supabase + MailerLite; cron pushes leads → MailerLite. Owner CRM only reads/writes Supabase leads. |
| **Agents data** | "My leads" and reassign | `getAgentSlugByEmail` (`data/agents`) used in `buildMyLeadsBrokerIds`. Lead detail page loads agents from Supabase `users` with `role in ('broker','agent','owner')` for reassign dropdown. |

**Lead creation (for reference):** Leads are created/updated in `POST /api/consultation` (contact form → MailerLite + Supabase upsert by email). No lead creation from Clerk webhook; `bridge-leads.ts` is a no-op (leads table has no `clerk_id`).

---

### 4. Data flow and wiring summary

| Flow | Steps |
|------|--------|
| Owner opens CRM | Sign in → Nav "Dashboard" → `/dashboard` → redirect `/owners/dashboard` → server: auth, ensureUserInSupabase, Supabase users + lead counts (all, mine via `buildMyLeadsBrokerIds`), role check → render. |
| Owner opens leads list | Link to `/owners/dashboard/leads` or `?scope=mine` → server: auth, sync, user row, build query (scope=mine ⇒ filter by `assigned_broker_id` in broker IDs else all), search/sort/range, resolve broker names for table → render. |
| Owner opens lead detail | Link to `/owners/dashboard/leads/[id]` → server: auth, sync, user + lead by id, role check, load agents list for reassign → render `LeadContactForm` with `showReassign agents={agents}`. |
| Owner reassigns lead | Client: PATCH `/api/leads/[id]` with `{ assigned_broker_id }` → API: auth, owner check, sanitize, admin update lead, revalidate owner paths → client shows success. |
| Owner edits contact | Client: PATCH `/api/leads/[id]` with contact fields → same API; owner uses admin client so any lead can be updated. |

**Revalidate:** On PATCH lead, `revalidatePath('/agents/dashboard/leads')`, `revalidatePath(/agents/dashboard/leads/${id})`, and when owner: `revalidatePath('/owners/dashboard/leads')`, `revalidatePath(/owners/dashboard/leads/${id})`.

---

### 5. Consistency and recommendations

| Item | Status | Recommendation |
|------|--------|----------------|
| No owner-specific layout | OK | Uses root layout; no nested layout under `app/owners/`. |
| Leads list search form | OK | GET form to `OWNER_LEADS_BASE`; hidden `sort` and `scope` preserve state. |
| LeadsSortForm | OK | Owner leads page passes `basePath={OWNER_LEADS_BASE}` and `currentScope={scope}` so sort form keeps scope. |
| Metadata path | OK | All owner pages use `path: '/owners/dashboard'` or `'/owners/dashboard/leads'` in `buildPageMetadata`; robots noindex. |
| Debug panel | OK | Only when `?debug=1` and `scope=mine`; explains empty "My leads" (broker IDs vs DB). |
| Assigned broker display | OK | Resolved by `clerk_id` and `slug` from `users`; fallback truncate id. |

**Optional improvements:**

- **Breadcrumbs:** Add structured breadcrumbs (e.g. Owner dashboard → Leads → [Name]) for SEO/accessibility; current "Back to leads" / "Back to dashboard" is sufficient for navigation.
- **Scope in form action:** Search form already sends `scope` when not `all` via hidden input; sort form uses `basePath` + hidden `scope` — consistent.
- **Agent list for reassign:** Built from Supabase `users` with role in broker/agent/owner; value is `slug` (or `clerk_id` if no slug) so `assigned_broker_id` stays canonical — aligned with `buildMyLeadsBrokerIds`.

---

### Summary

| Area | Status |
|------|--------|
| Pathways & slugs | ✅ Canonical `/owners/dashboard`, `/owners/dashboard/leads`, `/owners/dashboard/leads/[id]`; scope param and redirect for invalid scope. |
| Auth & protection | ✅ Proxy protects `/owners/dashboard(.*)`; all pages check auth and owner role; redirects for non-owners. |
| Integrations | ✅ Clerk (auth, role); Supabase (users, leads, counts, broker names); MailerLite not in owner UI; agents data for "My leads" and reassign. |
| Wiring | ✅ Dashboard redirect, lead list query (scope/search/sort/pagination), detail + reassign via PATCH, revalidate on update. |

---

## 15. CRM platforms — owners, agents, lenders (double-check, March 7, 2026)

**Scope:** Side-by-side audit of all three CRM-facing dashboards: pathways, slugs, auth, lead access, APIs, and revalidation.

### 1. Pathways and route matrix

| Platform | Dashboard | Leads list | Lead detail | Notes |
|----------|-----------|------------|-------------|--------|
| **Owners** | `/owners/dashboard` | `/owners/dashboard/leads` (`?scope=mine` \| all, `page`, `q`, `sort`, `debug=1`) | `/owners/dashboard/leads/[id]` | Full CRM: All leads or My leads; reassign on detail. |
| **Agents** | `/agents/dashboard` | `/agents/dashboard/leads` (`page`, `q`, `sort`; no scope) | `/agents/dashboard/leads/[id]` | Assigned leads only; no reassign; rescue logic for legacy/unassigned. |
| **Lenders** | `/lenders/dashboard` | — | — | Single page: “Leads needing attention” (leads where `assigned_lender_id` = userId, limit 20). No list/detail routes. |

**Role redirect (`/dashboard`):** owner → `/owners/dashboard`; broker/agent → `/agents/dashboard`; lender → `/lenders/dashboard`; else → `/clients/dashboard`. Role from Supabase (after Clerk sync) then Clerk `public_metadata.role`.

**Proxy protection:** `src/proxy.ts` — `/dashboard(.*)`, `/agents/dashboard(.*)`, `/owners/dashboard(.*)`, `/clients/dashboard`, `/lenders/dashboard` all protected when Clerk keys set.

---

### 2. Auth and role guards (all platforms)

| Check | Owners | Agents | Lenders |
|-------|--------|--------|---------|
| No userId | redirect `/sign-in` | redirect `/sign-in` | redirect `/sign-in` |
| ensureUserInSupabase | Yes (all 3 pages) | Yes (dashboard, leads, detail) | Yes |
| Role source | Supabase then Clerk metadata | Supabase then Clerk metadata | Supabase then Clerk metadata |
| Not owner | → agents / lenders / clients | — | — |
| Not agent | — | → lenders / clients | — |
| Not lender | — | — | → agents / clients |

**Role helpers:** `lib/roles.ts` — `isOwnerRole`, `isBrokerRole` (agent, broker, owner), `isLenderRole`. Used consistently on all dashboard pages.

---

### 3. Lead data access and Supabase client

| Platform | Supabase client | Lead filter | Select | Reassign / write |
|----------|-----------------|-------------|--------|-------------------|
| **Owners** | `supabaseAdmin()` | All leads or `assigned_broker_id` in `buildMyLeadsBrokerIds()` | `LEADS_SELECT`; count head | PATCH via API with admin; can set `assigned_broker_id`. |
| **Agents** | `createClerkSupabaseClient()` (user context) | `assigned_broker_id` in broker IDs (userId, slug, deriveUserSlug, getAgentSlugByEmail) | `LEADS_SELECT` / `LEADS_SELECT_PREVIEW` | PATCH contact only (no `assigned_broker_id`); rescue + normalize to canonical broker id on dashboard/detail. |
| **Lenders** | `createClerkSupabaseClient()` | `assigned_lender_id` = userId | `LEADS_SELECT_LENDER` (id, email_address, assigned_broker_id) | No PATCH leads; read-only. Broker names via `getBrokerDisplayNamesByClerkId`. |

**Broker identity (owners vs agents):** Owners use `buildMyLeadsBrokerIds()` (owner-my-leads-ids.ts); agents build broker IDs inline (same ideas: clerk_id, slug, derived slug, agent slug by email). Both align with `assigned_broker_id` stored as slug or clerk_id. Owner detail reassign dropdown uses `users.slug` (or clerk_id) so values stay canonical.

---

### 4. API usage and revalidation

| API | Used by | Revalidation |
|-----|--------|--------------|
| `GET /api/leads/[id]` | Client/agent lead detail (if used) | — |
| `PATCH /api/leads/[id]` | Owner (contact + reassign), Agent (contact only) | `revalidatePath` agents leads + owner leads (when owner). **Not** revalidating `/lenders/dashboard`. |
| `PATCH /api/me/agent` | Client: “Choose my agent” | `/clients/dashboard`, `/dashboard` |
| `PATCH /api/me/lender` | Client: “Choose my lender” | `/clients/dashboard`, `/dashboard` |

**Gap (optional):** When a lead is PATCHed and `assigned_lender_id` is set, lender dashboard could stay stale until next full load. Consider `revalidatePath('/lenders/dashboard')` when the updated lead row has `assigned_lender_id` changed.

---

### 5. Shared components and links

| Component | Owners | Agents | Lenders |
|-----------|--------|--------|---------|
| `LeadContactForm` | Yes; `backHref="/owners/dashboard/leads"`, `showReassign agents={agents}` | Yes; `backHref="/agents/dashboard/leads"`, no reassign | N/A (no lead detail) |
| `LeadsSortForm` | Yes; `basePath={OWNER_LEADS_BASE}`, `currentScope={scope}` | Yes; default basePath `/agents/dashboard/leads`, no scope | N/A |
| Back to dashboard | `/owners/dashboard` | `/agents/dashboard` | N/A (single page) |
| Back to leads | `/owners/dashboard/leads` | `/agents/dashboard/leads` | N/A |

**Hardcoded paths:** All owner paths use `OWNER_LEADS_BASE` or literal `/owners/dashboard*`; agent paths use literal `/agents/dashboard*`. No cross-linking mistakes found.

---

### 6. Lenders dashboard specifics

- **Single route:** `app/lenders/dashboard/page.tsx` only; no `leads` or `[id]` under lenders.
- **Data:** Leads where `assigned_lender_id` = current user’s Clerk ID; limit 20; `LEADS_SELECT_LENDER`; broker name resolved for each lead.
- **Profile/team:** Uses `users.assigned_broker_id` and `users.assigned_lender_id` (set by client via `/api/me/agent` and `/api/me/lender`). Resolves to agents.json / lenders.json for display (getAgentBySlug, getLenderBySlug, getAgentByEmail, getLenderByEmail).
- **No lead list/detail:** By design; lenders see a preview list on dashboard only.

---

### 7. Summary

| Platform | Pathways | Auth | Lead access | APIs | Revalidate |
|----------|----------|------|-------------|------|------------|
| Owners | ✅ 3 routes; scope param; canonical URLs | ✅ Sign-in + owner role; redirects | ✅ Admin; all or “my” via broker IDs | PATCH contact + reassign | ✅ Owner + agent paths |
| Agents | ✅ 3 routes; no scope | ✅ Sign-in + broker role; redirects | ✅ User client; assigned only; rescue + normalize | PATCH contact only | ✅ Agent paths |
| Lenders | ✅ 1 route (dashboard only) | ✅ Sign-in + lender role; redirects | ✅ User client; assigned_lender_id = userId | None for leads | ⚠️ Optional: revalidate lender dashboard on lead PATCH |

All three CRM platforms are consistent: correct role checks, correct Supabase usage (admin for owners, user-scoped for agents/lenders), and correct back links / form actions. Only optional improvement: revalidate `/lenders/dashboard` when a lead’s `assigned_lender_id` is updated so new assignments show up on next load.
