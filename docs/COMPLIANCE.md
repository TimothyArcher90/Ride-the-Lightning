Spanish original: [es/CUMPLIMIENTO.md](es/CUMPLIMIENTO.md)

# Compliance: what was requested, what is done and what is missing

Date: 2026-11-03 · Each row links the request to where it lives and how it was verified. ✅ done and tested · ⚠ done with limits · ❌ not possible / pending.

> Snapshot note: this is a faithful translation of the 2026-11-03 status. Some counts (e.g. "172 series", "16 models") have since grown; see the status block in [ROADMAP.md](ROADMAP.md) for the current numbers (812 catalog series, 27 models, 45 countries).

| # | Request | Status | Where it lives | How it was verified / limits |
|---|---|---|---|---|
| 1 | **Deployable locally**, with an icon next to Electric Eye | ✅ | `Ride the Lightning.lnk` on the desktop → `Iniciar Ride the Lightning.bat` (updates from GitHub, opens the studio, closes the previous session) | Launched through the real shortcut: the studio answers on `127.0.0.1:5180`. Listens on localhost only. |
| 2 | Well-understood **layers** of animated charts | ✅ | [SPEC_REFERENCE.md](SPEC_REFERENCE.md), `motor/` | `linea`, `barras`, `carrera`, `dispersion`, `calor`; annotations `llamada`, `zona`, `contador`; `titulo`, `imagen`, `cortina`. |
| 3 | **100 % accurate** | ✅ with limits | `servidor/compilar.mjs`, `servidor/datos.mjs` | No figure is typed by hand (compile error); every figure → series, date, row, raw value; ambiguous date / text in a numeric column / anchor without data = error; a report is written next to each render. 20 tests (`scripts/prueba.mjs`: formats, rules, chart types) + 28 template tests (`scripts/prueba-plantillas.mjs`). **Limits:** Yahoo is unofficial; FRED series units come from the catalog; when mixing frequencies, data is resampled to the last value of each period (declared). |
| 4 | **Images and Excel in multiple formats** | ⚠ | Excel/CSV/TSV/JSON/ODS: `servidor/datos.mjs`; images: `imagen` layer and `fondo` | `xlsx xls xlsb ods csv tsv json` yield identical tables (tested). **Images are used from Expert mode**; the guided wizard does not place them yet. |
| 5 | **Data-scientist** visualization | ⚠ | Templates "Comparar", "Panel", "Carrera", "¿Se mueven juntas?", log-scale line | Automatic log scale, base-100 index, OLS regression with R², correlation on changes, multi-panel layouts. **Missing:** histogram, box plot, series with confidence bands. |
| 6 | **Cinematic**, above Harris and Caspian | ⚠ | [STYLE_REFERENCES.md](STYLE_REFERENCES.md) | Done: camera in data space, 4 pacing presets, adaptive motion blur, `foco` (one protagonist series), brand on a bar without a card, hard wipes, year that follows the line. **Pending (P2/P3):** paper-like light background, morphing between charts, sound track, pictograms, 3D maps (these live in Electric Eye). The analyzed sample is only 2 videos: **more references are needed** (see below). |
| 7 | **Complete historical series** from the first data point | ⚠ | `catalogo/series.json` (172 at the time; 812 now), `catalogo/verificado.json` | Start measured at download: Bitcoin 2010-07-18, S&P 500 1927, Shiller 1871, commodities 1960, world population −10000. **Missing:** gold before 1960 has no open source; the Shiller file ends in 2023-09; full WIG/WIG20 require Stooq (blocked). |
| 8 | **Real data connected 24/7**, no downloading or passing files around | ⚠ | `servidor/vivo.mjs`, shortcut in the Windows startup folder | When a dataset is chosen it downloads automatically; the updater refreshes by frequency (markets every 15 min) and re-renders pieces flagged "vivo" (live). **Limits:** it is polling (no free source offers streaming); works while the PC is on. |
| 9 | Polish sources (Stooq, GUS, NBP, GPW) | ⚠ | `servidor/catalogo.mjs` | **NBP** ✅ (4 currencies and gold, official API). **GUS/BDL** ✅ (1 verified variable: CPI; the rest of the bank is added on demand). **Stooq** ❌ "Access denied" for automated downloads (not circumvented). **GPW** ❌ no stable API. |
| 10 | **Clean and professional, no overlapping text** | ✅ | `motor/capas.js` (`colocar`, box registry), `auditar` | Card = year · what happened · value. The renderer refuses to output anything if text overlaps. Audited with 0 collisions on the 3 example pieces and on the template combinations tested (cameras × styles × formats). |
| 11 | **Friendly for a non-coder, non-financial user** | ⚠ | `web/estudio.html`, `web/estudio.js`, [USER_GUIDE.md](USER_GUIDE.md) | 4-step wizard, plain language, moments detected from the data (with explanation), "Al día / Atrasada" and "Uso abierto / restringido" badges, keyboard and accessible labels. **Missing:** testing with a real non-technical person (so far only the author has tested it). |
| 12 | **Templates** for charts, animation and camera | ✅ | `servidor/plantillas.mjs` | 5 templates × 4 cameras × 2 moment styles × 2 formats. Outside the wizard (hand-written keyframes): Expert mode. |
| 13 | Review and **document** how Harris and Caspian work | ⚠ | [STYLE_REFERENCES.md](STYLE_REFERENCES.md) | 2 videos analyzed frame by frame (1 Harris line chart, 3 Caspian charts); techniques, parameters with confidence levels, prioritized gaps. Audio and frame-by-frame stroke were not analyzed. |

## What is needed from the owner to close the gaps
1. **References**: 5–10 URLs with the exact minute of the charts you like most from Johnny Harris and Caspian Report (or 10–15 s clips with sound). With more samples, real rhythms can be measured instead of inferred.
2. **Background style**: dark MacroWise (current), or also a light paper-like background as Harris uses? It is the biggest engine change left.
3. **Three target pieces** for MacroWise (which data, which message) to turn into house templates.
4. **A non-technical person** (anyone on your team) using it for 10 minutes while you watch without helping: the only way to know whether it is truly "100 % friendly".
5. **Sound**: do you want a sound-effects track synced to every moment (hit, whoosh), exported separately?
