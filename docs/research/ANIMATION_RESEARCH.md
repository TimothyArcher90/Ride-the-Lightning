Spanish original: [../es/INVESTIGACION_ANIMACION.md](../es/INVESTIGACION_ANIMACION.md)

# Research: data animation for video (Ride the Lightning)

Date: 2026-11-04. Method: web searches + page reading.
Source convention (the Spanish tags are kept in the original; here they are glossed):
- [LEÍDA] ("READ") = I opened the page and extracted the content.
- [BÚSQUEDA] ("SEARCH") = I only saw the search-engine summary, not the page.
- [HIPÓTESIS] ("HYPOTHESIS") = my own judgment or from blogs without primary data; it must be tested against our own retention curves.

## 0. What could and could not be verified

Sources read:
- Material Design 1, duration and easing: https://m1.material.io/motion/duration-easing.html [LEÍDA]
- Burn-Murdoch (FT), summary of a talk: https://lab.imedd.org/en/from-data-to-storytelling-concept-and-design-tips-from-the-financial-times-john-burn-murdoch/ [LEÍDA]
- FT Visual Vocabulary (official README): https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md [LEÍDA]
- Datawrapper, emphasis with color: https://www.datawrapper.de/blog/emphasize-with-color-in-data-visualizations [LEÍDA]
- Critiques of bar chart races: https://builtin.com/articles/bar-chart-races [LEÍDA]
- Caption sizes and TikTok dead zones (a vendor blog): https://blitzcutai.com/blog/best-caption-size-tiktok-2026 [LEÍDA, unofficial]
- Heer and Robertson 2007, record: https://idl.uw.edu/papers/animated-transitions [LEÍDA, summary only]

Seen only in search (not opened):
- Johnny Harris uses After Effects + the GEOlayers plugin for maps: https://aescripts.com/learn/how-johnny-harris-makes-maps/ (403 when opened).
- Burn-Murdoch at GIJN: https://gijn.org/stories/data-visualization-storytelling-tips-john-burn-murdoch/ (403).
- Heer and Robertson 2007 PDF: https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf (binary PDF unreadable by the tool). From the summary: two principles (Congruence and Apprehension), animation improves perception, staged transitions perform better, rescale the axis before moving values. The paper's numbers are NOT verified.
- Kurzgesagt, their process: https://kurzgesagt.org/youtube/ (script first, the narrator's voice sets the animation timing, After Effects).
- Alberto Cairo, five qualities (truthful, functional, beautiful, insightful, enlightening): https://thedataschool.co.uk/laura-brylka/the-five-qualities-of-great-vizualizations-according-to-alberto-cairo (third-party summary).
- Mona Chalabi: her hand drawings aim to show uncertainty and humanize; https://www.dezeen.com/2023/11/16/mona-chalabi-pulitzer-prize-winner/ (search only).
- The Pudding: they start from a question, structure from general to particular, and demand a clear conclusion; https://www.storybench.org/?p=8613 (search only).

Not found (do not invent): official guides from Vox, Caspian Report, Bloomberg Graphics, Reuters Graphics or the NYT on chart animation. Nor primary retention data for data videos. The "hook rate" benchmarks from blogs are contradictory (e.g. 25–30 % vs 70–85 % depending on the definition) and I do not use them as figures. [HIPÓTESIS] anything that depends on them.

## 1. Fifteen techniques with parameters (deterministic 2D canvas engine)

Base: 30 fps, time in seconds, `t` normalized 0..1 per segment. Every value is a starting point to calibrate, except where a source is cited.

