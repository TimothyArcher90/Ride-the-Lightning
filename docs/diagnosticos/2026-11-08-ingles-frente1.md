# 2026-11-08 · English version, front 1 (engine and templates)

Goal: every text the engine draws, and every message the compiler/templates/visualizer produce, can come out in English with `spec.idioma = 'en'`. Spanish (`'es'`) stays the default and its output does not change.

## What was done
- `motor/idioma.js`: added a data glossary (`traducir`: units, source names, SEC line items; `conIdioma`, `traducirA`). `t()`/`registrar()` were already there.
- `motor/diseno.js`: footer «Fuente» → `t('fuente')` ("Source").
- `motor/capas.js`, `motor/capas_extra.js`: all fixed drawn text moved to `registrar('c'|'ce', …)` with an `en` column; month abbreviations read `MESES_CORTO[idioma()]`. Imported as `tr` because `t` is the time inside the layers.
- `servidor/compilar.mjs`: sets the language from `spec.idioma`, adds `idioma` to the compiled plan (only when it is not `es`), translates units/suffixes/source footer, and passes its report through `servidor/mensajes_en.mjs` (regex table, ~130 rules) when the piece is English.
- `servidor/tablas.mjs`: concepts/units/suffixes go through the glossary (SEC labels come back to their original English names).
- `servidor/plantillas.mjs` + `plantillas_textos.mjs` + `plantillas_extra.mjs`: `generar(entrada.idioma)` sets `spec.idioma`; subtitles, default titles, notes and errors are translated; `nombre_en`/`descripcion_en`/`ayuda_en` added to each template and camera preset (`plantillas_en.mjs`). Library items accept `nombre`, `unidad`, `fuenteCorto` overrides and the catalog fields `nombre_en`, `unidad_en`, `fuente_corto_en` when they exist.
- `servidor/analisis.mjs`: moment labels and explanations, health and license texts translated (`momentos(tab, si, idioma)`, `salud(..., idioma)`, `licencia(e, idioma)`).
- `servidor/visualizador.mjs` + `porque_en.mjs`: the «porque» and template names follow `entrada.idioma`.
- `scripts/modelos-16.mjs`: `construirModelos(formato, {idioma})` and new `construirExtras()` (the other 11 models); `scripts/prueba-idioma.mjs` renders the 27 models in English (both formats) and fails on Spanish diacritics/stop words in drawn text or in the compiler report.

## Gotchas
- `generar()` restores the caller's language on exit; `compilar()` does not (it just sets it from the spec).
- A heredoc with `\d`/quotes in bash corrupts patches: patches were written with the Write tool to `.py` files.
- Catalog series names are still Spanish unless the catalog carries `nombre_en`; the test overrides names (`NOMBRES_EN` in `modelos-16.mjs`).
