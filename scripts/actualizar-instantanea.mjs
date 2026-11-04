// Regenera la INSTANTÁNEA CURADA de data/ (en git): CSV de series de LICENCIA ABIERTA + data/MANIFEST.json + data/README.md.
// Uso: node scripts/actualizar-instantanea.mjs [--refrescar] [--paralelo=6]
//   Por defecto reutiliza lo ya descargado en datos/biblioteca (misma fecha de descarga queda en el manifiesto); --refrescar vuelve a bajar todo de las fuentes.
// Reglas (duras):
//   · Solo fuentes con licencia que permite redistribuir: Banco Mundial (CC BY 4.0), Our World in Data (CC BY 4.0), Eurostat (CC BY 4.0),
//     dominio público de EE. UU. (SEC, FRED con origen BLS/BEA/Census/Fed/EIA/Tesoro, FiscalData, NASA, NOAA, USGS).
//   · NUNCA: Yahoo Finance, FMI, Coin Metrics (CC BY-NC), CC BY-SA (TRM, ANH), Shiller, Moody's, S&P, CBOE, Nasdaq, Freddie Mac, UMich, NBER, ni indicadores del
//     Banco Mundial cuya fuente primaria (primera citada) es IEA, FMI, OMS, UNESCO, UIT, OMC o la Federación Mundial de Bolsas.
//   · Los valores NO se alteran ni se recortan: cada CSV es copia byte a byte del que descarga el catálogo (sha256 verificado).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {leerCatalogo, descargar, pedir} from '../servidor/catalogo.mjs';
import {RAIZ} from '../servidor/compilar.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const REFRESCAR = process.argv.includes('--refrescar'), PAR = +arg('paralelo', 6);
const DIR = path.join(RAIZ, 'data'), LIB = path.join(RAIZ, 'datos', 'biblioteca'), hoy = new Date().toISOString().slice(0, 10);
const cat = leerCatalogo(), porId = new Map(cat.map((e) => [e.id, e]));

const L = {
  wb: {clase: 'CC-BY-4.0', texto: 'CC BY 4.0 (The World Bank, World Bank Open Data)', atribucion: 'The World Bank — https://data.worldbank.org (CC BY 4.0)'},
  owid: {clase: 'CC-BY-4.0', texto: 'CC BY 4.0 (Our World in Data); see each series for its primary source', atribucion: 'Our World in Data — https://ourworldindata.org (CC BY 4.0)'},
  eu: {clase: 'CC-BY-4.0', texto: 'CC BY 4.0 (Eurostat reuse policy, Commission Decision 2011/833/EU)', atribucion: 'Source: Eurostat'},
  pd: (org) => ({clase: 'public-domain', texto: `Public domain (work of the U.S. government: ${org})`, atribucion: `Source: ${org}`}),
};
const BLS = 'U.S. Bureau of Labor Statistics', BEA = 'U.S. Bureau of Economic Analysis', CEN = 'U.S. Census Bureau', FRB = 'Board of Governors of the Federal Reserve System', EIA = 'U.S. Energy Information Administration', TSY = 'U.S. Department of the Treasury';
// FRED ya catalogado antes de la ampliación: solo los de origen de dominio público (el resto —Moody's, S&P, CBOE, Nasdaq, NBER, UMich, Freddie Mac, NY Fed— queda fuera)
const FRED_PREVIO = {WALCL: FRB, WTISPLC: EIA, DCOILWTICO: EIA, DCOILBRENTEU: EIA, GASREGW: EIA, PPIACO: BLS, CPIAUCNS: BLS, CPIAUCSL: BLS, M2SL: FRB, M1SL: FRB, BOGMBASE: FRB, FEDFUNDS: FRB, DFF: FRB, GS10: FRB, DGS10: FRB, DGS2: FRB, DGS30: FRB, T10Y2Y: FRB,
  UNRATE: BLS, PAYEMS: BLS, GDP: BEA, GDPA: BEA, GFDEBTN: TSY, GFDEGDQ188S: 'U.S. Office of Management and Budget and U.S. Bureau of Economic Analysis', HOUST: CEN, DEXUSEU: FRB, DEXJPUS: FRB, DEXUSUK: FRB, DEXCHUS: FRB, DEXMXUS: FRB, INDPRO: FRB, WTREGEN: TSY};
