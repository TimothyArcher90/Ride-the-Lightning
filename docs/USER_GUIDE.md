Spanish original: [es/GUIA_USUARIO.md](es/GUIA_USUARIO.md)

# Quick guide (no code, no finance background needed)

> **Language switch:** the **EN | ES** button at the top right of the studio changes the language of the interface *and* of the animation itself (titles, units, month names, notes). The studio starts in English unless your browser is in Spanish, and remembers your choice. Some labels below are quoted in Spanish with an English translation, as they appear in the Spanish interface.

**To open it:** double-click **"Ride the Lightning"** on the desktop. A page opens in your browser. Keep the black (console) window open while you use it.

## Step 1 · Your data
- Type a word in the search box: *gold, bitcoin, oil, inflation, dollar, population…* (the catalog is searched in Spanish: *oro, bitcoin, petróleo, inflación, dólar, población…*) or pick a category.
- Click the card for the dataset you want. You will see:
  - **Since when** it has data (always from the first record that exists).
  - **"Al día"** ("Up to date", green) or **"Atrasada"** ("Stale", yellow: the source stopped publishing or is running late).
  - **"Uso abierto"** ("Open use") or **"Uso restringido"** ("Restricted use", yellow: may not be suitable if you plan to monetize the video).
- You do not have to download anything: it is fetched automatically, in full.
- **Have your own Excel file?** Drop it below. We ask for three things: which column has the dates, what you want to chart, and **where the data comes from** (it is printed at the foot of the video).

## Step 2 · "Cómo verlo" ("How to view it")
Pick a style (the card tells you whether it fits what you selected):
- **"La historia de una cifra"** ("The story of one number") — a line that draws itself and zooms into the key moments.
- **"Una contra las demás"** ("One against the rest") — several lines, one highlighted (with a base-100 index so they can be compared).
- **"Comparar varias a la vez"** ("Compare several at once") — 2 to 4 charts on screen.
- **"Ranking en carrera"** ("Ranking race") — bars competing against each other.
- **"¿Se mueven juntas?"** ("Do they move together?") — a color map of how strongly series are related.

In "La historia de una cifra" you will see **suggested moments** (the maximum, the biggest drop…). They come from the data, not from our imagination. Tick the ones you want and give each a short name (3–4 words).

## Step 3 · "Cámara y ritmo" ("Camera and pacing")
- **"Cinemático"** (slow, for documentaries) · **"Documental"** (the middle ground) · **"Dinámico"** (Reels/Shorts) · **"Sin movimiento"** (no movement).
- Choose whether each moment appears as a **card** (year · what happened · value) or as a **bar with the year** (if you will narrate it yourself).
- You can ask for the video to **refresh itself** when the source publishes new data.

## Step 4 · Review and export
- On the right you see the animation and the panel **"Tu animación, en simple"** ("Your animation, in plain terms"): where the data comes from, whether it is up to date, and how many figures appear on screen (all computed, none typed by hand). **"Ver cada cifra"** ("See every figure") shows the exact row each one comes from.
- **Draft** (~30 s) to test; **final version** (3–6 min) to publish or edit into a timeline.
- You receive: an **MP4**, a **ProRes file with transparency** (to lay over your video in Premiere) and a **report** with the origin of every figure.
- Before exporting, the system checks that **no text overlaps**. If it reports a collision, remove one moment or shorten its name.

## FAQ
- **Can I trust the figures?** They come straight from the stated source and you can see the exact row. The only thing we cannot guarantee is what the source itself publishes incorrectly.
- **It says "Atrasada" (stale).** The series has not been updated within what is expected for its frequency. Use it knowing the date it reaches, or choose another source.
- **It says "Uso restringido" (restricted use).** The license of that source (for example Coin Metrics or Yahoo) may not allow commercial use. If you will monetize, confirm it or use an official source.
- **What is "logarithmic scale"?** When a value grows thousands of times (Bitcoin), on a normal scale the early years would look flat; the log scale shows all of them clearly. It switches on automatically and you are told.
- **Can I change any detail?** Yes: **"Modo experto"** ("Expert mode", top right) shows the full recipe (spec) of the piece so you can edit it.

## New styles (step 3)
- **Camera "Sigue la línea"** ("Follow the line"): the camera tracks the tip while it draws and opens to the full shot at the end.
- **How moments are marked**: besides card and bar, there is a **yellow pill** (the phrase is typed out letter by letter) and a **circle** around the data point.
- **Look**: MacroWise (warm dark), **black and rose-red**, or **charcoal gray and teal**.

## "Cómo gana y gasta dinero una empresa" ("How a company earns and spends money", per quarter)
1. Step 1 → choose that story → search the company (Amazon, Apple, NVIDIA…) → choose the quarter (the 8 most recent come first; older ones are collapsed).
2. The diagram builds itself, left to right: revenue → cost of sales and gross profit → operating expenses and operating income → taxes and net income, with percentages.
3. When the company publishes its next report, it appears in the list on its own and a draft video is left for you (with the updater switched on).
- **A quarter appears greyed out?** It had a loss, and a flow cannot be negative: choose **"Qué sumó y qué restó"** ("What added and what subtracted") and you will see that same quarter as a waterfall.
- **Have your own table?** Download the template from the same step, fill it in and drop it in: it is detected automatically.

## Chat: edit by talking
- Click **Chat** (bottom right) and type what you want to change, in Spanish: «pásalo a vertical» ("make it vertical"), «ponlo en negro y rosa-rojo» ("make it black and rose-red"), «muéstrame el trimestre anterior» ("show me the previous quarter"), «ahora en cascada» ("now as a waterfall"), «cómo gana dinero NVIDIA» ("how NVIDIA makes money").
- The preview updates by itself. **"Nuevo"** ("New") starts a clean conversation.
- If you then touch the steps on the left, the piece is rebuilt from scratch (chat changes are lost).
- Requires Claude Code installed and signed in on this machine.

## Companies across the whole US stock market
- In "Cómo gana y gasta dinero una empresa", type the name or ticker (Uber, SoFi, Costco…). The first time takes 10–20 s because the data is fetched from the SEC.
- Quarters with a gold dot (●) include **revenue by product or segment**; those from the last year also carry the company's **own expense lines**.
- Banks, insurers and recently listed companies may show no data: their income statement has a different shape. Nothing is invented.
