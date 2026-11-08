# GitHub review: new or better projects for RTL output

Date: 2026-11-08. Method: `gh search repos` (filters `--updated=">2025-11-08"`, topic and keyword queries) and `gh api repos/<owner>/<repo>` (stars, push date, archived) plus `gh api repos/<owner>/<repo>/license` (first lines of the LICENSE file) for every repo whose SPDX id came back `NOASSERTION`/`none`. Stars and dates are snapshots from today. **No third-party code was downloaded or run.** Judgments about "what it would improve" come from READMEs and from reading `docs/research/*`, `motor/*` and the gallery frames (`carrera-h`, `historia-h`, `ranking-v`, `pendiente-h`).

Already covered, NOT repeated here: everything in `OPEN_SOURCE_SURVEY.md` (47 repos), the six integrations in `INTEGRATION_LOG.md` (ticks, scales, treemap, Sankey, label relaxation, curves) and `THIRD_PARTY_NOTICES.md`. Verdicts below only add to that.

## Honest summary

1. The market did not produce a new engine that fits RTL (frame-pure canvas, audited numbers, safe zone). Most new repos are Python/R wrappers, React dashboards, AI "skills" with 0-20 stars, or disk-usage treemaps.
2. Real new finds are **small**: one 2-D label-avoidance technique (its repo is unlicensed, so idea only), one text-layout library (MIT, optional), a Vizzu-style chart-to-chart morph (Apache-2.0, idea only), and palette data (Okabe-Ito, Paul Tol) for the color-blind test.
3. Locale work (d3-format, date-fns, CLDR) is **not needed**: `motor/nucleo.js` `fmtNum` already goes through `Intl.NumberFormat` with `es-CO`/`en-US` (`motor/idioma.js`). d3-format ships `es-ES`/`es-MX`/`es-BO` only, no `es-CO`, so it would be a step back.
4. The two defects still visible in frames that GitHub can help with are the jagged long daily line (`historia-h.png`, survey item D7, never done) and 2-D label collisions on line ends / callouts (only 1-D relaxation exists).

## Candidates (acceptable licenses)

Effort: S < 1 day, M 1-3 days, L > 3 days. "License verified" = the LICENSE file was opened, not only the API field.

