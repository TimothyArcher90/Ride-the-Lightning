# Open-source integration log

Date: 2026-11-04. Input: [OPEN_SOURCE_SURVEY.md](OPEN_SOURCE_SURVEY.md) and the queue in [../ROADMAP.md](../ROADMAP.md). Licenses and vendored versions: [../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Before images: `docs/gallery/before/` (the committed gallery at the start of the session); after images: `docs/gallery/<model>-h|v.png`.

Rules kept in every item: permissive licenses only, vendored ES source with its LICENSE (no runtime dependency, no bundler, no network), no `Math.random`/`Date`/timers in layers, **no value is changed or interpolated** (smoothed curves are opt-in and declared on screen), tests green, frames inspected in both formats.

## 1. Axis ticks: d3-array `ticks` (ISC)  ·  done, but the visible gain is nil

- **Change**: `ticksNum` (`motor/nucleo.js`) now calls the vendored d3-array `ticks`, keeping the old cap (range ÷ step ≤ `max`, finest step that fits, so small axes do not fill with numbers).
- **Defect fixed** (measured over 20,000 pseudo-random ranges): **21 % of the old tick lists carried floating-point noise** (`0.6000000000000001`), which also polluted the step used to choose the declared decimals. The *set* of ticks is identical to the old one in all 20,000 ranges (the old 1-2-5 rule and d3's are the same family), so no axis in the gallery changed.
- **A first version that cut by tick count instead of by range ÷ step produced denser axes** (0…5,000 in steps of 1,000 on the bar chart; six crowded labels on the 140 px vertical panels). The gallery showed it, so it was changed back to the old cap: the lesson is that d3's `count` is a target, not a ceiling.
- **Evaluated and rejected**: `nice()` of the domain. Applied to the scatter plot it expanded the already-padded domain to x ∈ [-2,000, 6,000] and y ∈ [0, 20,000], wasting a third of the plot. The function was removed instead of left as dead code.
- **Test**: `prueba-calidad.mjs` §0b checks 400 ranges for exact decimals and the cap.

## 2. Color scales: d3-scale-chromatic (ISC + ColorBrewer) and culori (dev only)  ·  done

- **Defects**: the calendar heatmap's centre color was `mezcla(tarjeta, …, 0)`, contrast **1.11:1** against the background (the "0 %" cells vanished) and red/green was the colour-blind worst case (CIEDE2000 under deuteranopia = 11); the correlation matrix had the same dark centre; the treemap used eight unrelated hues with no meaning.
- **Change**: `motor/escalas.js`. Divergent scale = centre warm grey `#8A877F`, poles BrBG(0.15) ochre `#A56A1D` / BrBG(0.85) teal `#1D7F77`; constant lightness so the magnitude rides on saturation. Sequential scale = viridis, floor at 0.42 so no cell sinks into the dark background. The treemap now colours by **share of the total** (category tables carry no cost/benefit semantics, so none is invented). Numbers inside cells pick the ink (white or `#0A0A0A`) with the best contrast; with that pair every mid-tone reaches ≥ 4.5:1 (found by the test: the previous ink choice left two correlation cells at 4.4:1).
- **Tests added** (`prueba-calidad.mjs` §0b): every cell ≥ 3:1 against both background colours (worst 3.3:1); **negative control** showing the old centre fails (1.11:1); deuteranopia / protanopia / tritanopia pole separation ΔE2000 = 36 / 25 / 51 (old red/green under deuteranopia: 11); 11 consecutive legend steps ≥ 2.5 ΔE2000 under deuteranopia (divergent 2.9, sequential 2.9).
- **Not done**: printing the extreme values on the *vertical* calendar. Cells are ~38 px wide; a legible number needs a font under the vertical floor. Horizontal already prints every cell. cividis was not vendored (Battelle license, see notices).
- Images: `calendario-h/v`, `correlacion-h/v`, `treemap-h/v`.

## 3. Treemap: d3-hierarchy squarify / resquarify (ISC)  ·  done

- **Defects** (`before/treemap-h.png`): "Tecnología e infra…", "US$ 34,8 mil M · 1…", "Impuestos US$ 6,2 mi…", cells without any label, and a flat "Partes pequeñas" list with no link to the rectangles.
- **Change**: layout from d3 squarify with the golden ratio (landscape cells, text fits better) in `motor/arbol.js`. Labels: whole name wrapped (never `…`), then `value · %`, then value and % on two lines, then % only; whatever still does not fit gets a callout row under the map with a **colour swatch of its own cell**, spaced by the deterministic 1-D relaxation. Nothing is dropped: every figure remains visible.
- **Stability**: with `anterior` on every row the layout is built with the previous values and re-squarified with the current ones (`resquarify`), on by default (`estable:false` turns it off). Test over 200 random quarter pairs: mean cell displacement **16 px vs 142 px** with independent layouts; areas stay exactly proportional (error < 1e-9).
- The amazon-dollar example uses no `anterior`, so its picture does not use `resquarify`; the stability feature is covered by the test only.
- Images: `treemap-h/v`.

## 4. Sankey (vertical): d3-sankey (BSD-3-Clause)  ·  done

- **Defects** (`before/sankey-v.png`): labels over nodes and over each other, almost all cut with `…` ("Utilidad br…", "Costo de v…"), labels of two nodes drawn on top of one another, a sixth of the width unused.
- **Change**: `disenarSankeyV` runs d3-sankey with the axes swapped (flow runs top to bottom), nodes aligned by the table's own `nivel`. Ribbon thickness = value × one common scale (tested). Labels are placed in rows above the first level, below the others, with `relajar1D` and a leader line whenever a label is displaced; names wrap to 2-3 lines; the first and last rows get extra reserved space and the layout is redone if a label would not fit. All 11 labels of the NVIDIA example are present, none truncated, none over a node.
- **Horizontal**: untouched (same code path, same image).
- **Test**: `prueba-calidad.mjs` fails if any Sankey/treemap text contains `…`; Sankey ribbon-thickness check; the existing collision auditor passes in both formats.
- Limits: mid-level nodes carry the name only in vertical (the 40 px vertical floor makes a second line cost a whole row).
- Images: `sankey-v` (and unchanged `sankey-h`).

## 5. Label placement and `…`  ·  partial

- **Added** `motor/etiquetas.js`: `relajar1D` (own code, labella.js idea, fixed 120 iterations, tested on 300 cases: no overlaps, inside the limits) and `envolverEntero` (wraps by whole words; returns `null` instead of cutting).
- **Used in**: vertical Sankey, treemap, bump chart (end labels in horizontal and left labels now wrap to 2 lines: "Bono del Tesoro 10 años (diari…" is now two full lines), correlation matrix row labels (horizontal).
- **Left open**: `envolver` in `motor/diseno.js` and `cortar` elsewhere still truncate (ranking, titles/subtitles, vertical correlation rows and the rotated column labels). Changing `envolver` globally changes line counts and heights in every layer; it needs its own pass with the visual review of all 27 models.
- Images: `bump-h/v`, `correlacion-h/v`.

## 6. Line curves: d3-shape `stepAfter` / `monotoneX` (ISC)  ·  done

- `linea` accepts `curva: "escalon" | "monotono"` (default linear, validated in the compiler). `escalon` holds each value until the next data point (right for policy rates) and the head shows that held value, never an interpolated one; `monotono` is Steffen's monotone interpolation (never overshoots). Both print a one-line declaration under the chart ("ESCALONES: EL VALOR SE MANTIENE HASTA EL SIGUIENTE DATO" / "CURVA SUAVIZADA: SOLO UNE LOS DATOS").
- **Tests**: every vertex of the step path uses an existing data value; every Bezier segment of the monotone curve stays inside the min/max of its two data points.
- Checked on `fred_fedfunds` in both formats (no collision-audit problems). No gallery image changes because no gallery case enables it; default charts are byte-identical in logic.

## Not attempted (outside the requested six)

Queue items 7 (min/max decimation), 9 (beeswarm / ridgeline / streamgraph) and 10 (supersampling, sub-frame blur, LOESS).

---

# 2026-11-08 — "Two milestones" model, min/max decimation, colour-blind test of the series colours

Input: [REFERENCIA_NETSCAPE_CHATGPT.md](REFERENCIA_NETSCAPE_CHATGPT.md) (task A) and the top 3 of [GITHUB_REVIEW_2026-11-08.md](GITHUB_REVIEW_2026-11-08.md) (task B). Same rules as above: no value changed or interpolated, no `Math.random`, no paid API, nothing under `datos/` or `data/` touched by hand.

## A. `dos_hitos` / `two_milestones` (model 28)  ·  done

- **What it is**: one daily series seen from two milestone dates. Each milestone rebases the series to 100 at the close of its date; the two curves are aligned by **trading sessions since the milestone**, not by calendar date. Top panel: growth, base 100 (log axis by default when max/min > 5, linear otherwise, `escala` forces either). Bottom panel: drawdown from the running maximum. Tip labels with name + date, a session counter, peak and trough annotations, a shaded "no projection" block where the shorter series ends (translatable text), a live table (return, drawdown now, worst drawdown) that is swapped for two big figures at the end, and a configurable closing line ("Historical comparison, not a forecast").
- **Where**: layer `dos_hitos` in `motor/capas_extra.js` (`calcularDosHitos` is the pure computation, exported and tested); template `dos_hitos` in `servidor/plantillas_extra.mjs` (alias `two_milestones`); texts via `registrar('ch', …)` in es and en; compiler messages translated in `servidor/mensajes_en.mjs`; new top-level spec key `pendiente` (compiler error `pieza pendiente: …`) for pieces that must fail with a clear reason.
- **Every figure comes from the series**: the compiler report lists, per milestone, the row used, base value, sessions, return, current and worst drawdown, peak and dates (`informe.cifras`, type `hito`). `prueba-plantillas.mjs` recomputes them independently from the CSV and compares.
- **Demonstration data**: `fred_dtwexbgs` (nominal broad US dollar index, Federal Reserve, public domain), milestones 2008-09-15 and 2020-03-11. **The dates and their names are claims to confirm against a primary source before publishing**; they are marked as such in `specs/ejemplo_dos_hitos_dolar.json` and in the template note. Example folder: `examples/two-milestones-dollar/`; gallery: `dos-hitos-h/v`.
- **Netscape / ChatGPT**: `specs/ejemplo_dos_hitos_nasdaq.json` is saved with `pendiente: "pending open licence: …"` and fails with that message as its first error until an open daily Nasdaq-100 series exists. No Yahoo, no `fred_nasdaqcom`, none of the video's figures.
- **Improvements over the reference video** (see the analysis): collision-free labels (audited), contrast ≥ 4.5:1 measured on pixels, a single locale layer for every number and date, an x-axis title, a source footer, and the tip/peak/trough annotations placed by scoring candidate positions against the real curves (`prueba-calidad` and the collision auditor pass in both formats).
- **Vertical decision**: the 40 px name floor and the 72 % safe zone leave no right-hand gutter for tip labels (a 360 px plot would remain), so in 9:16 the names go in a two-row legend above the chart (colour dash + name + date) and the plot gets the full width. Horizontal keeps labels at the tip, in a gutter, joined to the head by a dotted guide.
- **Mistake caught while building**: previews rendered at half scale hid layout collisions that exist at 1080 px (the design system's type floors do not scale with `u`). The decisions above were taken from full-scale frames and the auditor, which runs at full size.
- **Limits**: needs a daily series (one row per session; the compiler refuses coarser data); the template is not in the studio's template list because it needs two named dates (queue in `ROADMAP.md`); it is a tool for the CLI, MCP and spec files.
- **Tests**: `prueba-plantillas.mjs` §2c (es/en × horizontal/vertical, independent recomputation, log/linear rule, error cases, the pending spec, the dollar spec), `prueba-calidad.mjs` (model added: type floors, contrast, safe zone, collisions, reading time, both formats), `prueba-idioma.mjs` (no Spanish drawn in English; no unresolved keys in Spanish).

## B1. Per-pixel-column min/max decimation in `linea`  ·  done

- **Defect** (VIX daily from FRED, 9,311 rows, `before/n3-decimacion-vix-antes.png`): the old fixed stride (`bucket`) skipped rows, so the 2020 peak was drawn at **79.13** while the data's real maximum is **82.69**, and the 2008 peak lost its top. The axis already included 82.69, so the line stopped short of its own scale.
- **Change**: `motor/decimar.js` `decimarPorColumna` (own code, uPlot idea, credited in the notices). From every pixel column it keeps the first, minimum, maximum and last REAL row, in chronological order; null rows split the line; nothing is interpolated. `linea` uses it when more than ~2 rows per pixel of plot width are visible and no `curva` is declared (`decimar: false` switches it off for A/B comparisons). VIX: 9,311 rows → 4,977 drawn points.
- **Test** (`prueba-calidad.mjs` §0c): synthetic series with an isolated peak, trough and null gaps — drawn max and min equal the data's exactly, per-column min/max equal, ≤ 4 points per column, first/last row present, gaps split the line, only real rows; on the real VIX series the drawn maximum is 82.69 and the old stride's was 79.13 (control).
- Images: `before/n3-decimacion-vix-antes.png` and `before/n3-decimacion-vix-despues.png`. The committed gallery does not change: `historia` (Fed balance sheet) has 1,248 weekly rows, below the threshold.

## B2. Colour-blind check of the series colours (Okabe-Ito and Paul Tol as references)  ·  done

- **Test** (`prueba-calidad.mjs` §0d): the four series colours of each of the three themes, pairwise CIEDE2000 under deuteranopia, protanopia and tritanopia (culori), minimum ΔE2000 = 8 (about four times the just-noticeable difference). The two reference palettes (Okabe-Ito without black, Tol "bright") are printed next to it: their weakest pairs are 12.6 / 11.3 (deuteranopia), 12.9 / 16.0 (protanopia), 11.0 / 10.7 (tritanopia).
- **Result**: all themes pass. The weakest RTL pair is teal `#50B5A2` against stone `#CBC6BC` under protanopia, **ΔE2000 = 8.3**, below the references' 12.9: it passes the floor but with little margin. No colour was changed (the teal is the brand's; the stone is the neutral fourth series). Mitigation already in the designs: lines carry direct labels, and signed numbers (+/−) never rely on colour alone.
- **Control**: an orange / olive-green pair at equal lightness scores 2.2 and fails the same test.

## B3. 2-D label placement ("choices")  ·  not done (queued)

`dos_hitos` contains a small private version (candidate positions scored against the curves and the other boxes); a shared `elegirPosicion` in `motor/etiquetas.js` for `bump`, `pendiente` and multi-series `linea` is in the queue (see `docs/ROADMAP.md`). The avoid-overlap repo has no licence; only its README's idea is used.
