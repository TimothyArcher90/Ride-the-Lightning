# Data sources

Every series in Ride the Lightning (RTL) comes from an **open source that needs no API key**, is downloaded **in full from its first data point**, and is stored with its provenance (URL, download date, SHA-256, licence). This page documents each source: what it provides, the exact endpoint, the licence and what it allows, API limits, update cadence, gotchas, and how it was verified.

- Catalogue: **4,480 series** (`catalogo/series.json`) — 812 from the first releases plus **3,668 added on 2026-11-04** (3,375 country series + 293 global/US/EU series). Nothing is downloaded until a series is requested; the open-licence subset is committed in [`data/`](../data/README.md).
- Format of the catalogue, CSVs and manifests: [DATA_FORMAT.md](DATA_FORMAT.md). Countries and coverage: [COUNTRIES.md](COUNTRIES.md). Verification tables: [data-verification.md](data-verification.md).
- **Exactness rules** (apply to every adapter): omit, never interpolate; keep the source's own value strings; declare every omission or transformation in the series note; measure first/last date and row count at download time instead of trusting the catalogue.

## Summary

| Source | Adapter(s) | Series in catalogue | Licence | In `data/` snapshot |
|---|---|---:|---|---|
| World Bank — World Development Indicators | `worldbank` | 3,911 (3,861 country + 50 world/regional aggregates) | CC BY 4.0 (some indicators carry a third-party primary-source licence) | yes, except indicators whose primary source is IMF, IEA, WHO, UNESCO, ITU, WTO or WFE |
| World Bank — Commodity Price Data (Pink Sheet) | `bancomundial` | 69 | CC BY 4.0 | yes |
| IMF — World Economic Outlook (DataMapper) | `imf` | 144 | **Restricted** (written permission for systematic download and commercial reuse) | **never** |
| Eurostat | `eurostat` | 100 | CC BY 4.0 | yes |
| Our World in Data | `owid` | 41 | CC BY 4.0 (OWID) + licence of the primary source | partly (25 of 41; see manifest) |
| FRED (St. Louis Fed) | `fred` | 136 | Depends on the original publisher; U.S. government publishers are public domain | only public-domain-origin series (124) |
| U.S. Treasury FiscalData | `tesoro`, `fiscaldata` | 19 | Public domain | yes |
| SEC EDGAR | (`servidor/xbrl.mjs`, `servidor/trimestres.mjs`) | ~6,000 companies (not in `series.json`) | Public domain | 16 featured companies |
| NASA GISTEMP | `nasa_giss` | 3 | Public domain (cite) | yes |
| NOAA GML / CPC | `noaa_gml`, `noaa_oni` | 5 | Public domain (cite) | yes |
| USGS earthquakes | `usgs_sismos` | 1 | Public domain | yes |
| datos.gov.co (Colombia) | `trm`, `socrata_suma` | 2 | CC BY-SA 4.0 | no (share-alike) |
| Yahoo Finance | `yahoo` | 35 | Personal/research use, no redistribution | **never** |
| Coin Metrics Community | `coinmetrics` | 2 | CC BY-NC 4.0 | **never** |
| Shiller (Yale) | `shiller` | 6 | Author's public data; cite | no |
| NBP / GUS (Poland) | `nbp`, `gus` | 6 | Public data; redistribution terms not verified | no |

---

## World Bank — World Development Indicators (WDI)

