# Latam debt to gdp

> No preview image is shipped for this example: its data licence does not allow redistributing it (see below).

**What it shows.** Government gross debt / GDP of Argentina, Brazil, Chile, Colombia, Mexico and Peru on one axis, Colombia highlighted.

- **Model:** Latam debt to gdp — template `comparar` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** IMF World Economic Outlook (DataMapper)
- **Licence of the data:** IMF terms: statistical data may be redistributed citing the IMF and unaltered; systematic download and commercial reuse need written permission (copyright@imf.org). Not redistributed here.
- **Data actually read by the spec:** 
  - Series combinadas — combinación por fecha exacta de: FMI · WEO · GGXWDG_NGDP · ARG + FMI · WEO · GGXWDG_NGDP · BRA + FMI · WEO · GGXWDG_NGDP · CHL + FMI · WEO · GGXWDG_NGDP · COL + FMI · WEO · GGXWDG_NGDP · MEX + FMI · WEO · GGXWDG_NGDP · PER — see source
- **Duration / format:** 12 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# the data (data.csv) is in this folder; nothing to download

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/latam-debt-to-gdp/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/latam-debt-to-gdp/spec.json 4,9
node servidor/cli.mjs render examples/latam-debt-to-gdp/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/latam-debt-to-gdp/spec.json`. Regenerate this folder with `npm run gallery`.
