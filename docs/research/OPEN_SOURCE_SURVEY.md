# Open-source survey: what can make RTL's output better?

Date: 2026-11-04. Scope: 47 repos/libraries checked. Stars, last push and SPDX id come from the GitHub API on the survey date (`gh api repos/<owner>/<repo>`); for every repo whose API license was `NOASSERTION`/`none` the LICENSE file was read. "Better than RTL / lacks vs RTL" is my assessment from the READMEs and prior knowledge; **no third-party code was run or tested** in this survey. Items marked (unverified) must be checked before relying on them.

RTL constraints used for the verdicts: zero-dependency canvas-2D engine in `motor/` (ES modules, no build), frame = pure function of `(plan, time)`, every figure traceable, collision audit + reels safe zone, and **permissive licenses only** (MIT, BSD, ISC, Apache-2.0, CC0, OFL) because David monetizes the output.

## Executive summary

1. No open-source project replaces RTL: none combines exact-number verification, frame-pure determinism, a collision audit and a reels safe zone. Most chart libraries animate with timers/DOM and cannot be seeked frame by frame.
2. The real gain is in **small, permissive math/layout pieces** copied into `motor/` (vendored with their license header), not in swapping the engine.
3. Best value / lowest risk: **d3-array tick algorithm + `nice()`** (ISC) for the axis ticks, and **d3-shape `curveStep`/`monotoneX`** (ISC) for rate-like or sparse series.
4. The biggest visible defects (vertical Sankey, truncated `…` labels, unlabeled treemap cells) are *label-placement* problems: take **labella.js / d3fc-label-layout ideas** (Apache-2.0 / MIT) and write a 1-D relaxation + wrap/shrink-to-fit, not more truncation.
5. The calendar heatmap's dark mid-tone is nearly the background color and red/green is the worst pair for color-blind viewers: use **d3-scale-chromatic** (ISC; palettes carry their own notices) + **culori** (MIT) to build CVD-safe scales and add a color-blind simulation to `prueba-calidad.mjs`.
6. **d3-sankey** (BSD-3) gives a battle-tested node relaxation; transposed it can fix the vertical layout, but the label code is still ours.
7. **d3-hierarchy** (ISC) `resquarify` keeps treemap rectangles stable between quarters, which the roadmap's "Q-to-Q morph" needs.
8. **Remotion** is source-available with a company license for larger for-profit entities, **GSAP** uses a non-OSI "no charge" license, **OWID Grapher** is now view-only, **Theatre.js studio**, **Elastic Charts**, **Highcharts** are not clean: discard as dependencies.
9. Revideo / Motion Canvas (MIT) and manim (MIT) are good for ideas on sequencing and easing, but would mean a rewrite; not recommended as the engine.
10. Output-quality ideas worth a spike: min/max-per-pixel decimation for long lines (exact extremes kept), 2x supersampled render, and temporal sub-frame blur for fast moves.

## Defects seen in rendered frames (`docs/gallery/*.png`) and in `docs/MODELS.md` "Known issues"

| # | Defect (evidence) | Cause in RTL | Candidate fix |
|---|---|---|---|
| D1 | `sankey-v.png`: labels overlap nodes and each other ("Utilidad op…" over bars, "Utilidad br…"), many cut with `…` | 4 columns in 810 px; labels centered on narrow nodes; truncation as the only fallback | transposed d3-sankey layout + 1-D label relaxation + wrap/abbreviation |
| D2 | `treemap-h.png`: "Tecnología e infra…", "Impuestos US$ 6,2 mi…", small cells have no label, rainbow colors without meaning | label drawn at fixed size; hard `…` cut; one color per cell | fit-text (wrap then shrink to min), callout lines for small cells, semantic palette |
| D3 | `calendario-v.png`: no figures, mid-tone cells (near 0 %) almost equal to the background; red/green diverging | diverging scale passes through the dark theme color | sequential/diverging perceptual scale with a lighter neutral, CVD-safe; value printed for extremes |
| D4 | Subtitles / series names cut with `…` (correlation, ranking, bump `Bono del Tesoro 10 años (diari…)`) | `envolver` cuts with `…` when a word does not fit (`motor/diseno.js`:115) | wrap + `corto` alias from catalog + shrink-to-fit |
| D5 | Axis ticks: `ticksNum` uses 1-2-5-10 steps with `span/step <= max` and no `nice()` of the domain | `motor/nucleo.js`:99 | d3-array `ticks`/`tickStep` + `nice` |
| D6 | Lines are straight segments; step data (policy rates) and sparse series look jagged | no curve option | `curveStep`, optional `monotoneX` for sparse series, declared on screen |
| D7 | Very long daily series (tens of thousands of points) cost render time and can alias | all points drawn | per-pixel-column min/max decimation (keeps every extreme exactly) |
| D8 | Colors: categorical palette is brand-based, not checked for color-blindness; heatmap red/green | no CVD test | culori CVD simulation in the quality test |

