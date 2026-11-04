# Gdp per capita ranking

![preview](preview.png)

**What it shows.** GDP per capita of 45 countries, ranked, with Colombia highlighted (it appears with its real rank even when it is not in the top).

- **Model:** Ranking with codes — template `ranking_pais` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** World Bank WDI: GDP per capita, latest value of 45 countries
- **Licence of the data:** CC BY 4.0
- **Data actually read by the spec:** 
  - Banco Mundial — World Development Indicators (último dato de cada país) — CC BY 4.0 (Banco Mundial)
- **Duration / format:** 11.2 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# the data (data.csv) is in this folder; nothing to download

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/gdp-per-capita-ranking/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/gdp-per-capita-ranking/spec.json 4,9
node servidor/cli.mjs render examples/gdp-per-capita-ranking/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/gdp-per-capita-ranking/spec.json`. Regenerate this folder with `npm run gallery`.
