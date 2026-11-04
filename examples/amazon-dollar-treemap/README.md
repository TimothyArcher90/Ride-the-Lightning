# Amazon dollar treemap

![preview](preview.png)

**What it shows.** Where each Amazon dollar goes, as areas proportional to the figures: many parts, one glance.

- **Model:** Treemap — template `treemap` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** SEC EDGAR: Amazon latest 10-Q
- **Licence of the data:** Public domain (US government)
- **Data actually read by the spec:** 
  - SEC EDGAR · reporte 10-Q de Amazon (Q3 FY2026) — Dominio público (Gobierno de EE. UU.)
- **Duration / format:** 11 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# the data (data.csv) is in this folder; nothing to download

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/amazon-dollar-treemap/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/amazon-dollar-treemap/spec.json 4,9
node servidor/cli.mjs render examples/amazon-dollar-treemap/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/amazon-dollar-treemap/spec.json`. Regenerate this folder with `npm run gallery`.

## Compiler notices (in Spanish, as the engine prints them)

- capas[0]:titulo.texto: contiene cifra escrita a mano ("Amazon · Q3 FY2026") declarada verificada en Período del reporte Q3 FY2026 (SEC EDGAR, fecha de cierre 2026-09-30) · https://data.sec.gov/api/xbrl/companyfacts/CIK0001018724.json.
