Spanish original: [es/PRIORIDADES.md](es/PRIORIDADES.md)

# Ride the Lightning priorities (living list for the night work)

> **Status as of 2026-11-04**
> - **27 chart models** (up from 16), including radar, stacked area, candlesticks, histogram, dumbbell, calendar heatmap, grouped bars, bullet, bands, pictogram and country ranking (`motor/capas_extra.js`).
> - **Live style gallery**: step 2 shows each style drawn with the user's own data, with the best fit marked ★ and the reason why.
> - **45 countries × 14 indicators**; the catalog now holds **812 series** (the "172 series" figures below are the 2026-11-03 count). Country profile, comparison and World Bank ↔ IMF cross-verification (`catalogo/verificado.json`).
> - **Design system** (`motor/diseno.js`): type hierarchy, minimum sizes per format, contrast ≥ 4.5:1, mandatory source footer, reels safe zone.
> - **Quality tests** (`scripts/prueba-calidad.mjs`) over the models × 2 formats. Weakest point: vertical Sankey.
> - Still pending: test with a non-technical person; saved-template library / "Surprise me"; IMF commercial-reuse license to be confirmed. See [PROFESSIONAL_PLAN.md](PROFESSIONAL_PLAN.md).

Work order for the night session (see "Night work" below). Every task ends with: tests green, commit, push and one line in the log `docs/diagnosticos/YYYY-MM-DD-noche.md`.
Status: ✅ done · ⬜ pending · 🔄 in progress.

## P0 · Requested on 2026-11-03 (done the same day)
- ✅ Sankey, donut and waterfall; studio organized by stories; themes; "follow" camera; pill and circle.
- ✅ Quarterly library (SEC): 16 featured companies with their full history since 2009 + **the whole US stock market** (7,200+ companies) with the last 3 years, fetched when selected or overnight.
- ✅ Fine detail for the last year (4 quarters): company-specific expense lines (Fulfillment, Technology…) and revenue by product/segment (AWS, Online stores…), from the full XBRL.
- ✅ Watcher agent over the SEC daily index (whole library with 2 requests) + automatic draft.
- ✅ A company's results as series (revenue, profit, margin) for the series templates.
- ✅ Chat to edit the piece by talking (Claude Code + 18 MCP tools).

## P1 · Data and accuracy (most important)
1. ⬜ **Fine detail for every quarter of the featured companies** (today: last year only). Night task: `node scripts/trimestres.mjs construir` with high `detalle` (the cache makes it repeatable).
2. ⬜ **Verify universe coverage** at dawn: `node scripts/trimestres.mjs universo` → how many companies have quarters, how many have no data and why (banks, insurers, REITs, new companies). Write the summary in the log.
3. ⬜ **Banks and insurers**: their own structure (interest income, provisions, non-interest expenses). Design a dedicated Sankey or document them as "not applicable".
4. ⬜ **Translations**: review the English labels left untranslated for the largest companies (`servidor/xbrl.mjs`, `ES` dictionary). Do not translate anything doubtful.
5. ⬜ **YoY comparison** (change versus the same quarter of the previous year) on every Sankey node: already in the engine (`anterior`); the column still has to be written to the CSVs.
6. ⬜ **Q4 with fine detail** for companies with unusual fiscal years (try Apple, Walmart, Costco, Nvidia, Oracle).

## P2 · User experience
7. ⬜ Test with a non-technical person (10 minutes, no help). Note where they get stuck.
8. ⬜ Home screen with three clear doors: "Empresas (SEC)" (Companies), "Mercados y economía" (Markets and economy; 172 series at the time, 812 now) and "Mis archivos" (My files); with the data map (`GET /api/datos`).
9. ⬜ Step-1 series search with suggestions ("oro", "petróleo"…) and categories with icons.
10. ⬜ Edit the piece with chat and with controls at the same time without them colliding (today, touching the steps rebuilds the piece).
11. ⬜ Accessibility: visible focus, screen readers in the chat, contrast.

## P3 · Chat
12. ⬜ More chat tools: change a series' color, add/remove moments, duplicate the piece in another format, compare two companies.
13. ⬜ The chat should be able to **explain the source of each figure** ("where does this 79.3 come from?") by reading the verification report.
14. ⬜ Per-piece history (save the conversation next to the spec).

## P4 · Visual / cinema
15. ⬜ Light paper-like background (Harris/Caspian) as a fourth theme.
16. ⬜ Point-to-point mode in lines, flags at the end of each series, dashed baseline.
17. ⬜ Horizontal ranking and pictograms as native types; sound track (hit on every moment).
18. ⬜ Sankey with quarter-to-quarter comparison (morph from one Q to the next).

## P5 · Quality and operations
19. ⬜ A single suite: `npm test` that runs prueba.mjs, prueba-plantillas, prueba-tablas and prueba-trimestres.
20. ⬜ Weekly backup of `catalogo/` and `specs/`; disk limit for `datos/` (today ~gigabytes because of the SEC caches).
21. ⬜ Single startup: one icon that brings up both the studio and the updater (today they are two processes and may duplicate work).
22. ⬜ Document every contract change in `CLAUDE.md` (learnings) and in `docs/`.

