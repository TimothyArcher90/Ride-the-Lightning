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