- **What it brings:** ~1,400 annual development indicators for ~215 economies and aggregates. RTL catalogues 59 indicators × 72 countries (see [COUNTRIES.md](COUNTRIES.md)) plus world/regional aggregates (`WLD`, `LCN`, `EUU`, `EAS`, `SAS`, `SSF`, `MEA`, `NAC`).
- **Endpoint:** `https://api.worldbank.org/v2/country/{ISO3|ISO3;ISO3…}/indicator/{code}?format=json` — add `&mrnev=1` for "most recent non-empty value" (used by country sheets, batched 40 countries per request) or `&per_page=20000` for the full history (used by the series adapter). Indicator metadata: `/v2/indicator/{code}?format=json` (name, unit, `sourceOrganization`).
- **Licence:** the World Bank publishes its datasets under **CC BY 4.0** (<https://datacatalog.worldbank.org/public-licenses>): commercial reuse and redistribution allowed with attribution and a note of changes. **Caveat:** WDI republishes third-party data; the API does not expose a per-indicator licence field. RTL therefore keeps indicators whose primary source is the IMF (IFS, BOP, GFS), IEA, WHO, UNESCO UIS, ITU, WTO or the World Federation of Exchanges **out of the redistributable snapshot** and says so in `data/MANIFEST.json`. You can still download them locally.
- **Limits:** no key, no published hard limit; RTL spaces requests (100–150 ms) and retries on HTTP 429/5xx. Lists of countries are batched at 40 per request.
- **Cadence:** a few updates a year; the API reports `lastupdated` (observed `2026-10-08`). The last year available differs by country and indicator (see lag table in COUNTRIES.md).
- **Gotchas:** (1) archived indicators answer `200` with a message instead of an error (`EN.ATM.CO2E.PC` → "The indicator was not found. It may have been deleted or archived"); the CO₂ series moved to EDGAR-based codes `EN.GHG.CO2.*.AR5`. (2) A null year is a gap, never zero: the adapter omits it. (3) The API returns paginated results; the adapter refuses a paginated response rather than silently truncating. (4) External-debt indicators exist only for low/middle-income countries. (5) Aggregates (e.g. `WLD`) are computed by the Bank with their own coverage rules.
- **Verification:** for 10 country series the first and last values equal an independent query (`mrnev=1`, `date=` ranges), and no value exists before our first year; CO₂ total ≈ CO₂ per capita × population within 1% for 5 countries ([data-verification.md](data-verification.md)). GDP, inflation and population are cross-checked against the IMF for all 72 countries by `scripts/verificar-paises.mjs` (22 documented differences, listed in COUNTRIES.md).

## World Bank — Commodity Price Data (Pink Sheet)

- **What it brings:** monthly nominal prices of ~70 commodities since 1960 (energy, metals, agriculture, fertilizers). 69 series (price indices are skipped).
- **Endpoint:** the xlsx `CMO-Historical-Data-Monthly.xlsx` linked from <https://www.worldbank.org/en/research/commodity-markets>. **The file URL changes with every edition**, so the adapter scrapes the page to find it.
- **Licence:** CC BY 4.0. **Cadence:** monthly, early in the month.
- **Gotchas:** the unit is in row 6 of the sheet (`($/mt)`, `($/bbl)`…) and is read from it; column names carry footnote asterisks that are stripped; periods are written `1960M01`.
- **Verification:** inherited from the first release (`catalogo/verificado.json`: first/last dates measured at download).

## IMF — World Economic Outlook (DataMapper) — **restricted**

- **What it brings:** macro and fiscal indicators with projections (public debt, fiscal balance, growth…). Catalogue: 144 series (141 country series — public debt and fiscal balance — plus 3 earlier ones).
- **Endpoint:** `https://www.imf.org/external/datamapper/api/v1/{indicator}[/{country}]` (the API **ignores the country filter and returns every country**, so the adapter selects it); metadata at `/indicators` and `/countries`.
- **Licence:** <https://www.imf.org/en/About/copyright-and-terms> (read 2026-11-04): statistical data may be downloaded, copied and redistributed with attribution to the IMF as source and without altering their nature or accuracy (every transformation must be declared). The "Content" in general allows personal use only, and **systematic download and commercial use require written permission** (`copyright@imf.org`). RTL therefore **marks every IMF series as restricted** in the catalogue and in the compile report, and **never redistributes it** from this repository.
- **Cadence:** WEO twice a year (April, October), with partial updates. **Gotchas:** years after the current year minus one are projections and are excluded by default (`proyecciones: false`); the most recent included years may still be IMF estimates, which country sheets flag. IMF population differs from UN/World Bank figures by up to ~18% for some countries (Ukraine, Ethiopia: documented in COUNTRIES.md).
- **Verification:** GDP, inflation and population against the World Bank for all countries; debt against Eurostat (8 EU countries, all within 2 pp) and the U.S. Treasury (different definition, informational).

## Eurostat

- **What it brings:** harmonised European statistics. 100 series: monthly unemployment, quarterly GDP growth, monthly industrial production, population on 1 January, general-government debt, HICP inflation by COICOP category, for 12 EU countries plus EU-27 / euro-area aggregates.
- **Endpoint:** `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}?format=JSON&lang=EN&{dimension}={code}…` (JSON-stat 2.0). Every dimension except `time` must be fixed by filters, or the adapter refuses (so a mistyped geo code cannot silently return a different country).
- **Licence:** **CC BY 4.0** (Eurostat reuse policy, Commission Decision 2011/833/EU): reuse and redistribution allowed with source acknowledgement.
- **Limits:** no key; RTL asks for one series at a time and pauses between calls. **Cadence:** daily according to Eurostat's release calendar.
- **Gotchas:** (1) **Greece is `EL`, not `GR`**. (2) An unknown `geo` does not error: it returns many geos, which the adapter rejects ("faltan filtros para geo"). (3) **Euro-area aggregates for HICP (`EA`, `EA20`) end in 2025-12** and `EA21` has no HICP data yet (observed 2026-11-04). For fresh euro-area-wide inflation use member countries. `namq_10_gdp` and `sts_*` work with `EA20`. (4) Periods come as `YYYY`, `YYYY-Qn`, `YYYY-MM`; flags `p` (provisional) and `e` (estimated) are listed in the series note. (5) Sample sizes differ by dataset; "n=0 with `geo` size 1" means no data, not an error.
- **Verification:** first and last values of 5 series equal independent `sinceTimePeriod` / `untilTimePeriod` queries; population of Spain vs World Bank within 2%; German debt vs IMF within 2 pp.

## Our World in Data (OWID)

- **What it brings:** long-run world series (energy, climate, demography, food). 41 catalogued (`World` entity).
- **Endpoint:** `https://ourworldindata.org/grapher/{slug}.csv?v=1&csvType=full&useColumnShortNames=true` — one CSV per chart with `entity,code,year,<value columns>`.
- **Licence:** OWID's own processing is **CC BY 4.0**, but each chart republishes a primary source with its own terms (Global Carbon Project, Ember, Energy Institute, UN WPP, FAO, EM-DAT, IEA…). The primary source is recorded in each series note; the snapshot only includes series whose primary source is CC BY (Ember, Global Carbon Project, UN, FAO, Maddison, HYDE…) and leaves out IEA-, Energy-Institute-only, WHO- and EM-DAT-based ones. Always credit OWID **and** the primary source.
- **Gotchas:** (1) an unknown slug returns **404 with an empty body**; (2) `useColumnShortNames=true` gives stable lower-case column names but charts with several columns need `columna`; (3) some charts include **projections** (e.g. `population-growth-rate` runs to 2100): such charts are not catalogued; (4) years are integers and can be negative (`-10000`); AD years below 1000 are not padded (`1-01-01`); (5) values can be empty — omitted.
- **Verification:** two series re-read with the long-column CSV variant and compared row by row (identical); child mortality and fertility cross-checked against the World Bank (UN IGME / UN WPP): mortality within 3%, fertility differs 2.5% because the two publishers use different editions of the UN estimates (documented).

## FRED (Federal Reserve Bank of St. Louis)

- **What it brings:** 136 series: US employment by sector, CPI by category, housing, rates, FX, macro, energy, fiscal.
- **Endpoint:** `https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES}` — **no API key**, whole history when no date range is given. Missing observations are `.` and are dropped.
- **Licence:** FRED redistributes data from many publishers; **the licence is the original publisher's**. Series from **BLS, BEA, Census, the Federal Reserve Board, EIA and the Treasury are U.S.-government works (public domain)**; they are marked as such and included in the snapshot. Series from private publishers (S&P Case-Shiller, Moody's, CBOE VIX, Nasdaq, NBER recession dates, University of Michigan, Freddie Mac, FHFA, NY Fed) stay in the catalogue only, and the snapshot excludes them. FRED's terms: <https://fred.stlouisfed.org/legal/>.
- **Limits:** no documented limit for `fredgraph.csv`; RTL runs ≤6 parallel requests with retries. **Cadence:** each series follows its publisher (BLS employment first Friday of the month, CPI mid-month, H.10 FX weekly, Treasury yields daily).
- **Gotchas:** (1) an unknown id returns an **HTML error page (HTTP 404)**, so the adapter checks the CSV header (`observation_date`). (2) **FRED ids differ from the publisher's**: FRED `USCONS` is BLS `CES2000000001`. (3) Values are seasonally adjusted or not according to the series; index bases are in the series page (CPI 1982-84=100 except education and recreation, Dec 1997=100). (4) Series are **revised** after publication; a download is a snapshot of that day. (5) Some licensed series only keep a short window on FRED (ICE BofA indices such as `BAMLH0A0HYM2` start in 2023-11); they are not catalogued.
- **Verification:** 12 employment/CPI/earnings series compared to the **BLS public API** (identical, last 6 months); 6 Treasury yield series compared to the **U.S. Treasury par yield curve CSV** (identical, last days).

