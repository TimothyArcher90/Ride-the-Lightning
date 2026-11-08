Spanish original: [es/CAPAS.md](es/CAPAS.md)

# Layer and spec reference

> Note: field names and enum values in the spec JSON are in Spanish (`datos`, `capas`, `linea`, `barras`…) because the engine's contract is Spanish. They are not translated; English glosses appear in parentheses where useful.

## Spec
```jsonc
{
  "version": 1, "titulo": "…", "formato": "horizontal|vertical", "fps": 30, "duracion": 20,
  "fondo": {"imagen": "entradas/foto.jpg", "tono": 0.78, "puntos": true},   // background
  "sello": true,                       // automatic source stamp (false to remove it)
  "vivo": {"render": "final", "alfa": true, "minEntreRendersMin": 360},   // "live": automatic re-render when the data changes
  "datos": {                           // data
    "id": {
      "archivo": "datos/biblioteca/fed_balance.csv",   // csv tsv txt json xlsx xls xlsb ods
      "hoja": "Hoja1", "filaEncabezado": 1,            // sheet, header row
      "x": "fecha", "tipoX": "fecha|anio|num|cat",     // x column; x type: date | year | number | category
      "decimal": ",", "formatoFecha": "dmy|mdy", "fechaSerial": false,   // only if the file requires it
      "desde": "inicio", "hasta": "fin",               // explicit trim ("from"/"to"; always flagged in the report)
      "fuente": {"nombre": "…", "url": "…", "obtenido": "2026-11-03", "licencia": "…"},   // source; the library fills it in automatically
      "columnas": [{"col": "WALCL", "nombre": "…", "color": "oro|teal|purpura|piedra|#hex", "divisor": 1000000,
                    "prefijo": "US$ ", "sufijo": " bill.", "decimales": 2, "unidad": "billones de US$"}]   // decimals: a number or "auto"
    }
  },
  "capas": [ … ]                       // layers
}
```
Combining library series into one wide table (join on **exact** date, no resampling): `combinar({ids, nombre, id})` in `servidor/biblioteca.mjs` (MCP tool `combinar_series`). The result keeps its recipe and rebuilds itself whenever a component changes.

## Charts (each with `caja:[x,y,w,h]` as fractions of the canvas and `t:[start,end]` in seconds)
| type | use | options |
|---|---|---|
| `linea` (line) | evolution over time | `datos`, `series:[i]`, `ejeDer:[i]` (right axis), `area`, `escala:"log"`, `curva:"lineal|escalon|monotono"` (default `lineal`; `escalon` holds each value until the next data point, for policy rates; `monotono` is a Steffen monotone curve; both are declared on screen and never invent a value), `camara:[{t,x:[a,b]\|"auto",y:[c,d]\|"auto"\|"ajustar",mov}]` (camera keyframes), `id` |
| `barras` (bars) | categories / periods | `orientacion:"v\|h"`, `orden:"desc"`, `maxBarras`, `colorSigno` (color by sign), `formatoX:"anio\|mes\|dia"` |
| `carrera` (bar-chart race) | ranking that changes | series = entities, x = date; `top`, `formatoX` |
| `dispersion` (scatter) | x–y relationship | `tipoX:"num"`; computes OLS and R² (`regresion:false` to hide); `etiquetaX`, `etiquetaY` |
| `dos_hitos` (two milestones) | one **daily** series seen from two dates | `datos`, `series:[0]`, **`hitos:[{"fecha":"AAAA-MM-DD","nombre":"…"},{…}]`** (exactly two; each date must be a session, or at most 5 days after one, with ≥ 30 sessions after it), `escala:"auto"`, `"lineal"` or `"log"` (default `auto`: log if max/min > 5), `colores:[c0,c1]`, `espera` (seconds between the end of the drawing and the swap from the live table to the final figures), `aviso` (closing line; default "Historical comparison, not a forecast"). Base 100 at each milestone's close, aligned by sessions since the milestone; drawdown panel, live table, peak and trough annotations, shaded "no projection" where one series ends. All figures come from the series (see `informe.cifras`, type `hito`). The template `dos_hitos` (alias `two_milestones`) builds it. A piece that cannot run yet carries a top-level `"pendiente": "…"` that the compiler reports as its first error. |
| `calor` (heatmap) | correlation | `series:[…]`, `sobre:"variaciones\|niveles"` (changes vs. levels; defaults to changes) |

