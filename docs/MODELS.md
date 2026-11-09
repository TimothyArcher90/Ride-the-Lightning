# Chart model catalogue

Ride the Lightning ships **31 chart models** (plus a few variants). Every image below is a real final frame rendered from real data with `npm run gallery` (see [EXAMPLES.md](EXAMPLES.md)); horizontal is 16:9, vertical is 9:16 for reels (with the platform safe zone respected).

> **Language note.** The text *inside* the charts (titles, notes, source line) is Spanish: that is the output language of the engine and of the channel it was built for. The repository, the docs and the code comments are English.

## How to choose a model: the shape of the data decides

| Your data looks like… | Use |
|---|---|
| One series over time | `historia`, `bandas`, `histograma`, `cordillera`, `velas`, `calendario` |
| One daily series seen from **two dates** (two events, same index) | `dos_hitos` (alias `two_milestones`) |
| Several series, **same unit**, over time | `comparar`, `apilada`, `corriente`, `carrera`, `agrupadas`, `bump` |
| **Distribution**: how values are spread (across countries, or year by year) | `enjambre` (one dot per country), `cordillera` (one ridge per year), `histograma` |
| Several series, **different units** | `comparar` (indexed to 100, declared), `pendiente`, `divergente`, `panel`, `correlacion`, `radar`, `bullet` |
| Parts of a total at one moment (a table) | `donut`, `treemap`, `waffle`, `lollipop`, `pictograma` |
| Money flowing through stages | `sankey`, `cascada` |
| Before vs. after, per item | `dumbbell`, `pendiente` |
| Ranking of items/countries | `ranking`, `lollipop`, `barras` |
| Relationship between two quantities | `dispersion`, `correlacion` |

## Rules every model follows

- **Exactness.** No figure is typed by hand: every number on screen is a placeholder resolved from a row of the data (the compiler prints which row), or a computation over rows that is declared on screen.
- **Source line.** Each piece ends with `Fuente: …` plus the date of the last data point. A table or series without a source does not compile.
- **Honest scales.** Bars start at 0; indexed or logarithmic scales are announced in the chart; derived values (percentages, medians, percentiles) say how they were computed.
- **Clean layout.** An audit (`auditarColisiones`) checks every 0.2 s that no text overlaps another or leaves the frame, and, in vertical, that nothing sits in the reels button column.

Series models take items from the data library (`{origen: 'biblioteca', id}`) or columns of your own file; table models take a CSV with `concepto,valor[,anterior]` (categories) or `origen,destino,valor` (flows). Minimal use from code:

```js
import {generar} from './servidor/plantillas.mjs';
const {spec, informe} = generar({plantilla: 'radar', series: [{origen: 'biblioteca', id: 'fred_unrate'} /* … */], formato: 'vertical', camara: 'dinamico'});
// spec is the JSON you can save and run: node servidor/cli.mjs compilar spec.json
```

The generator behind every image is [`scripts/galeria-casos.mjs`](../scripts/galeria-casos.mjs): one real-data case per model.

---

## Time series

### `historia` — single series history
When: one number and its story; the most used model. Needs: 1 series. Declares: the period, unit, a live counter that follows the line head; callouts take year and value from the anchored row.
Limits: more than ~5 callouts make it busy; very long histories with several orders of magnitude need `escala: "log"` (announced).

| Horizontal | Vertical |
|---|---|
| ![](gallery/historia-h.png) | ![](gallery/historia-v.png) |

Example: [fed-balance-sheet](../examples/fed-balance-sheet/) · data: Federal Reserve via FRED (public domain).

### `comparar` — one against the rest
When: compare 2–6 series, one protagonist. Needs: 2–6 series. Declares: if units differ, **index base 100 at the first common date**; if equal, real values on one axis. Limits: indexing hides absolute levels.

| Horizontal | Vertical |
|---|---|
| ![](gallery/comparar-h.png) | ![](gallery/comparar-v.png) |

Example: [gold-copper-oil](../examples/gold-copper-oil/) · [latam-debt-to-gdp](../examples/latam-debt-to-gdp/) (spec only: IMF licence).

### `panel` — small multiples
When: 2–4 series that deserve their own axis but one shared clock. Needs: 2–4 series. Declares: shared time scale, each series with its own value and unit.

| Horizontal | Vertical |
|---|---|
| ![](gallery/panel-h.png) | ![](gallery/panel-v.png) |

### `barras` — bars
When: values per period or category, from zero. Needs: 1 table/series (hand-written spec in the gallery). Declares: baseline at 0. Limits: no template yet; written as a spec (see `scripts/galeria-casos.mjs`).

