# RMLS Internet Display Policy Compliance (IDX / VOW)

This document summarizes the implementation for **brantleychristianson.com** to comply with RMLS (Regional Multiple Listing Service) Internet Display Policies for IDX and VOW websites.

## 1. UI: Listing Attribution & Disclaimers

- **Listing firm name**: The `ListingAttribution` component (`src/components/rmls/ListingAttribution.tsx`) displays `listing_firm_name` (and optional `listing_agent_name`) immediately adjacent to property details. Use it in any property card or detail view that shows MLS data.
- **RMLS disclaimer**: The `RMLSDisclaimer` component (`src/components/rmls/RMLSDisclaimer.tsx`) shows the required RMLS disclaimer text and logo (or “RMLS” fallback if the logo image is missing). It is used:
  - At the bottom of the Portland condo detail page (`/markets/oregon/pdx/condos/[slug]`).
  - Inside `PropertyDetails` for any full listing detail page.
- **Brokerage name**: The disclaimer uses the brokerage name (e.g. “Brantley Christianson Real Estate”) via the `brokerageName` prop or `SITE_NAME` from `@/config/site`.
- **RMLS logo**: Place the official RMLS logo at `public/media/img/logos/rmls-logo.png`. If the file is missing, the component shows a text fallback “RMLS”.

## 2. Authentication: VOW Terms of Service (Clerk)

- **Sign-up page**: `/sign-up` (`src/app/sign-up/[[...sign-up]]/page.tsx`) is the VOW registration entry point. It displays the required disclosure and a **required checkbox** before the Clerk sign-up form is shown.
- **Disclosure text**: “By registering, you agree to the Terms of Use, acknowledging that the MLS data provided is exclusively for your personal, non-commercial use, and you have a bona fide interest in the purchase, sale, or lease of real estate of the type being offered.”
- **Terms of Use**: The same VOW/MLS language is included on the site Terms page (`/terms`) under “MLS data (VOW)”.
- **Link to sign-up**: Ensure the app links to `/sign-up` (e.g. from header or auth prompts) so new users complete registration through this page.

## 3. Data Freshness: 12-Hour Sync

- **Cron**: Vercel Cron is configured in `vercel.json` to call `/api/cron/sync-mls` every 12 hours (`0 */12 * * *`).
- **IDX feed source**: Listings are synced from **Repliers.io** via `src/lib/repliers-listings.ts`. The cron route:
  - Validates the request using the `CRON_SECRET` environment variable (Bearer token).
  - Marks listings past `expiration_date` as `Expired`.
  - When `REPLIERS_API_KEY` and `REPLIERS_DEFAULT_AGENT_ID` are set, fetches all active listings from Repliers (POST `/listings`, `status=A`, paginated), upserts them into the `listings` table, and marks any existing Active/Pending listing not in the feed as `Expired`.
- **Environment**: In Vercel, set `CRON_SECRET`. For IDX sync, also set `REPLIERS_API_KEY` and `REPLIERS_DEFAULT_AGENT_ID` (same as used for the consultation/lead flow).

## 4. Restricted Data Fields

- **Listings table**: Migration `supabase/migrations/20260308000000_create_listings_table_rmls.sql` defines the `listings` table. Columns `seller_contact` and `showing_instructions` are **restricted** and must never be exposed to the public.
- **Public API**: `src/app/api/listings/route.ts` returns only Active/Pending listings and **does not select** `seller_contact` or `showing_instructions`.
- **Helpers**: `src/lib/listings-rmls.ts` provides:
  - `RMLS_PUBLIC_STATUSES`: only `Active` and `Pending` are allowed for public IDX.
  - `toPublicListing()`: strips restricted fields and enforces public status when building responses.
  - `filterPublicListings()`: filters arrays to displayable statuses.
- **Rule**: For any server or API that returns listing data to unauthenticated users, never include `seller_contact` or `showing_instructions`. For VOW (logged-in users), expose these only if your RMLS agreement permits and only in authenticated contexts.

## Checklist

- [ ] RMLS logo at `public/media/img/logos/rmls-logo.png`
- [ ] `CRON_SECRET` set in Vercel for `/api/cron/sync-mls`
- [ ] `REPLIERS_API_KEY` and `REPLIERS_DEFAULT_AGENT_ID` set in Vercel (for IDX feed sync)
- [ ] Run migration `20260308000000_create_listings_table_rmls.sql` when adding MLS listings
- [ ] Use `PropertyDetails` and `ListingAttribution` on any new MLS listing detail page
- [ ] Link to `/sign-up` wherever you want new VOW registrations