1. **Entrance with deceleration (ease-out).** Entering elements slow down on arrival. Material "Deceleration" curve cubic-bezier(0, 0, .2, 1) [LEÍDA]. Mobile entrance duration ~225 ms; exit ~195 ms; above 400 ms it feels slow [LEÍDA]. For a video chart (not UI) scale ×2–×3: 0.45–0.7 s [HIPÓTESIS].
2. **Internal movement with ease-in-out.** Value changes and repositioning: cubic-bezier(.4, 0, .2, 1) [LEÍDA]. Line drawing: 1.2–2.4 s depending on the number of points.
3. **Exit with acceleration (ease-in).** cubic-bezier(.4, 0, 1, 1) [LEÍDA]. Exit shorter than entrance (~70–85 %).
4. **Duration proportional to distance.** Material recommends scaling by distance and surface change [LEÍDA]. Formula: `dur = clamp(0.35 + dist_px/2400, 0.35, 1.2)` s [HIPÓTESIS on the constant].
5. **Stagger of bars/points.** Delay of 40–90 ms between elements, group total capped at 0.8 s (with many elements, raise speed, not delay) [HIPÓTESIS]. Order by descending value or by position, never random.
6. **Staged transition.** Heer and Robertson: staging outperforms direct interpolation; first rescale the axis, then move values [BÚSQUEDA]. Recipe: stage A (axis, 0.5 s) → pause 0.15 s → stage B (values, 0.8 s).
7. **Brief anticipation.** 80–120 ms of pull-back (3–6 % scale or 4–8 px) before a big hit [HIPÓTESIS, Disney principle].
8. **Emphasis hit (pop) with overshoot.** Scale 1 → 1.06–1.10 → 1 in 0.28–0.4 s, soft easeOutBack (overshoot 1.2–1.5) [HIPÓTESIS]. Only on the protagonist of the shot; at most 2 hits per shot.
9. **Focus and dimming.** When highlighting an element, the rest drops to 25–35 % opacity or to gray, in 0.3 s. Aligned with Datawrapper (gray for context, 1–2 emphasis colors) [LEÍDA] and Burn-Murdoch ("minimize distraction, maximize contrast") [LEÍDA].
10. **Numeric counter.** Figure from 0 to the value with ease-out in 0.8–1.4 s; freeze and hold ≥ 1.5 s after arriving. Fixed width with tabular digits so it does not jitter.
11. **Line drawing with a live tip.** `stroke-dashoffset`/clipping; circular marker (r 8–12 px) at the tip with a label that follows it; if the line has an abrupt jump, slow that stretch (time ∝ 1/slope^0.5) [HIPÓTESIS].
12. **Annotation synchronized with the voice.** The annotation appears 0.1–0.2 s BEFORE the voice says the figure (the eye arrives first) and stays until 0.4 s after [HIPÓTESIS]. The audio rules; scenes are derived from word timestamps (already a project rule).
13. **Reading time.** Every visible text ≥ 3 s (Electric Eye rule). A standalone figure ≥ 1.5 s after its animation ends. Long text: 0.25 s per word + 1 s [HIPÓTESIS].
14. **Hold the ending still.** The last frame of each shot stable for 0.5–1.0 s before the cut; no residual movement (micro-jitter = amateur).
15. **Slow, constant camera movement.** Zoom 100 → 103–106 % over the whole shot (subtle Ken Burns) to avoid the feeling of a frozen image; never during an emphasis hit [HIPÓTESIS].

Quick curve table (cubic-bezier): entrance (0,0,.2,1); standard (.4,0,.2,1); exit (.4,0,1,1); sharp (.4,0,.6,1) [all LEÍDA, Material 1]. Pop: easeOutBack with overshoot ~1.3 (not from Material).

## 2. Amateur vs. pro checklist (convertible into automated tests)

Each row carries a test over the scene (JSON/frames) and a threshold.

