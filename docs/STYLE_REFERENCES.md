Spanish original: [es/REFERENCIAS_ESTILO.md](es/REFERENCIAS_ESTILO.md)

# Style references: Johnny Harris and Caspian Report

Research dated 2026-11-03. Goal: learn what they really do in their data charts and what Ride the Lightning lacks to match or surpass them **with traceable data** (something they do not offer).

**How to read the confidence levels**
- **Measured** = seen in frames of the analyzed videos (see section 4 on real precision).
- **Inferred** = deduced from what was measured or from coherent secondary sources.
- **Rumor** = reported by third parties (forums, Fiverr, automatic summaries), unchecked.

## 0. What was analyzed

| Channel | Video | Length | Segments examined |
|---|---|---|---|
| Johnny Harris | "The REAL reason China built so much" (`axRhjqd-rus`) | 50 min 25 s | Full contact sheet (1 frame / 45 s) + line-chart segment at 2018–2058 s at 1 fps |
| Caspian Report | "The hidden geography of AI" (`K-qll_Yhfms`) | 14 min 48 s | Full contact sheet (1 frame / 18 s) + bars at 52–64 s at 2 fps + stacked area/bars at 340–364 s at 1 fps |

Downloaded at 480p (854×480; 23.98 and 29.97 fps) into a temporary folder outside the repo, since deleted. Only 2 videos, 2 chart segments each: **this is a small sample**, not a study of the channel.

---

## 1. What they do (techniques)

### Johnny Harris

