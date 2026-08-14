# Mausam ka Mood

Mausam ka Mood is a travel-first weather planner that turns forecast data into useful decisions—with colorful weather scenes, trip scores, AQI context, packing guidance, and friendly Hindi sarcasm.

## Features

- City search with location-aware suggestions
- Current conditions and 16-day forecast data
- Chronological seven-day navigator
- Hourly weather story and best outdoor window
- Rain, wind, UV, visibility, AQI, and historical context
- Smart trip score, weather alerts, comparison, voice briefing, and sharing
- Lightweight animated weather scenes with reduced-motion support
- Optional lazy-loaded Windy radar with AQI badge
- Hidden ad slots ready for a future approved ad integration

## Routes

- `/` — planner and weather overview
- `/forecast` — detailed city/day forecast
- `/sitemap.xml` — generated sitemap
- `/robots.txt` — generated crawler rules

## Local development

Requirements: Node.js `>=22.13.0` and pnpm.

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm test
```

Open [http://localhost:3000](http://localhost:3000).

## Data sources

- Open-Meteo Geocoding and Forecast APIs
- Open-Meteo Air Quality API
- Open-Meteo Historical Archive API
- Windy embedded radar, loaded only on demand

## Search Console readiness

The sitemap and robots routes are now configured. Before submitting to Google, set the production URL in Netlify as:

```text
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
```

Redeploy, then verify the domain in Google Search Console using DNS, submit `/sitemap.xml`, and inspect the homepage and `/forecast`. Localhost must not be submitted as the production property.

Google verification tokens and AdSense publisher IDs are intentionally not included because they are account-specific secrets.

## Netlify deployment

This project uses Vinext with the Nitro Netlify adapter. Netlify should use the committed `netlify.toml`:

```text
Build command: pnpm run build:netlify
Publish directory: leave empty
```

Set Node.js 22 and `NEXT_PUBLIC_SITE_URL` in Netlify environment variables, then trigger a new deploy.

## Ads

Ad placeholders remain hidden until a real ad integration fills them. For AdSense, add the approved script, slot IDs, privacy/consent pages where required, and a root-level `public/ads.txt` containing the exact line supplied by AdSense. Never commit a placeholder publisher ID.

## Project map

- `app/page.tsx` — homepage experience
- `app/forecast/page.tsx` — detailed forecast experience
- `app/globals.css` — UI system and responsive styling
- `app/layout.tsx` — metadata and document shell
- `app/sitemap.ts`, `app/robots.ts` — SEO routes
- `site-skills/mausam-ka-mood/` — reusable project skill and UI metadata