## Survey tables

Verdict key: **INTEGRATE** (copy/vendor a specific part, with license header), **IDEAS** (read, reimplement, do not copy), **DISCARD** (license, weight or non-determinism).

### (a) Animated-chart and charting libraries

| Repo | Stars | Last push | License (read) | Does better than RTL | Lacks vs RTL | Verdict |
|---|---|---|---|---|---|---|
| observablehq/plot | 5.4k | 2026-11-03 | ISC | concise mark grammar; `dodge` (beeswarm), hexbin, good default scales/ticks, text wrapping options | SVG/DOM, no frame-seek animation, no number audit | IDEAS; port `dodge` later |
| vega/vega | 12k | 2026-11-02 | BSD-3-Clause | declarative scenegraph, canvas renderer, label transforms | no determinism contract, heavy, own runtime | IDEAS |
| vega/vega-lite (+ vega-embed, altair) | 5.5k | 2026-11-02 | BSD-3-Clause | grammar of graphics, automatic axis/legend rules | animation limited; weight | IDEAS |
| vega/vega-label | 19 | 2020-07-13 | BSD-3-Clause | tiny bitmap-based label placement | stale | IDEAS (algorithm) |
| apache/echarts | 68k | 2026-10-13 | Apache-2.0 | huge chart set, `labelLayout` (hideOverlap/moveOverlap), races | timer-driven animation, 1 MB, cannot be audited | IDEAS (label layout rules); DISCARD as engine |
| chartjs/Chart.js | 68k | 2026-10-23 | MIT | canvas, plugin ecosystem | real-time animation loop, basic chart set | DISCARD |
| recharts/recharts, plouc/nivo, airbnb/visx | 28k / 14k / 21k | 2026-11 / 2026-07 / 2026-06 | MIT each | nice React defaults; visx has low-level primitives (legend, axis) | React/DOM, no video pipeline | DISCARD (visx: IDEAS for axis/legend) |
| plotly/plotly.js | 18k | 2026-10-29 | MIT | 3-D, financial charts | WebGL/DOM, heavy, non-seekable | DISCARD |
| bokeh/bokeh, matplotlib, plotnine, vega/altair | 20k / 23k / 4.8k / 10k | 2026-11 | BSD-3 / PSF-style (own LICENSE file) / MIT / BSD-3 | scientific rigor, great tick/legend logic | Python dependency; not canvas/web | DISCARD (matplotlib/plotnine docs: IDEAS) |
| thomasp85/gganimate | 2.0k | 2025-09-04 | LICENSE file is the CRAN `YEAR/COPYRIGHT HOLDER` stub (GPL-compatible template, **unverified**) | clean tweening grammar (`ease_aes`, `shadow_wake`) | R only | IDEAS |
| dexplo/bar_chart_race | 1.5k | 2024-06-27 | MIT | smooth rank interpolation between frames | Python/matplotlib, stale | IDEAS (rank tween) |
| rawgraphs/rawgraphs-app (+ charts lib) | 9.1k | 2026-10-08 | Apache-2.0 | ~30 chart types RTL lacks: alluvial, beeswarm, ridgeline, streamgraph, sunburst, violin | React/SVG, no animation, no audit | IDEAS; port 2-3 as new models |
| tradingview/lightweight-charts | 17.8k | 2026-11-04 | Apache-2.0 (NOTICE/attribution requirement per its README, unverified) | pixel-snapped candles, crisp canvas | live-data oriented, not seekable | IDEAS (pixel snapping) |
| leeoniya/uPlot | 10.6k | 2026-10-30 | MIT | fastest canvas line charts, min/max decimation, tick logic | no animation | IDEAS (decimation, ticks) |
| d3fc/d3fc | 1.4k | 2024-09-28 | MIT | canvas/WebGL series, `label-layout` (greedy, annealing, remove-overlaps) | stale, D3 v5-era | IDEAS (label strategies) |
| elastic/elastic-charts | 400 | 2026-11-04 | SSPL + Elastic License 2.0 (read) | n/a | non-permissive | **DISCARD** |
| Highcharts | n/a | n/a | proprietary, paid (knowledge, not fetched) | polish | paid | **DISCARD** |
| Flourish, Datawrapper (SaaS) | n/a | n/a | closed SaaS | benchmark for look and bar-chart-race UX | not code | IDEAS (their academy/blog) |