## U.S. Treasury — FiscalData

- **What it brings:** debt to the penny (total, held by the public, intragovernmental; daily since 1993), average interest rates on Treasury securities (monthly, since 2001), Treasury reporting rates of exchange (quarterly).
- **Endpoint:** `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/{endpoint}?format=json&fields=…&filter=…&sort=…&page[size]=10000&page[number]=N`. No key. **Licence:** public domain (U.S. government work).
- **Gotchas:** (1) missing numbers come as the **string `"null"`** (held-by-public / intragov are empty before 2001): dropped. (2) The exchange-rate dataset publishes **a second row with the same `record_date` when a rate is amended mid-quarter**, with a different `effective_date`; the series uses `effective_date` as the time key and keeps both. (3) Rates of exchange are federal reporting rates, not market quotes. (4) Max page size is 10,000 rows.
- **Verification:** `held by public + intragovernmental = total debt` on 4 dates (to the cent); last and first values of an interest-rate series and an exchange-rate series equal independent filtered queries.

## SEC EDGAR

- **What it brings:** quarterly financial statements for the whole US stock market, from XBRL. Not in `series.json`: it feeds the company charts (`servidor/trimestres.mjs`, `servidor/xbrl.mjs`); 16 featured companies' consolidated quarterly series are in `data/sec/`.
- **Endpoint:** `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` and `submissions/CIK##########.json`. **Licence:** public domain (U.S. government work).
- **Limits:** SEC fair-access policy, **≤10 requests per second**, and a descriptive `User-Agent`. `data.sec.gov` accepts a generic one; **`www.sec.gov/Archives` (full XBRL packages) returns 403 "Undeclared Automated Tool" without a real contact** — RTL only uses it when the user supplies one.
- **Gotchas:** Q4 does not exist as a filing: it is derived (fiscal year − first nine months) and flagged; some line items (e.g. Amazon Fulfillment/Technology) use company-specific concepts missing from `companyfacts` and are shown as "not broken down" rather than invented.
- **Verification:** see `scripts/prueba-trimestres.mjs` (balance checks: breakdowns must sum to the reported total within 0.5%).

