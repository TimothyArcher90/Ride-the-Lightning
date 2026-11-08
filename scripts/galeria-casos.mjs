// Gallery cases: one real-data case per chart model (28 models + 4 variants), shared by `generar-galeria.mjs`
// (docs/gallery + examples/) and by the docs. Every case builds a `generar()` input for a given format, so the
// result is the same spec a user would get from the studio: nothing is typed by hand, every figure comes from a file.
//
// Licence policy for what we PUBLISH in the repo: only open data (World Bank CC BY 4.0, SEC EDGAR public domain,
// Our World in Data CC BY 4.0, Federal Reserve / BLS / EIA public domain via FRED). Yahoo Finance (personal use),
// Coin Metrics (CC BY-NC) and the IMF (written permission for systematic/commercial reuse) are never redistributed:
// the examples that read them ship the spec only, and no preview image.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from '../servidor/compilar.mjs';
import {leerIndice, itemTrimestre} from '../servidor/trimestres.mjs';
import {PAISES} from '../servidor/paises.mjs';

const BIB = path.join(RAIZ, 'datos', 'biblioteca');
export const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
export const hay = (...ids) => ids.every((id) => fs.existsSync(path.join(BIB, `${id}.csv`)));
const meta = (id) => JSON.parse(fs.readFileSync(path.join(BIB, `${id}.csv.meta.json`), 'utf8'));
const rd = (id) => new Map(fs.readFileSync(path.join(BIB, `${id}.csv`), 'utf8').trim().split('\n').slice(1).map(csvFila));
const hoy = new Date().toISOString().slice(0, 10);
const TRIM = path.join(RAIZ, 'datos', 'trimestres');
/** CSV row to fields, honouring double quotes (the SEC bridge files quote names that contain a comma, e.g. Sales, general and administrative). */
const csvFila = (l) => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };

/** Directory where a case writes its derived CSV: examples/<slug>/ for shipped examples, .tmp/galeria for gallery-only cases. */
export function dirDatos(caso) {
  const d = caso.ejemplo ? path.join(RAIZ, 'examples', caso.ejemplo.slug) : path.join(RAIZ, '.tmp', 'galeria', caso.id);
  fs.mkdirSync(d, {recursive: true});
  return d;
}
const rel = (f) => path.relative(RAIZ, f).split(path.sep).join('/');
const itemCsv = (dir, nombre, csv, fuente, extra = {}) => {
  const f = path.join(dir, 'data.csv'); fs.writeFileSync(f, csv);
  return {origen: 'archivo', ruta: rel(f), tabla: 'categorias', uso: 'donut', nombre, fuente, ...extra};
};

