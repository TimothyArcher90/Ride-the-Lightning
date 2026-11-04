# Architecture

Ride the Lightning (RTL) turns **verifiable data** into **animated charts** (MP4 + ProRes 4444 with alpha). Everything runs locally; the server listens on `127.0.0.1` only.

```
 ┌────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐
 │  Data      │ → │  Templates    │ → │  Compiler    │ → │  Engine      │ → │  Renderer   │
 │ catalog +  │   │ (data shape → │   │ (spec →      │   │ canvas-2D,   │   │ headless    │
 │ connectors │   │  spec JSON)   │   │  plan +      │   │ deterministic│   │ browser +   │
 │            │   │               │   │  verification│   │ pure layers  │   │ ffmpeg      │
 └────────────┘   └───────────────┘   └──────────────┘   └──────────────┘   └─────────────┘
   catalogo/         servidor/            servidor/           motor/            servidor/
   servidor/         plantillas*.mjs      compilar.mjs        capas*.js         render.mjs
   biblioteca.mjs    visualizador*.mjs                        diseno.js
   paises.mjs
```

The studio UI (`web/`), the MCP server (`servidor/mcp.mjs`), the CLI (`servidor/cli.mjs`) and the chat bridge (`servidor/chat.mjs`) are four front doors to the same pipeline.

## Design principles

1. **Accuracy is the product.** Every number on screen is computed from a data row. Text never contains typed digits; it uses markers such as `{valor}`, `{fecha}`, `{cambio:N}`. The compiler rejects a stray digit unless the layer declares `"verificada": {"fuente", "url"}`.
2. **Determinism.** A frame is a pure function of `(plan, time)`. No `Math.random()`, no wall-clock. The same spec always renders the same pixels, so renders can be diffed and reviewed frame by frame.
3. **Nothing overlaps.** Every text box is registered in a collision registry; `auditarColisiones` samples the whole timeline and the renderer refuses to export a piece with overlapping text.
4. **Honest scales.** Log scales, base-100 indices, rank-by-growth and "other N parts" groupings are always declared on screen.
5. **Reel-safe.** In vertical (9:16) nothing is drawn with `x ≥ 72.2 %` of the width and `y ≥ 43.75 %` of the height (where TikTok/Instagram/Shorts put their buttons).

## Layers in detail

### 1. Data (`catalogo/`, `servidor/biblioteca.mjs`, `servidor/datos.mjs`, `servidor/paises.mjs`)
- `catalogo/series.json` is the **catalog**: one entry per series (id, name, source, URL, license, frequency, unit, adapter + its parameters). Downloads are on demand.
- **Adapters** fetch a series from its source and write a normalized CSV plus provenance (URL, download date, sha256, first/last real data point): FRED, World Bank, IMF DataMapper, Eurostat, US Treasury FiscalData, Our World in Data, Coin Metrics, Yahoo Finance, NBP, GUS/BDL, SEC EDGAR (XBRL), datos.gov.co.
- **No interpolation, ever.** Missing data stays missing. Combining series joins on the *exact* date.
- `servidor/paises.mjs` serves the **country layer**: `listarPaises()`, `indicadoresPais()`, `fichaPais(iso3)` (latest real value of each indicator with year and source) and `compararPaises(isos, clave)`. Series ids follow `pais_<ISO3>_<indicator>`.
- `servidor/trimestres.mjs` + `servidor/xbrl.mjs` build **quarterly income statements** from SEC filings (Sankey / waterfall / donut inputs).
- `servidor/tablas.mjs` ingests user files (`xlsx xls xlsb ods csv tsv json`) and asks only what it cannot infer (date order, decimal separator, source).
- `servidor/vivo.mjs` / `servidor/actualizar.mjs` refresh downloaded series on a per-source cadence and can re-render pieces marked `"vivo"`.

### 2. Templates and the visualizer (`servidor/plantillas*.mjs`, `servidor/visualizador*.mjs`)
- A **template** turns *data + intent* into a complete spec (layers, camera, pacing, theme). There are 27 chart models; see [MODELS.md](MODELS.md).
- The **visualizer** (`visualizador.mjs`) decides *which* models tell a dataset well, using the data shape (one series, several comparable series, flows, categories with signs, price with OHLC…) and rules from *From Data to Viz* / the FT Visual Vocabulary / Cleveland–McGill. It can build several distinct options, compile each, run the collision audit, and keep only those that pass (`proponer()`); `recomendar()` is the fast, side-effect-free version used by the UI.
- `servidor/analisis.mjs` detects **key moments from the data itself** (min, max, biggest rise/fall…), so annotations are never invented.

