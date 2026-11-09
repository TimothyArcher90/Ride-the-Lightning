# Third-party notices

Ride the Lightning (RTL) is MIT-licensed (see [LICENSE](../LICENSE)). The engine in `motor/` runs in the browser and in Node **without a bundler and without runtime dependencies**, so the third-party pieces below are *vendored* as ES source under `motor/vendor/<package>/`, each with its original `LICENSE` and a header comment that names the package, version and origin. Only permissive licenses (ISC, BSD-3-Clause, Apache-2.0-style, MIT, CC0) are used, because the output is used commercially.

How each was obtained: `npm pack <package>@<version> --ignore-scripts` into a fresh temporary folder, treated as untrusted data (no scripts run), and only the needed `src/*.js` files were copied. The `LICENSE` of that exact tarball was read and copied next to the code. `scripts/prueba-calidad.mjs` fails if a vendored file has no origin header, a package folder has no `LICENSE`, or a package is missing from this table.

| Package (folder in `motor/vendor/`) | Version | License | Upstream | What is used | Where in RTL |
|---|---|---|---|---|---|
| `d3-array` | 3.2.4 | ISC, © 2010-2023 Mike Bostock | https://github.com/d3/d3-array | `ticks`, `tickIncrement`, `tickStep` (`ticks.js`); `min`, `max`, `sum` (needed by d3-sankey). `index.js` is a 5-line re-export written for RTL, not upstream code. | `motor/nucleo.js` `ticksNum` (axis ticks, every numeric axis; exact decimals); `motor/vendor/d3-sankey` |
| `d3-color` | 3.1.0 | ISC, © 2010-2022 Mike Bostock | https://github.com/d3/d3-color | `color.js`, `define.js` (RGB parsing for the interpolator) | only through `d3-interpolate` |
| `d3-interpolate` | 3.0.1 | ISC, © 2010-2021 Mike Bostock | https://github.com/d3/d3-interpolate | `rgb.js` (`rgbBasis`), `basis.js`, `basisClosed.js`, `color.js`, `constant.js` | only through `d3-scale-chromatic` |
| `d3-scale-chromatic` | 3.0.0 | ISC (© 2010-2021 Mike Bostock) + ColorBrewer license (below); viridis data is CC0 | https://github.com/d3/d3-scale-chromatic | `diverging/BrBG.js`, `sequential-multi/viridis.js`, `colors.js`, `ramp.js` | `motor/escalas.js`: divergent scale (calendar heatmap, correlation matrix) and sequential scale (treemap) |
| `d3-hierarchy` | 3.1.2 | ISC, © 2010-2021 Mike Bostock | https://github.com/d3/d3-hierarchy | `treemap/squarify.js`, `treemap/resquarify.js`, `treemap/dice.js`, `treemap/slice.js` | `motor/arbol.js` → treemap layout and quarter-to-quarter stability |
| `d3-sankey` | 0.12.3 | BSD-3-Clause, © 2015 Mike Bostock | https://github.com/d3/d3-sankey | `sankey.js`, `align.js`, `constant.js` (node/link layout; `linkHorizontal` is not used) | `motor/capas.js` `disenarSankeyV` → vertical (9:16) Sankey |
| `d3-shape` | 3.2.0 | ISC, © 2010-2022 Mike Bostock | https://github.com/d3/d3-shape | `curve/step.js` (`stepAfter`), `curve/monotone.js` (`monotoneX`, Steffen) | `motor/capas.js` `linea`: opt-in `curva: "escalon"` or `"monotono"`, declared on screen |

Version notes: `d3-array` 3.2.5, `d3-color` 3.1.1, `d3-interpolate` 3.0.2, `d3-hierarchy` 3.1.3, `d3-scale-chromatic` 3.1.1 and `d3-shape` 3.2.1 exist, but those tarballs ship only the bundled `dist/` (no ES source), so the last tarball that still contains `src/` was vendored instead.

## Ideas implemented from scratch (no code copied)

