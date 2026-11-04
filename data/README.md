# data/ — curated open-licence snapshot

A small, **version-controlled** sample of real data so anyone can run the examples without downloading anything. Regenerate it with `node scripts/actualizar-instantanea.mjs` (add `--refrescar` to re-download from the sources).

- **2439 files, 12.5 MB** (limit 40 MB) — generated 2026-11-04.
- **Values are never altered and no years are trimmed**: each CSV is a byte-for-byte copy of what the catalogue adapter downloads (`sha256` in `MANIFEST.json` equals the `sha256` of the file).
- `MANIFEST.json` lists, for every file: `id`, `source`, `source_url`, `data_url`, `license`, `attribution`, `downloaded`, `sha256`, `rows`, `first`, `last`, `trimmed`, plus the full provenance record in `provenance`.
- **How it is used:** `servidor/datos.mjs` reads `datos/biblioteca/<id>.csv` (local download, git-ignored) and, if it does not exist, falls back to `data/<id>.csv`. Provenance (source, URL, licence) then comes from the manifest, so reports and on-screen source lines stay correct.
- This is **not** the whole catalogue (4480 series): everything else is downloaded on demand from its source (see [docs/DATA_SOURCES.md](../docs/DATA_SOURCES.md)).

## What is inside

| Family | Files | Licence |
|---|---:|---|
| World Bank — World Development Indicators (country series, 30 core indicators) | 2034 | CC BY 4.0 |
| World Bank — world and regional aggregates | 43 | CC BY 4.0 |
| World Bank — Commodity Price Data (Pink Sheet) | 69 | CC BY 4.0 |
| Our World in Data (world series) | 25 | CC BY 4.0 (primary sources in the manifest) |
| Eurostat | 100 | CC BY 4.0 |
| FRED — series republished from U.S. government publishers (BLS, BEA, Census, Federal Reserve, EIA, Treasury) | 124 | Public domain |
| U.S. Treasury FiscalData | 19 | Public domain |
| NASA GISTEMP | 3 | Public domain |
| NOAA (GML greenhouse gases, CPC ONI) | 5 | Public domain |
| USGS earthquakes | 1 | Public domain |
| SEC EDGAR quarterly company series | 16 | Public domain |

Every file must be credited to its source (see the `attribution` field). CC BY 4.0 requires attribution and a note of any change — we make none.

## What is deliberately **not** here

- **Yahoo Finance** (all `yf_*` series): personal/research use only, no redistribution.
- **IMF DataMapper** (all `imf_*` series and the country series `deuda_pib`, `deficit_pib`): systematic download and commercial reuse need written permission from the IMF.
- **Coin Metrics Community** (Bitcoin, Ether prices): CC BY-NC 4.0 (non-commercial).
- **datos.gov.co** (TRM, ANH crude production): CC BY-SA 4.0 (share-alike) — not mixed into this repository.
- **Shiller (Yale), NBP and GUS (Poland)**: no explicit redistribution licence verified.
- **FRED series from private publishers**: Moody's (AAA, BAA), S&P (Case-Shiller), CBOE (VIX), Nasdaq, NBER (recessions), University of Michigan, Freddie Mac, FHFA, New York Fed.
- **World Bank indicators whose primary source carries its own terms**: IMF International Financial Statistics (inflation, interest rates, exchange rates, reserves, balance of payments), IEA (energy use, electricity consumption, renewable shares), WHO (health expenditure, physicians), UNESCO (education), ITU (internet), WTO (merchandise trade), World Federation of Exchanges (market capitalisation).
- **Our World in Data series** that rely on the IEA, on the Energy Institute alone, on WHO or on EM-DAT, or whose primary-source licence was not verified one by one.


The exact list (with ids) is in `MANIFEST.json` → `excluded_for_license`.

Those series stay in the catalogue and can be downloaded locally for your own use; they are simply not redistributed from this repository.

## File layout

- `<id>.csv` — two columns: `fecha` (ISO `YYYY-MM-DD`; for annual series `YYYY-01-01`; BCE years are negative) and the value. Gaps in the source are gaps in the file: nothing is interpolated.
- `sec/<TICKER>_serie.csv` — quarterly company series (several columns), from SEC EDGAR.
- See [docs/DATA_FORMAT.md](../docs/DATA_FORMAT.md) for the full format.