### (b) Math and layout pieces

| Repo | Stars | Last push | License (read) | Does better than RTL | Lacks vs RTL | Verdict |
|---|---|---|---|---|---|---|
| d3/d3-array (+ d3-scale `nice`) | 465 / 1.6k | 2026-11-03 | ISC | `ticks`, `tickStep`, `nice`, `bin`, `quantile`; better "pretty" ticks (fixes D5) | n/a (pure math) | **INTEGRATE** `ticks`/`tickIncrement`/`nice` (~60 lines) |
| d3/d3-shape | 2.5k | 2026-11-03 | ISC | `curveStep`, `monotoneX` (Steffen), `catmullRom`, `bumpX` (fixes D6) | SVG-path oriented (use its canvas context mode) | **INTEGRATE** `step` and `monotoneX` as opt-in, declared |
| d3/d3-hierarchy | 1.3k | 2026-11-03 | ISC | `treemapSquarify`, `resquarify` (stable between updates), `pack`, `partition` | none | **INTEGRATE** `resquarify` for Q-to-Q treemap; IDEAS otherwise |
| d3/d3-sankey | 0.9k | 2023-11-13 | BSD-3-Clause | iterative node relaxation, `justify`/`left`/`right` alignment, link widths exact to value | horizontal only; labels not handled | **INTEGRATE** layout (transpose for vertical) |
| d3/d3-scale-chromatic | 0.8k | 2026-11-03 | ISC header read; bundled palettes carry their own notices (ColorBrewer Apache-2.0, viridis family CC0 — the rest of LICENSE not read, unverified) | viridis/cividis (CVD-safe), perceptual diverging | none | **INTEGRATE** a few palettes (fixes D3) after reading the full NOTICE |
| d3/d3-format, d3/d3-time-format | 0.6k / 0.3k | 2026-11-03 | ISC | SI prefixes, rounding to significant digits, locales (es-ES, es-MX; no es-CO) | RTL's `fmtNum` already does es-CO | IDEAS |
| d3/d3-interpolate, d3/d3-ease | 0.5k / 0.6k | 2026-11-03 | ISC / BSD-3 | full easing set, Lab/Hcl color interpolation | RTL avoids bounce/elastic by policy | IDEAS (Hcl interpolation for heatmap) |
| d3/d3-force | 2.0k | 2026-11-03 | ISC | collision/relaxation for labels and beeswarm | iterative, needs fixed ticks to stay deterministic | IDEAS |
| color-js/color.js | 2.3k | 2026-11-03 | MIT | CSS Color 4, OKLCH, **APCA** contrast, gamut mapping | none | IDEAS / optional INTEGRATE for contrast audit |
| Evercoder/culori | 1.2k | 2026-10-15 | MIT | OKLCH, **color-blindness simulation** (`filterDeficiency*`), interpolation | none | **INTEGRATE** only in the test script (dev dependency), not in `motor/` |
| gka/chroma.js | 10.6k | 2026-10-24 | BSD-3 header read; API reports `NOASSERTION` (extra notices, unverified) | scales, Lab ramps, `colorbrewer` | license ambiguity | IDEAS (prefer culori) |
| axismaps/colorbrewer | 1.1k | 2026-02-25 | Apache-2.0 | classic palette set, CVD flags | data only | IDEAS (already inside d3-scale-chromatic) |
| twitter/labella.js | 3.9k | 2023-04-10 | Apache-2.0 | force-based 1-D label placement with leader lines (fixes D1/D2) | stale, small | **INTEGRATE** the algorithm (reimplement ~80 lines, keep NOTICE) |
| tinker10/D3-Labeler | 226 | 2017-11-23 | MIT | simulated-annealing label placement | stale, not deterministic by default (needs seeded RNG) | IDEAS |
| mourner/simplify-js | 2.4k | 2022-11-14 | BSD-2-Clause | RDP simplification | changes the geometry (violates "no interpolation/alteration") | IDEAS; use min/max decimation instead |
| sveinn-steinarsson/flot-downsample (LTTB) | 331 | 2024-06-25 | **no LICENSE file** | LTTB reference | cannot copy; also drops extremes | IDEAS only (write min/max decimation from scratch) |
| HarryStevens/d3-regression | 172 | 2026-09-13 | BSD-3-Clause | LOESS, linear, polynomial regression | trend line is an interpretation: must be declared on screen | **INTEGRATE** LOESS for `dispersion` (declared) — optional |
| veltman/flubber | 6.9k | 2022-11-14 | MIT | shape morph between arbitrary paths | stale; morphs invent intermediate geometry | IDEAS |
| pshihn/rough, rough-stuff/rough-notation | 21k / 9.7k | 2024 | MIT | hand-drawn look | off-brand; seed needed for determinism | DISCARD |
| mapbox/polylabel | 1.6k | 2026-06-25 | ISC | pole of inaccessibility: best label point inside irregular shapes | RTL shapes are mostly rectangles/sectors | IDEAS (donut sectors) |
| Kcnarf/d3-beeswarm | 52 | 2022-08-16 | WTFPL (read; not an OSI license) | beeswarm layout | license ambiguity | **DISCARD** (use Plot `dodge` idea, ISC) |
| mbostock/d3-bboxCollide | 2 | 2016-10-07 | Unlicense | bbox collision force | tiny, D3 v4 | IDEAS |
| susielu/d3-annotation | 762 | 2022-12-03 | Apache-2.0 | callout/bracket/badge annotation types with elbow connectors | stale, SVG | IDEAS (bracket/elbow callouts) |
| jasondavies/d3-cloud | 4.0k | 2026-10-30 | BSD-3-Clause | word cloud | not an RTL use case | DISCARD |

