Spanish original: [../servidor/guia-de-direccion.md](../servidor/guia-de-direccion.md)

# Direction guide — Ride the Lightning

> English translation of `servidor/guia-de-direccion.md`. **The Spanish original stays at `servidor/guia-de-direccion.md` and is loaded at runtime by the MCP tool `guia_de_direccion`; do not move or rename it.** If you edit one, update the other.

Read this before directing a piece. It summarizes how to build a data animation with a Johnny Harris / Caspian Report feel, without sacrificing accuracy.

## 0. Accuracy rules (non-negotiable)
- **No figure is typed by hand.** Every number on screen comes from the data through placeholders: `{valor}` `{fecha}` `{cambio:N}` `{pct:N}` `{max}` `{min}` `{desde}` `{hasta}` `{n}`. A bare digit in a text is a **compile error**, unless the layer declares `"verificada":{"fuente","url"}` ("verified": source, url).
- **Every series carries a source** (the library's `.meta.json`, or a declared `fuente`). No source, no compile.
- **Full series from its first data point.** Trimming with `desde` ("from") is flagged. Say so in the narration if you trim.
- An anchor (`{"fecha":"2020-06-03"}`) must fall on a real row (tolerance 1.5 steps). If there is no nearby data, **no point is invented**.
- Anything you cannot verify against an official source: ask the owner; do not put it in or silently leave it out.
- Always read the compile report: it lists every figure with its series, date and row.

## 1. Workflow
1. `buscar_series` ("search series") → `descargar_serie` ("download series", full history) — or `inspeccionar_datos` ("inspect data") if the owner shares an Excel/CSV.
2. Write the spec (JSON). A chart = layers: `linea` | `barras` | `carrera` | `dispersion` | `calor`, plus data-anchored annotations: `llamada`, `zona`, `contador`, and presentation: `titulo`, `imagen`, `cortina`.
3. `compilar_spec` ("compile spec") → fix errors/warnings.
4. `vista_previa` ("preview") with 4–6 instants (start, mid-stroke, at each zoom, at each callout, end). **Look at the images**: overlapping cards, text outside the frame, camera that does not frame correctly.
5. `exportar_video` ("export video"; draft first; final + alpha on approval).

## 2. Motion language (what makes it feel "documentary")
- **The stroke is narrated**: the line draws itself with the voice; a pulsing head leads the eye. `t:[start,end]` of the `linea` layer = stroke pacing.
- **Camera in data space**: `camara:[{t, x:[a,b], y:"ajustar"}]`. Each keyframe is reached at `t` after moving for `mov` s (default 1.1). Do a *punch-in* on the event and open back out at the end. `y:"ajustar"` frames the visible range; `"auto"` = the full series.
- **One idea per zoom**: at most one main callout per framing; the second arrives 0.5–1 s later, not at the same time.
- **Callouts with a hard hit**: shock wave + card that enters with a short bounce. **Opaque** cards (Premiere blends semi-transparent ones into gray).
- **Hard wipes** (`cortina`) between chapters, not fades.
- Pacing: 20 s for a long series with 3–4 milestones; 8–12 s for a single data point. Leave 1 s of breathing room at the end.
- Color with meaning (MacroWise brand): **gold** = value/opinion, **teal** = technical indicators/energy/computing, **purple** = geopolitics, stone = structure. Do not invent another palette.
- Formats: `horizontal` 1920×1080 and `vertical` 1080×1920 come from the same spec (use `caja:[x,y,w,h]` in fractions if you need to reposition).

## 3. Which chart for what (data-analyst criteria)
- Evolution over time, one or few series → `linea` (`area:true` for cumulative magnitudes; `ejeDer:[i]` for two scales, **label both units**).
- Compare categories or discrete periods → `barras` (`orden:"desc"`, `orientacion:"h"` for rankings, `colorSigno:true` for changes).
- Who leads and how the ranking shifts → `carrera` (series = entities, x = date).
- Relationship between two variables → `dispersion` (tipoX `num`; computes OLS and R² at compile time).
- Relationship among many series → `calor` with a correlation matrix. **By default on changes**, not levels (trending series correlate by chance). The method is recorded in the report.
- Do not mix different scales on one axis without saying so. Do not use two axes if you could index to 100.

## 4. Honest limits
- Yahoo prices are **unofficial**; continuous futures are spliced without roll adjustment. For a brand figure, cross-check against an official source.
- The FRED unit in the catalog is a catalog unit: confirm it on the series' page before labeling.
- Ultra-long historical series (gold since 1257, etc.) are not available from open sources without friction: if the owner asks for one, look it up and upload it as a file with its source.
