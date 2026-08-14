---
name: mausam-ka-mood
description: Maintain and extend the Mausam ka Mood travel-first weather planner, including its React/Vinext routes, Open-Meteo data flows, weather UI, day navigation, animations, radar, SEO, ads, and local-only deployment workflow.
---

# Mausam ka Mood

Use this skill when changing, debugging, documenting, or extending this weather planner. Read [MAUSAM_KA_MOOD.md](../../MAUSAM_KA_MOOD.md) first for the current product contract and file map.

## Working rules

1. Preserve the two-route shape: `/` is the planner and `/forecast` is the detailed day view.
2. Keep forecast data sourced from Open-Meteo. Treat Windy as an optional, lazy-loaded radar enhancement rather than a dependency for the page to render.
3. Keep day navigation responsive: prefetch on hover/focus, show an immediate transition on click, and keep the selected day in the sticky seven-day dock.
4. Prefer CSS weather motion and existing emoji/icon treatments over large GIFs. Honor reduced-motion preferences.
5. Keep cards bounded at medium widths. Test the forecast temperature card, weather orb, map iframe, and ad slot at desktop, tablet, and mobile sizes.
6. Catch expected browser promise rejections, especially `navigator.share()` cancellation.
7. Keep ad placeholders hidden when unfilled. Add real AdSense code only after the user provides an approved publisher ID, ad slot IDs, and production domain.
8. Do not deploy or use the existing Sites metadata unless the user explicitly asks; local development is the default.

## Validation

Run:

```bash
pnpm run build
git diff --check
```

For UI changes, manually verify city selection, day selection, loading transitions, weather animation containment, radar loading, share cancellation, and hydration on first load.

## Useful extension targets

- Smart Go/Maybe/Skip recommendation
- Rain arrival timeline
- Saved cities and favourite trips
- Shareable forecast cards
- AQI health guidance
- `robots.txt`, `sitemap.xml`, JSON-LD, and Search Console verification after a domain is selected