// Indicadores del Banco Mundial incluidos (clave de servidor/paises.mjs) — el resto de WDI se descarga bajo demanda
const WB_CLAVES = ['pib', 'pib_pc', 'crec_pib', 'desempleo', 'poblacion', 'esperanza_vida', 'gini', 'exportaciones', 'apertura_comercial', 'importaciones', 'co2_total', 'co2_pc', 'ghg_total', 'acceso_electricidad', 'mortalidad_infantil', 'mortalidad_menores5',
  'fertilidad', 'crec_poblacion', 'urbanizacion', 'deuda_externa', 'deuda_externa_ingreso', 'servicio_deuda', 'ppa', 'part_laboral', 'desempleo_juvenil', 'valor_industria', 'valor_agro', 'valor_servicios', 'inversion', 'ahorro'];
const PRIMARIA_NO_REDISTRIBUIBLE = /IEA|International Energy Agency|International Monetary Fund|IMF|World Health Organization|WHO\b|UNESCO|International Telecommunication|ITU\b|World Trade Organization|WTO\b|World Federation of Exchanges/i;
const OWID_PREVIO = ['ow_population', 'ow_gdp_per_capita_maddison_project_database_gdp_per_capita', 'ow_life_expectancy', 'ow_annual_co2_emissions_per_country'];   // fuentes primarias CC BY (UN/HYDE/Gapminder, Maddison, UN WPP, Global Carbon Project)
// Fuente primaria con licencia propia no verificada como redistribuible (IEA, Energy Institute sola, WHO CC BY-NC-SA, EM-DAT/CRED): quedan en el catálogo, no en data/
const OWID_NO = new Set(['ow_electric_car_sales', 'ow_gas_production_by_country', 'ow_gas_consumption_by_country', 'ow_oil_consumption_by_country', 'ow_fossil_fuel_primary_energy', 'ow_maternal_mortality_mmr', 'ow_number_of_deaths_from_natural_disasters_total_dead_all_disasters_yearly']);

const SEL = new Map(), EXCL = [];   // id → {lic, nota}
const incluir = (id, lic, extra = {}) => { if (porId.has(id)) SEL.set(id, {lic, ...extra}); };
const excluir = (id, motivo) => EXCL.push({id, motivo});

const metaWB = new Map();
async function primariaWB(cod) {
  if (!metaWB.has(cod)) metaWB.set(cod, ((await pedir(`https://api.worldbank.org/v2/indicator/${cod}?format=json`).then((t) => JSON.parse(t)[1]?.[0]?.sourceOrganization ?? '')) || '').replace(/\s+/g, ' '));
  return metaWB.get(cod);
}
const claveDe = new Map(); for (const e of cat.filter((x) => x.pais)) claveDe.set(e.id, e.id.slice(('pais_' + e.pais.iso3 + '_').length));