| Horizontal | Vertical |
|---|---|
| ![](gallery/barras-h.png) | ![](gallery/barras-v.png) |

#### Variant: `barras_decada` — one bar per decade
When: an **annual** series with a sustained trend (urban population, life expectancy, …) that would otherwise be offered only a line. Needs: 1 annual series with at least 15 years. Declares: one bar per decade (year multiple of 10) plus the first and the latest data point, from zero; only real rows of the source are used, nothing is interpolated. The visualizer recommends it automatically for such series (`servidor/visualizador_extra.mjs`). In vertical the bars lie horizontally.

| Horizontal | Vertical |
|---|---|
| ![](gallery/barras-decada-h.png) | ![](gallery/barras-decada-v.png) |

### `carrera` — bar chart race
When: who leads at each date, same unit. Needs: 3–10 series of the same kind. Declares: the date advances at constant speed; labels lose what every name repeats.
Limits: long names are shortened; works best with ≤ 8 bars.

| Horizontal | Vertical |
|---|---|
| ![](gallery/carrera-h.png) | ![](gallery/carrera-v.png) |

Example: [energy-race](../examples/energy-race/).

### `apilada` / `apilada100` — stacked area (absolute / 100 %)
When: how a total splits among parts over time. Needs: 2–8 series, same unit. Declares: the height is the exact sum; in 100 % mode each band is value ÷ total at that moment; only dates where **all** series have data are used.

| Horizontal | Vertical |
|---|---|
| ![](gallery/apilada-h.png) | ![](gallery/apilada-v.png) |
| ![](gallery/apilada100-h.png) | ![](gallery/apilada100-v.png) |

Example: [global-energy-mix](../examples/global-energy-mix/).

### `agrupadas` — grouped bars
When: a few items at 3–4 moments (e.g. 1800 / 1974 / 2025). Needs: 2–8 series, same unit. Declares: common scale from 0; moments are spread evenly over the rows where all series have data.

| Horizontal | Vertical |
|---|---|
| ![](gallery/agrupadas-h.png) | ![](gallery/agrupadas-v.png) |

### `bump` — rank over time
When: who overtakes whom. Needs: 3–8 series. Declares: ranks by value (same unit) or **by cumulative growth** (different units), written on screen. Limits: long names are cut with “…”.

| Horizontal | Vertical |
|---|---|
| ![](gallery/bump-h.png) | ![](gallery/bump-v.png) |

### `velas` — candlesticks
When: price series. Needs: 1 daily close series **or** 4–5 columns (open, high, low, close, volume). Declares: with closes only, each candle groups a period (open = first close, close = last close, wicks = highest/lowest close, *not* intraday extremes); with OHLC columns the candles are exact.
Limits: the open data we can redistribute only has closes, hence the gallery shows the declared-limitation version.

| Horizontal | Vertical |
|---|---|
| ![](gallery/velas-h.png) | ![](gallery/velas-v.png) |

Example: [wti-candlesticks](../examples/wti-candlesticks/).

### `histograma` / `retornos` — distribution of values / of returns
When: “how common is a value / a move of this size”. Needs: 1 series with ≥ 30 points. Declares: bin width, median, last value and its percentile; returns are `v[t]/v[t-1] − 1` between consecutive rows, range from percentile 0.5 to 99.5 with tails grouped in the end bars.

| Horizontal | Vertical |
|---|---|
| ![](gallery/histograma-h.png) | ![](gallery/histograma-v.png) |
| ![](gallery/retornos-h.png) | ![](gallery/retornos-v.png) |

Example: [eurusd-daily-returns](../examples/eurusd-daily-returns/).

### `calendario` — calendar heatmap
When: seasonality, bad years at a glance. Needs: 1 daily price series. Declares: monthly return = last close of the month ÷ last close of the previous month − 1 (or daily); colour saturates at ±20 %, announced; shows the most recent years that fit. In vertical the grid is transposed (months as rows, years as columns) so every cell carries its number; the number of years shown is whatever fits the width of «−12,3».

| Horizontal | Vertical |
|---|---|
| ![](gallery/calendario-h.png) | ![](gallery/calendario-v.png) |

Example: [oil-monthly-returns-calendar](../examples/oil-monthly-returns-calendar/).

### `bandas` — this year against the historical range
When: “is this year normal?” for monthly data. Needs: 1 series with ≥ 5 years. Declares: per month min–max, percentiles 25–75 and median of previous years; the current year on top; nothing is projected.

| Horizontal | Vertical |
|---|---|
| ![](gallery/bandas-h.png) | ![](gallery/bandas-v.png) |

