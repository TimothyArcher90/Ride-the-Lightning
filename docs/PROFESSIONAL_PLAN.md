Spanish original: [es/PLAN_PROFESIONAL.md](es/PLAN_PROFESIONAL.md)

# Ride the Lightning professional plan (2026-11-04)

Origin: the owner (David), after using the studio: «innavegable, ilegible, inentendible… burdo… no sé cómo usarlo ni para qué sirve» ("unnavigable, illegible, unintelligible… crude… I don't know how to use it or what it is for").
Goal: a **universal visualizer** for real data — any dataset, any country, any chart — with a clear interface and professional-grade output, without the user needing to know anything about charts.

## 1. Diagnosis (measured on screenshots, not assumed)

| Problem | Evidence | Fix |
|---|---|---|
| 5,382 px page, 185 identical cards | full-page capture of step 1 | "Most used" list, search, categories, "Show more" (24 per page) |
| Does not say what it is for | zero purpose text | "What it is for + 3 steps" block |
| First step has no obvious action | empty black preview | Entry points by intent (6 cards), "See a ready-made example" button |
| The user picks a "chart type" blind | generic doodles | **Live gallery**: each style shows YOUR data actually drawn |
| Technical warnings leaking through | «datos.d: ninguna capa…» | Filtered; messages in plain language |
| Output text unreadable on a phone | 19–26 px on a 1080 canvas | Design system with measured minimum sizes (see §4) |
| Missing countries, debt, GDP | catalog has no per-country data | 45 countries × ~11 indicators, country profile and comparison (see §3) |
| Missing chart types | 16 models | +11 models (radar, stacked area, candlesticks, histogram, dumbbell, calendar…) |

## 2. Flow architecture (4 steps, always visible)

1. **What to show** — 6 entry points grouped as: *Markets and economy* (one dataset over time) · *Countries* (one country; compare countries) · *Companies* (how a company earns and spends; what added and what subtracted) · *My data* (Excel/CSV).
2. **How to view it** — live gallery with every style that fits; the best one comes first with a ★ and the reason why. Title, format (16:9 / 9:16), key moments.
3. **Camera and pacing** — one recommended option; advanced settings collapsed.
4. **Review and download** — summary (dataset, style, format, duration), sources and accuracy, draft (~30 s) or final version (MP4 + ProRes with alpha + report).

UX principles applied (Nielsen, progressive disclosure, "recognition rather than recall"): one goal per screen; advanced options collapsed; every state visible (current step, what is chosen, what is missing); plain-language text; touch targets ≥ 44 px; visible focus; no horizontal overflow at 390 px.

## 3. Data

- **Countries** (`servidor/paises.mjs`): a profile with the latest value of each indicator (value, year, source) and full series `pais_<ISO3>_<indicator>`. Sources: World Bank (CC BY 4.0) and IMF DataMapper.
- **Source verification**: World Bank ↔ IMF cross-check on GDP, debt/GDP, inflation and population; discrepancies are recorded in `catalogo/verificado.json`. Never interpolate. Every figure on screen carries its source and date.
- **Pending a legal decision**: commercial reuse of IMF data (terms to be confirmed against their official text).

## 4. Output (what gets exported)

A single design system (`motor/diseno.js`): title/subtitle/body/figure hierarchy, minimum sizes per format measured by tests, contrast ≥ 4.5:1, mandatory footer "Source · date of last data point", reels safe zone, motion with easing and staggered entrances. Automated checklist (`scripts/prueba-calidad.mjs`) across the models × 2 formats.

## 5. Universal visualizer

New models in `motor/capas_extra.js`: radar/profile, stacked and 100 % area, candlesticks/OHLC, histogram, dumbbell, calendar heatmap, grouped bars, bullet, series with bands, pictogram, ranking by country. The standalone visualizer (`servidor/visualizador.mjs`) recommends them from the shape of the data and the gallery displays them.

## 6. Delivery order and status

| Phase | Content | Status |
|---|---|---|
| A | Interface: guide, compact list, clear steps, mobile | Done (ab68f11, cc2e9c9) |
| B | Countries: profile, comparison, source verification | Done: 45 countries × 14 indicators (812 series in the catalog); IMF license to be confirmed |
| C | Professional output: design, source footer, checklist | Done (`motor/diseno.js`, `scripts/prueba-calidad.mjs`); vertical Sankey is the weakest point |
| D | Universal models + live gallery | Done: 27 models, gallery with the real data |
| E | Test with a non-technical person, sample final video | Pending |
| F | Library of saved templates / multi-option "Surprise me" | Pending |
