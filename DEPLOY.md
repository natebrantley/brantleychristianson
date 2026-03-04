# Deployment checklist

## Build

- **Production build:** `npm run build` — must complete with no errors.
- **Start locally:** `npm run start` — smoke-test key routes (/, /brokers, /contact, /social, /resources/portland-condo-guide).

## Environment variables

Set these in your hosting dashboard (Vercel, Netlify, etc.) only if you use the feature:

| Variable | Required | Purpose |
|----------|----------|---------|
| `MAILERLITE_API_TOKEN` | Only for consultation form | Add contact to MailerLite list |
| `MAILERLITE_GROUP_ID` | Optional | Group ID to add consultation leads to |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Optional | Embedded map on condo building pages |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 |
| `REPLIERS_API_KEY` | Optional | Repliers.io CRM / lead management |
| `WALKSCORE_API_KEY` | Optional | Walk Score API for walk/transit/bike scores |

**You can deploy with no env vars.** The site will run; the consultation form will fail until MailerLite token is set.

## Platform

- **Vercel:** Connect the repo; build command `next build`, output is automatic. No `vercel.json` required.
- **Netlify:** Build command `next build`, publish directory `.next`. Use the Netlify Next.js runtime or set `NODE_VERSION=18` (or 20).

## After deploy

1. Open the production URL and check home, Brokers, Contact, Social, and a broker profile.
2. If you use the consultation form, submit a test and confirm the contact is added in MailerLite.
3. Point your domain (e.g. brantleychristianson.com) in the host’s DNS/domain settings if needed.