### (c) Motion and video rendering

| Repo | Stars | Last push | License (read) | Does better than RTL | Lacks vs RTL | Verdict |
|---|---|---|---|---|---|---|
| remotion-dev/remotion | 70.7k | 2026-11-04 | custom "Remotion License": free for individuals and small companies; company license for larger for-profit entities (read) | mature React-to-video, frame-pure model | non-OSI, company tier; same idea RTL already has | **DISCARD** as dependency; IDEAS |
| motion-canvas/motion-canvas | 19.7k | 2026-07-02 | MIT | generator-based timelines, editor, MP4 export | TS/Vite stack, rewrite, no data audit | IDEAS (sequencing) |
| midrender/revideo (Motion Canvas fork) | 4.2k | 2026-07-15 | MIT | headless programmatic rendering API | same | IDEAS |
| 3b1b/manim, ManimCommunity/manim | 96k / 42k | 2026-09 / 2026-11 | MIT / MIT | math-grade animation primitives (`Create`, `LaggedStart`, rate functions) | Python, Cairo/OpenGL, no safe zones | IDEAS |
| greensock/GSAP | 30k | 2026-11-04 | "Standard 'no charge' license" (package.json, read; custom, not OSI) | best-in-class tweening | non-OSI terms (restriction on visual-animation-builder tools: (unverified)); RTL needs no tween engine | **DISCARD** |
| juliangarnier/anime | 74k | 2026-11-02 | MIT | v4 timelines with seek | DOM-oriented | IDEAS |
| Popmotion/popmotion | 20k | 2024-03-12 | repo shows no LICENSE file via API (npm says MIT, **unverified**), stale | analytic spring solver (deterministic) | stale | IDEAS (spring math) |
| theatre-js/theatre | 12.9k | 2024-08-14 | Apache-2.0 at repo root; the studio package is reportedly AGPL (**unverified**) | timeline editor | mixed licenses, stale | **DISCARD** |
| rive-app/rive-wasm, airbnb/lottie-web | 1k / 32k | 2026 / 2025 | MIT / MIT | rich vector animation for icons/overlays | not for data; Rive editor is proprietary | DISCARD (no use case now) |
| puppeteer/puppeteer | 95.8k | 2026-11-04 | Apache-2.0 | same role as RTL's `playwright-core` (Apache-2.0) | nothing to gain | no change |
| tungs/timecut | 655 | 2023-07-18 | BSD-3-Clause | virtual-time capture (overrides Date/rAF) | RTL seeks frames directly; stale | IDEAS (not needed) |
| spite/ccapture.js | 3.8k | 2026-10-13 | MIT | in-browser WebM/PNG capture | lower quality than ffmpeg path | DISCARD |
| ffmpegwasm/ffmpeg.wasm | 18k | 2026-09-29 | MIT wrapper; bundled core license depends on build (**unverified**, may be GPL) | ffmpeg in browser | RTL uses native ffmpeg | DISCARD |
| Automattic/node-canvas, Brooooooklyn/canvas (skia) | 10.7k / 2.4k | 2026-11 | MIT (Brooooooklyn LICENSE read; node-canvas API shows none, **unverified**) | headless canvas in Node, no browser start-up | font/AA differences vs Chrome would change pixels | IDEAS (speed spike only) |

### (d) Explainer styles, guides, kits

