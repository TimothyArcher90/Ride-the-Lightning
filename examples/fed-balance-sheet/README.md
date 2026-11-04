# Fed balance sheet


**What it shows.** Total assets of the Federal Reserve since 2002 with the camera zooming into the 2008 crisis, the pandemic and the shrinking of the balance sheet.

- **Model:** Federal Reserve balance sheet — template `historia (hand-directed)` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** Federal Reserve Board via FRED: total assets (WALCL)
- **Licence of the data:** Public domain
- **Data actually read by the spec:** 
  - Board of Governors of the Federal Reserve System (US), vía FRED — Total Assets (Less Eliminations from Consolidation): Wednesday Level (WALCL) — Dominio público (FRED)
- **Duration / format:** 21.5 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# 1. download the series this example reads (the data folder is not versioned)
node servidor/cli.mjs bajar fed_balance

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/fed-balance-sheet/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/fed-balance-sheet/spec.json 4,9
node servidor/cli.mjs render examples/fed-balance-sheet/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/fed-balance-sheet/spec.json`. Regenerate this folder with `npm run gallery`.