| # | Amateur | Pro | Automated test | Threshold |
|---|---|---|---|---|
| 1 | Linear movement | Eased curve | Detect segments with constant velocity > 0.3 s on moving objects | 0 segments |
| 2 | Everything enters at once | Staggered or focused | Count elements with the same `t_inicio` in a group > 3 | 0 groups |
| 3 | Text on screen < 3 s | Text ≥ 3 s | `t_fin - t_inicio` per text | ≥ 3.0 s |
| 4 | Text overlaps text | Separate boxes | Bounding-box intersection per frame sampled every 0.1 s | 0 overlaps |
| 5 | Text in the TikTok UI zone | Inside the safe zone | Box outside the safe rectangle | 0 violations |
| 6 | Small type (< ~48 px at 1080x1920) | Legible sizes | Minimum font size on canvas | ≥ 48 px (labels), ≥ 60 px (figures) [HIPÓTESIS, blog figure] |
| 7 | More than 1 protagonist | One protagonist per shot | Number of elements with opacity > 0.8 animating at once | ≤ 1 |
| 8 | Rainbow of colors | 1–2 emphasis colors + gray | Number of distinct high-saturation hues per shot | ≤ 3 |
| 9 | Low contrast | Strong contrast | Text/background contrast (WCAG) per label | ≥ 4.5:1 (≥ 7:1 recommended) |
| 10 | Figure without a source | Visible source | Every labeled figure has a non-empty `fuente` field | 100 % |
| 11 | Axis that jumps or rescales without warning | Stable axis or a rescale stage | Domain change between frames outside a stage | 0 |
| 12 | Misleading truncated axis on bars | Bars from 0 | Bars with a base ≠ 0 | 0 (unless flagged) |
| 13 | Separate legend | Direct label on the series | Chart with >1 series and no label within ≤ 40 px of the line | 0 [LEÍDA, Burn-Murdoch] |
| 14 | Empty descriptive title ("Sales") | Title that states the conclusion | Title contains a verb or figure | yes |
| 15 | Excessive bounce | Subtle overshoot | Maximum overshoot of the pop | ≤ 12 % |
| 16 | Animation too long or slow | Justified duration | Entrance > 1.2 s that is not a stroke | 0 |
| 17 | Final frame with movement | Static ending | Pixel difference across the last 6 frames of the shot | < threshold |
| 18 | Flicker from rounding (pixel jitter) | Smoothed subpixel positions | Frame-to-frame position variance on "still" objects | ~0 |
| 19 | Many racing bars with no guide | Race with annotation or an alternative | Racing bars without ≥ 1 annotation | 0 [LEÍDA, builtin: a guide is recommended] |
| 20 | Colors indistinguishable under color-blindness | Safe palette | Simulate deuteranopia and measure distance between series | minimum ΔE [HIPÓTESIS] |
| 21 | No defined background / noise | Opaque brand background | Cards with alpha < 1 (rule: opaque) | 0 |
| 22 | Annotation out of sync with the voice | Synchronized | \|t_annotation − t_word\| | ≤ 0.2 s |

## 3. Visual scripts second by second (30 / 45 / 60 s)

Starting principles: Pudding = question first and a clear conclusion [BÚSQUEDA]; FT = the title states the message and the annotations answer "what it shows / why it matters" [LEÍDA]. The importance of the first 3 s is qualitative consensus in blogs; the concrete percentages are [HIPÓTESIS].

### 30 s (1 data point, 1 chart)
- 0–3 s HOOK: a big figure or a question ("How much did it fall…?") on an empty background; 1 element. No logo.
- 3–8 s CONTEXT: axis and series barely visible; the line starts drawing.
- 8–20 s DATA: full line; live tip; highlight of the maximum/minimum with pop and dimming of the rest; annotation with year + what happened + figure.
- 20–26 s TWIST: a second data point that changes the reading (e.g. recovery or comparison); staged transition (axis first).
- 26–30 s CLOSE: aphoristic phrase + source visible ≥ 3 s + brand.

### 45 s (2 charts)
- 0–3 s hook (figure or contradiction).
- 3–6 s anchor question that will be answered at the end.
- 6–18 s chart A (line or bars) with 1 annotation.
- 18–22 s bridge: clean cut, change of chart model (e.g. from line to bars) to reset attention.
- 22–36 s chart B with the twist (comparison or slope).
- 36–42 s answer to the anchor question with the final figure in a counter.
- 42–45 s source + brand.

### 60 s (3 blocks)
- 0–3 s hook.
- 3–8 s setup + anchor question.
- 8–22 s block 1: base chart; 2 annotations max.
- 22–26 s visual pause (cut with silence or a 0.5 s breath).
- 26–42 s block 2: twist; change chart type.
- 42–52 s block 3: consequence or comparison; final counter.
- 52–58 s close that answers the anchor question, quotable phrase.
- 58–60 s source and brand. If there are 2+ sources, list them on the final card for ≥ 3 s.

