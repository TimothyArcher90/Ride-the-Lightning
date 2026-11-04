# Global energy mix

![preview](preview.png)

**What it shows.** The share of coal, oil, gas, hydro and nuclear in the world’s energy since 1800, always summing to 100 %.

- **Model:** Stacked area, 100 % — template `apilada100` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** Our World in Data: global energy by source (TWh)
- **Licence of the data:** CC BY 4.0 (check the primary source on the OWID page)
- **Data actually read by the spec:** 
  - Series combinadas — combinación por fecha exacta de: Our World in Data · global-energy-substitution + Our World in Data · global-energy-substitution + Our World in Data · global-energy-substitution + Our World in Data · global-energy-substitution + Our World in Data · global-energy-substitution — see source
- **Duration / format:** 12.2 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# the data (data.csv) is in this folder; nothing to download

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/global-energy-mix/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/global-energy-mix/spec.json 4,9
node servidor/cli.mjs render examples/global-energy-mix/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/global-energy-mix/spec.json`. Regenerate this folder with `npm run gallery`.
