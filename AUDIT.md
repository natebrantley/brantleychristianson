# Full Page Audit — Brantley Christianson Real Estate

**Date:** March 2, 2026  
**Scope:** Site-wide (Next.js 16 app, home, layout, key pages, components, API, SEO, a11y, performance, security)

---

## Executive summary

The site is in good shape: clear structure, semantic HTML, metadata and JSON-LD, accessible forms and navigation, and a solid design system. The main gaps are **missing Privacy/Terms pages** (linked in footer), **no skip link**, **empty hero image alts**, **API rate limiting**, and a few consistency and SEO tweaks. Below are findings by category with priority and suggested fixes.

---

## 1. Broken links & missing pages

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Footer links to `/privacy` and `/terms`** but those routes do not exist. | **High** | `SiteFooter.tsx` | Add `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`, or remove/update the links until pages exist. |
| 404 and error pages exist and are well done. | — | `not-found.tsx`, `error.tsx` | No change. |

**Recommendation:** Either create placeholder (or real) Privacy and Terms pages, or change the footer to something like “Privacy & Terms (coming soon)” that does not link, or remove the links until ready.

---

## 2. Accessibility (a11y)

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **No skip link** to main content. | **High** | `SiteHeader.tsx` / layout | Add a “Skip to main content” link as the first focusable element (e.g. in header or layout) that targets `#main-content` and ensure `<main id="main-content">` in layout or a wrapper. |
| **Hero images use `imageAlt=""`** on home, contact, about, not-found. | **Medium** | `page.tsx`, `contact/page.tsx`, `about/page.tsx`, `not-found.tsx` | If images are decorative, keep `alt=""`. If they convey meaning (e.g. “Modern kitchen in Pacific Northwest home”), add a short descriptive alt. |
| **Broker headshots use `alt=""`** in `BrokerGrid`. | **Low** | `BrokerGrid.tsx` | Consider `alt={`${agent.name}, ${agent.title}`}` so screen readers get name + role. |
| **Logo has `alt=""`** with an `aria-label` on the parent link. | — | `SiteHeader.tsx` | Acceptable; link is labeled “Brantley Christianson Real Estate – Home”. |
| **Form inputs** use `outline: none` with custom focus (border + box-shadow). | **Low** | `forms.css` | Ensure focus ring is clearly visible (e.g. 2–3px, high contrast). Consider adding `:focus-visible` so custom focus only for keyboard. |
| **ConsultationForm** has `aria-busy`, `aria-describedby` for errors, and confirmation has `role="status"` and `aria-live="polite"`. | — | `ConsultationForm.tsx` | Good. |
| **Mobile nav** has `aria-expanded`, `aria-controls`, and Escape to close. | — | `SiteHeader.tsx` | Good. |
| **Sections** use `aria-labelledby` / `aria-label` where appropriate. | — | Home, about, contact | Good. |
| **`:focus-visible`** defined in `globals.css`. | — | `globals.css` | Good. |

---

## 3. SEO & metadata

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Root layout** sets `metadataBase`, default title template, description, OG, Twitter, robots. | — | `layout.tsx` | Good. |
| **Home** has custom metadata and JSON-LD (`RealEstateAgent`). | — | `page.tsx` | Good. |
| **Contact** has `ContactPage` JSON-LD. | — | `contact/page.tsx` | Good. |
| **Child pages** use `openGraph: { url: '/contact' }` etc. without full URL. | **Low** | contact, about | `metadataBase` will resolve these; optional to set full `url` for clarity. |
| **Featured listing** (home) is not marked up as structured data. | **Low** | `page.tsx` | Consider adding `Product` or `RealEstateListing` JSON-LD for the featured property. |
| **Single `<h1>` per page** and sensible heading order. | — | Pages | Good. |

---

## 4. Performance & best practices

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Hero images** use Next `Image` with `priority` on key pages, `sizes` set. | — | Hero, home | Good. |
| **YouTube iframe** on home (featured listing) loads on initial load. | **Medium** | `page.tsx` | Consider loading iframe only when in view (e.g. Intersection Observer) or using `loading="lazy"` if supported, or a “Play” placeholder to reduce initial payload. |
| **GA** loaded with `strategy="afterInteractive"`. | — | `layout.tsx` | Good. |
| **next.config** uses `reactStrictMode` and image formats (avif, webp). | — | `next.config.js` | Good. |
| **Body** uses `min-height: 100dvh` and safe-area insets. | — | `globals.css` | Good. |

---

## 5. Security

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Consultation API** has no rate limiting. | **High** | `api/consultation/route.ts` | Add rate limiting (e.g. by IP or fingerprint) to prevent abuse and Mailchimp quota burn. |
| **API** validates required fields (email) and trims strings. | — | `api/consultation/route.ts` | Good. |
| **No CSRF** token on consultation form. | **Medium** | Form + API | Next.js App Router same-origin POSTs are relatively safe; for extra hardening consider SameSite cookies or a short-lived token. |
| **Sensitive config** (Mailchimp keys) only in server env. | — | API route | Good. |
| **Error responses** do not leak internal details. | — | API route | Good. |

---

## 6. Code quality & consistency

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Error page** uses raw `<button className="button button--outline">` instead of shared `Button`. | **Low** | `error.tsx` | Use `<Button variant="outline" onClick={reset}>Try again</Button>` for consistency (Button supports `onClick` if you add it, or use a small wrapper). |
| **Inline `style`** used in a few places (e.g. `marginTop`, `marginBottom`). | **Low** | `page.tsx`, contact CTA | Prefer utility classes (e.g. `mt-lg`, `mb-md`) or extend the stack/section classes to avoid magic values. |
| **Theme/config** is consistent (`@/config/theme`, `@/config/site`). | — | — | Good. |
| **TypeScript** used; types in `@/data/types`. | — | — | Good. |

---

## 7. Content & UX

| Issue | Priority | Location | Fix |
|-------|----------|----------|-----|
| **Site announcement** (“We’re rolling out a new website…”) is clear and has a proper region/label. | — | Home | Good. |
| **Featured listing** has title, description, specs, and broker link. | — | Home | Good. |
| **CTA sections** are clear (“Ready to find your place?”, “Get in touch”). | — | Home, about | Good. |
| **Consultation form** explains response time and “no spam.” | — | Contact | Good. |

---

## 8. Checklist summary

- [ ] Add `/privacy` and `/terms` pages or adjust footer links.
- [ ] Add skip-to-main-content link and `id="main-content"` on main.
- [ ] Add rate limiting to `POST /api/consultation`.
- [ ] Consider descriptive `imageAlt` for hero images where they add context.
- [ ] Consider lazy-loading or deferring the featured listing YouTube iframe.
- [ ] Optionally add RealEstateListing JSON-LD for the featured listing.
- [ ] Optionally use `Button` on the error page and add `onClick` to the component if needed.
- [ ] Consider broker card image alts (e.g. agent name + title).

---

## 9. Optional: Security headers

If you deploy to Vercel (or similar), consider adding security headers in `next.config.js` (e.g. `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`). The Next.js docs and your host’s docs have examples.

---

*End of audit.*
