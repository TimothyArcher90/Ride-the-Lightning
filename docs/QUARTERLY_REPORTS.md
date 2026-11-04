Spanish original: [es/TRIMESTRES.md](es/TRIMESTRES.md)

# Quarterly library (flow diagram per quarter)

Covers **the whole US stock market (Nasdaq, NYSE, CBOE: ~6,300 operating companies)**. The **16 featured companies** (`catalogo/empresas.json`) have **every quarter since 2009** (the year the SEC began requiring structured data); the rest are fetched **when selected** (10–20 s) or **overnight**, with the **last 3 years**. Each quarter is stored and ready to animate as a **Sankey** ("where the money comes from and where it goes") and a **waterfall** ("what added and what subtracted"). The waterfall exists even for loss-making quarters, where a Sankey cannot be drawn.

## Where every number comes from
- **Single source:** SEC EDGAR, the public "XBRL company facts" API (`data.sec.gov`). These are the numbers each company declares in its official 10-Q and 10-K reports. Public domain, no keys or accounts.
- **Every figure is one of two things:** a reported value (stored with its XBRL concept, e.g. `OperatingIncomeLoss`) or an exact subtraction/sum of reported values. Derived figures are listed in each quarter's `.meta.json`:
  - Gross profit = revenue − cost of sales.
  - Operating expenses = gross profit − operating income.
  - Other (non-operating) = net income + taxes − operating income.
  - **Q4 is not reported separately:** it is computed as full year − 9-month cumulative (or − Q1−Q2−Q3). It is flagged (`q4Calculado`).
- **The diagram balances by construction**, and the compiler re-checks it: if something does not balance (>5 %) it is not drawn; between 0.5 % and 5 % it is drawn with a warning (rounding in the source).
- **What the summarized source does not break down** is not invented. Real example: Amazon labels its fulfillment and technology expenses with company-specific concepts that the summarized API does not include; they appear together as "Gastos operativos sin desglosar" ("operating expenses not broken down", 82 % of its operating expenses) and the piece says so.

## Where it lives
```
datos/trimestres/<TICKER>/indice.json                 list of quarters, last report seen, skipped ones
datos/trimestres/<TICKER>/<YYYY-MM-DD>.csv            the quarter's flows (origen, destino, valor, tipo) in US$
datos/trimestres/<TICKER>/<YYYY-MM-DD>.puente.csv     the waterfall for the same quarter
datos/trimestres/<TICKER>/<…>.csv.meta.json           provenance, XBRL concepts used, derivations, notes, sha256
datos/trimestres/INDICE.md                            summary of what exists (regenerated)
catalogo/empresas.json                                tracked companies (ticker, CIK, name)
```
`datos/` is not pushed to GitHub (it rebuilds in minutes with one command).

## How to use it
- **Studio:** step 1 → "Cómo gana y gasta dinero una empresa" ("How a company earns and spends money") → pick company and quarter. Everything else resolves itself.
- **Rebuild the library:** `node scripts/trimestres.mjs construir` (all) or `… construir AMZN AAPL`.
- **Add a company:** add `{ticker, cik, nombre}` to `catalogo/empresas.json` (the CIK is found at https://www.sec.gov/search-filings) and run `construir TICKER`.
- **Test:** `node scripts/prueba-trimestres.mjs` (every quarter compiles and balances, pieces have no overlapping text, and Amazon Q3 FY2026 matches its 10-Q) and `node scripts/prueba-tablas.mjs` (accuracy rules).

## The agent that watches for new reports
Inside the 24/7 updater (`servidor/vivo.mjs`), **every 4 hours** it asks the SEC whether any company in the library has filed a new 10-Q/10-K (one small request per company). If so:
1. It rebuilds that company's quarters (adding the new one).
2. It saves the ready-made piece to `specs/trimestre-<TICKER>-<YEAR>-<Q>.json`.
3. It notifies in the studio ("Amazon published its Q4 FY2026…") and leaves a **draft video** in `salidas/`.
4. If the SEC has published the filing but its structured data does not yet include the quarter (this can take hours), it retries on the next cycle.

It can be launched by hand: `node scripts/trimestres.mjs vigilar`. **Honest limit:** the agent lives inside the updater, so it only works while the PC is on; reports are picked up as soon as the PC is active again (the SEC keeps them).

## Known limits
- **No breakdown by product or segment** (e.g. AWS vs. retail) in the summarized API. The fine detail (company-specific lines and segments) comes from each filing's full XBRL file on `www.sec.gov`; the SEC requires a real contact to identify who is accessing it, and that was not enabled at the time this section was written (see the update below).
- **Quarters with a loss** (operating or net): no Sankey, but a waterfall. A flow cannot be negative.
- **Companies with different financial statements** (banks, insurers, REITs) do not fit this structure; they are not in the list.
- **Nominal dollars**, not adjusted for inflation.
- Any quarter without reported revenue, operating income, taxes or net income is discarded (Intel has 14 for this reason; they appear in the index under `omitidos`, "skipped").

## Your own tables
The same Sankey, donut and waterfall work for **any table** of yours (Excel or CSV). Templates in `ejemplos/` (demo figures, labeled as such). Rules: flows with positive values that balance per node; in the waterfall, subtotals marked `total` must match the preceding sum; always with a source.

## Update (2026-11-03, night): fine detail and the whole market
- **Fine detail for the last year** (4 quarters per company): the full XBRL file of the filing is read (`www.sec.gov`, with the contact authorized by the owner), and two things are pulled: (a) the company's **own expense lines**, per its calculation linkbase (Amazon: Fulfillment 30.0 and Technology and infrastructure 34.8), and (b) **revenue by product or segment** (Amazon: Online stores 68.5, AWS 46.0…). Each breakdown is checked: if it does not sum to what the company reports (±0.5 %), it is discarded and the summary is used. Axis priority: product/service > business segments > other > geography.
- **Quarters older than the last year** use the official summary (without the company-specific lines); every piece warns about this.
- **Q4** with fine detail = full year (10-K) − 9-month cumulative (Q3 10-Q).
- **Per-company time series** (`datos/trimestres/<T>/serie.csv`): revenue, operating income, net income and operating margin per quarter, for the line/compare/panel templates. One company per piece.
- **Library-wide watcher agent:** reads the SEC daily index (today and 2 days back: 3 requests for the entire market) and updates only whoever filed a 10-Q/10-K. If the filing exists but the structured data does not yet, it stays "pending" for up to 3 days.
- **Night work:** the updater builds the market from 1:00 to 6:00 (`node scripts/trimestres.mjs universo` by hand). Disk: only featured companies keep the raw SEC JSON; the rest keep only CSV, metadata and a minimal XBRL cache.
- **Out of scope today:** banks and insurers (different structure), closed-end funds/ETFs/SPACs (excluded from the list), companies without revenue and costs reported as industry or services.
