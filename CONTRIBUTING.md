# Contributing

Thanks for helping. RTL has one non-negotiable rule: **every number on screen must come from a verifiable data row.** Everything below serves that.

## Setup

```
git clone https://github.com/TimothyArcher90/Ride-the-Lightning.git
cd Ride-the-Lightning
npm install
node servidor/estudio.mjs        # studio at http://127.0.0.1:5180
```
Requirements: Node.js 22+, FFmpeg on the PATH, Microsoft Edge or Google Chrome. Examples can run offline from the curated snapshot in `data/`; live series download on demand into `datos/` (git-ignored).

To run a **second instance** for UI tests without starting the nightly updater: `RTL_PUERTO=5199 RTL_VIVO=0 node servidor/estudio.mjs`.

## Before you open a PR

Run the suites that touch what you changed (all must pass):

```
node scripts/prueba.mjs && node scripts/prueba-tablas.mjs && node scripts/prueba-plantillas.mjs
node scripts/prueba-visualizador.mjs && node scripts/prueba-universal.mjs && node scripts/prueba-calidad.mjs
node scripts/prueba-conectores.mjs && node scripts/prueba-paises.mjs      # need network
```
**Look at the frames.** The collision auditor only measures *registered* text boxes; it does not see dots, ribbons or unregistered fonts. For any visual change, render frames (`node servidor/cli.mjs vista <spec> 4,12,18`) in **both** horizontal and vertical and check them by eye.

## Adding a chart model

1. Layer: a pure function `(env, layer)` in `motor/capas_extra.js` (or `capas.js`). Register every text box with `reg(env, 'label', box, id)`. Use the tokens in `motor/diseno.js` (type scale, safe zone, footer, motion curves) — never hard-code font sizes.
2. Register it in `DIBUJO` and in `GRAFICA` (`motor/escena.js`).
3. Template: add an entry in `servidor/plantillas_extra.mjs` (id, name, description, data shape it needs, `necesita.min/max`), and the generator that builds its spec.
4. Compiler: add the type to `TIPOS_GRAFICA` / `validarExtra` in `servidor/compilar.mjs`.
5. Visualizer rule: say *when* the model fits in `servidor/visualizador*.mjs` (`candidatas()`), with the reason in plain language (it is shown to users).
6. Honest scales: declare on screen anything that is not the raw value (log axis, index, grouping).
7. Tests: add the model to `scripts/prueba-universal.mjs` with **real** data, and make sure `scripts/prueba-calidad.mjs` passes in both formats. Add a gallery image (`npm run gallery`).

## Adding a data source

See [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md) for the step-by-step. In short:
1. Write an adapter that returns exact rows (no interpolation) and provenance (URL, date, sha256).
2. Add catalog entries with **license text** and what it permits. Mark restricted sources (`nivel` ≠ `libre`) so the compiler warns users.
3. Add a live test in `scripts/prueba-conectores.mjs` that cross-checks row counts and a sample of values against the official source.
4. Record the verification in `docs/data-verification.md`.
5. Only open-license data may go into `data/` (the redistributable snapshot). **Never** commit Yahoo Finance, IMF DataMapper bulk data, or anything restricted.

## Code style

- ES modules, no build step, no framework in the engine (it runs in the browser and Node).
- Determinism: no `Math.random()`, `Date.now()` or timers inside a layer.
- Prefer wrapping over truncating text; never truncate numbers (`…` on a figure is a bug).
- User-facing strings are Spanish today; docs and commit messages are English.

## Licenses of what you add

Code: MIT. Fonts: Geist (SIL OFL). **Do not** add CodeFormer or any non-commercial-only model/library: the project is used commercially. Check any new dependency's license before adding it.

## Reporting issues

Please include: the spec JSON (or the studio steps), the format (horizontal/vertical), the frame time that looks wrong, and a screenshot. For data errors, include the series id, the value shown, and the official source value.