## NASA GISTEMP v4

- **What it brings:** global, northern- and southern-hemisphere monthly land+ocean temperature anomalies (°C vs 1951–1980) since 1880.
- **Endpoint:** `https://data.giss.nasa.gov/gistemp/tabledata_v4/{GLB|NH|SH}.Ts+dSST.csv`. **Licence:** NASA content is generally not copyrighted; citation requested (GISTEMP Team; Lenssen et al. 2024). **Cadence:** monthly (mid-month); the whole record can be revised.
- **Gotchas:** wide year × month table; `***` = missing (omitted); the CSV is in °C, the `.txt` twin in 0.01 °C; the 1951–1980 base is not comparable with other products' baselines.
- **Verification:** every month of the global series equals the `.txt` version (×100).

## NOAA — GML greenhouse gases and CPC ONI

- **What it brings:** monthly CO₂ at Mauna Loa, global monthly CO₂, CH₄ and N₂O (GML); the Oceanic Niño Index (CPC).
- **Endpoints:** `https://gml.noaa.gov/webdata/ccgg/trends/{co2/co2_mm_mlo.csv|co2/co2_mm_gl.csv|ch4/ch4_mm_gl.csv|n2o/n2o_mm_gl.csv}`; `https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt`. **Licence:** public domain; NOAA asks for credit (and co-authorship consideration when the data are central to a publication). **Cadence:** monthly.
- **Gotchas:** the GML files start with dozens of `#` comment lines. **Months NOAA interpolated are flagged by negative `sdev`/`ndays` (or `-99.99`) and RTL omits them.** The Mauna Loa file also uses negative flags for the Scripps-era rows (March 1958 – April 1974) because the source gives no information to tell measured from interpolated months; RTL drops that whole period rather than risk showing interpolated values. ONI is a 3-month running mean; RTL dates each season at its **centre month** (DJF → January).
- **Verification:** all months of the Mauna Loa, global CO₂ and global CH₄ series equal the `.txt` versions of the same files, with the same count of flagged months omitted; ONI season count and last/first values equal the source.