| Source | License | What was taken | Where |
|---|---|---|---|
| labella.js (Twitter, Inc.) https://github.com/twitter/labella.js | Apache-2.0 | The idea of 1-D label relaxation: a spring toward the desired position plus repulsion between overlapping neighbours, with leader lines. Reimplemented in ~40 lines with a fixed iteration count (deterministic). Notice: *Copyright Twitter, Inc. Licensed under the Apache License, Version 2.0.* | `motor/etiquetas.js` `relajar1D` |
| d3fc `label-layout` (ScottLogic) https://github.com/d3fc/d3fc | MIT | The idea of connecting displaced labels to their anchor with a short line. | `motor/capas.js` (vertical Sankey) |
| kevinschaul/avoid-overlap https://github.com/kevinschaul/avoid-overlap | no licence declared | ONLY the idea from its README (choose among candidate positions, keep the one with least overlap). Its code was not copied or read; `colocar2D` is written from scratch. | `motor/etiquetas.js` |
| d3-scale `nice` (Mike Bostock) | ISC | Considered for axis domains; evaluated and **not** used (it made the scatter plot worse, see `docs/research/INTEGRATION_LOG.md`). | none |
| uPlot (Leon Sorokin) https://github.com/leeoniya/uPlot | MIT | The idea of drawing a long line with one minimum and one maximum per pixel column so no extreme is lost. Written from scratch (no upstream code read or copied); RTL also keeps the first and last row of each column and never interpolates. Notice: *Copyright (c) 2022 Leon Sorokin. MIT License.* | `motor/decimar.js` (`decimarPorColumna`), used by `linea` in `motor/capas.js` |

## Development-only dependency (not shipped, not loaded by the engine)

| Package | Version | License | Use |
|---|---|---|---|
| `culori` (npm `devDependencies`, exact pin) | 4.0.2 | MIT, © 2018 Dan Burzo | `scripts/prueba-calidad.mjs`: color-blindness simulation (`filterDeficiencyDeuter/Prot/Trit`) and CIEDE2000 distance to test the color scales. If it is not installed, that part of the test is skipped with a notice. |

## Palette licenses (texts required by the licenses)

**ColorBrewer** (BrBG data inside `d3-scale-chromatic`): *Apache-Style Software License for ColorBrewer software and ColorBrewer Color Schemes. Copyright 2002 Cynthia Brewer, Mark Harrower, and The Pennsylvania State University. Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0); software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.* The full text is in `motor/vendor/d3-scale-chromatic/LICENSE`.

**viridis / magma / inferno / plasma** (data in `sequential-multi/viridis.js`): colormaps by Nathaniel J. Smith, Stefan van der Walt and (viridis) Eric Firing, released under **CC0 1.0 / public domain** (verified in the header of https://github.com/BIDS/colormap/blob/master/colormaps.py on 2026-11-04). The authors ask for credit: credit given here. Only viridis is used by RTL; the other three travel unchanged inside the same upstream file.

**Okabe-Ito and Paul Tol "bright" (test references only, nothing is shipped or drawn).** `scripts/prueba-calidad.mjs` §0d lists the hex values of two published colour-blind-safe qualitative palettes as numbers to compare RTL's series colours against under deuteranopia, protanopia and tritanopia: the 8-colour palette of Masataka Okabe and Kei Ito (*Color Universal Design (CUD)*, 2008; the values are public and carry no licence text; credit given) and the "bright" scheme of Paul Tol (SRON, *Colour Schemes*, technical note SRON/EPS/TN/09-002, 2021; the values are also distributed in the BSD-3-Clause package `tol_colors` by Descanonge, whose code was **not** used). No colour of these palettes appears in any video; they exist only inside the test to show how far apart RTL's own colours are.

**cividis is deliberately NOT used.** `d3-scale-chromatic`'s `cividis.js` is a polynomial fit of the Nuñez-Anderton-Renslow scheme whose reference implementation is under a Battelle Memorial Institute license with its own conditions (read at https://github.com/pnnl/cmaputil on 2026-11-04). It is not one of the licenses allowed here, so it is not vendored.

## Texts of the ISC and BSD-3-Clause licenses

The exact license file of each package is kept next to its code: `motor/vendor/<package>/LICENSE`. ISC requires the copyright and permission notice to be kept in all copies; BSD-3-Clause additionally requires reproducing the notice in documentation or other materials for binary distributions and forbids using the authors' names to endorse derived products. Both are satisfied by keeping those files and this document.