### `enjambre` — beeswarm: how a quantity is spread across countries or companies
When: "where does Colombia sit among 70 countries?" Needs: a categories table with ≥ 8 rows (`COL · Colombia` style concepts show the code). Declares: one dot per row on a single horizontal scale (logarithmic, and announced, when the largest is over 30× the smallest); vertical position only separates dots and means nothing; dotted line = exact median. Labels the smallest, the largest and the highlighted row (`resalta`). Template `enjambre_pais`.

| Horizontal | Vertical |
|---|---|
| ![](gallery/enjambre-h.png) | ![](gallery/enjambre-v.png) |

### `cordillera` — ridgeline: a daily series' distribution, year by year
When: "how did the SHAPE of the values change, not just the average?" Needs: 1 daily series with ≥ 3 years (≥ 20 observations per year). Declares: each ridge is the % of that year's observations in each of 40 equal ranges (frequency polygon, **not smoothed**), the same height scale for every ridge, white mark = exact median; the last 12 years are shown and the screen says so. Template `cordillera`.

| Horizontal | Vertical |
|---|---|
| ![](gallery/cordillera-h.png) | ![](gallery/cordillera-v.png) |

### `corriente` — streamgraph: a stacked area with a centered baseline
When: the `apilada` use case when the *flow* of the parts matters more than reading the total. Needs: 3–8 series of the same unit, all positive. Declares: band thickness is the exact value; the baseline is centered (a "wiggle" baseline after Byron & Wattenberg 2008, own implementation), so vertical position is NOT a value and a scale bar measures the unit. Inside-out ordering by peak time. Template `corriente`.

| Horizontal | Vertical |
|---|---|
| ![](gallery/corriente-h.png) | ![](gallery/corriente-v.png) |