| Repo | License verified | Last push | Stars | Concrete problem in RTL output | Effort | Verdict |
|---|---|---|---|---|---|---|
| uPlot idea (leeoniya/uPlot) | MIT (survey, 2026-10-30) | 2026-10-30 | 10.6k | `historia-h.png`: 6,000+ daily points drawn one by one, fuzzy/jagged line near 2009-2012 and 2020-2023. Per-pixel-column min/max keeps every extreme and removes aliasing. Survey item 7, still not done. | S | **Integrate now** (own code, no copy) |
| kevinschaul/avoid-overlap | **no LICENSE file** (API 404) | 2026-03-16 | 10 | Technique only: "choices" (try a list of candidate positions, keep the first non-colliding combination) and "nudge". RTL has 1-D `relajar1D` only; line-end labels and callouts that collide in 2-D just get pushed. | S-M | **Queue as an idea**: reimplement `choices` from the README description, do not read/copy code |
| chenglou/pretext | MIT (LICENSE text read, "Copyright (c) 2026 Pretext contributors"; API says NOASSERTION) | 2026-10-15 | 51k | Pure-JS text measure + line breaking (Intl segmentation, many scripts) without DOM. RTL already measures with `ctx.measureText`; `envolver` (`motor/diseno.js`:115) still cuts with `…` (open item in INTEGRATION_LOG §5). Pretext would fix break opportunities (hyphens, CJK) but not the truncation policy. | M | **Queue** (not needed to stop `…`; revisit if CJK/long compound names appear) |
| adobe/leonardo | Apache-2.0 (API) | 2026-07-08 | 2.2k | Generates color ramps for a target contrast ratio. Could derive the light-paper variant (#DAD5D0, STYLE_REFERENCES P1.5) with WCAG-checked inks. | M | **Queue** (needs a paper theme first) |
| color-js/color.js | MIT (API) | 2026-11-03 | 2.3k | APCA contrast and OKLCH for the contrast audit. `culori` is already the dev dependency; two color libs would be redundant. | S | Discard (duplicate of culori) |
| Descanonge/tol_colors | BSD-3-Clause (API) | 2026-07-16 | 41 | Python package; its value is the Paul Tol qualitative palettes (bright, muted, vibrant, high-contrast), color-blind safe. Python code unusable; only the published hex values would be used. | S | **Integrate** hex values into the quality test as a reference (see top 3) |
| Okabe-Ito palette (Okabe & Ito 2008, 8 hex values, no repo) | public values, no license text; credit given | n/a | n/a | RTL's categorical palette (gold/teal/purple/stone, `motor/nucleo.js` `PALETA`) is only CVD-tested for the divergent and sequential scales (`INTEGRATION_LOG` §2), not for the categorical set drawn side by side (`carrera-h`: gold vs teal vs purple). | S | **Integrate** as a test reference |
| vizzuhq/vizzu-lib | Apache-2.0 (LICENSE read) | 2026-04-20 | 2.0k | Morph between chart types with the same data (bars to stacked to area) is STYLE_REFERENCES P2 item 8 ("morfa"). Vizzu is C++/WASM with its own clock: cannot be frame-seeded by RTL, so only the interpolation design is useful. | L | **Queue as ideas** (read docs on "keyframe" morph rules) |
| nowthis/sankeymatic | ISC (API, header read) | 2026-07-13 | 1.4k | Mature Sankey UI with label placement and flow-color rules; same d3-sankey base RTL already vendors. Ideas for the horizontal Sankey label plates. | M | Ideas only |
| ricklupton/d3-sankey-diagram | MIT (LICENSE read) | 2026-11-05 | 123 | Handles loops, ranks, and layered label placement. RTL tables are DAGs, so no gain today. | M | Queue (only if a table with a cycle appears) |
| walterra/d3-milestones | Apache-2.0 (LICENSE.md read; API says NOASSERTION) | 2026-11-02 | 204 | Alternating above/below milestone stems. RTL's `llamada` already covers events on a line; layout of several close milestones (Fed balance sheet: 2008, 2020, 2022) could borrow the alternating rule. | S | Ideas only |
| javaeer/bar-chart-race | MIT (LICENSE read) | 2026-10-12 | 2 | Canvas 2D, 9:16, PNG sequence export, "rank decoupled from entry count" and candidate pruning (many entities). Same stack as RTL; useful only when `carrera` gets more than ~10 series. Algorithm credits Bostock's ISC bar-chart-race. | S | Ideas only |
| hatemhosny/racing-bars | MIT (API) | 2026-06-25 | 132 | Race with overtakes and highlighting; DOM/SVG, not seekable. | n/a | Ideas only |
| iart-ai/data-animation-skills | MIT (API) | 2026-06-22 | 18 | Claude Code skills that turn CSV into data videos. Same goal, far less rigor (no number audit). Might hold useful prompt wording. | S | Ignore |
| observablehq/plot | ISC | 2026-11-05 | 5.4k | Already in survey (IDEAS). Still the best source for `dodge` (beeswarm) if a new model is added. | M | Unchanged: queue |

## Discarded, with reason

| Repo | License (as read) | Reason |
|---|---|---|
| kevinschaul/avoid-overlap | none (no LICENSE file) | Cannot copy or adapt code. Technique can be re-derived from its README. |
| slowkow/ggrepel | GPL-3.0 | R package, copyleft; algorithm reference only. |
| eclarke/ggbeeswarm | GPL-3.0 | R, copyleft. |
| wilkelab/ggridges | GPL-2.0 | R, copyleft. |
| Zxilly/go-size-analyzer, adileo/squirreldisk | AGPL-3.0 | Treemap apps (disk usage), AGPL, not a library for this use. |
| windirstat, qdirstat, MangoDisk | GPL | Disk-usage tools, not reusable. |
| apexcharts/apexcharts.js | "other" in API (commercial-use tier; not read in full) | Not verified permissive; DOM/SVG with timers, not frame-pure. |
| NorthwoodsSoftware/GoJS | proprietary ("other") | Paid, discard. |
| holoviz/colorcet | "other" (CC-BY-4.0 in practice, not verified) | Python; attribution license and not needed; viridis already vendored. |
| unicode-org/cldr-json | Unicode License V3 (read) | Permissive but unnecessary: `Intl` already ships CLDR data in Node/Chrome. Vendoring it would add MBs for nothing. |
| mapbox/polylabel | ISC (read; API NOASSERTION) | Already in survey as IDEAS; no new reason to integrate (RTL shapes are rectangles/sectors). |
| mertapp1122/clauderemotion, sirioberati/YouTube-AI-Motion-Graphics | no license / MIT | Remotion based (Remotion license issue, see survey) or HTML templates; no data audit. |
| formatjs/formatjs, date-fns/date-fns | API reports none (404 on license endpoint; repos are MIT in practice, not verified here) | Not needed; `Intl` already covers es-CO and month names (`motor/idioma.js`). |
| Any Python/R-only package (bumplot, ridgeplot, rankflow, floweaver, SwarmMakie, tol_colors code) | MIT/BSD mostly | Python/R/Julia, cannot run in `motor/` (zero-dependency browser/Node). Concepts only. |

## What was NOT found / limits of this search

- `gh search repos` requires every word to match; multi-word queries often returned nothing (e.g. "number format locale intl", "label placement overlap", "d3 annotation callout"). I used topic and single-word queries instead; coverage of niche repos is therefore partial. The search API hit its 30-per-minute limit once and was retried after the reset.
- No new maintained label-placement library with a permissive license appeared; the only one found (avoid-overlap, 10 stars) has no license.
- No new Sankey/treemap/bar-race project showed activity or quality that beats the already vendored d3 modules.
- Stars measure popularity, not output quality; none of these were rendered.
- Licenses reported by the API as permissive but whose LICENSE file I did not open: apexcharts ("other"), colorcet ("other"), vizzu (opened: Apache-2.0), leonardo (API only), tol_colors (API only), racing-bars (API only), iart-ai (API only).

## Top 3 to integrate tonight (all S, in `motor/` or the test script)

All keep the contract: pure function of `(plan, time)`, no `Math.random`, no change to any value, `npm run prueba` and `scripts/prueba-calidad.mjs` green, `scripts/generar-galeria.mjs` before/after.

1. **Per-pixel-column min/max decimation for long lines** (uPlot idea, own code, no vendor).
   - File: `motor/capas.js`, function `linea` (line 129). Reduce each pixel column to its min and max point before building the path; keep first/last points; never for series shorter than ~2x the plot width.
   - Visible: `docs/gallery/historia-h.png` and `-v.png` (Fed balance sheet, daily points): clean line with every spike (2008, 2020, 2022 peaks) preserved exactly.
   - Test: extremes of the decimated path equal the extremes of the data (assert in `scripts/prueba-calidad.mjs`).

2. **Color-blind check of the categorical palette using Okabe-Ito and Paul Tol hex values as references** (no code copied, credit in `docs/THIRD_PARTY_NOTICES.md`).
   - File: `scripts/prueba-calidad.mjs` (extend the culori block at line ~153, add the pairwise CIEDE2000 of the 4-6 categorical colors in `PALETA`, `motor/nucleo.js` line 25, under deuteranopia/protanopia/tritanopia).
   - Visible: only if a pair fails (gold vs teal vs purple lines in `carrera-h`, `pendiente-h`, `bump-h`); then the fix is a lightness shift of one color, which does show in frames. If all pairs pass, the result is a documented guarantee.

3. **2-D "choices" label placement for line-end labels and callouts** (idea from avoid-overlap's README, reimplemented; its code is unlicensed and must not be read for copying).
   - File: `motor/etiquetas.js` (new `elegirPosicion(cajas, candidatos)` next to `relajar1D`, deterministic greedy over a fixed candidate list: right, above, below, left, each with a leader line), first used in `motor/capas.js` where end labels of multi-series lines/bump are placed.
   - Visible: `bump-h.png`, `pendiente-h.png`, multi-series `linea` ends where labels currently stack or shift only vertically.
   - Effort is S only if limited to end labels; widening to every layer is M. If time is short tonight, swap it for item 1 plus item 2 and leave this for the queue.