// 1. Banco Mundial: series por país (indicadores centrales) y agregados mundo/regiones
const gate = new Map();
for (const e of cat.filter((x) => x.adaptador === 'worldbank')) {
  const cod = e.args.indicador, central = e.pais ? WB_CLAVES.includes(claveDe.get(e.id)) : true;
  if (!central) continue;
  if (!gate.has(cod)) { const org = await primariaWB(cod), primero = org.split(';')[0]; gate.set(cod, !PRIMARIA_NO_REDISTRIBUIBLE.test(primero) || ['SP.DYN.IMRT.IN', 'SH.DYN.MORT'].includes(cod) ? null : `World Bank indicator whose primary source (${primero.slice(0, 90)}) has its own redistribution terms`); }
  if (gate.get(cod)) { if (!e.pais) excluir(e.id, gate.get(cod)); continue; }
  incluir(e.id, L.wb, {tema: e.pais ? 'country' : 'aggregate'});
}
for (const [cod, motivo] of gate) if (motivo) excluir(`WDI ${cod} (all countries)`, motivo);
// 2. Pink Sheet del Banco Mundial (CC BY 4.0)
for (const e of cat.filter((x) => x.adaptador === 'bancomundial')) incluir(e.id, L.wb);
// 3. Our World in Data
for (const e of cat.filter((x) => x.adaptador === 'owid')) { if (OWID_NO.has(e.id)) excluir(e.id, 'OWID series whose primary source (IEA, Energy Institute alone, WHO or EM-DAT) has its own terms'); else if (e.ampliacion || OWID_PREVIO.includes(e.id)) incluir(e.id, L.owid, {primaria: (e.nota ?? '').match(/Fuente primaria: ([^.]*)/)?.[1] ?? null}); else excluir(e.id, 'OWID series whose primary-source licence was not individually verified'); }
// 4. Eurostat
for (const e of cat.filter((x) => x.adaptador === 'eurostat')) incluir(e.id, L.eu);
// 5. FRED de dominio público
for (const e of cat.filter((x) => x.adaptador === 'fred')) {
  if (e.ampliacion) { const org = (e.licencia.match(/gobierno de EE\. UU\.: ([^)]*)\)/) ?? [])[1]; if (org) incluir(e.id, L.pd(`${org}, via FRED`)); else excluir(e.id, 'FRED series whose original publisher does not release to the public domain (Freddie Mac, FHFA, NY Fed)'); }
  else if (FRED_PREVIO[e.args.id]) incluir(e.id, L.pd(`${FRED_PREVIO[e.args.id]}, via FRED`)); else excluir(e.id, "FRED series from a private publisher (Moody's, S&P, CBOE, Nasdaq, NBER, UMich, Freddie Mac, NY Fed)");
}
// 6. Tesoro de EE. UU., NASA, NOAA, USGS
for (const e of cat.filter((x) => ['tesoro', 'fiscaldata'].includes(x.adaptador))) incluir(e.id, L.pd(`${TSY}, FiscalData`));
for (const e of cat.filter((x) => x.adaptador === 'nasa_giss')) incluir(e.id, L.pd('NASA Goddard Institute for Space Studies (GISTEMP)'));
for (const e of cat.filter((x) => ['noaa_gml', 'noaa_oni'].includes(x.adaptador))) incluir(e.id, L.pd('NOAA'));
for (const e of cat.filter((x) => x.adaptador === 'usgs_sismos')) incluir(e.id, L.pd('U.S. Geological Survey'));
// 7. Exclusiones explícitas por familia (queda constancia en el manifiesto)
const FAMILIAS = [['yahoo', 'Yahoo Finance: personal/research use only, no redistribution'], ['imf', 'IMF DataMapper: systematic download and commercial reuse need written permission'], ['coinmetrics', 'Coin Metrics Community: CC BY-NC 4.0'],
  ['trm', 'datos.gov.co TRM: CC BY-SA 4.0 (share-alike)'], ['socrata_suma', 'datos.gov.co ANH: CC BY-SA 4.0 (share-alike)'], ['shiller', "R. Shiller's data: no explicit redistribution licence"], ['nbp', 'NBP/GUS (Poland): redistribution terms not verified'], ['gus', 'NBP/GUS (Poland): redistribution terms not verified']];
for (const [ad, m] of FAMILIAS) { const n = cat.filter((e) => e.adaptador === ad).length; if (n) excluir(`${n} series from adapter «${ad}»`, m); }

// ── Descarga / reutilización ─────────────────────────────────────────────────────────────────────────────────
const ids = [...SEL.keys()];
console.log(`seleccionadas ${ids.length} series (${EXCL.length} exclusiones registradas)`);
const frescas = (id) => { const f = path.join(LIB, id + '.csv.meta.json'); return fs.existsSync(f) && fs.existsSync(path.join(LIB, id + '.csv')); };
const pend = ids.filter((id) => REFRESCAR || !frescas(id)), fallos = [];
let k = 0, hechas = 0;
await Promise.all(Array.from({length: PAR}, async () => {
  while (k < pend.length) {
    const id = pend[k++];
    try { await descargar(porId.get(id)); } catch (e) { fallos.push(`${id}: ${String(e.message).slice(0, 120)}`); }
    if (++hechas % 100 === 0) console.log(`  descargadas ${hechas}/${pend.length}`);
  }
}));
if (fallos.length) { console.log('FALLOS de descarga (esas series no entran):\n  ' + fallos.join('\n  ')); }