Common pacing rules: one "visual novelty" (chart change, stage, highlight) every 4–6 s [HIPÓTESIS]; never two new texts at once; every figure with its source.

## 4. Ten new chart models (not already implemented)

FT family reference (Visual Vocabulary) [LEÍDA]: deviation, correlation, ranking, distribution, change over time, part-to-whole, magnitude, spatial, flow. The following come from there or from variants.

1. **Ranking lollipop.** Sticks + circles. Animation: sticks grow staggered (60 ms), circles pop on arrival; the leader enlarges. (Ranking/magnitude family.)
2. **Diverging bars (deviation).** Bars from a central zero to left/right. Animation: the axis is drawn, bars leave the center in two directions; positives in the emphasis color and negatives in gray, or the reverse.
3. **Connected scatter.** Points joined in time order. Animation: the stroke advances year by year with a live point and a label for key years; zoom into quadrants.
4. **Fan chart (projection).** An uncertainty band around a projection. Animation: solid historical line; on reaching the present a fan opens in 3 stages (50 %, 80 %, 95 % cone). Consistent with Chalabi's idea of showing uncertainty [BÚSQUEDA].
5. **Histogram / distribution that fills up.** Points "fall" and stack into bins (cascade effect). Animation: staggered fall with ease-in and minimal bounce; the protagonist's data point falls last and is highlighted.
6. **Population pyramid / butterfly.** Two mirrored histograms by age. Animation: bars grow from the center by cohort; a year slider advances (visible time bar).
7. **Calendar heatmap.** A grid of days. Animation: diagonal wave sweep with per-cell delay (20–30 ms); highlight of an extreme day with pop and dimming.
8. **Event timeline (Priestley/circle timeline).** Events on an axis with cards. Animation: the camera pans; each event appears when the voice says it; card with year + what happened + figure.
9. **Dot strip / two-moment dot plot (dumbbell).** Each category with two points joined by a bar (before/after). Animation: both points are born at "before", the second travels to "after" with ease-in-out; the bar stretches; sort by size of change.
10. **Cartogram / isotype (pictogram).** Icons representing units (e.g. 1 icon = X). Animation: icons fill in staggered blocks; the excess is tinted with the emphasis color. (FT magnitude/isotype.)

Avoid: more bar chart races without an alternative (criticism from Cotgreave and Bostock; mapping time to space, as a bump chart does, is better for trends) [LEÍDA, builtin].

## 5. Prioritized top 10 for implementation

Criterion: impact on "looks pro" per effort, and consistency with the Electric Eye rules (3 s reading time, one protagonist, no overlaps, safe zone, always a source).

1. **Automatic scene linter** (checklist in section 2, rows 3, 4, 5, 7, 10, 22): blocks the render if it fails. Low effort, high impact.
2. **Easing library** (entrance, standard, exit, pop) with the Material curves [LEÍDA] + easeOutBack. Low effort.
3. **Automatic focus and dimming** (gray for context, 1–2 emphasis colors) [LEÍDA]. Medium effort, very high impact.
4. **Voice-synchronized annotation engine** (appears 0.1–0.2 s before the word) with a year · what happened · figure card. Medium effort.
5. **Stagger and staged transition** (axis → values). [BÚSQUEDA, Heer and Robertson]. Medium effort.
6. **Numeric counter + guaranteed reading time** (≥ 1.5 s after arriving, ≥ 3 s text). Low effort.
7. **30/45/60 s visual-script template** with hook, anchor question, twist and aphorism close (section 3). Low effort.
8. **Emphasis pop with anticipation and bounded overshoot** (≤ 12 %). Low effort.
9. **New models: lollipop, diverging bars, dumbbell and fan chart** (section 4, items 1, 2, 9, 4). Medium-high effort, greater visual variety and message (deviation, before/after, uncertainty).
10. **Legibility test** (contrast ≥ 4.5:1, minimum size, color-blindness simulation, direct label on the line). Medium effort.

Recommended next step (unverified): measure the per-second retention curve in our own reels (TikTok Studio / Instagram) and compare versions with and without focus/dimming. Until that data exists, every threshold tagged [HIPÓTESIS] is a starting point to calibrate, not a truth.
