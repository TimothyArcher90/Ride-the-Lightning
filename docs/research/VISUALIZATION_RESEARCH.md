Spanish original: [../es/INVESTIGACION_VISUALIZACION.md](../es/INVESTIGACION_VISUALIZACION.md)

# Research: animated data visualization for 9:16 reels

Date: 2026-11-04. Every URL below was opened or appeared in search during the research. Anything marked **(unverified)** comes from secondary sources or memory and must be cross-checked before being used as a brand figure.

## 1. Theory: rules for choosing a chart automatically

Sources:
- Cleveland and McGill (1984), Graphical Perception, JASA 79(387). Secondary summary: https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html (course PDF: https://vis.pku.edu.cn/course/visclass_f25/material/Graphical_perception.pdf)
- Tufte, The Visual Display of Quantitative Information (1983): data-ink ratio. Summary: https://freshspectrum.com/data-ink-ratio/ (secondary source)
- Cairo, The Truthful Art (2016): truthful, functional, beautiful, insightful, enlightening graphics. Summary: https://thedataschool.co.uk/laura-brylka/the-five-qualities-of-great-vizualizations-according-to-alberto-cairo
- Wilke, Fundamentals of Data Visualization (CC BY-NC-ND): https://clauswilke.com/dataviz/ (ch. 5 directory, 6 amounts, 10 proportions, 13 time series, 14 trends, 17 "proportional ink", 20 redundant coding, 29 telling a story)
- From Data to Viz (decision tree): https://www.data-to-viz.com/
- FT Visual Vocabulary (9 categories): https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- Datawrapper, why bars start at zero: https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero
- Datawrapper, lines: https://www.datawrapper.de/academy/what-to-consider-when-creating-line-charts
- Datawrapper, annotations: https://www.datawrapper.de/academy/annotate-tab and https://www.datawrapper.de/blog/annotations-in-bar-charts
- European guide to direct labelling: https://data.europa.eu/apps/data-visualisation-guide/direct-labelling

### Perceptual hierarchy (Cleveland-McGill)
Order of accuracy (best to worst, per a secondary summary): position on a common scale > position on non-aligned scales > length/direction/angle > area > volume/curvature > shading/saturation.
Operating rule: encode the main data with position or length. Area (bubbles, treemap) and angle (donut) only for secondary data or proportions of a few parts, always with the figure written out.

### FT taxonomy (which question each family answers)
- Deviation: diverging bars, surplus/deficit.
- Correlation: scatter, bubbles, connected scatter.
- Ranking: ordered bars, slope, lollipop.
- Distribution: histogram, boxplot, violin, dot grid.
- Change over time: line, area, calendar heatmap, candlestick, connected scatter.
- Part-to-whole: stacked, treemap, waffle, donut, waterfall.
- Magnitude: columns, isotype (pictogram), lollipop.
- Spatial: choropleth, bubble on map, flow.
- Flow: sankey, waterfall, chord.

### Data to Viz decision tree (summary)
Entry by data format: numeric, categorical, numeric+categorical, time series, map, network.
- One time series: line, area, bars, lollipop. Several series: line, stacked area, streamgraph, heatmap, ridgeline.
- One categorical: bars, lollipop, donut, waffle, treemap, circle packing.
- Nested categorical: treemap, sunburst. Relations between categories: sankey, chord, heatmap.
- Numeric+categorical, one value per group: bars or lollipop. Several observations per group: violin, boxplot, ridgeline.
- Two numeric: scatter (connected if there is time order).

### Concrete rules for an automatic selector (proposal)
Input: data type (time / category / flow), number of series (S), number of categories (C), number of points (N), whether it sums to 100 % or is part-to-whole, whether there are two periods.

| Data shape | Default chart | Alternative | Avoid |
|---|---|---|---|
| 1 time series, N>12 | line (optional soft fill) | area | bars if N>30 |
| 1 time series, N<=12, discrete values (quarters) | bars | lollipop | line without markers |
| 2–5 time series, same unit | lines with a direct label at the end | base-100 index | separate legend |
| 6–10 time series | highlight 1–2 and dim the rest (spaghetti with focus) | small multiples | 10 identical colors |
| >10 series | small multiples (max 6 per shot) or ranking | heatmap | one line per series |
| series with very different units or scales | base-100 index or small multiples | dual axis only as a last resort | dual axis by default |
| ranking that changes over time | racing bars (top 8 max) | bump chart | more than 10 rows in 9:16 |
| compare two moments, many categories | slope chart (two points) | dumbbell | grouped bars |
| compare categories, 1 period | ordered horizontal bars | lollipop | pie |
| part-to-whole, 2–5 parts | donut or 100 % stacked bar | waffle | 3D pie, >6 slices |
| part-to-whole, 6–30 parts | treemap | waffle by groups | donut |
| part-to-whole over time | 100 % stacked area | streamgraph | overlapping lines |
| from A to B with losses/transformation | sankey (max 3 columns) | waterfall | sankey with >12 nodes |
| additive contributions to a total | waterfall | stacked bars | donut |
| two numeric variables, N groups | scatter/bubble with 3–6 labels | connected scatter if there is time | labeling every point |
| distribution (many values) | histogram/density | beeswarm, dot strip | unexplained boxplot |
| calendar / seasonality | calendar heatmap | overlaid lines per year | -- |
| price with intraday range | candlestick | closing line | -- |
| cumulative / market share vs total | stacked area | marimekko (2 dimensions) | -- |

Tie-breaking rules (from Cleveland-McGill, Wilke and Datawrapper):
1. Prefer position/length over angle/area.
2. Order categories by value, unless there is a natural order (time, age).
3. Label directly; a legend only if there are more than 6 colors.
4. At most 1 emphasis color; the rest in dimmed gray.
5. If the message is "this went up/down", the chart must show the change (index, slope, difference), not two distant absolute values.

## 2. Catalog of chart models (libraries and galleries)

References for learning implementations:
- d3-sankey (BSD-3): https://github.com/d3/d3-sankey
- d3-hierarchy treemap (squarify, resquarify, binary, dice, slice, sliceDice; resquarify is designed for animation): https://d3js.org/d3-hierarchy/treemap
- d3-force (center, collision, link, charge, position; useful for non-overlapping bubbles and beeswarm): https://d3js.org/d3-force
- Observable Plot: https://observablehq.com/plot/ (the /plot/marks page returned 429 when checked; retry)
- Vega-Lite marks (area, bar, circle, line, point, rect, rule, square, text, tick, geoshape + boxplot, errorband, errorbar): https://vega.github.io/vega-lite/docs/mark.html
- RAWGraphs (almost 30 visual models): https://www.rawgraphs.io/
- Flourish (templates; the templates page did not list names when queried): https://flourish.studio/visualisations/
- Apache ECharts examples: https://echarts.apache.org/examples/en/index.html
- Plotly: https://plotly.com/javascript/ (not verified in detail)

Implementation note: d3-sankey, d3-hierarchy and d3-force can run in Node without a DOM. To keep the function pure in time, compute the layout once (in the preparation phase, with a fixed seed, and for d3-force a fixed number of ticks) and draw by interpolating between precomputed layouts.

### Models (feasibility on deterministic 2D canvas and 1080x1920)
Already in the tool: lines, racing bars, area, sankey, donut, waterfall, callouts, zones, camera.

| # | Model | Best use | 2D canvas | Legible in vertical |
|---|---|---|---|---|
| 1 | Slope chart | Before/after across 5–12 categories | Easy | Very good (uses the height) |
| 2 | Bump chart | Ranking changes over time | Easy | Good with <=8 series |
| 3 | Dumbbell | Gap between two values per category | Easy | Very good horizontal with rows |
| 4 | Lollipop | Ranking with less ink than bars | Easy | Very good |
| 5 | Base-100 index | Compare series with different scales | Easy | Good |
| 6 | Stacked / 100 % area | Composition over time | Easy | Good |
| 7 | Streamgraph | Composition with aesthetics (many categories) | Medium (d3.stack wiggle offset baseline) | Good, hard to read values |
| 8 | Treemap (squarify) | Part-to-whole with many parts | Medium (precomputed layout) | Good: takes time to explain |
| 9 | Waffle / isotype | Understandable figures ("1 in 10") | Easy | Very good |
| 10 | Small multiples | Many series without spaghetti | Medium | Fair: max 2x3 or 3x2 |
| 11 | Calendar heatmap | Seasonality, streaks | Easy | Fair (many cells) |
| 12 | Beeswarm | Distribution with named points | Medium (precomputed simulation) | Good with <=60 points |
| 13 | Bubble race | Two variables over time, Gapminder-style | Medium | Fair: 6–10 bubbles |
| 14 | Radial/polar | Seasonality, cycles | Medium | Fair; avoid for comparing values |
| 15 | Marimekko | Share per segment × segment size | Medium | Fair |
| 16 | Candlestick | Prices with range | Easy | Good with <=40 candles |
| 17 | Connected scatter | Two evolving variables (inflation vs unemployment) | Easy | Good |
| 18 | Circle packing | Hierarchy in bubbles | Medium (d3.pack) | Good |
| 19 | Fan chart (projection with band) | Forecasts with uncertainty | Easy | Good |
| 20 | Density/ridgeline | Distributions per group | Medium | Fair |

Easy and high-impact for the reel: slope, bump, dumbbell, lollipop, waffle, base-100 index, fan chart. More expensive: treemap, streamgraph, beeswarm, bubble race.

## 3. Animation: principles and what retains attention

Sources:
- Heer and Robertson (2007), Animated Transitions in Statistical Data Graphics, IEEE TVCG 13(6). PDF: https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf (the binary content could not be read; the guidelines come from course slides: https://courses.cs.washington.edu/courses/cse442/24au/lectures/CSE442-Animation.pdf)
- Robertson, Fernandez, Fisher, Lee, Stasko (2008), Effectiveness of Animation in Trend Visualization, IEEE TVCG 14(6). PDF: https://faculty.cc.gatech.edu/~stasko/papers/infovis08-anim.pdf

### Key findings
- Heer-Robertson: well-designed animated transitions outperform static ones in object tracking and value estimation. Guidelines (from the slides): keep the chart valid throughout the transition, consistent mappings, respect the semantic correspondence between elements, avoid ambiguity; group similar transitions, minimize occlusion, maximize predictability, keep transitions simple, stage the complex ones, and make them last just long enough.
- Robertson 2008: for analysis, animation was the worst (slower than overlaid lines or small multiples; small multiples were more accurate). With a presenter and interesting data, it helps the audience understand. Consequence: in a reel (guided presentation) animation works, but each shot must carry a single message and the final value must stay still and legible long enough; do not rely on the viewer comparing values while they move.

### Concrete techniques (proposals, to validate by eye in tests)
- Staging: axis and context first (0.3–0.5 s), then the data, then the annotation. Never everything at once.
- Progressive reveal: a line drawn left to right with the tip marked (dot + live figure). Bars that grow from zero (never from another base).
- Easing by data type:
  - Growing magnitudes (bars, counters): cubic ease-out, fast attack and settling.
  - Time series being drawn: nearly linear within the segment, so as not to distort the perceived rate of change, with ease-in-out only at start and end.
  - Reorderings (ranking, bump): soft ease-in-out, 0.6–0.9 s.
  - Camera: long ease-in-out, no bounces. Avoid overshoot in financial data: it suggests figures that do not exist.
- Stagger: 40–80 ms between elements of the same family (bars, waffle cells). More than 120 ms feels slow.
- Focus with dimming: when highlighting a series, the rest drops to ~20–30 % opacity and gray; the focus series gains thickness and color. Focus transition 0.3–0.4 s.
- Camera: follow the line tip or zoom into a segment (crisis, turning point). Keep the zoom within legible axes; show the new scale.
- Counters: figures that rise with the animation and stay still on arrival; use a tabular font so the width does not jitter.
- Annotation synchronized with the voice: mark the instant each callout appears with the word's timestamp (per-word timestamps from the script) so the chart "says" the same as the voice in the same second.
- Final pause: leave 1–1.5 s without movement with the written conclusion before the cut.
- What retains attention (working hypothesis, not a study result): a hook with the figure or the twist in the first 2 s, a visual change every 2–4 s, a question the chart answers, and the most important element always in the visual center, not at the edges.

Meta style references (no rules extracted from them; review by hand): Our World in Data https://ourworldindata.org/, Datawrapper https://www.datawrapper.de/blog, The Pudding https://pudding.cool/, FT Visual Vocabulary above.

## 4. Accuracy and integrity

### Best practices
- Bars and columns: always a zero baseline (Datawrapper blocks a minimum >0 on bars: https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero). Lines need not start at zero, but the range must be declared and the slope not exaggerated.
- If the axis is cut or a log scale is used, state it on the chart ("logarithmic scale").
- Avoid dual axes; if unavoidable, label each axis with its series' color and warn. Prefer a base-100 index or two shots.
- Money across years: say whether it is nominal or real. Deflate with CPI (FRED CPIAUCSL, BLS CPI) and write the base year ("2020 USD").
- Always on screen: source (agency + series/ID) and the date of the last data point. It is a brand claim (the owner's rule): a figure not verified against an official source is not published.
- Do not mix frequencies without saying so; do not smooth without saying so; beware of revisions: recent data (GDP, employment) changes.
- If a stretch is a projection, use a distinct style (dotted line/band) and the label "estimate".
- Color maps with enough contrast and not relying on color alone (redundant coding, Wilke ch. 20).
- Cairo: a chart must be truthful before beautiful (see section 1).

### Open data sources (status verified on 2026-11-04)

| Source | Key | Example endpoint | Notes |
|---|---|---|---|
| FRED | Yes (free) | `https://api.stlouisfed.org/fred/series/observations?series_id=GNPCA&api_key=YOUR_KEY&file_type=json` | Docs: https://fred.stlouisfed.org/docs/api/fred/series_observations.html. `units` (pch, pc1, etc.) and `frequency` parameters are useful |
| World Bank | No | `https://api.worldbank.org/v2/country/MEX/indicator/NY.GDP.MKTP.CD?format=json&per_page=100` | Tested: returns JSON, [meta, records]. Docs: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589 (not verified) |
| IMF DataMapper | No | `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/MEX` | Tested: JSON `values.INDICATOR.COUNTRY.YEAR`. Includes WEO projections: flag them as estimates |
| OECD (SDMX) | No | `https://sdmx.oecd.org/public/rest/dataflow/all` | Tested: returns SDMX 2.1 XML with the list of dataflows. Data: `/public/rest/data/{AGENCY,FLOW,VERSION}/{filter}?format=jsondata` (SDMX pattern, unverified) |
| BLS | v2: free registration recommended | `https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000` | GET tested (US unemployment): REQUEST_SUCCEEDED. With a key: up to 20 years and 50 series per query. Docs: https://www.bls.gov/developers/api_signature_v2.htm |
| BEA | Yes (free UserID) | `https://apps.bea.gov/api/data/?UserID=YOUR_KEY&method=GetData&datasetname=NIPA&TableName=T10101&Frequency=A&Year=X&ResultFormat=JSON` | Registration: https://apps.bea.gov/API/signup/index.cfm. Parameters per the bea.R R package; confirm in the BEA guide |
| Census | Yes (free) | `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01001_001E&for=state:*&key=YOUR_KEY` | Tested without a key: asks for a key. Registration: https://api.census.gov/data/key_signup.html (unverified); guide https://www.census.gov/data/developers/guidance/api-user-guide.html |
| Eurostat | No | `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?format=JSON&lang=EN&geo=ES&coicop=CP00&sinceTimePeriod=2025-01` | Tested: JSON-stat 2.0 (harmonized inflation). Docs: https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started |
| Banxico SIE | Yes, token (free) in the `Bmx-Token` header | `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43783/datos/oportuno` | Doc: https://www.banxico.org.mx/SieAPIRest/service/v1/?locale=en. Query limits at `/SieAPIRest/service/v1/doc/limiteConsultas` |
| Colombia: TRM | No (optional app token) | `https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=2` | Tested: fields valor, unidad, vigenciadesde, vigenciahasta. The TRM (official representative exchange rate) is certified by the Superfinanciera (the Banco de la República has taken it from there since Nov 2016). History in the Bank's statistics portal: https://banrep.gov.co/es/como-consultar-datos-historicos-tasa-representativa-mercado-trm-nuevo-portal-estadisticas |
| SEC EDGAR | No; User-Agent header mandatory | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` and `https://data.sec.gov/submissions/CIK##########.json` | Max. 10 requests/s. Policy: https://www.sec.gov/os/accessing-edgar-data. Already integrated |
| Treasury FiscalData | No | `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?format=json` | Docs: https://fiscaldata.treasury.gov/api-documentation/ |
| UN Comtrade | Preview without a key (limited); full with a key | `https://comtradeapi.un.org/public/v1/preview/C/A/HS?flowCode=X&reporterCode=156&period=2023` | Only 500 records per query, one product and one period; no descriptions. Secondary source: https://comtradewiki.azurewebsites.net/?p=382. The official page could not be opened (404 at the comtradeapi.un.org root) |
| OWID | No | `https://ourworldindata.org/grapher/life-expectancy.csv?v=1&csvType=full&useColumnShortNames=true` | Tested: CSV `entity,code,year,column`. Metadata in `.metadata.json`. License CC BY 4.0 (https://docs.owid.io/projects/etl/api/): cite OWID and the original source of each series |

Still to verify: Census daily limit without a key, Banxico limits, reuse licenses per source (World Bank CC BY 4.0 is the usual one, confirm).

## 5. Reel 9:16 format

Safe-zone sources (third parties; there is no single specification):
- https://www.revid.ai/instagram-reels-safe-zone (Reels/Shorts/TikTok at 1080x1920: ~270 px top, ~670 bottom, 65 left, 120 right)
- https://www.socialync.io/tools/safe-zones/tiktok (TikTok: 240 top, 660 bottom, 120 per side)
- https://www.revid.ai/tiktok-safe-zone (TikTok: 220 top, 480 bottom, 60 left, 140 right)
- https://houseofmarketers.com/guide-to-safe-zones-tiktok-facebook-instagram-stories-reels/
The figures disagree by up to 300 px on the bottom edge. Verify with TikTok's official template (In-Feed Ads) and the in-app preview before accepting a figure.

### Recommended rules (conservative union of the above)
- Safe zone for text and key data: x 120–940 (820 px wide), y 270–1250 (about 980 px tall). Background, color and decorative elements may reach the edges.
- The bottom 670 px are reserved for the platform's title/captions: do not put figures there. If the voice's subtitles go at the bottom, even less space is left for the chart.
- Font sizes at 1080 px width (our own guide; verify on a real phone): protagonist figure 140–220 px; title 64–80 px; data labels 40–48 px minimum; data source/note 30–34 px (non-essential text only); nothing below 28 px.
- Contrast: light text on the brand's dark background (MacroWise palette), opaque cards (the owner's rule), no gradients that lower contrast.
- Line thickness: 6–10 px at 1080 width; points 14–20 px; bars at least 40 px tall.
- Density: at most 1 idea per shot; 1 protagonist figure; max. 3 simultaneous annotations; max. 8 rows in a ranking; max. 5 labeled lines; max. 6 donut segments; axes with 3–4 ticks, no more.
- Duration per shot: 4–8 s for one idea; if the animation lasts more than 8 s, split it into two shots.
- X axis in vertical: use the height (slope, ranking, vertical waterfall, bump). Long time series read better with a camera zoom than squeezed into 820 px.
- Label orientation: always horizontal; never rotated text.
- Subtitles as an editable track (the owner's rule), not burned in; leave the band where they will go free.

## What to implement first (top 10)

| # | Priority | What | Why | Difficulty on 2D canvas |
|---|---|---|---|---|
| 1 | Automatic chart selector | A function that, given the data schema, picks the chart using the table in section 1 and warns if the data does not allow it | Turns the research into product and avoids ad-hoc decisions | Low (logic, no drawing) |
| 2 | Integrity and source layer | Force labeling of source, series and last-data date; automatic warnings (bars with a non-zero base, dual axis, nominal vs real) | A labeled figure = a brand claim; avoids public errors | Low |
| 3 | Safe zone and legibility rules in the renderer | 120/270/670 margins, minimum font sizes and density limits as pre-render validation | Every reel needs it; today it is the easiest mistake to make | Low |
| 4 | Animated slope chart | High legibility in vertical; the best chart for "before vs after" | Answers the typical financial-reel question in 1 shot | Low |
| 5 | Base-100 index with focus and direct labeling | Compare assets/countries of different scale without a dual axis; dim the rest | Replaces spaghetti and the dual axis, both very common in finance | Low-medium |
| 6 | Dumbbell and lollipop | Rankings and gaps with less ink than bars | Fill the gap between racing bars and the slope; easy to animate with stagger | Low |
| 7 | Bump chart | Ranking changes over time; complements the bar race | Very attractive and narrative; vertical favors it with few series | Medium (smooth curves and crossings) |
| 8 | Waffle / isotype | Make figures like "1 in 8" tangible | High retention through simplicity; almost no computation | Low |
| 9 | Fan chart (projection with bands) and projected line | Honest forecasts with uncertainty (IMF, central banks) | Avoids false precision and fits the rule of labeling estimates | Low-medium |
| 10 | Treemap with precomputed layout (squarify/resquarify) | Part-to-whole with many categories (budgets, portfolios, sectors) | Covers the case that donut/sankey do not solve; resquarify allows animating changes | Medium (requires a d3-hierarchy port and a deterministic precomputed layout) |

Next in the queue: candlestick, connected scatter, small multiples, bubble race, streamgraph, beeswarm.

Suggested work order: 1–3 in parallel (no new drawing, they improve everything that exists), then 4–6 (same primitives: lines, circles, text), then 8–10.

## Out of scope / unresolved
- The full text of Heer-Robertson or Cleveland-McGill was not read; the guidelines come from slides and summaries (linked).
- There is no cited study on what retains attention in reels; those sentences are marked as hypotheses.
- Johnny Harris, Caspian Report, Bloomberg, NYT and Reuters Graphics were not analyzed directly in this round.
- The OECD and BEA data endpoints were not confirmed with a real call, nor were reuse licenses per source.
