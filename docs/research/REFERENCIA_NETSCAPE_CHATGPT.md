# Reference analysis: "Netscape / ChatGPT" (MacroWise, two-milestone chart)

Analysed on 2026-11-08 from the **file itself** (`WhatsApp Video 2026-11-08 at 7.45.37 AM.mp4`), not from captions or screenshots: contact sheet every 0.5 s with ffmpeg, scene-change detection, ffprobe, and full-resolution frames at 10 s and 20 s.

## Measured facts

| Property | Value |
|---|---|
| Container / codec | H.264, 1200 x 1200 (1:1), 30 fps, ~410 kb/s |
| Duration | 30.1 s (903 frames) |
| Audio | none (no audio stream) |
| Structure | dark intro card (~1.5 s) -> chart builds (~24 s) -> table row swaps to two big KPIs (~3 s) -> dark closing card with the disclaimer |
| Cuts | none inside the chart: it is one continuous animation; only intro->chart and chart->outro are hard changes |
| Scale | left panel "growth, base 100" on a **linear** axis (0-800); lower panel "drawdown from cycle maximum" (0 to -90 %) |
| Series | two lines, both rebased to 100 on the close of their milestone date, aligned by **trading sessions since the milestone** (not by calendar date) |
| Colors | near-black and teal lines on a light-grey card; gold dot for a peak; red for losses, green for gains in the table |
| Type | geometric sans (bold) for title and names; monospace, wide-tracked caps for eyebrow, axis titles, dates and numbers |
| Source on screen | yes: "Fuente: Nasdaq-100 (^NDX), cierres diarios, Yahoo Finance - Corte: 6 nov 2026", plus an "inspired by" credit |

## What it does well

1. **One idea, one chart**: two events, same index, same starting line (base 100). The viewer compares paths without reading numbers.
2. **Session counter** ("SESION 1.803", top right of the card) turns the build into a visible clock; it makes the pacing legible and the x-axis honest.
3. **Direct labels at the moving tip** of each line (name + date) instead of a legend. The label rides the line.
4. **Honest truncation**: when the younger series runs out of sessions, the chart says "ChatGPT ends at session 987 - no projection" and shades the region where only one series exists. This is the best idea in the piece.
5. **Second panel for drawdown** from the running maximum answers "how bad did it get?" which the base-100 panel hides.
6. **Table that updates live** (return, current drawdown, worst drawdown) under the chart, then collapses into two large KPIs for the final beat.
7. **Disclaimer as a closing card** ("Historical comparison, not a forecast"), which protects the brand and gives the end of the piece a stop.
8. **Events annotated at the data**: peak (gold dot + "Peak - date") and trough ("Trough - date, -x %") appear when the line reaches them.

## What to copy (implemented as the `two_milestones` template)

- Rebase each series to 100 at its own milestone date; align by sessions since the milestone.
- Tip labels with name + date; session counter; peak and trough annotations; "no projection" shading where one series has ended.
- Drawdown panel from the running maximum, below the growth panel.
- Live table, then final KPIs. Closing card with a configurable disclaimer.
- All text through the language layer (`motor/idioma.js`), so the same spec renders in `es` and `en`.

## What to improve

- **Linear axis hides the early years.** In a 0-800 axis the first 800 sessions are a flat ribbon. Offer `escala: "log"` (base-100 log axis, ticks 50/100/200/400/800) and make it the default when max/min > 5.
- **"0" tick on the growth axis** is meaningless for a base-100 index (the axis starts at zero only because it is linear). Drop it on log scale.
- **Label collisions**: the "NETSCAPE" tip label sits on top of its own line and over the shaded block; the trough label is clipped by the card edge. Use the engine's collision-free labelling (`motor/etiquetas.js`) and keep labels inside the plot.
- **Contrast**: the grey shading plus the light-grey axis labels fall below 4.5:1 in places (the design system requires >= 4.5:1).
- **Mixed language and decimal separators** ("-82,9 %" next to "+124%"): use the locale layer for every number.
- **The drawdown panel shares the x-axis but not the card title**; add one clear axis title ("Sessions since the milestone").
- **No audio and no easing information**: the line grows at constant speed; ease-in on the first second and a slow-down near the end would read better. Hold the final frame 1 s before the KPI swap.
- **Source line must be verifiable and open**: the piece cites Yahoo Finance, which is not an open licence. See next section.

## What NOT to copy

- **Any number.** Every figure shown in the original (returns, drawdowns, peak/trough dates, session counts, "+313 %", "+124 %") is a brand claim. None of them was copied here; none is used until recomputed from a source with an open licence and checked against the official series.
- **Yahoo Finance as the data source.** Yahoo's terms forbid redistribution; the repo's rule is "never Yahoo". `yf_*` catalog entries stay "personal use only".
- **The "inspired by" credit and the layout verbatim**: the template reproduces the idea (two milestones, base 100, sessions since), not the artwork.

## Data availability (checked in the catalog on 2026-11-08)

- **Nasdaq-100 with an open licence: not available.** The catalog has no Nasdaq-100 series. FRED's `NASDAQ100` covers only ~10 years and carries Nasdaq's terms. `yf_ixic` (Nasdaq Composite via Yahoo) is "personal/research use, do not redistribute".
- `fred_nasdaqcom` (Nasdaq Composite from FRED, since 1971) has the licence note "see the series terms on FRED"; the redistribution terms of Nasdaq data on FRED were **not verified**, so it is not used for any published example.
- Therefore the Netscape/ChatGPT case is **not reproduced with invented or non-open data**. The template is demonstrated on an open public-domain daily series (see `docs/research/INTEGRATION_LOG.md`, 2026-11-08 entry) and the exact Netscape/ChatGPT spec is saved as a ready-to-run example that fails loudly until an open Nasdaq-100 series is added (`specs/ejemplo_dos_hitos_nasdaq.json`, source marked "pending open licence").
- Milestone dates are public facts but were not copied from the video either: Netscape IPO and the public launch of ChatGPT must be confirmed against SEC / OpenAI primary sources before use.
