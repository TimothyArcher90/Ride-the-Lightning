# Bitcoin full history

> No preview image is shipped for this example: its data licence does not allow redistributing it (see below).

**What it shows.** Bitcoin from its first price (2010) to today on a log scale, with the camera zooming into the key moments.

- **Model:** Bitcoin full history — template `historia` (see [docs/MODELS.md](../../docs/MODELS.md))
- **Source:** Coin Metrics Community Network Data (PriceUSD)
- **Licence of the data:** CC BY-NC 4.0 — non-commercial: do not use for monetised content without a Coin Metrics licence. Not redistributed here.
- **Data actually read by the spec:** 
  - Coin Metrics Community Network Data — CC BY-NC 4.0 (datos comunitarios de Coin Metrics)
- **Duration / format:** 18.5 s, 1920×1080 (`spec.vertical.json` is the 1080×1920 version for reels)

## Run it

```bash
# 1. download the series this example reads (the data folder is not versioned)
node servidor/cli.mjs bajar cm_btc_precio

# 2. compile: validates the spec and prints the verification report (every figure traced to a row)
node servidor/cli.mjs compilar examples/bitcoin-full-history/spec.json

# 3. preview frames (PNG in .tmp/vistas) and a fast draft video
node servidor/cli.mjs vista examples/bitcoin-full-history/spec.json 4,9
node servidor/cli.mjs render examples/bitcoin-full-history/spec.json --borrador --sin-alfa
```

Final delivery (MP4 + ProRes 4444 with alpha): `node servidor/cli.mjs render examples/bitcoin-full-history/spec.json`. Regenerate this folder with `npm run gallery`.

## Compiler notices (in Spanish, as the engine prints them)

- datos.btc: LICENCIA: «CC BY-NC 4.0 (datos comunitarios de Coin Metrics)». Si la pieza se monetiza (YouTube, clientes), esta fuente puede NO permitirlo: confirma la licencia o sustitúyela por una fuente oficial.