### 3. Compiler (`servidor/compilar.mjs`)
Takes a spec and returns a **plan** (resolved layers + data in pixel-ready form) and a **verification report**:
- every figure shown → series, column, date, row, raw value;
- errors: stray digits, missing source, ambiguous date, text in a numeric column, anchor without nearby data, unsupported layer/data combination;
- warnings: license restrictions (e.g. Yahoo = personal use; CC BY-NC), trimmed ranges, estimates (IMF WEO), long labels.

### 4. Engine (`motor/`)
- `nucleo.js`: data → pixel projection, scales, easing, formatting helpers.
- `escena.js`: stacking by `z`, camera keyframes in *data space* (text stays crisp), per-format scaling.
- `capas.js` and `capas_extra.js`: the chart layers, each a pure function `(env, layer)`; annotations (`llamada`, `zona`, `contador`) anchor to data (`{"fecha": …}`, `{"max": true}`), never to pixels.
- `diseno.js`: the **design system** — type scale with per-format minimum sizes (vertical: names ≥ 40 px, axes/units ≥ 32, footer ≥ 28), WCAG contrast helpers, safe-zone constants, Material motion curves, 40 ms stagger, and the mandatory source footer *"Source: <name> · <date of last data point> · RTL"*.

### 5. Renderer (`servidor/render.mjs`)
Headless Edge/Chrome (via `playwright-core`) loads `web/render.html`, seeks frame by frame, and pipes frames to **ffmpeg**:
- reference **MP4** (`libx264 -crf 17 -preset slow -pix_fmt yuv420p`);
- **ProRes 4444 with alpha** (`.mov`) for compositing in Premiere;
- a JSON verification report next to every render (`salidas/<piece>/<piece>_vN.json`);
- subtitles are never burned in.

### 6. Front doors
| Door | File | Notes |
|---|---|---|
| Studio (web UI) | `servidor/estudio.mjs` + `web/` | Guided 4-step flow, live "gallery" thumbnails drawn with *your* data, Server-Sent Events for live updates |
| CLI | `servidor/cli.mjs` | `buscar`, `bajar`, `compilar`, `vista`, `auditar`, `render`, `vivo` |
| MCP server | `servidor/mcp.mjs` (`.mcp.json`) | Lets Claude search series, generate pieces, preview frames, export; includes `proponer_visualizaciones` |
| Chat | `servidor/chat.mjs` | "Edit by talking" panel in the studio; uses your local Claude Code |

## Directory map

| Path | Purpose |
|---|---|
| `motor/` | Rendering engine and design system (browser + Node) |
| `servidor/` | Server, compiler, templates, connectors, renderer, CLI, MCP |
| `web/` | Studio UI (`estudio.html`, `estudio.js`) and the headless render page |
| `catalogo/` | Series catalog, country catalog, verification records |
| `data/` | Curated open-license data snapshot (so examples run offline) — see [DATA_SOURCES.md](DATA_SOURCES.md) |
| `datos/` | Local download cache (git-ignored) |
| `examples/` | Ready-to-run specs and sample renders — see [EXAMPLES.md](EXAMPLES.md) |
| `docs/gallery/` | One image per chart model × format |
| `scripts/` | Test suites and builders |
| `specs/` | Spec JSONs used by the CLI/tests |
| `fuentes/` | Geist fonts (SIL OFL) |

## Testing

```
node scripts/prueba.mjs               # formats, accuracy rules, base chart types
node scripts/prueba-tablas.mjs        # flows / categories / table recognition
node scripts/prueba-plantillas.mjs    # templates against the catalog
node scripts/prueba-visualizador.mjs  # visualizer options are distinct and pass the audit
node scripts/prueba-universal.mjs     # the 11 newer models (--ver saves PNGs)
node scripts/prueba-calidad.mjs       # professional-quality checklist, 27 models × 2 formats
node scripts/prueba-conectores.mjs    # connectors vs. live APIs (no interpolation, row counts)
node scripts/prueba-paises.mjs        # country cards and comparisons
```

The quality suite measures **real canvas text**: minimum font size per format, contrast over the drawn pixels, safe zone, footer present, collisions, ≥ 3 s reading time for annotation cards, easing, and stagger.

> The studio UI and most inline code comments are in Spanish (the primary user's language). Public documentation is in English; the original Spanish notes live in [`es/`](es/).