1. **Flat cream background, not dark.** Charts and maps on a warm paper tone: pixel sample in the chart frame = **RGB 218,213,208 (#DAD5D0)**. Alternates with dark shots of the presenter. *Measured (contact sheet and pixel).*
2. **The line chart shows several series but highlights ONE.** In "percent of population in extreme poverty" the subtitle names 5 countries/the world, each name in its color; China's line is thick red and the others are gray/faded in the background. *Observed in the JH video, ≈2043–2058 s.*
3. **A single data point per date = a vertical yellow bar.** To mark the year ≈2013 a yellow bar grows bottom-to-top in ≈1 s and stays. There is no text card in that segment: the voice says the value. *Observed, frames 2051–2057 s.*
4. **Camera in data space, with a "wide shot → punch-in → wide shot" rhythm.** The chart enters whole (≈5 s still with title and legend), zooms to the bottom-right corner (X axis 2000–2020 enlarged, axes rescaled) in ≈1–2 s, places the yellow bar and opens back out. *Observed, frames 2043–2058 s.* This is exactly the `camara:[{t,x,y}]` model the engine already has.
5. **Very little text.** In the line shot: a one-line title, a colored legend on the same line, 4–5 axis labels and a source line in tiny type. No subtitles or paragraphs. **2 figures on screen** (the axes) plus whatever the voice says. *Measured in the sample.*
6. **Typography.** Condensed uppercase headlines in a condensed grotesque ("PERCENT OF POPULATION IN EXTREME POVERTY") and thin sans axes. Chapter titles with large lettering on a solid background (emerald green with a grid, "6. LYING FLAT") and the Chinese term large. *Observed; I did not identify the exact typeface (rumor: unverified).*
7. **Color with meaning per chapter.** Maps in pastel pink/red and gray; emerald green for chapter titles; yellow only for "the moment". Short palette repeated throughout the video. *Observed.*
8. **Unit infographics (pictograms).** Grids of small figures (10,000 officials, central committee) instead of bars when the data is a count. *Observed on the contact sheet.*
9. **Timeline with panning.** A 1990–2000–2010–2020 axis that slides horizontally under the leaders (Mao, Deng, Jiang, Hu, Xi) with a colored zone that advances. *Observed, frames ≈2115 s and ≈2295 s.*
10. **Maps: mask reveals.** The Adobe Community thread (March 2025) on his Japanese-occupation map concludes: duplicated map, bottom layer with a pattern (not a flat color), a **track matte that reveals** the pattern layer, and scaling to imitate the zoom-out. *Rumor/forum, answer marked as correct, not confirmed by him.*
11. **Tools.** After Effects + the **GEOlayers 3** plugin (aescripts.com publishes "How Johnny Harris Makes Maps"; map styles via Mapbox/MapTiler according to summaries). Regular freelancer: Boone Loves Video (course with Illustrator + Photoshop + AE). *Inferred from third-party sources; see URLs.*
12. **Cuts.** Shot-change detection (threshold 0.3 over 3,025 s): **643 cuts → 1 cut every ≈4.7 s across the video** (includes camera, interviews and charts). Hard cuts dominate in the sample; I did not see long wipes. *Measured (figure) / inferred (transition type).*
13. **Chart-scene ending.** After the punch-in and the bar, the camera returns to the wide shot of the chart with the bar fixed and then cuts to the presenter. *Observed once.*

### Caspian Report

1. **Near-black navy background with a dot pattern and a thin rule.** It is the "data notebook": small white title top-left, tiny uppercase subtitle, a separator line. *Observed, 3 different charts.*
2. **A single hue per chart.** Bars in periwinkle (lilac-blue) with rounded edges in "Electricity needed for the same computing power" (3 bars: 109, 117 and 128 "units", labeled above each). For multiple series (stacked area, stacked bars) it uses a blue scale + gold/orange/green with a small legend. *Observed.*
3. **Bars rise in ≈1 s and then stay still.** In the 52–64 s segment at 2 fps, the 3 bars grow over 2–3 frames (≈1–1.5 s) and the chart holds **≈4–5 s without movement** while the narrator speaks. *Measured (±0.5 s error).*
4. **The data label accompanies each bar ("109 UNITS").** It appears with the bar, not as a separate card. *Observed.*
5. **Stacked area with a shaded "ESTIMATE" zone.** The area is drawn left to right in ≈2–3 s and a gray band marks the projected part. *Observed at 1 fps (≈345–350 s).*
6. **Transformation between charts, not a cut.** The area chart "fades and morphs" into the next one (stacked bars): the old title is seen dissolving while the new one enters. *Observed (frames ≈351–352 s).*
7. **Much more on-screen text than Harris.** Title + subtitle + 5-entry legend + axis labels + 3 highlighted figures ("+112 GW BY 2030", "≈20 % AT RISK OF DELAY") in the side panel. *Measured in the sample: ≈25–40 text elements in the densest charts, versus ≈6–8 in Harris.*
8. **3D terrain maps with pins.** Relief in sand/blue tones, 3D country names like letters lying on the terrain (STATES, AMSTERDAM), black circular pins with numbers and red thumbtacks with labels. "Powered by deltasweep.com" watermark. *Observed in ≈15 of 49 frames on the contact sheet. Tool not identified (rumor).*
9. **Camera in the maps: tilted and orbital.** Tilted 3D views and flyovers between countries; dotted arrows/routes (the submarine cable, supply-logic routes). *Observed.*
10. **Stock footage between charts.** Every 1–3 charts, stock footage (data centers, engineers) comes in as a breather. *Observed; the contact sheet shows ≈12 stock shots out of 49.*
11. **Articles as proof.** News screenshots with the key phrase highlighted in blue/yellow. *Observed (FT/Reuters, several).*
12. **Cuts.** **115 cuts in 888 s → ≈1 cut every 7.7 s** (threshold 0.3). Slower-paced than Harris. *Measured.*
13. **Fixed brand mark.** White-tile logo in the bottom-left corner throughout the video (≈5 % of the height). *Observed.*
14. **Ending.** Credits with lettering over a landscape shot; no "closing card with a figure" ending. *Observed.*

---

## 2. Approximate measurable parameters

| Parameter | Johnny Harris | Caspian Report | Confidence |
|---|---|---|---|
| Time a line chart is on screen | ≈14–16 s (from wide shot to ending) | ≈10–12 s | Measured on 1 chart each |
| Still time before the first action | ≈4–5 s | ≈4–5 s | Measured (±1 s) |
| Bar/stroke entrance | ≈0.5–1 s (yellow bar) | ≈1–1.5 s (bars) | Measured (±0.5 s) |
| Camera punch-in | ≈1–2 s, once per chart | not observed in 2D charts; yes in 3D maps | Measured / inferred |
| Easing | Soft exit (decelerates at the end); not measured precisely | Rises with a soft bounce in bars | Inferred |
| Simultaneous elements (chart) | 3–5 (lines, legend, axes, bar) | 8–15 (title, subtitle, bars, labels, legend) | Measured (manual count) |
| On-screen text | Minimal: title + legend + source | High: title + subtitle + legend + figures panel | Measured |
| Figures labeled at once | 0 (the voice says them) | 3–6 (labels above bars + highlighted figures) | Measured |
| Highlighting a data point | Yellow vertical bar + muting the other lines to gray | Numeric label above the bar | Measured |
| Background | Cream #DAD5D0 | Near-black blue with a dot pattern | Measured (Harris pixel) / observed |
| Cut rhythm (whole video) | 1 every ≈4.7 s | 1 every ≈7.7 s | Measured (threshold 0.3; may undercount dissolves) |
| Transition between charts | Hard cut | Dissolve/morph between charts | Observed |
| Sound/music | Not analyzed (audio was not extracted) | Not analyzed | **Not verified** |

---

## 3. Comparison with our engine

Source for "what we already have": `README.md`, [SPEC_REFERENCE.md](SPEC_REFERENCE.md), [DIRECTION_GUIDE.md](DIRECTION_GUIDE.md).

| Technique | Do we have it? | What is missing |
|---|---|---|
| Camera in data space with punch-in | Yes (`camara:[{t,x,y,mov}]`, `y:"ajustar"`) | Configurable easing (today fixed `io2`); "wide → zoom → wide" presets |
| One data point per date with a visual hit | Yes, `llamada` with a shock wave | **Minimal highlight without a card:** vertical date bar ("date bar") growing over 1 s; today every callout carries a card |
| Multiple series with one highlighted and the rest dimmed | Not explicit | A `foco:{serie}` option that lowers the others to faint gray and thickens the main one |
| Very little on-screen text | Yes (year · what happened · value) | "Mute" mode: callout without text, just a mark, so the voice carries the value |
| Colors with meaning | Yes (gold/teal/purple/stone) | Light cream palette (#DAD5D0) as an alternate background; today dark only |
| Dark background with a dot pattern | Yes (`fondo.puntos`) | Covered |
| Bars that rise ≈1 s with their own label | Partial (`barras`) | Numeric label stuck to each bar once it finishes rising |
| Area with a shaded "ESTIMATE" zone | `zona` exists | A "projection" template combining zone + dashed edge |
| Stacked bar and morphing between charts | No | A `morfa` transition between two layers (same categories) |
| Unit pictograms (10,000 figures) | No | A `unidades` chart (icon grid with a real count) |
| Time axis with panning + colored zone | Partial (camera in X) | A `regimen`/`periodo` layer with labeled bands that slide |
| 3D maps with pins and flyover | No (out of scope; lives in Electric Eye) | Integration: a piece that alternates map (Electric Eye) and chart |
| Mask reveal over a map | No | Out of scope for this engine |
| Hard wipes between chapters | Yes | Covered |
| Sound (hit, whoosh) on each callout | No | Separate sound-effects track, editable in Premiere |
| Verifiable, traceable figures | **Yes, better than them** | Our advantage: neither Harris nor Caspian publishes the data row behind each chart |

### Prioritized improvements

**P1 (most cinematic impact, low cost)**
1. **Yellow/gold date bar** in Harris's style: a vertical mark growing over ≈0.7–1 s, no card, tied to `ancla.fecha`. Closes the "one data point per date" gap.
2. **`foco` option**: protagonist series thick and saturated, the rest dimmed (opacity ≈25 %), as in the China chart.
3. **Camera presets** `plano-golpe-plano` ("shot-hit-shot"): wide ≈4–5 s → punch-in ≈1.2 s on the event → opens back out. Today it is written by hand.
4. **"Voice carries the value" mode**: callout without text (mark only) for narrated pieces.
5. **Light paper-like background** (cream ≈#DAD5D0, ink lines) as a brand variant.

**P2**
6. Numeric label stuck to each bar as it rises, with figures always derived from data (`{valor}` placeholder).
7. Projection template (`zona` + dashed line + "estimated" label).
8. Morphing between charts (line → area → stacked bars with the same series).
9. Sound-effects track synced to each callout, exported separately.

**P3**
10. Pictogram chart (`unidades`).
11. Time axis with per-period bands and panning.
12. Integration with Electric Eye to alternate 3D map ↔ chart.
13. Fixed corner mark (logo) with a safe zone.

---

## 4. Honest limits (what I could NOT verify)

- **Resolution and sampling.** I worked at 480p and **1 frame per second** on the charts (2 fps in one short segment). Stroke entrance durations carry **±0.5–1 s of error**. Exact easings cannot be measured this way.
- **I did not see the line being drawn.** In the Harris segment the chart already appeared complete in the first chart frame: the stroke (if there was one) lasted under 1 s or entered with a dissolve. I have no measurement of the "stroke rhythm".
- **Minimal sample.** One Harris line chart, three Caspian ones. I do not know whether this is their usual style across all videos or which year each asset is from.
- **Sound and music: not analyzed.** I did not extract the audio nor measure callout hits or mixes.
- **Caspian's tools unknown.** There is no public source on their workflow; the "Powered by deltasweep.com" mark appeared on the maps, but the web search returned no information about that tool.
- **Typography not identified** with certainty (neither in Harris nor in Caspian).
- **Details of Harris's map masks:** only the Adobe forum (marked as correct, not confirmed by him) and third-party summaries; the aescripts article "How Johnny Harris Makes Maps" returned 403 when I tried to read it.
- **Cut counts** come from scene-change detection (threshold 0.3): they undercount dissolves and overcount changes within a single shot.
- **Palettes:** I only measured one pixel (Harris's cream background). The other colors are visual readings.

## 5. What material to ask the owner for

1. **2–3 specific videos from each channel in 1080p** with the charts he likes most (URL and exact minute), or downloaded by him (I do not have cookies for his account).
2. **Screenshots or 10–15 s clips** of: a line stroke from scratch, a ranking race, and the entrance of a bar with its label. With that I measure at 24 fps or more.
3. **A reference video with sound** to measure callout hits and whooshes (isolated audio helps).
4. **Which of the two styles he prefers** for MacroWise: editorial cream (Harris) or night with a dot pattern (Caspian), or a hybrid. This determines whether P1 #5 (light background) moves up in priority.
5. **A list of 3 target charts** for MacroWise (series and message) to test the improvements on real cases.

## 6. Sources

- Johnny Harris video analyzed: https://www.youtube.com/watch?v=axRhjqd-rus
- Caspian Report video analyzed: https://www.youtube.com/watch?v=K-qll_Yhfms
- aescripts, "Making maps for Johnny Harris" (GEOlayers): https://aescripts.com/learn/making-maps-for-johnny-harris---volcanoes/ (403 when read; only the title and the search-engine snippet)
- aescripts, "How Johnny Harris makes maps": https://aescripts.com/learn/how-johnny-harris-makes-maps/ (not read)
- Adobe Community, Johnny Harris map reveal: https://community.adobe.com/t5/after-effects-discussions/how-does-johnny-harris-do-this-mask-reveal-animation-in-after-effects/td-p/15191636
- PremiumBeat, "Making maps for Johnny Harris": https://www.premiumbeat.com/blog/making-maps-for-johnny-harris/
- Boone Loves Video (course, map freelancer for Harris): https://boonelovesvideo.teachable.com/
- Glasp, automatic summary of "How to Create Animated Maps with AfterEffects" (rumor, unverified): https://glasp.co/youtube/GsojLuJpe_0
- Engine repo: `README.md`, [SPEC_REFERENCE.md](SPEC_REFERENCE.md), [DIRECTION_GUIDE.md](DIRECTION_GUIDE.md) (runtime copy: `servidor/guia-de-direccion.md`)

---

## 7. Second round (2026-11-03): 8 videos with charts as protagonists

Method: search with `yt-dlp ytsearch` (WebSearch returned no useful videos), video-only download at 480p, contact sheet (1 frame / 10 s) and, on the chart segments, frames at 4 fps (12 s) or 2 fps (24 s) with timestamps. Frames and videos in a temporary folder outside the repo. Cuts = scene detection (threshold 0.3).

### 7.1 Videos reviewed

| # | Channel | Title (URL) | Length | Charts (approx. minute) | Use |
|---|---|---|---|---|---|
| 1 | Johnny Harris | Why Recessions Happen (https://www.youtube.com/watch?v=EhyOQ0QMINg) | 15:43 | 0:50–1:10 points and GDP line; 3:20–4:30 England GDP; 5:00–5:40 US GDP and bars; 7:20–7:50 line + "Recession" label; ≈13:00 unemployment | **Segments 0:52–1:04 (4 fps) and 5:00–5:24 (2 fps)** |
| 2 | Caspian Report | How France is becoming a "third-world" economy (https://www.youtube.com/watch?v=mC5NdpSMDks) | 18:23 | ≈15 charts (bonds ≈11:35, parties ≈10:00, deficit ≈14:00, debt/GDP ≈15:00) | **Segment 11:35–11:59 (2 fps)** |
| 3 | Caspian Report | Why global debt keeps growing (https://www.youtube.com/watch?v=EzCiEv1IqiA) | 15:43 | Global debt bars ≈0:30; interest ≈9:00 | Contact sheet only; the chosen segment fell on a map |
| 4 | Caspian Report | US National Debt, Part 1 (https://www.youtube.com/watch?v=WWCoDORgs3A) | 11:36 | Pie and bars (2018) | Contact sheet only (old style) |
| 5 | Johnny Harris | INFLATION, Explained in 6 Minutes (https://www.youtube.com/watch?v=zIbNJCSCEjk) | 8:44 | "Movie ticket prices" bars ≈1:50 | Contact sheet only (2021, collage) |
| 6 | Johnny Harris | Our New Global Economy (https://www.youtube.com/watch?v=pQCJmxEOzhs) | 21:16 | Chapter "Global Trade Explodes" 3:48 | Downloaded, **not analyzed** |
| 7 | Caspian Report | How Putinomics works (https://www.youtube.com/watch?v=nhu3n8vkJSg) | 12:29 | — | Downloaded, cut count only |
| 8 | Caspian Report | UK "third-world" economy (https://www.youtube.com/watch?v=OTWDzMjgsEY) | 15:36 | — | Located only |

Untouched candidates: 1955 vs 2025 (https://www.youtube.com/watch?v=J4qqIJ312zI), Why most of our money isn't real (https://www.youtube.com/watch?v=E_VKZ6dzauo), Caspian US National Debt Parts 2 and 3.

### 7.2 Findings

**Johnny Harris (current style; measured in 2 segments of video 1)**
1. **Near-black background, pink-red line.** Color histogram: background ≈ #101010–#181818; line and points pink-red (≈ #C05040 in the most saturated pixels). Differs from the cream background in section 1 (a different video). Confidence: **high** (colors), medium (that it is the palette of the whole series).
2. **The line is built point by point.** Segment 0:52–1:04: each point enters bouncing from the right, lands and connects with a segment in ≈0.5 s; cadence ≈1–1.5 s per point. In "GDP USA" (≈5:08–5:12) the line is drawn left to right in ≈3.5 s while the camera rescales the axis. Confidence: **high** (4 fps, ±0.25 s).
3. **The camera is alive the whole time.** Continuous zoom/pan that reframes the line as it grows (the Y axis is rescaled ≈3 times in 12 s); then a punch-in on the recession bars in ≈4 s (thin bars to wide bands, ≈5:16–5:22). Confidence: **high**.
4. **Label = yellow pill.** It is born as a yellow dot, stretches into a pill in ≈0.5 s and the text ("GDP", "Recession", "GDP USA") is typed letter by letter in ≈0.75 s; bold serif on yellow; it stays fixed. Confidence: **high**.
5. **Recessions = translucent orange vertical bars** that appear staggered in ≈1 s over the line; the camera then widens them. A **yellow circle** is drawn in an arc (≈0.5–1 s) around the specific dip. Confidence: **high**.
6. **Dashed baseline** in white that enters at the start and accompanies the reframing; a small **red box** with monospaced text, no big figure. Confidence: medium.
7. **Rhythm.** Cuts: Recessions 214 in 942 s = **1 every ≈4.4 s**; Inflation (2021) 150 in 523 s = ≈3.5 s. Charts last 6–25 s continuously: the movement is camera movement inside the chart, not cuts. Confidence: medium (threshold 0.3).
8. **The style evolved.** 2021: cream/salmon collage with cutouts and labels like "$1350"; almost no data charts. 2025: dark data charts, red line and pills. It is not a single aesthetic. Confidence: medium (2 points in time).

**Caspian Report (France and Global debt)**
9. **Dark gray background (≈ #404040–#505050) with a vignette; teal and gray series; tiny white axes.** It is not the dotted navy of section 1. The global-debt video uses **light crumpled paper** with teal/blue. Confidence: **high** (contact sheet from 2 videos).
10. **Chart still for ≈7 s before acting.** 10-year bonds (≈11:35): 7 s of the full chart with 4–5 countries; then the secondary series drop to faint gray in ≈1.5 s (focus technique); at ≈11.5 s into the segment a **yellow ellipse** is drawn around the 2008–2012 dip (≈1 s) and at ≈12–13 s "Eurozone sovereign debt crisis" is typed beside it; the annotation stays ≈10 s. Confidence: **high**.
11. **Repeated chart types:** line with flags at the end of each series, horizontal ranking bars, large donut/semi-donut, pictogram grid (retirees vs. working-age population, 1997/2025/2040), 3D map with black data cards. Confidence: **high**.
12. **Articles as proof with the phrase highlighted in lime green** (not blue/yellow). Confidence: medium.
13. **Cuts:** France 181 in 1,103 s ≈ 6.1 s; Debt P1 (2018) 38 in 696 s ≈ 18 s (old style, long shots); Global debt 278 in 943 s ≈ 3.4 s (counts paper dissolves, unreliable). Confidence: low.
14. **Fixed brand mark** (white tower logo) bottom-left throughout the video. Confidence: high.

### 7.3 Corrections to section 1
- "Dotted navy" (Caspian) **is not general**: in 2025–26 it uses charcoal gray or light paper, with teal as the data color. Confidence: medium-high.
- Harris's yellow is still the "moment" color, but in Recessions it shows up as a pill and an arc-drawn circle, not just as a vertical bar. Confidence: medium.

### 7.4 New gaps for the engine
1. **Point-by-point construction** (`modo:"puntos"`): each point enters with a short bounce and connects the line in ≈0.5 s; cadence of 1–1.5 s per point, configurable.
2. **Camera that follows the line's tip** with auto-rescaled axis (`camara:"seguir"`), in addition to the manual `camara:[{t,x,y}]`.
3. **Label pill**: dot, pill, text typed letter by letter (≈1.25 s), "moment" color with bold serif.
4. **Arc-drawn circle** over a dip or peak (≈0.7 s) with an annotation typed beside it.
5. **Translucent recession/period bands** that appear staggered in ≈1 s, plus a zoom that widens them.
6. **Measured temporal focus:** ≈7 s of wide shot and then the secondary series to gray in ≈1.5 s (makes the `foco` of section 3 concrete).
7. **Dashed baseline** that accompanies the reframing.
8. **Flags/labels at the end of each series** (line head with a name or icon).
9. **Three new themes:** near-black + pink-red line, charcoal gray + teal, and light paper (in addition to the current dark one).
10. **Horizontal ranking and donut/semi-donut** as native types; pictograms per period.
11. **Fixed brand mark with a logo** in a corner (confirmed in Caspian).
12. **Chart-scene script:** 6–25 s continuous without cuts with 2–3 chained actions (line, label, circle), one action every 4–6 s.

### 7.5 What I could NOT verify
- **Sound, music and whoosh:** not analyzed (videos downloaded without audio).
- **Transcript:** I did not use the `watch` skill or extract subtitles; chart minutes come from the contact sheet (±10 s) and YouTube chapters.
- **Videos 3–8:** contact sheet only (3, 4, 5) or not even that (6, 7, 8); the "Global debt" segment fell on a map, so I did not measure its bars.
- **Exact easing and duration of the point's bounce:** at 4 fps there is only ±0.25 s.
- **Typeface:** unidentified (the pill looks like a Playfair or DM Serif type of serif; unchecked).
- Resolution 480p; colors from a 1-frame histogram, not exhaustive sampling.
- Whether this is each channel's stable style or only that of these videos.

### 7.6 What is already implemented (2026-11-03)
What was measured in 7.2 was applied to the engine. Each item comes from a gap in 7.4:
- **Camera that follows the line** (gap 2): `"camara": "seguir"` on a `linea` layer. A window that tracks the tip, Y axis rescaled (an envelope of a few moments around it, so the line never leaves the frame), and at the end it opens to the full shot. In the studio: "Sigue la línea (estilo Johnny Harris)" ("Follow the line (Johnny Harris style)").
- **Label pill** (gap 3): `"estilo": "pildora"` on a `llamada`. Dot → yellow pill → phrase typed letter by letter (≈1.25 s), bold serif. It is anchored to a data row like every callout.
- **Arc-drawn circle** (gap 4): `"estilo": "circulo"`. Ellipse drawn in ≈0.7 s over the data point and an annotation typed beside it.
- **Period bands** (gap 5): `"estilo": "banda"` on a `zona` (more visible fill, no dashed guides).
- **Themes** (gap 9, partial): `"tema": "oscuro" | "harris" | "carbon"` in the spec. `harris` = near-black + pink-red line + moment yellow; `carbon` = charcoal gray + teal. **The "light paper" theme is still pending** (it changes the color of all texts).
- **Pending from 7.4:** point-by-point mode (1), measured temporal focus (6), dashed baseline (7), flags at the end of each series (8), horizontal ranking/donut/pictograms (10), fixed brand mark with logo (11), 6–25 s script per chart (12).