// ── Copia a data/ + manifiesto ───────────────────────────────────────────────────────────────────────────────
fs.rmSync(DIR, {recursive: true, force: true}); fs.mkdirSync(DIR, {recursive: true});
const files = [];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
for (const id of ids) {
  const f = path.join(LIB, id + '.csv');
  if (!fs.existsSync(f) || fallos.some((x) => x.startsWith(id + ':'))) continue;
  const buf = fs.readFileSync(f), meta = JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')), s = sha(buf);
  if (s !== meta.sha256) throw new Error(`${id}: el sha256 del CSV no coincide con su .meta.json (re-descarga con --refrescar)`);
  fs.writeFileSync(path.join(DIR, id + '.csv'), buf);
  const e = porId.get(id), sel = SEL.get(id);
  const filas = buf.toString('utf8').trim().split('\n').slice(1);
  files.push({id, file: id + '.csv', name: e.nombre, category: e.categoria, source: meta.fuente.nombre, source_url: meta.fuente.url, data_url: meta.fuente.urlDatos, license: sel.lic.texto, license_class: sel.lic.clase, attribution: sel.lic.atribucion,
    primary_source: sel.primaria ?? undefined, frequency: e.frecuencia, unit: meta.fuente.unidad ?? e.unidad ?? null, downloaded: meta.descargado, sha256: s, rows: filas.length, first: meta.inicio, last: meta.fin, trimmed: false, bytes: buf.length,
    provenance: {...meta, fuente: {...meta.fuente, licencia: sel.lic.texto, licencia_catalogo: meta.fuente.licencia ?? null}}});   // la licencia que rige la redistribución desde data/ (la del catálogo queda en licencia_catalogo)
}
// SEC EDGAR (dominio público): series trimestrales consolidadas de las empresas destacadas
const sec = [], empresas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'catalogo', 'empresas.json'), 'utf8'));
fs.mkdirSync(path.join(DIR, 'sec'), {recursive: true});
for (const emp of empresas) {
  const f = path.join(RAIZ, 'datos', 'trimestres', emp.ticker, 'serie.csv');
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f), meta = JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')), filas = buf.toString('utf8').trim().split('\n').slice(1);
  fs.writeFileSync(path.join(DIR, 'sec', `${emp.ticker}_serie.csv`), buf);
  sec.push({id: `sec_${emp.ticker.toLowerCase()}_serie`, file: `sec/${emp.ticker}_serie.csv`, name: `${emp.nombre} (${emp.ticker}) — quarterly revenue, operating income, net income, operating margin`, category: 'Companies (SEC)', source: meta.fuente.nombre, source_url: meta.fuente.url, data_url: meta.fuente.url,
    license: 'Public domain (work of the U.S. government: U.S. Securities and Exchange Commission, EDGAR)', license_class: 'public-domain', attribution: 'Source: U.S. SEC EDGAR (data.sec.gov)', frequency: 'Quarterly', unit: 'US$ (revenue and income); % (margin)', downloaded: meta.fuente.obtenido, sha256: sha(buf), rows: filas.length, first: meta.inicio, last: meta.fin, trimmed: false, bytes: buf.length,
    note: 'Q4 is derived (fiscal year minus first nine months) because the SEC does not publish Q4 as such; see docs/es/CUMPLIMIENTO.md.'});
}
const todos = [...files, ...sec], bytes = todos.reduce((a, f) => a + f.bytes, 0);
const por = {}; for (const f of todos) por[f.license_class] = (por[f.license_class] ?? 0) + 1;
const manifiesto = {
  generated: hoy, generator: 'scripts/actualizar-instantanea.mjs', files_count: todos.length, total_bytes: bytes, trimming: 'none — every CSV is a byte-for-byte copy of what the catalogue adapter downloads; no years were removed and no value was altered',
  license_summary: por, how_to_use: 'servidor/datos.mjs falls back to data/<id>.csv when datos/biblioteca/<id>.csv is missing; provenance comes from the `provenance` field.',
  excluded_for_license: EXCL, files: todos,
};
fs.writeFileSync(path.join(DIR, 'MANIFEST.json'), JSON.stringify(manifiesto, null, 1));

