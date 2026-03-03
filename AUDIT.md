# Full Website Audit — Brantley Christianson Real Estate

**Date:** March 2025  
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

**API:** `POST /api/consultation` → `app/api/consultation/route.ts` (Mailchimp + rate limit).

**Special:** `error.tsx` (error boundary), `not-found.tsx` (404). No nested layouts under markets/brokers.

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

### Unused components

| Component | Status |
|-----------|--------|
| `BrokerGrid.tsx` | Not imported anywhere (brokers section removed from home) |
| `FeaturedListingCard.tsx` | Not imported |
| `PropertyCard.tsx` | Not imported |

**Recommendation:** Remove unused components or document if reserved for future use.

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
- **Third-party:** GA4, Repliers API, Mailchimp (consultation), Google Maps/OSM (CondoMapSection), Walk Score, YouTube (LazyYouTube, social), social links from `data/site.ts`.
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
- **Env:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `MAILCHIMP_*`, and any Repliers/API keys (see `api/consultation/route.ts` and `lib/`).

---

## Summary

| Area | Status | Notes |
|------|--------|--------|
| Routes & structure | ✅ | Clear app-router layout; static + dynamic routes and one API route. |
| Layout & global UI | ✅ | Single layout, skip link, header/footer. |
| Components | ✅ | Unused components removed (BrokerGrid, FeaturedListingCard, PropertyCard, MarketStack). |
| Data & config | ✅ | Centralized markets, agents, site, theme; static generation used correctly. |
| Styles | ✅ | Single entry, design tokens; dead broker-grid.css removed. |
| SEO & metadata | ✅ | Layout + per-page/dynamic metadata; JSON-LD where needed. |
| Accessibility | ✅ | Meaningful `imageAlt` added on markets, brokers, resources, portland-condo-guide, error. |
| State page consistency | ✅ | Washington state page rebuilt to match Oregon (breadcrumb + county stack, A–Z). |

**Fixes applied (post-audit):**  
1. Added meaningful `imageAlt` on markets, brokers, resources, portland-condo-guide; error page given image + alt.  
2. Removed unused components and MarketStack; removed broker-grid.css.  
3. Washington state page rebuilt with breadcrumb + city-stack (alphabetical counties).  
4. Error page Hero given `imageSrc` and `imageAlt`.  
5. TypeScript: optional `highlight`/`sub` in Portland components guarded with `'highlight' in item` / `'sub' in card`.