## Night work
- **Who:** (a) the 24/7 updater (`servidor/vivo.mjs`) builds the stock-market library between 1:00 and 6:00 with no intervention; (b) a scheduled Claude session (`rtl-trabajo-de-noche`, 1:07 a.m.) goes through this list in order. See [NIGHT_WORK.md](NIGHT_WORK.md).
- **Rules for the night session:** read `CLAUDE.md` and this list; work from the highest ⬜ task downward; do not edit `datos/` by hand; run the tests before every commit; never delete work; if something needs a decision from the owner, write it in the log and move on to the next; when done, update this list (✅/⬜) and write the log with: what was done, paths, what the owner should review, what was left out.
- **Honest limit:** it only runs while the PC is on and the Claude app is open.

## Done on 2026-11-04 (research + new models)
- ✅ Web research: [research/VISUALIZATION_RESEARCH.md](research/VISUALIZATION_RESEARCH.md) (chart-choice rules, 20 models, open data sources, reel rules).
- ✅ New models: slope, bump, treemap, waffle. Log scale declared on screen; waffle sums to 100 by largest remainder; treemap lists small items without cutting figures.
- ✅ `servidor/visualizador.mjs` + MCP tool `proponer_visualizaciones` ("propose visualizations"): picks charts from the shape of the data, builds up to 4 distinct options and discards those that fail accuracy/text checks.
- ⬜ Next (see "What to implement first" in the research doc): dumbbell/lollipop, fan chart, 9:16 safe-zone validator, on-screen source/date layer, key-less FRED/World Bank/IMF/Eurostat connectors, a "Surprise me" button in the interface.

## Done on 2026-11-04 (second batch)
- ✅ New models: lollipop (categories) and diverging (% change on a common scale). Total models at that point: 16.
- ✅ TikTok/Reels safe zone: `auditarColisiones` returns `zonaSegura` (a separate warning); in vertical all models now come out with 0 warnings (boxes at 66–72 % of the width; vertical waterfall = horizontal rows).
- ✅ Interface: icons for the new models and "★ Recomendada: …" ("Recommended: …") label (endpoint `/api/recomendar`) in step 2.
- ✅ Key-less connectors (agent): World Bank, IMF, Eurostat, US Treasury, TRM Colombia; 13 new series (172 → 185). `node scripts/prueba-conectores.mjs`.
- ✅ [research/ANIMATION_RESEARCH.md](research/ANIMATION_RESEARCH.md): 15 techniques with parameters, 22 amateur/pro tests, 30/45/60 s scripts.
- ⬜ **Vertical typography**: text in the older models (19–26 px on a 1080-wide canvas) is small for phones; the research suggests ≥48 px for labels [hypothesis from a blog]. It must be raised model by model and re-audited (the auditor measures registered boxes: if the font grows, the box must grow too). *(Addressed afterwards by the design system and `scripts/prueba-calidad.mjs`; see the status block at the top.)*
- ⬜ Automated tests for the amateur/pro checklist (§2 of the animation research): linear easing, text <3 s, >1 protagonist, contrast.
- ⬜ Vertical Sankey is cramped (intermediate nodes with small labels).

## Queue — open-source integrations
Source: [research/OPEN_SOURCE_SURVEY.md](research/OPEN_SOURCE_SURVEY.md) (permissive licenses only: MIT, BSD, ISC, Apache-2.0, CC0). Vendor code into `motor/vendor/` with its license header and list it in `THIRD_PARTY_LICENSES.md`. Keep determinism (no `Math.random()`), run `npm run prueba`, `scripts/prueba-calidad.mjs` and `npm run gallery`, and compare frames before/after. Do them in this order.

- [ ] 1. Axis ticks: replace `ticksNum` (`motor/nucleo.js`) with the d3-array `tickIncrement`/`ticks` algorithm (ISC) + `nice()` of the domain; keep "1-2-5 only, declared decimals".
- [ ] 2. Text fitting in `motor/diseno.js`: wrap, then shrink to the per-format minimum, then catalog short name; use `…` only as last resort; the collision auditor must see the final boxes.
- [ ] 3. Deterministic 1-D label relaxation (labella.js idea, Apache-2.0; fixed iteration count) with leader lines for sankey, treemap small cells and bump/ranking end labels.
- [ ] 4. Sankey: d3-sankey layout (BSD-3) transposed for 9:16, labels outside the nodes; keep the current layout as fallback; update "Known issues".
- [ ] 5. Palettes: viridis/cividis + light-neutral diverging scale from d3-scale-chromatic (read its full NOTICE first); add culori (MIT) color-blind simulation to `scripts/prueba-calidad.mjs` (dev only); print extreme values on the calendar heatmap.
- [ ] 6. Lines: `curveStep` for rate-like series and opt-in `monotoneX` for sparse series (d3-shape, ISC); always declared on screen.
- [ ] 7. Long lines: per-pixel-column min/max decimation (own code) keeping every extreme exactly.
- [ ] 8. Treemap: d3-hierarchy `resquarify` (ISC) for quarter-to-quarter stability (also unblocks item 18 above) + semantic colors instead of one hue per cell.
- [ ] 9. New models inspired by RAWGraphs (Apache-2.0): beeswarm (dodge), ridgeline, streamgraph.
- [ ] 10. Spikes: 2x supersampled render, temporal sub-frame blur, declared LOESS trend (d3-regression, BSD-3).
- [ ] 11. Create `THIRD_PARTY_LICENSES.md` and a test that fails if a vendored file lacks its license header.
