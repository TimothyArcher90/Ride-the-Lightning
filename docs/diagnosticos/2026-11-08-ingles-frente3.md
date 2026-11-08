# English version — front 3 (catalogue and countries)

Status: **done**, nothing committed. Run `node scripts/construir-ingles.mjs` then `node scripts/prueba-catalogo-ingles.mjs`.

## What changed
- `catalogo/series.en.json` (generated): English overlay for all 4,480 series. Only visible text (`nombre`, `categoria`, `tema`, `etiquetas`, `frecuencia`, `fuente_original`, `fuente_corto`, `licencia`, `nota`, `pais{nombre,region}`) plus `unidad_vis`. ids, `adaptador`, `args`, `unidad` are never in the overlay.
- `servidor/catalogo.mjs`: `leerCatalogo(idioma='es')` ('es' = `series.json` byte for byte; 'en' = overlay merged, `unidad` untouched, `unidad_vis` added, a series missing from the overlay falls back to Spanish with `unidad_vis = unidad`). `buscar(consulta, catalogo, idioma)` and the new `coincideBusqueda(e, terminos)` index every series in Spanish AND English, so «gold»/«oro» and «germany unemployment»/«desempleo alemania» find the same series in any mode. Overlay and search index are cached by mtime.
- `servidor/paises.mjs`: tables `PAISES_EN` (72), `REGIONES_EN`, `TEMAS_EN`, `INDICADORES_EN` (59: name, unit, suffix). `idioma` argument on `entradasPaises`, `listarPaises`, `indicadoresPais`, `fichaPais`, `compararPaises`, `rankingPais` (+ `formatear`). English formats: `US$ 30.8 trillion`, `124.4% of GDP`, `2.2% per year`. Reasons for missing data and the verification notes of `catalogo/verificado.json` are translated by pattern (`motivoSinDatosEn`, `notaVerificacionEn`); if a text does not match the known pattern it stays in the original. `rankingPais(..., 'en')` writes `datos/derivados/ranking_<k>_en.csv` (separate file, so the two languages do not overwrite each other).
- `servidor/estudio.mjs`: only `leerCatalogo(lang)` and `coincideBusqueda` in `/api/biblioteca` (the paises endpoints already passed `lang`).
- `scripts/ingles-tablas.mjs` (translation tables + Spanish detector), `scripts/construir-ingles.mjs` (builder), `scripts/prueba-catalogo-ingles.mjs` (test, 69 checks).

## Decisions / left as is (see also `2026-11-08-ingles-frente3-pendientes.md`)
- **Kept in Spanish on purpose** (proper names, whitelist in `ingles-tablas.mjs`): Superintendencia Financiera de Colombia, Agencia Nacional de Hidrocarburos (legal names; official English renderings not verified), Narodowy Bank Polski, Bank Danych Lokalnych, the portal `datos.gov.co`, `Superfinanciera` (search tag), `El Niño` / `La Niña` / `Niño 3.4` (English texts use them), `El Salvador`, `vigenciahasta` (column name quoted in the TRM note), `et al.`.
- **Judgment calls worth a look**: «IPC México» (Yahoo `^MXX`) → `S&P/BMV IPC (Mexico)` so that IPC is not read as CPI; «Turquía» → `Turkey` (not Türkiye, ASCII); `Eurostat «población activa»` → `% of the active population`; «Iron ore, cfr spot» keeps no «CFR spot» qualifier in the name (neither does the Spanish name); «Soya» → `Soybeans` (matches the Pink Sheet label); «ley 1000» (NBP gold) → `1000 fineness`.
- Country-series tags in English use the English indicator keyword instead of the Spanish key (`pib`, `inflacion`…); the Spanish key stays searchable because search indexes both languages.
- Not done on purpose: `descargar()` still writes Spanish provenance (`.meta.json`) because it receives the original entry; the UI cards (`ficha()` in `estudio.mjs`) still send `unidad` (original) — they can add `unidad_vis` from the 'en' catalogue.

## Tests run
`prueba-catalogo-ingles.mjs` (new, all green), `prueba-paises.mjs`, `prueba-universal.mjs`, `prueba-tablas.mjs` (all green in es).