// ── README (inglés), generado a partir del manifiesto ──────────────────────────────────────────────────────────
const cuenta = (pred) => todos.filter(pred).length;
const fam = [
  ['World Bank — World Development Indicators (country series, 30 core indicators)', (f) => /^pais_/.test(f.id), 'CC BY 4.0'], ['World Bank — world and regional aggregates', (f) => /^wb_/.test(f.id), 'CC BY 4.0'], ['World Bank — Commodity Price Data (Pink Sheet)', (f) => /^bm_/.test(f.id), 'CC BY 4.0'],
  ['Our World in Data (world series)', (f) => /^ow_/.test(f.id), 'CC BY 4.0 (primary sources in the manifest)'], ['Eurostat', (f) => /^eu_/.test(f.id), 'CC BY 4.0'],
  ['FRED — series republished from U.S. government publishers (BLS, BEA, Census, Federal Reserve, EIA, Treasury)', (f) => /^(fred_|fed_)/.test(f.id), 'Public domain'], ['U.S. Treasury FiscalData', (f) => /^ust_/.test(f.id), 'Public domain'],
  ['NASA GISTEMP', (f) => /^nasa_/.test(f.id), 'Public domain'], ['NOAA (GML greenhouse gases, CPC ONI)', (f) => /^noaa_/.test(f.id), 'Public domain'], ['USGS earthquakes', (f) => /^usgs_/.test(f.id), 'Public domain'], ['SEC EDGAR quarterly company series', (f) => /^sec_/.test(f.id), 'Public domain'],
];
const readme = `# data/ — curated open-licence snapshot

A small, **version-controlled** sample of real data so anyone can run the examples without downloading anything. Regenerate it with \`node scripts/actualizar-instantanea.mjs\` (add \`--refrescar\` to re-download from the sources).

- **${todos.length} files, ${(bytes / 1048576).toFixed(1)} MB** (limit 40 MB) — generated ${hoy}.
- **Values are never altered and no years are trimmed**: each CSV is a byte-for-byte copy of what the catalogue adapter downloads (\`sha256\` in \`MANIFEST.json\` equals the \`sha256\` of the file).
- \`MANIFEST.json\` lists, for every file: \`id\`, \`source\`, \`source_url\`, \`data_url\`, \`license\`, \`attribution\`, \`downloaded\`, \`sha256\`, \`rows\`, \`first\`, \`last\`, \`trimmed\`, plus the full provenance record in \`provenance\`.
- **How it is used:** \`servidor/datos.mjs\` reads \`datos/biblioteca/<id>.csv\` (local download, git-ignored) and, if it does not exist, falls back to \`data/<id>.csv\`. Provenance (source, URL, licence) then comes from the manifest, so reports and on-screen source lines stay correct.
- This is **not** the whole catalogue (${cat.length} series): everything else is downloaded on demand from its source (see [docs/DATA_SOURCES.md](../docs/DATA_SOURCES.md)).

## What is inside

| Family | Files | Licence |
|---|---:|---|
${fam.map(([n, p, l]) => `| ${n} | ${cuenta(p)} | ${l} |`).join('\n')}

Every file must be credited to its source (see the \`attribution\` field). CC BY 4.0 requires attribution and a note of any change — we make none.

## What is deliberately **not** here

- **Yahoo Finance** (all \`yf_*\` series): personal/research use only, no redistribution.
- **IMF DataMapper** (all \`imf_*\` series and the country series \`deuda_pib\`, \`deficit_pib\`): systematic download and commercial reuse need written permission from the IMF.
- **Coin Metrics Community** (Bitcoin, Ether prices): CC BY-NC 4.0 (non-commercial).
- **datos.gov.co** (TRM, ANH crude production): CC BY-SA 4.0 (share-alike) — not mixed into this repository.
- **Shiller (Yale), NBP and GUS (Poland)**: no explicit redistribution licence verified.
- **FRED series from private publishers**: Moody's (AAA, BAA), S&P (Case-Shiller), CBOE (VIX), Nasdaq, NBER (recessions), University of Michigan, Freddie Mac, FHFA, New York Fed.
- **World Bank indicators whose primary source carries its own terms**: IMF International Financial Statistics (inflation, interest rates, exchange rates, reserves, balance of payments), IEA (energy use, electricity consumption, renewable shares), WHO (health expenditure, physicians), UNESCO (education), ITU (internet), WTO (merchandise trade), World Federation of Exchanges (market capitalisation).
- **Our World in Data series** that rely on the IEA, on the Energy Institute alone, on WHO or on EM-DAT, or whose primary-source licence was not verified one by one.


The exact list (with ids) is in \`MANIFEST.json\` → \`excluded_for_license\`.

Those series stay in the catalogue and can be downloaded locally for your own use; they are simply not redistributed from this repository.

## File layout

- \`<id>.csv\` — two columns: \`fecha\` (ISO \`YYYY-MM-DD\`; for annual series \`YYYY-01-01\`; BCE years are negative) and the value. Gaps in the source are gaps in the file: nothing is interpolated.
- \`sec/<TICKER>_serie.csv\` — quarterly company series (several columns), from SEC EDGAR.
- See [docs/DATA_FORMAT.md](../docs/DATA_FORMAT.md) for the full format.
`;
fs.writeFileSync(path.join(DIR, 'README.md'), readme);
console.log(`data/: ${todos.length} archivos, ${(bytes / 1048576).toFixed(2)} MB · licencias ${JSON.stringify(por)} · exclusiones ${EXCL.length} · fallos ${fallos.length}`);
if (bytes > 40 * 1048576) { console.error('¡data/ supera 40 MB!'); process.exit(2); }
process.exit(fallos.length ? 1 : 0);