### `dos_hitos` — one series, two milestones (alias `two_milestones`)
When: "what did the same index do after event A versus after event B?". Needs: **1 daily series** and `hitos`: two `AAAA-MM-DD` dates with a name each (the template refuses to run without them, so it is not in the studio's template list: use a spec, the CLI or the MCP). Declares: each milestone rebases the series to 100 at the close of its date; the two curves are aligned by trading sessions since the milestone (not by calendar date); log axis when max/min > 5 (`escala` forces `lineal` or `log`); where the shorter series ends the screen shades "no projection". Shows: tip labels (name + date), session counter, peak and trough annotations, drawdown from the running maximum, a live table (return, drawdown now, worst drawdown) and two final figures. Every figure is computed from the series and listed in the compiler report; the milestone dates and names are **claims to confirm against a primary source**. In 9:16 the names sit in a legend above the chart (the 40 px name floor leaves no gutter at the line tip).

| Horizontal | Vertical |
|---|---|
| ![](gallery/dos-hitos-h.png) | ![](gallery/dos-hitos-v.png) |

Example: [two-milestones-dollar](../examples/two-milestones-dollar/) (nominal broad dollar index, Federal Reserve, public domain). The Netscape / ChatGPT version, [`specs/ejemplo_dos_hitos_nasdaq.json`](../specs/ejemplo_dos_hitos_nasdaq.json), fails on purpose with "pending open licence" until an open daily Nasdaq-100 series exists.

### `bullet` — gauge against history
When: where the last value sits in its own history. Needs: 1–5 series. Declares: three bands (min–P25, P25–P75, P75–max), the target line = median (computed) unless you pass a hand-written target **with a verified source**; scale starts at 0.

| Horizontal | Vertical |
|---|---|
| ![](gallery/bullet-h.png) | ![](gallery/bullet-v.png) |

## Several series, different units

### `pendiente` — slope chart
When: who rose and who fell between the first and last moment. Needs: 2–8 series. Declares: logarithmic scale (distance proportional to % change) when magnitudes differ a lot.

| Horizontal | Vertical |
|---|---|
| ![](gallery/pendiente-h.png) | ![](gallery/pendiente-v.png) |

### `divergente` — diverging bars of % change
When: gains and losses on one scale, units may differ. Needs: 2–8 series. Declares: change = last ÷ first − 1, with both values shown.

| Horizontal | Vertical |
|---|---|
| ![](gallery/divergente-h.png) | ![](gallery/divergente-v.png) |

### `correlacion` — correlation heatmap
When: which series move together. Needs: 3–8 series. Declares: correlation of the **changes** between periods (not of the levels). Limits: in vertical the matrix is small (4–5 series is the practical maximum); long names are cut.

| Horizontal | Vertical |
|---|---|
| ![](gallery/correlacion-h.png) | ![](gallery/correlacion-v.png) |

### `dispersion` — scatter with regression
When: relationship between two quantities. Needs: a table with x and y. Declares: OLS line and R² computed by the compiler, number of points. Limits: hand-written spec (see the gallery cases).

| Horizontal | Vertical |
|---|---|
| ![](gallery/dispersion-h.png) | ![](gallery/dispersion-v.png) |

### `radar` — profile (series, or a table)
When: where a country or company is strong or weak. Needs: 3–8 series (each axis runs from its own historical min = 0 to max = 100; the dot is the last value), or a table (`radar_tabla`) with a common scale declared on screen. Declares: it says **where inside the range**, not whether it is good or bad.

| Horizontal | Vertical |
|---|---|
| ![](gallery/radar-h.png) | ![](gallery/radar-v.png) |
| ![](gallery/radar-pais-h.png) | ![](gallery/radar-pais-v.png) |

Example: [colombia-radar-45-countries](../examples/colombia-radar-45-countries/).

## Parts of a total (tables)

### `donut`
When: up to ~8 parts. Needs: categories table. Declares: unit; centre shows the total; % = value ÷ sum of parts.

| Horizontal | Vertical |
|---|---|
| ![](gallery/donut-h.png) | ![](gallery/donut-v.png) |

### `treemap`
When: many parts (> 6). Needs: categories table. Declares: area proportional to value; parts too small to label are listed with their figure (never dropped).

| Horizontal | Vertical |
|---|---|
| ![](gallery/treemap-h.png) | ![](gallery/treemap-v.png) |

Example: [amazon-dollar-treemap](../examples/amazon-dollar-treemap/).

### `waffle`
When: “out of every 100…”. Needs: categories table. Declares: each square = 1 %; squares are allocated by largest remainder so they sum to exactly 100; the legend shows the exact %.

| Horizontal | Vertical |
|---|---|
| ![](gallery/waffle-h.png) | ![](gallery/waffle-v.png) |

Example: [nvidia-per-100-dollars](../examples/nvidia-per-100-dollars/).

### `lollipop`
When: ranking of parts on a phone (big type). Needs: categories table. Declares: sticks start at 0 and are proportional to the value; % over the sum of parts.

| Horizontal | Vertical |
|---|---|
| ![](gallery/lollipop-h.png) | ![](gallery/lollipop-v.png) |

### `pictograma`
When: “how much is this, concretely”. Needs: categories table. Declares: each square = a round unit stated on screen; incomplete squares are exact fractions.

| Horizontal | Vertical |
|---|---|
| ![](gallery/pictograma-h.png) | ![](gallery/pictograma-v.png) |

### `ranking` — ranking with codes
When: countries or companies, highlight one. Needs: categories table (`COL · Colombia` shows the ISO code or ticker chip; no flags). Declares: bars from 0; if the highlighted item is not in the top it appears below with its real rank.

| Horizontal | Vertical |
|---|---|
| ![](gallery/ranking-h.png) | ![](gallery/ranking-v.png) |

Example: [gdp-per-capita-ranking](../examples/gdp-per-capita-ranking/).

## Flows and bridges

### `sankey`
When: where money comes from and where it goes. Needs: flows table (`origen,destino,valor`). Declares: a node equals the sum of its flows; % over the largest node; a node that does not balance (> 0.5 %) warns, (> 5 %) is an error. For SEC reports the figures are derived so the diagram always balances.
In vertical the diagram runs top to bottom (d3-sankey layout, row-staggered labels with leader lines). Limits: mid-level nodes carry the name only, because of the vertical type floor.

| Horizontal | Vertical |
|---|---|
| ![](gallery/sankey-h.png) | ![](gallery/sankey-v.png) |

Example: [nvidia-how-it-makes-money](../examples/nvidia-how-it-makes-money/).

### `cascada` — waterfall
When: from a total, what each step added or took away. Needs: categories table with `inicio`/`total` rows. Declares: subtotals are checked against the running sum. Limits: vertical uses horizontal rows (12 columns do not fit a phone).

| Horizontal | Vertical |
|---|---|
| ![](gallery/cascada-h.png) | ![](gallery/cascada-v.png) |

Example: [apple-revenue-to-profit](../examples/apple-revenue-to-profit/).

### `dumbbell` — before and after
When: two moments per item. Needs: a table `concepto,valor,anterior` (`dumbbell`) or 2–8 series of the same unit (`dumbbell_series`). Declares: common scale from 0; change = now ÷ before − 1; green up, red down.

| Horizontal | Vertical |
|---|---|
| ![](gallery/dumbbell-h.png) | ![](gallery/dumbbell-v.png) |
| ![](gallery/dumbbell-series-h.png) | ![](gallery/dumbbell-series-v.png) |

---

## Known issues

See the list at the end of [EXAMPLES.md](EXAMPLES.md#known-issues).