// ── real-data helpers ──────────────────────────────────────────────────────────────────────────────────────────
/** «Where each dollar went» of a quarterly report (SEC), as a categories table (income-statement bridge without subtotals). */
function categoriasSec(dir, tk, {uso = 'donut', comillas = false} = {}) {
  const idx = leerIndice(tk), t = idx?.trimestres?.find((x) => x.archivo && x.puente);
  if (!t) throw new Error(`No quarterly data for ${tk}: run the quarters downloader first.`);
  const it = itemTrimestre(tk, t.fin, 'puente');
  const filas = fs.readFileSync(path.join(RAIZ, it.ruta), 'utf8').trim().split('\n').slice(1).map(csvFila), partes = filas.filter((f) => f[2] !== 'total' && f[2] !== 'inicio'), neta = filas[filas.length - 1];
  const q = (s) => (/[",]/.test(s) ? `"${s.replace(/"/g, '')}"` : s);
  const csv = 'concepto,valor\n' + [...partes.map((f) => [f[0].replace(/"/g, ''), Math.abs(+f[1])]), [neta[0].replace(/"/g, ''), +neta[1]]].filter((f) => f[1] > 0).map((f) => `${q(f[0])},${f[1]}`).join('\n');
  const f = path.join(dir, 'data.csv'); fs.writeFileSync(f, csv);
  return {...it, ruta: rel(f), tabla: 'categorias', uso};
}
/** Sankey / bridge items point at the SEC file in datos/trimestres; copy it next to the example so the spec is self-contained. */
function trimestreLocal(dir, tk, uso) {
  const idx = leerIndice(tk), t = idx?.trimestres?.find((x) => x.archivo && x.puente);
  if (!t) throw new Error(`No quarterly data for ${tk}: run the quarters downloader first.`);
  const it = itemTrimestre(tk, t.fin, uso), f = path.join(dir, 'data.csv');
  fs.copyFileSync(path.join(RAIZ, it.ruta), f);
  return {...it, ruta: rel(f)};
}
const ENERGIA = ['coal', 'oil', 'gas', 'hydro', 'nuclear'].map((k) => `ow_global_energy_substitution_${k}_twh`);
const MACRO_PD = ['fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_indpro', 'fred_houst', 'fred_payems'];
const COMMOD = ['bm_gold', 'bm_copper', 'bm_crude_oil_wti'];

function barras(formato) {
  const m = meta('bm_gold');
  const datos = {d: {archivo: 'datos/biblioteca/bm_gold.csv', x: 'fecha', tipoX: 'fecha', desde: '2026-03', columnas: [{col: 'Gold', nombre: 'Oro', color: 'oro', prefijo: 'US$ ', decimales: 0, unidad: 'US$ por onza troy'}]}};
  return {version: 1, titulo: 'El oro, mes a mes', formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: 'El oro, mes a mes', color: 'oro', sub: 'Precio mensual, US$ por onza troy', t: [0.2, 7.9]}, {tipo: 'barras', datos: 'd', formatoX: 'mes', id: 'g1', t: [0.9, 5.5]}], _fuente: m.fuente.nombre};
}
function dispersion(formato, dir) {
  const a = rd('bm_gold'), b = rd('bm_copper'), filas = [];
  for (const [f, v] of a) if (f >= '2000-01-01' && b.has(f) && v !== '' && b.get(f) !== '') filas.push(`${f},${v},${b.get(f)}`);
  const f = path.join(dir, 'data.csv'); fs.writeFileSync(f, 'fecha,oro,cobre\n' + filas.join('\n'));
  const m = meta('bm_gold');
  const datos = {d: {archivo: rel(f), x: 'oro', tipoX: 'num', fuente: {nombre: m.fuente.nombre, corto: 'Banco Mundial · Pink Sheet · Oro y cobre', url: m.fuente.url, obtenido: m.fuente.obtenido, licencia: m.fuente.licencia}, columnas: [{col: 'cobre', nombre: 'Cobre', color: 'teal', prefijo: 'US$ ', decimales: 0, unidad: 'US$ por tonelada'}]}};
  return {version: 1, titulo: '¿Suben juntos el oro y el cobre?', formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: '¿Suben juntos el oro y el cobre?', color: 'oro', t: [0.2, 7.9]}, {tipo: 'dispersion', datos: 'd', etiquetaX: 'Oro, US$ por onza troy', etiquetaY: 'Cobre, US$ por tonelada', id: 'g1', t: [0.9, 6]}]};
}
/** Colombia's rank among the 45 countries of the World Bank list in 6 indicators (WB only: no IMF series, which is not redistributable). */
function radarColombia(dir) {
  const U = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8')).ultimos;
  const nom = {pib_pc: 'PIB per cápita', crec_pib: 'Crecimiento del PIB', inflacion: 'Inflación', desempleo: 'Desempleo', esperanza_vida: 'Esperanza de vida', exportaciones: 'Exportaciones / PIB'};
  const claves = Object.keys(nom).filter((k) => U[k]?.COL);
  const filas = claves.map((k) => { const v = Object.values(U[k]).map((q) => q.valor), c = U[k].COL.valor; return [nom[k], +(((v.filter((q) => q < c).length) / (v.length - 1)) * 100).toFixed(1)]; });
  return itemCsv(dir, 'Colombia: puesto entre 45 países', 'concepto,valor\n' + filas.map((f) => f.join(',')).join('\n'), {nombre: 'Banco Mundial (WDI), último dato de cada país; percentil calculado entre los 45 países de la lista', url: 'https://data.worldbank.org/', obtenido: hoy, licencia: 'CC BY 4.0 (Banco Mundial)'}, {decimales: 0, unidad: 'percentil entre 45 países'});
}
function rankingPib(dir, indicador = 'pib_pc') {
  const U = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8')).ultimos, nom = Object.fromEntries(PAISES.map((p) => [p.iso3, p.nombre]));
  const filas = Object.entries(U[indicador]).sort((a, b) => b[1].valor - a[1].valor).map(([iso, d]) => `${iso} · ${nom[iso] ?? iso},${d.valor}`);
  return itemCsv(dir, 'PIB per cápita', 'concepto,valor\n' + filas.join('\n'), {nombre: 'Banco Mundial — World Development Indicators (último dato de cada país)', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', obtenido: hoy, licencia: 'CC BY 4.0 (Banco Mundial)'}, {prefijo: 'US$ ', decimales: 0, unidad: 'US$ corrientes por habitante'});
}
function dumbbellIngresos(dir) {
  const tks = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META', 'TSLA', 'NFLX'], fil = [];
  for (const tk of tks) { const f = path.join(TRIM, tk, 'serie.csv'); if (!fs.existsSync(f)) continue; const s = fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map(csvFila); if (s.length > 5) fil.push([tk, +s[s.length - 1][1], +s[s.length - 5][1]]); }
  if (fil.length < 4) throw new Error('Need the quarters of at least 4 companies (SEC) for this case.');
  return itemCsv(dir, 'Ingresos trimestrales', 'concepto,valor,anterior\n' + fil.map((f) => `${f[0]},${f[1]},${f[2]}`).join('\n'), {nombre: 'SEC EDGAR (companyfacts), ingresos trimestrales; último trimestre frente al mismo trimestre del año anterior', url: 'https://www.sec.gov/edgar', obtenido: hoy, licencia: 'Dominio público (Gobierno de EE. UU.)'}, {divisor: 1e9, prefijo: 'US$ ', sufijo: ' mil M', decimales: 1, unidad: 'miles de millones de US$'});
}

/**
 * Each case: id (stable file stem), modelo (one of the 28 model ids, or the variant it belongs to), nombre (English), plantilla,
 * fuente/licencia (English, for the docs), `faltan()` (names of data files missing on this machine), `entrada(formato, dir)` →
 * input for generar(). `ejemplo` makes the case a shipped example. `restringido` means: spec only, no image, no data copy.
 */
export const CASOS = [
  {id: 'historia', modelo: 'historia', nombre: 'Single series history', plantilla: 'historia', fuente: 'Federal Reserve Board via FRED: total assets (WALCL)', licencia: 'Public domain', faltan: () => (hay('fed_balance') ? [] : ['fed_balance']),
    entrada: () => ({plantilla: 'historia', series: bib('fed_balance'), momentos: []})},
  {id: 'comparar', modelo: 'comparar', nombre: 'One against the rest', plantilla: 'comparar', fuente: 'World Bank Pink Sheet: gold, copper, WTI crude', licencia: 'CC BY 4.0', faltan: () => COMMOD.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'comparar', series: bib(...COMMOD), foco: 0}),
    ejemplo: {slug: 'gold-copper-oil', que: 'Gold, copper and WTI crude since 1960 on one common axis (indexed to 100 because the units differ), gold highlighted.', video: 'h'}},
  {id: 'panel', modelo: 'panel', nombre: 'Small multiples panel', plantilla: 'panel', fuente: 'World Bank Pink Sheet: gold, copper, WTI crude', licencia: 'CC BY 4.0', faltan: () => COMMOD.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'panel', series: bib(...COMMOD)})},
  {id: 'barras', modelo: 'barras', nombre: 'Bars', plantilla: '(hand-written spec)', fuente: 'World Bank Pink Sheet: gold, monthly', licencia: 'CC BY 4.0', faltan: () => (hay('bm_gold') ? [] : ['bm_gold']),
    manual: (formato) => barras(formato)},
  {id: 'barras-decada', modelo: 'barras', variante: true, nombre: 'Bars by decade (annual series)', plantilla: 'barras_decada', fuente: 'World Bank: urban population, Colombia (annual)', licencia: 'CC BY 4.0', faltan: () => (hay('pais_COL_urbanizacion') ? [] : ['pais_COL_urbanizacion']),
    entrada: () => ({plantilla: 'barras_decada', series: bib('pais_COL_urbanizacion'), titulo: 'Colombia, década a década'})},
  {id: 'carrera', modelo: 'carrera', nombre: 'Bar chart race', plantilla: 'carrera', fuente: 'Our World in Data: global energy by source (TWh)', licencia: 'CC BY 4.0 (check the primary source on the OWID page)', faltan: () => ENERGIA.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'carrera', series: bib(...ENERGIA)}), ejemplo: {slug: 'energy-race', que: 'Which energy source leads in each year since 1800: coal, oil, gas, hydro and nuclear racing in TWh.'}},
  {id: 'dispersion', modelo: 'dispersion', nombre: 'Scatter with regression', plantilla: '(hand-written spec)', fuente: 'World Bank Pink Sheet: gold vs. copper, monthly since 2000', licencia: 'CC BY 4.0', faltan: () => ['bm_gold', 'bm_copper'].filter((i) => !hay(i)),
    manual: (formato, dir) => dispersion(formato, dir)},
  {id: 'correlacion', modelo: 'correlacion', nombre: 'Correlation heatmap', plantilla: 'correlacion', fuente: 'World Bank Pink Sheet + Federal Reserve (via FRED): gold, copper, WTI, 10-year yield', licencia: 'CC BY 4.0 / public domain', faltan: () => [...COMMOD, 'fred_dgs10'].filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'correlacion', series: bib(...COMMOD, 'fred_dgs10')})},
  {id: 'sankey', modelo: 'sankey', nombre: 'Sankey flow', plantilla: 'resultados', fuente: 'SEC EDGAR: NVIDIA latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('NVDA') ? [] : ['SEC quarters: NVDA']),
    entrada: (f, dir) => ({plantilla: 'resultados', series: [trimestreLocal(dir, 'NVDA', 'sankey')]}),
    ejemplo: {slug: 'nvidia-how-it-makes-money', que: 'NVIDIA’s latest quarter as a flow: revenue, cost of sales, R&D, operating expenses, taxes and what is left as net income. The 10-Q figures are derived so the diagram always balances.', video: 'h'}},
  {id: 'donut', modelo: 'donut', nombre: 'Donut', plantilla: 'composicion', fuente: 'SEC EDGAR: Amazon latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('AMZN') ? [] : ['SEC quarters: AMZN']),
    entrada: (f, dir) => ({plantilla: 'composicion', series: [categoriasSec(dir, 'AMZN')]})},
  {id: 'cascada', modelo: 'cascada', nombre: 'Waterfall', plantilla: 'puente', fuente: 'SEC EDGAR: Apple latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('AAPL') ? [] : ['SEC quarters: AAPL']),
    entrada: (f, dir) => ({plantilla: 'puente', series: [trimestreLocal(dir, 'AAPL', 'puente')]}),
    ejemplo: {slug: 'apple-revenue-to-profit', que: 'From revenue to net income in one waterfall: every cost steps the bar down; subtotals are checked against the report.'}},
  {id: 'pendiente', modelo: 'pendiente', nombre: 'Slope chart', plantilla: 'pendiente', fuente: 'World Bank Pink Sheet + FRED: gold, copper, WTI, 10-year yield', licencia: 'CC BY 4.0 / public domain', faltan: () => [...COMMOD, 'fred_dgs10'].filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'pendiente', series: bib(...COMMOD, 'fred_dgs10')})},
  {id: 'bump', modelo: 'bump', nombre: 'Bump chart', plantilla: 'bump', fuente: 'World Bank Pink Sheet + FRED: gold, copper, WTI, wheat, 10-year yield', licencia: 'CC BY 4.0 / public domain', faltan: () => [...COMMOD, 'bm_wheat_us_hrw', 'fred_dgs10'].filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'bump', series: bib(...COMMOD, 'bm_wheat_us_hrw', 'fred_dgs10')})},
  {id: 'treemap', modelo: 'treemap', nombre: 'Treemap', plantilla: 'treemap', fuente: 'SEC EDGAR: Amazon latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('AMZN') ? [] : ['SEC quarters: AMZN']),
    entrada: (f, dir) => ({plantilla: 'treemap', series: [categoriasSec(dir, 'AMZN')]}),
    ejemplo: {slug: 'amazon-dollar-treemap', que: 'Where each Amazon dollar goes, as areas proportional to the figures: many parts, one glance.'}},
  {id: 'waffle', modelo: 'waffle', nombre: 'Waffle (100 squares)', plantilla: 'waffle', fuente: 'SEC EDGAR: NVIDIA latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('NVDA') ? [] : ['SEC quarters: NVDA']),
    entrada: (f, dir) => ({plantilla: 'waffle', series: [categoriasSec(dir, 'NVDA')]}),
    ejemplo: {slug: 'nvidia-per-100-dollars', que: 'Where NVIDIA’s money goes in the latest quarter, in 100 squares of 1 % each: costs, taxes and net income. Note: the 100 is revenue plus non-operating income (that income is one of the parts), not revenue alone.'}},
  {id: 'lollipop', modelo: 'lollipop', nombre: 'Lollipop ranking', plantilla: 'lollipop', fuente: 'SEC EDGAR: Amazon latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('AMZN') ? [] : ['SEC quarters: AMZN']),
    entrada: (f, dir) => ({plantilla: 'lollipop', series: [categoriasSec(dir, 'AMZN')]})},
  {id: 'divergente', modelo: 'divergente', nombre: 'Diverging bars (% change)', plantilla: 'divergente', fuente: 'World Bank Pink Sheet + FRED: gold, copper, WTI, wheat, 10-year yield', licencia: 'CC BY 4.0 / public domain', faltan: () => [...COMMOD, 'bm_wheat_us_hrw', 'fred_dgs10'].filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'divergente', series: bib(...COMMOD, 'bm_wheat_us_hrw', 'fred_dgs10')})},
  {id: 'radar', modelo: 'radar', nombre: 'Radar (series, vs. own history)', plantilla: 'radar', fuente: 'FRED: unemployment, fed funds, 10-year yield, industrial production, housing starts, payrolls (BLS, Federal Reserve, Census)', licencia: 'Public domain (US government series)', faltan: () => MACRO_PD.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'radar', series: bib(...MACRO_PD), titulo: 'Dónde está EE. UU. frente a su historia'})},
  {id: 'radar-pais', modelo: 'radar', variante: true, nombre: 'Radar (table): Colombia among 45 countries', plantilla: 'radar_tabla', fuente: 'World Bank WDI, latest value per country (6 indicators)', licencia: 'CC BY 4.0', faltan: () => (fs.existsSync(path.join(RAIZ, 'datos', 'paises-ultimos.json')) ? [] : ['datos/paises-ultimos.json']),
    entrada: (f, dir) => ({plantilla: 'radar_tabla', series: [radarColombia(dir)], titulo: 'Dónde está Colombia', nota: 'CADA EJE: PUESTO DE COLOMBIA ENTRE LOS PAÍSES CON DATO; 0 = EL MENOR VALOR, 100 = EL MAYOR. NO DICE SI ES BUENO O MALO.'}),
    ejemplo: {slug: 'colombia-radar-45-countries', que: 'Colombia’s rank among 45 countries in GDP per capita, growth, inflation, unemployment, life expectancy and exports/GDP. It says where it sits, not whether that is good or bad.', video: 'v'}},
  {id: 'apilada', modelo: 'apilada', nombre: 'Stacked area', plantilla: 'apilada', fuente: 'Our World in Data: global energy by source (TWh)', licencia: 'CC BY 4.0 (check the primary source on the OWID page)', faltan: () => ENERGIA.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'apilada', series: bib(...ENERGIA), titulo: 'De dónde sale la energía'})},
  {id: 'apilada100', modelo: 'apilada', variante: true, nombre: 'Stacked area, 100 %', plantilla: 'apilada100', fuente: 'Our World in Data: global energy by source (TWh)', licencia: 'CC BY 4.0 (check the primary source on the OWID page)', faltan: () => ENERGIA.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'apilada100', series: bib(...ENERGIA), titulo: 'Qué peso tiene cada fuente'}),
    ejemplo: {slug: 'global-energy-mix', que: 'The share of coal, oil, gas, hydro and nuclear in the world’s energy since 1800, always summing to 100 %.', video: 'h'}},
  {id: 'velas', modelo: 'velas', nombre: 'Candlesticks', plantilla: 'velas', fuente: 'EIA via FRED: WTI crude daily (closes only)', licencia: 'Public domain (US government)', faltan: () => (hay('fred_dcoilwtico') ? [] : ['fred_dcoilwtico']),
    entrada: () => ({plantilla: 'velas', series: bib('fred_dcoilwtico'), titulo: 'El petróleo WTI'}), ajuste: (s) => { s.datos.d.desde = '2023-01-01'; },
    ejemplo: {slug: 'wti-candlesticks', que: 'WTI crude candlesticks since 2023. The source only has daily closes, so each candle groups a period and the screen says wick = highest/lowest close (not intraday extremes).'}},
  {id: 'histograma', modelo: 'histograma', nombre: 'Histogram (levels)', plantilla: 'histograma', fuente: 'BLS via FRED: US unemployment rate', licencia: 'Public domain (US government)', faltan: () => (hay('fred_unrate') ? [] : ['fred_unrate']),
    entrada: () => ({plantilla: 'histograma', series: bib('fred_unrate'), titulo: 'Desempleo de EE. UU.'})},
  {id: 'retornos', modelo: 'histograma', variante: true, nombre: 'Histogram (returns)', plantilla: 'retornos', fuente: 'Federal Reserve H.10 via FRED: EUR/USD daily', licencia: 'Public domain (US government)', faltan: () => (hay('fred_dexuseu') ? [] : ['fred_dexuseu']),
    entrada: () => ({plantilla: 'retornos', series: bib('fred_dexuseu'), titulo: 'Cómo se mueve el euro'}),
    ejemplo: {slug: 'eurusd-daily-returns', que: 'How often the euro moves a lot in one day against the dollar: the distribution of daily returns since 1999, median and last day marked.'}},
  {id: 'dumbbell', modelo: 'dumbbell', nombre: 'Dumbbell (table)', plantilla: 'dumbbell', fuente: 'SEC EDGAR: quarterly revenue of 8 US companies, latest quarter vs. a year earlier', licencia: 'Public domain (US government)', faltan: () => ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META', 'TSLA', 'NFLX'].filter((t) => !leerIndice(t)).map((t) => `SEC quarters: ${t}`),
    entrada: (f, dir) => ({plantilla: 'dumbbell', series: [dumbbellIngresos(dir)], titulo: 'Ingresos: ahora y hace un año', etiquetaAntes: 'HACE UN AÑO', etiquetaDespues: 'ÚLTIMO TRIMESTRE'})},
  {id: 'dumbbell-series', modelo: 'dumbbell', variante: true, nombre: 'Dumbbell (series)', plantilla: 'dumbbell_series', fuente: 'Our World in Data: global energy by source', licencia: 'CC BY 4.0 (check the primary source on the OWID page)', faltan: () => ENERGIA.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'dumbbell_series', series: bib(...ENERGIA), titulo: 'Antes y después por fuente'})},
  {id: 'calendario', modelo: 'calendario', nombre: 'Calendar heatmap', plantilla: 'calendario', fuente: 'EIA via FRED: WTI crude daily, monthly returns', licencia: 'Public domain (US government)', faltan: () => (hay('fred_dcoilwtico') ? [] : ['fred_dcoilwtico']),
    entrada: () => ({plantilla: 'calendario', series: bib('fred_dcoilwtico'), titulo: 'Los meses del petróleo'}),
    ejemplo: {slug: 'oil-monthly-returns-calendar', que: 'Every month of WTI crude since 1986 as a green/red square: seasonality and the worst years at a glance. (Swap `fred_dcoilwtico` for `yf_gspc` locally to get the S&P 500 version; Yahoo data is personal-use, so it is not shipped.)'}},
  {id: 'agrupadas', modelo: 'agrupadas', nombre: 'Grouped bars', plantilla: 'agrupadas', fuente: 'Our World in Data: global energy by source', licencia: 'CC BY 4.0 (check the primary source on the OWID page)', faltan: () => ENERGIA.filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'agrupadas', series: bib(...ENERGIA), titulo: 'La energía, fuente por fuente'})},
  {id: 'bullet', modelo: 'bullet', nombre: 'Bullet gauge vs. history', plantilla: 'bullet', fuente: 'FRED: unemployment, fed funds, 10-year yield, 10y-2y spread', licencia: 'Public domain (US government series)', faltan: () => ['fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_t10y2y'].filter((i) => !hay(i)),
    entrada: () => ({plantilla: 'bullet', series: bib('fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_t10y2y'), titulo: 'Dónde estamos hoy'})},
  {id: 'bandas', modelo: 'bandas', nombre: 'Band chart (this year vs. range)', plantilla: 'bandas', fuente: 'BLS via FRED: US unemployment rate', licencia: 'Public domain (US government)', faltan: () => (hay('fred_unrate') ? [] : ['fred_unrate']),
    entrada: () => ({plantilla: 'bandas', series: bib('fred_unrate'), titulo: 'Desempleo: este año y la historia'})},
  {id: 'pictograma', modelo: 'pictograma', nombre: 'Pictogram', plantilla: 'pictograma', fuente: 'SEC EDGAR: Apple latest 10-Q', licencia: 'Public domain (US government)', faltan: () => (leerIndice('AAPL') ? [] : ['SEC quarters: AAPL']),
    entrada: (f, dir) => {
      const it = trimestreLocal(dir, 'AAPL', 'puente'), filas = fs.readFileSync(path.join(RAIZ, it.ruta), 'utf8').trim().split('\n').slice(1).map(csvFila), partes = filas.filter((x) => x[2] !== 'total' && x[2] !== 'inicio'), neta = filas[filas.length - 1];
      const csv = 'concepto,valor\n' + [...partes.map((x) => [x[0].replace(/"/g, ''), Math.abs(+x[1])]), [neta[0].replace(/"/g, ''), +neta[1]]].filter((x) => x[1] > 0).map((x) => `"${x[0]}",${x[1]}`).join('\n');
      fs.writeFileSync(path.join(RAIZ, it.ruta), csv);
      return {plantilla: 'pictograma', series: [{...it, tabla: 'categorias', uso: 'donut'}], titulo: 'A dónde fue el dinero'};
    }},
  {id: 'ranking', modelo: 'ranking', nombre: 'Ranking with codes', plantilla: 'ranking_pais', fuente: 'World Bank WDI: GDP per capita, latest value of 45 countries', licencia: 'CC BY 4.0', faltan: () => (fs.existsSync(path.join(RAIZ, 'datos', 'paises-ultimos.json')) ? [] : ['datos/paises-ultimos.json']),
    entrada: (f, dir) => ({plantilla: 'ranking_pais', series: [rankingPib(dir)], resalta: 'COL', titulo: 'PIB por habitante'}),
    ejemplo: {slug: 'gdp-per-capita-ranking', que: 'GDP per capita of 45 countries, ranked, with Colombia highlighted (it appears with its real rank even when it is not in the top).', video: 'v'}},
  {id: 'dos-hitos', modelo: 'dos_hitos', nombre: 'Two milestones (same series from two dates)', plantilla: 'dos_hitos', fuente: 'Federal Reserve via FRED: nominal broad US dollar index (DTWEXBGS), daily', licencia: 'Public domain (US government). The two milestone dates and names are claims to confirm against a primary source before publishing.', faltan: () => (hay('fred_dtwexbgs') ? [] : ['fred_dtwexbgs']),
    entrada: () => ({plantilla: 'dos_hitos', series: bib('fred_dtwexbgs'), titulo: 'El dólar tras dos choques', hitos: [{fecha: '2008-09-15', nombre: 'Quiebra de Lehman'}, {fecha: '2020-03-11', nombre: 'Pandemia de COVID'}]}),
    ejemplo: {slug: 'two-milestones-dollar', que: 'The broad dollar index seen from two milestone dates: each rebased to 100 at its close and aligned by trading sessions since the milestone, with the drawdown from the running peak, a live table and two final figures. The younger series ends first and the screen says so (no projection). The Netscape/ChatGPT version of this piece is saved as `specs/ejemplo_dos_hitos_nasdaq.json` and fails on purpose until an open-licence Nasdaq-100 series exists.'}},
];

/** Examples that are published as spec only (restricted data licences): no preview image, no data copy. */
export const RESTRINGIDOS = [
  {slug: 'bitcoin-full-history', modelo: 'historia', que: 'Bitcoin from its first price (2010) to today on a log scale, with the camera zooming into the key moments.', origen: 'specs/bitcoin-historia.json', ids: ['cm_btc_precio'], fuente: 'Coin Metrics Community Network Data (PriceUSD)', licencia: 'CC BY-NC 4.0 — non-commercial: do not use for monetised content without a Coin Metrics licence. Not redistributed here.'},
  {slug: 'latam-debt-to-gdp', modelo: 'comparar', que: 'Government gross debt / GDP of Argentina, Brazil, Chile, Colombia, Mexico and Peru on one axis, Colombia highlighted.', ids: ['pais_ARG_deuda_pib', 'pais_BRA_deuda_pib', 'pais_CHL_deuda_pib', 'pais_COL_deuda_pib', 'pais_MEX_deuda_pib', 'pais_PER_deuda_pib'], foco: 3, plantilla: 'comparar', fuente: 'IMF World Economic Outlook (DataMapper)', licencia: 'IMF terms: statistical data may be redistributed citing the IMF and unaltered; systematic download and commercial reuse need written permission (copyright@imf.org). Not redistributed here.'},
];