## USGS — Earthquake catalog (ComCat)

- **What it brings:** the number of earthquakes of magnitude ≥ 7 per calendar year (UTC) since 1900.
- **Endpoint:** `https://earthquake.usgs.gov/fdsnws/event/1/count?starttime=Y-01-01&endtime=(Y+1)-01-01&minmagnitude=7` — one request per year (≈126, with a 60 ms pause). **Licence:** public domain. **Limits:** the `query` endpoint caps at 20,000 events per request; `count` has no such cap.
- **Gotchas:** only complete years; earlier catalogues are incomplete for smaller magnitudes (M ≥ 7 is considered reasonably complete since 1900); magnitudes are revised over time, so counts can change by ±1.
- **Verification:** counts for 1960, 2004, 2011 and 2022 equal the number of events in the `query` listing (a different service).

## datos.gov.co (Colombia, Socrata)

- **What it brings:** the TRM (official COP/USD rate, Superintendencia Financiera) and monthly national crude-oil production (ANH).
- **Endpoint:** `https://www.datos.gov.co/resource/{dataset}.json` (SoQL: `$select`, `$order`, `$limit` ≤ 50,000, `$offset`). Dataset ids: `32sa-8pi3` (TRM), `fdvb-hsrf` (ANH).
- **Licence:** **CC BY-SA 4.0** — attribution and **share-alike**. RTL attributes the issuing entity but keeps these series **out of `data/`** so the share-alike condition never contaminates the repository's open snapshot.
- **Gotchas:** TRM date = start of validity (a value holds until `vigenciahasta`; weekends are not filled). ANH `produccion_bls` is **text with thousands commas** (`"25,866.00"`) so the server cannot sum it: the adapter downloads every record, parses it, and sums per month in integer cents (no floating-point error). Large datasets (e.g. credit rates, ~100 M rows) are entity-level micro-data and are not catalogued: a derived aggregate would need its own methodology.
- **Verification:** the monthly ANH totals for 2014-01, 2019-07 and 2024-06 equal an independent `$where` query summed separately; the TRM row count equals the source's `count(*)`.

## Yahoo Finance, Coin Metrics, Shiller, NBP, GUS (first release)

- **Yahoo Finance** (`yahoo`, 35 series): unofficial chart API; personal/research use only — flagged by the compiler; never redistributed.
- **Coin Metrics Community** (`coinmetrics`, 2 series): **CC BY-NC 4.0** — not usable in monetised pieces without a licence; flagged by the compiler; never redistributed.
- **Robert Shiller / Yale** (`shiller`, 6 series): the author's public spreadsheet (S&P composite since 1871); credit Shiller; not redistributed.
- **NBP** (`nbp`) and **GUS BDL** (`gus`) (Poland): official APIs without a key; not redistributed pending a licence check.
- **Stooq** blocks automated downloads (403) and is deliberately not used.

## Not added

- **UN Comtrade** needs a subscription key. **UN Data / UNCTADstat** were not integrated in this pass: no stable keyless endpoint with a clear licence was verified.
- **Datos.gov.co entity-level datasets** (loan rates, deposit rates): micro-data; no honest single series without an aggregation methodology.
- **Eurostat euro-area HICP after 2025-12:** the `EA`/`EA20` aggregate ends; see Eurostat gotchas.

## Reading the licence column correctly

| In the compile report you may see | Meaning | What you can do |
|---|---|---|
| `CC BY 4.0` | attribution required, commercial use allowed | publish with the source line RTL adds automatically |
| `Public domain (U.S. government)` | no restriction; citing the source is courtesy | publish |
| `CC BY-NC` / "personal use" / IMF terms | **may not be monetised** (or needs written permission) | confirm with the provider or replace the source |
| `CC BY-SA` | attribution + share-alike | fine for a video credit; do not add to an open dataset under another licence |
