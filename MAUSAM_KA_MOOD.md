# Mausam ka Mood — Site Reference

## Product

Mausam ka Mood is a travel-first weather planner. It turns forecast data into practical decisions: whether to go outside, what to pack, when to travel, and whether the weather deserves a sarcastic Hindi roast.

## Local development

- Local URL: `http://localhost:3000/`
- Main route: `/`
- Detailed forecast route: `/forecast`
- Example: `/forecast?city=New+Delhi&country=India&date=2026-08-14&lat=28.62137&lon=77.2148`
- Start: `pnpm run dev`
- Build: `pnpm run build`
- Test: `pnpm test`

## Architecture

- Vinext/React 19 application with Cloudflare-compatible output.
- `app/page.tsx`: planner, city search, quick destinations, home forecast summary, weather theatre, weekly forecast.
- `app/forecast/page.tsx`: dedicated day view, week navigator, hourly story, trip score, alerts, health, history, share, radar, comparison, packing.
- `app/globals.css`: visual system, responsive layout, weather scenes, transitions, card styling, map containment, ad-slot rules.
- `app/layout.tsx`: title, description, favicon, Open Graph and X metadata.
- `public/og.png`: social preview image.
- `public/favicon.svg`: favicon.

## Data sources

Open-Meteo is used for geocoding, forecast, air quality, and historical archive data. Windy is used only for the optional interactive radar iframe. Forecast data is client-fetched using city coordinates and a 16-day window.

## UX rules

- City suggestions should prioritize the intended city/country and avoid irrelevant same-name locations.
- The capital/primary result is labelled where useful.
- Day changes show immediate transition feedback and prefetch the destination route on hover/focus.
- The forecast page must keep the selected day visible in the seven-day dock.
- Weather animations are lightweight CSS effects; respect `prefers-reduced-motion`.
- The radar is lazy and loads only after the user requests it; it must remain clipped inside its rounded viewport.
- Empty ad slots stay completely hidden until an ad integration marks `data-ad-filled="true"`.
- Never expose browser errors for cancelled sharing; native share cancellation is expected.

## Weather interpretation

Condition codes are mapped in `skies` in both page components. The UI derives a vibe score from rain chance, UV, and wind; alerts cover storms, high UV, and low visibility. Hindi humour is intentionally short, friendly, and weather-related.

## SEO and monetization status

Current metadata exists, but `sitemap.xml`, `robots.txt`, Google Search Console verification, AdSense code, and `ads.txt` are not configured. These require a production HTTPS domain and real Google-issued verification/publisher IDs. Never commit placeholder AdSense IDs.

## Deployment status

This workspace is currently intended for localhost use. `.openai/hosting.json` contains project metadata, but no deployment should be performed unless the user explicitly requests it. The project can be adapted to Cloudflare Workers, Vercel, Netlify, or another provider after choosing a provider and domain.

## Known maintenance checks

Before handing off changes, run `pnpm run build` and `git diff --check`. Check medium widths around 860–1100px, mobile widths, day navigation, map loading, share cancellation, and first-load hydration.