| Repo | Stars | Last push | License (read) | Does better than RTL | Lacks vs RTL | Verdict |
|---|---|---|---|---|---|---|
| owid/owid-grapher | 1.6k | 2026-11-04 | **view-only**: "you may not copy, modify, distribute… or otherwise use any part of this codebase" without written permission (read; prior MIT history noted in the file) | best-practice timeline/entity charts | cannot be used | **DISCARD** (public design principles can still be read) |
| datawrapper/datawrapper | 1.5k | 2025-03-30 | no top-level LICENSE; README says the shared libs are MIT (mixed, **unverified per package**) | direct labeling, annotation rules, academy docs | not a full chart engine here | IDEAS (academy articles); verify before any code reuse |
| Financial-Times/chart-doctor | 3.4k | 2024-03-12 | MIT | Visual Vocabulary: question to chart mapping (RTL's `visualizador` already uses it) | design guide, not engine | IDEAS (already adopted) |
| UrbanInstitute/urbnthemes | 88 | 2026-08-28 | API shows none (**unverified**) | Urban style guide: type, colors, annotation rules | R/Python themes | IDEAS (style guide text only) |
| the-pudding/starter | 221 | 2023-03-15 | MIT | scrollytelling kit | web pages, not video | DISCARD |
| Reuters graphics kit, NYT graphics kits | n/a | n/a | repos not found via API (private/renamed, **unverified**) | n/a | n/a | not assessed |

## Recommended integration order

Effort: S < 1 day, M 1-3 days, L > 3 days. All code goes into `motor/vendor/` (or is reimplemented in `motor/`) with the original license header and an entry in a new `THIRD_PARTY_LICENSES.md`. Every item keeps the contract: pure function of `(plan, time)`, no `Math.random()`, run `npm run prueba` + `scripts/prueba-calidad.mjs` and re-render `scripts/generar-galeria.mjs` before/after.

| Order | Item | Effort | Risk | Benefit | Fixes |
|---|---|---|---|---|---|
| 1 | Axis ticks from d3-array (`tickIncrement`, `ticks`) + `nice()` of domain, keep the "1-2-5 only, declared decimals" rule | S | Low (pure math; golden-image diff) | cleaner, fuller axes everywhere | D5 |
| 2 | Text fitting: wrap, then shrink to a minimum size, then abbreviation from catalog; stop using `…` except as last resort | M | Low-Med (collision auditor must see the new boxes) | removes the most visible amateur tell | D4, D2, D1 |
| 3 | Label relaxation (labella-style 1-D force with leader lines; deterministic, fixed iterations) for sankey, treemap small cells, bump/ranking end labels | M | Med | labels readable and non-overlapping | D1, D2, D4 |
| 4 | Sankey layout via d3-sankey (BSD-3), transposed for 9:16 so flows run top to bottom with labels outside the nodes | M-L | Med (changes the look; keep old as fallback) | vertical Sankey usable | D1 |
| 5 | Palettes: d3-scale-chromatic viridis/cividis + a light-neutral diverging scale; culori CVD simulation in `prueba-calidad.mjs`; print min/max values on heatmap | M | Low | accessible, legible heatmaps, color-blind safe | D3, D8 |
| 6 | d3-shape `curveStep` (rates, policy data) and opt-in `monotoneX` for sparse series, always declared | S | Low | honest, nicer lines | D6 |
| 7 | Per-pixel min/max decimation (own code, inspired by uPlot) for long lines | S | Low (extremes preserved exactly) | faster render, no aliasing | D7 |
| 8 | d3-hierarchy `resquarify` for treemap Q-to-Q stability + semantic palette | M | Low | enables roadmap item 18 | D2 |
| 9 | New models inspired by RAWGraphs: beeswarm (Plot-style dodge), ridgeline, streamgraph | L | Low | broader model set | - |
| 10 | Spikes (optional, hypotheses): 2x supersampled render, temporal sub-frame blur, LOESS trend (d3-regression, declared) | M | Med | smoother motion/edges | - |

## What could not be verified

- Nothing was run; improvements are estimated from reading and from the rendered gallery frames.
- Licenses of bundled palettes in d3-scale-chromatic (beyond the ISC header), chroma.js extras, Datawrapper sub-packages, node-canvas, Popmotion, Theatre studio, ffmpeg.wasm core, lightweight-charts NOTICE and GSAP's usage restrictions were not fully read.
- Highcharts, Flourish and Datawrapper SaaS statements are from knowledge, not fetched.
- Reuters and NYT graphics kits were not found by API.
- Stars/dates are snapshots from 2026-11-04.
