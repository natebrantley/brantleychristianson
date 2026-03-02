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
    /img/listings   Listing images
    /img/hubs       Region/hub images
```

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
