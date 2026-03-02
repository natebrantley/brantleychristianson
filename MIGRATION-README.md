# BCRE Migration – Next.js

Luxury real estate brand site (Brantley Christianson Real Estate) migrated from legacy static structure to **Next.js 14** (App Router, React 18). Brand: *Fiercely Independent, Strategically Driven.* Design: high-contrast, Pacific Northwest–inspired luxury tokens.

## File structure

```
/src
  /components     Modular UI: Button, Hero, FeaturedListingCard, IntelligenceHubs, RevealSection
  /config        theme.ts – central colors, typography, layout tokens
  /hooks         useScrollState (scroll + no-scroll nav), useReveal (intersection reveal)
  /layout        SiteHeader, SiteFooter, Stack (Lobotomized Owl)
  /styles        variables.css (master manifest), globals + header, footer, hero, cards, buttons, hubs, forms
  /app           layout.tsx, page.tsx
/public
  /media         All media (hosted at /media/ in the app)
    /img/brokers    Broker headshots
    /img/condos     Condo/building images
    /img/hubs       Region hub images
    /img/listings   Listing photos
    /img/logos      BCRE logos
    /img/markets    Market/region imagery (pdx.jpeg, pdx_skyline*, AdobeStock_*, camas_*, ridgefield_river, etc.)
    /img/stock      Stock/interior photos
```

**Media inventory (under `/public/media/img/`):**
- **brokers/** – Headshots (28 files).
- **condos/** – Building photos (e.g. eliot-tower, elizabeth, harrison, lexis, marshall-wells, ritz, casey).
- **markets/** – Portland and regional imagery (pdx, pdx_skyline, AdobeStock, camas, ridgefield, Longview, Tualatin, etc.).
- **hubs/** – Region hub images (add as needed).
- **listings/** – Listing photos (add as needed).
- **logos/** – BCRE-White-Navy, BCRE-White-Trans.
- **stock/** – couch, kitchen, living, office, table.

## Core system

- **Colors:** Primary `#0a2438`, Accent `#c5a059`, RGB vars for transparency (see `src/config/theme.ts` and `src/styles/variables.css`).
- **Typography:** Body `Quasimoda`, headings `Tenso`, display `Arno Pro Display` (see CSS variables).
- **Stack:** Lobotomized Owl implemented as `<Stack gap="md">` in `src/layout/Stack.tsx`; CSS: `[class*="stack--"] > * + *`.
- **Responsive:** `clamp()` font sizes and `--header-height` preserved in variables.

## Components

- **SiteHeader / SiteFooter** – Shared layout; header uses `is-scrolled` state and mobile hamburger with body `no-scroll` lock (hooks: `useScrollState`, `useNavToggle`).
- **Hero** – Variants: `fullscreen`, `half`, `condo`. Supports native `<picture>` or Next `Image`; `fetchpriority="high"` / `priority` for LCP.
- **FeaturedListingCard** – MLS block with image, "Explore Listing" overlay (hover), listing info.
- **IntelligenceHubs** – Grid of regional links (e.g. Oregon / Washington), aspect-ratio 4/3, text-shadow overlay.

## Performance & SEO

- Hero image: `priority` / `fetchPriority="high"` and lazy load for below-fold images.
- Semantic HTML: `<main>`, `<section>`, headings; JSON-LD (RealEstateAgent) on home page.
- **Interactive engine:** Legacy `bcre-engine.js` replaced by React hooks: `useScrollState`, `useNavToggle` (no-scroll), `useReveal` (reveal-item animations via Intersection Observer).

## Run

```bash
npm install
npm run dev
```

Build: `npm run build`. Put all media in `public/media/` (e.g. `public/media/img/listings/`, `public/media/img/hubs/`, `public/media/img/brokers/`). Paths are centralized in `src/config/theme.ts` as `assetPaths`.

## Deploy (Vercel)

1. **Connect repo:** [Vercel](https://vercel.com) → Import Project → select `natebrantley/brantleychristianson`. Framework Preset: Next.js.
2. **Environment variables:** In Project Settings → Environment Variables, add (for Production and Preview):
   - `MAILCHIMP_API_KEY` – Mailchimp API key (e.g. `…-us2`)
   - `MAILCHIMP_AUDIENCE_ID` – Mailchimp audience (list) ID  
   Optional: `MAILCHIMP_MERGE_TAG_MESSAGE` (default `MMERGE3`) for the consultation message merge field.
3. **Deploy:** Push to `master` (or your production branch) to trigger a new deployment.