The `log` scale is mandatory for series spanning several orders of magnitude (Bitcoin, S&P 500 since 1927, population since 10,000 BC). In log mode the camera only accepts `"auto"`/`"ajustar"` on `y`.

## Annotations (anchored to a chart with `capa:"id"`; the chart comes first)
| type | fields |
|---|---|
| `llamada` (callout) | `ancla:{fecha\|x\|max\|min\|ultimo\|primero\|indice, rango?}` (anchor: date, x, max, min, last, first, index), `serie`, `texto` (3–4 words), `color`, `t:[in,out]`. **The year and the value come automatically from the anchored row.** Optional: `lado` (side; only a preference: the engine picks the first free slot), `sinValor` (no value), `detalle` (detail; discouraged: adds a line) |
| `zona` (zone) | `desde`, `hasta` (dates), `texto`, `color`, `t` |
| `contador` (counter) | `serie`, `modo:"completo|fecha|compacto"`, `pos:[fx,fy]`, `alinea`. Full = big year + value + unit; `fecha` = year only; `compacto` = name + value + unit (panels). It follows the line head and steps aside while a card is showing |

Placeholders in `texto`/`detalle`/`sub`: `{valor}` (value) `{fecha[:dia\|mes\|anio]}` (date) `{cambio:N}` (change) `{pct:N}` `{max}` `{min}` `{desde[:fmt]}` (from) `{hasta[:fmt]}` (to) `{n}` `{serie}`. `N` = number of rows back (in weekly data, 52 ≈ one year: the report states the base row).

## Presentation
`titulo` (title: `texto`, `sub`, `pos`, `tam`, `color`, `t`) · `imagen` (image: `archivo`, `caja`, `ajuste:"cubrir\|contener"` (cover/contain), `zoom:[1,1.08]`, `opacidad`, `borde`, `t`) · `cortina` (curtain/wipe: `t`, `color`; hard wipe between chapters).

## Default stacking order (`z`)
image 5 · zone 8 · charts 10 · callout 20 · counter 25 · title 30 · curtain 40 · stamp 50. Can be forced with `"z": n`.

## Outputs
`salidas/<piece>/<piece>_vN.mp4` (reference), `…_alfa.mov` (ProRes 4444 with alpha: charts and text only, no background), `…_contacto.png` (contact sheet, 12 frames), `…_vN.json` (verification report). Cards are opaque on purpose.

## Tables: sankey, donut, waterfall
Data that is not a time series. In `datos`, declare `"tipo":"flujos"` (flows: columns source, target, value, optional type) or `"tipo":"categorias"` (categories: concept, value, optional type; `"uso":"donut"|"cascada"`).
- `{"tipo":"sankey","id":"g1","datos":"d","t":[0.9,7.9]}` — flow diagram. Node = sum of its flows; % relative to the largest node; YoY change if there is an `anterior` (previous) column. Labels look for free space (above, below, left, right).
- `{"tipo":"donut",…}` — a ring that fills part by part; legend with value and %.
- `{"tipo":"cascada",…}` (waterfall) — floating bars; `inicio` (start) / `total` rows run from 0; the rest go up or down. Supports negatives. `total` rows are checked against the running sum.

Accuracy rules: source is mandatory; a node that does not balance (>5 %) is an error, (>0.5 %) a warning; flow values are always positive; cycles and unknown types are errors.
