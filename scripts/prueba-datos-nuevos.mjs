// Prueba de la AMPLIACIÓN de datos (2026-11-04): catálogo íntegro + adaptadores nuevos contrastados contra la fuente OFICIAL con una consulta INDEPENDIENTE
// (otra petición, otro parámetro, otro formato o un cruce con otra fuente). Registra cada contraste en catalogo/verificado.json (clave `_verificacion_datos_nuevos`)
// y, con --doc, escribe docs/data-verification.md (inglés, sin datos sensibles). Uso: node scripts/prueba-datos-nuevos.mjs [--doc] [--sin-red]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execSync} from 'node:child_process';
import {leerCatalogo, descargar, rutaVerificado} from '../servidor/catalogo.mjs';
import {RAIZ, compilar} from '../servidor/compilar.mjs';
import {combinar} from '../servidor/biblioteca.mjs';
import {PAISES} from '../servidor/paises.mjs';

const DOC = process.argv.includes('--doc');
let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const filasVer = [];   // {fuente, serie, contraste, nuestro, oficial, veredicto}
const UA = {'User-Agent': 'RideTheLightning/0.1 (prueba de datos nuevos)'};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(u, {json = true, opciones = {}} = {}) {
  let ult;
  for (let k = 0; k < 4; k++) {
    try { const r = await fetch(u, {headers: UA, ...opciones}); if (r.status === 429 || r.status >= 500) { ult = new Error(`HTTP ${r.status}`); await dormir(2000 * (k + 1)); continue; } if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return json ? await r.json() : await r.text(); }
    catch (e) { ult = e; await dormir(1500 * (k + 1)); }
  }
  throw ult;
}
const num = (x) => Number(x);
/** Registra un contraste. tol = tolerancia relativa (0 = igualdad numérica exacta). */
function contraste(fuente, serie, que, nuestro, oficial, tol = 0, nota = '', informativo = false) {
  const a = num(nuestro), b = num(oficial), d = Math.abs(a - b), rel = d / Math.max(Math.abs(b), 1e-12);
  const pasa = Number.isFinite(a) && Number.isFinite(b) && (tol === 0 ? a === b || d <= 1e-9 * Math.max(1, Math.abs(b)) : rel <= tol);
  // informativo: cruce entre dos publicaciones con ediciones/definiciones distintas; una diferencia se DOCUMENTA, no rompe la prueba (los datos de cada fuente son fieles a su fuente)
  const veredicto = pasa ? (d === 0 ? 'identical' : `within ${(tol * 100).toFixed(2)}%`) : informativo && Number.isFinite(rel) ? `documented difference (${(rel * 100).toFixed(1)}%)` : 'DISCREPANCY';
  filasVer.push({fuente, serie, contraste: que, nuestro: String(nuestro), oficial: String(oficial), veredicto, nota});
  ok(pasa || (informativo && Number.isFinite(rel)), `${serie}: ${que} — nuestro ${nuestro} vs oficial ${oficial}${nota ? ` (${nota})` : ''}${pasa ? '' : ' → diferencia documentada'}`);
}
const leer = (archivo) => fs.readFileSync(archivo, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
const cat = leerCatalogo(), porId = new Map(cat.map((e) => [e.id, e]));
const bajar = async (id) => { const m = await descargar(porId.get(id)); return {m, filas: leer(m.archivo), mapa: new Map(leer(m.archivo))}; };
const sinRed = process.argv.includes('--sin-red');

// ── 1. Catálogo ───────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nCatálogo');
{
  let previas = null;
  try { previas = JSON.parse(execSync('git show HEAD:catalogo/series.json', {cwd: RAIZ, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore']}).toString()); } catch { /* sin git */ }
  const nuevas = cat.filter((e) => e.ampliacion), paises = new Set(cat.filter((e) => e.pais).map((e) => e.pais.iso3));
  ok(new Set(cat.map((e) => e.id)).size === cat.length, `ids únicos (${cat.length} series)`);
  if (previas) {
    const m = new Map(cat.map((e) => [e.id, e])), perdidas = previas.filter((e) => !m.has(e.id)), cambiadas = previas.filter((e) => m.has(e.id) && JSON.stringify(m.get(e.id)) !== JSON.stringify(e));
    ok(previas.length === 812 && perdidas.length === 0 && cambiadas.length === 0, `las ${previas.length} series previas (git HEAD) siguen idénticas (perdidas ${perdidas.length}, cambiadas ${cambiadas.length})`);
  } else console.log('  · sin git: no se pudo comparar con las 812 previas');
  ok(nuevas.length >= 250, `${nuevas.length} series nuevas no-país con marca «ampliacion»`);
  ok(cat.filter((e) => e.pais).length >= 3800, `${cat.filter((e) => e.pais).length} series por país`);
  ok(paises.size === PAISES.length && paises.size >= 70, `${paises.size} países en el catálogo`);
  const g20 = ['ARG', 'AUS', 'BRA', 'CAN', 'CHN', 'FRA', 'DEU', 'IND', 'IDN', 'ITA', 'JPN', 'KOR', 'MEX', 'RUS', 'SAU', 'ZAF', 'TUR', 'GBR', 'USA'];
  const latam = ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'CRI', 'CUB', 'DOM', 'ECU', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN', 'PRY', 'PER', 'URY', 'VEN'];
  ok(g20.every((c) => paises.has(c)), 'los 19 países del G20 (más la UE como bloque) están');
  ok(latam.every((c) => paises.has(c)), 'toda Latinoamérica continental hispanohablante + Brasil + Cuba + R. Dominicana están');
  const falta = cat.filter((e) => (e.ampliacion || e.pais) && (!e.id || !e.nombre || !e.categoria || !e.adaptador || !e.args || !e.unidad || !e.frecuencia || !e.fuente_original || !e.licencia)).map((e) => e.id);
  ok(falta.length === 0, `todas las series nuevas y por país con id, nombre, categoría, adaptador, args, unidad, frecuencia, fuente y licencia (faltan: ${falta.slice(0, 5).join(', ') || 'ninguna'})`);
  ok(cat.filter((e) => e.adaptador === 'imf').every((e) => /FMI|IMF|permiso/i.test(e.licencia)), 'toda serie del FMI declara su licencia restringida');
  ok(nuevas.every((e) => !/yahoo|coin metrics/i.test(e.fuente_original)), 'la ampliación no incluye Yahoo ni Coin Metrics');
}

// ── 2. Forma de TODAS las series nuevas ya descargadas (bajar-ampliacion) ───────────────────────────────────────
console.log('\nForma de las series nuevas descargadas');
{
  const dir = path.join(RAIZ, 'datos', 'biblioteca'), nuevas = cat.filter((e) => e.ampliacion), malas = [];
  let n = 0;
  for (const e of nuevas) {
    const f = path.join(dir, `${e.id}.csv`); if (!fs.existsSync(f)) { malas.push(`${e.id}: no descargada (node scripts/bajar-ampliacion.mjs)`); continue; }
    n++; const filas = leer(f), cab = fs.readFileSync(f, 'utf8').split('\n')[0];
    if (cab.split(',')[0] !== 'fecha' || cab.split(',').length !== 2) malas.push(`${e.id}: cabecera ${cab}`);
    if (!filas.length) malas.push(`${e.id}: sin filas`);
    if (!filas.every((r) => /^-?\d{1,6}-\d{2}-\d{2}$/.test(r[0]))) malas.push(`${e.id}: fecha mal formada`);
    const clave = (f) => { const m = f.match(/^(-?\d+)-(\d\d)-(\d\d)$/); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : NaN; };
    if (!filas.every((r, i) => i === 0 || clave(r[0]) > clave(filas[i - 1][0]))) malas.push(`${e.id}: fechas no crecientes`);
    if (!filas.every((r) => r[1] !== '' && Number.isFinite(Number(r[1])))) malas.push(`${e.id}: valor vacío o no numérico`);
    const meta = JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8'));
    if (!(meta.sha256 && meta.fuente?.nombre && meta.fuente?.url?.startsWith('http') && meta.fuente?.urlDatos?.startsWith('http') && meta.fuente?.licencia && /^\d{4}-\d{2}-\d{2}$/.test(meta.fuente?.obtenido ?? ''))) malas.push(`${e.id}: meta incompleto`);
  }
  ok(malas.length === 0, `${n} series nuevas: cabecera, fechas crecientes, valores numéricos y procedencia completa${malas.length ? ' — ' + malas.slice(0, 6).join(' | ') : ''}`);
}

// ── 2b. Instantánea data/ (en git) y caída a ella ───────────────────────────────────────────────────────────────
console.log('\nInstantánea data/');
{
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'MANIFEST.json'), 'utf8')), dir = path.join(RAIZ, 'data');
  let bytes = 0, malos = [];
  for (const f of man.files) {
    const ruta = path.join(dir, f.file); if (!fs.existsSync(ruta)) { malos.push(`${f.id}: falta el archivo`); continue; }
    const buf = fs.readFileSync(ruta); bytes += buf.length;
    if (crypto.createHash('sha256').update(buf).digest('hex') !== f.sha256) malos.push(`${f.id}: sha256`);
    if (buf.toString('utf8').trim().split('\n').length - 1 !== f.rows) malos.push(`${f.id}: filas`);
    if (!f.license || !f.license_class || !f.source_url || !f.data_url || !f.downloaded || f.trimmed !== false) malos.push(`${f.id}: campos del manifiesto`);
    if (/^(yf_|imf_|cm_|co_trm|co_crudo|sh_|nbp_|gus_)/.test(f.id) || /^pais_[A-Z]{3}_(deuda_pib|deficit_pib|inflacion|reservas|cuenta_corriente|ied)$/.test(f.id)) malos.push(`${f.id}: serie de licencia restringida en la instantánea`);
    if (!['CC-BY-4.0', 'public-domain'].includes(f.license_class)) malos.push(`${f.id}: licencia ${f.license_class}`);
  }
  ok(malos.length === 0, `${man.files.length} archivos: sha256 y filas = manifiesto, licencia CC BY 4.0 o dominio público, ninguna serie restringida${malos.length ? ' — ' + malos.slice(0, 5).join(' | ') : ''}`);
  ok(bytes <= 40 * 1048576, `tamaño de data/ = ${(bytes / 1048576).toFixed(1)} MB ≤ 40 MB`);
  ok(new Set(man.files.map((f) => f.id)).size === man.files.length, 'ids únicos en el manifiesto');
  // Caída a data/: se aparta temporalmente la descarga local y se compila/combina desde la instantánea
  const lib = path.join(RAIZ, 'datos', 'biblioteca'), ids = ['fred_unrate', 'fred_payems'], movidos = [];
  try {
    for (const id of ids) for (const ext of ['.csv', '.csv.meta.json']) { const f = path.join(lib, id + ext); if (fs.existsSync(f)) { fs.renameSync(f, f + '.bak'); movidos.push(f); } }
    const spec = {version: 1, titulo: 't', formato: 'horizontal', fps: 30, duracion: 6, datos: {d: {archivo: 'datos/biblioteca/fred_unrate.csv', x: 'fecha', tipoX: 'fecha', columnas: [{col: 'UNRATE', nombre: 'Unemployment', color: 'teal'}]}}, capas: [{tipo: 'linea', id: 'g1', datos: 'd', t: [0.5, 5], series: [0]}]};
    const r = compilar(spec), d0 = r.informe.datos[0], m = man.files.find((f) => f.id === 'fred_unrate');
    ok(r.informe.errores.length === 0 && d0.filas === m.rows && d0.sha256 === m.sha256, `compilar() sin datos/biblioteca lee data/fred_unrate.csv (${d0.filas} filas, sha256 = manifiesto, 0 errores)`);
    ok(/FRED/.test(d0.fuente.nombre) && d0.fuente.url?.startsWith('http') && d0.fuente.licencia && !r.informe.avisos.some((a) => /sha256/.test(a)), `procedencia desde el manifiesto: «${d0.fuente.corto}», licencia «${String(d0.fuente.licencia).slice(0, 60)}…»`);
    const c = combinar({ids, nombre: 'prueba snapshot', id: 'prueba_snap_comb'});
    ok(c.filas > 900 && c.componentes.length === 2 && c.componentes.every((x) => x.sha256), `combinar() también cae a data/ (${c.filas} filas, ${c.componentes.length} componentes con sha256)`);
    fs.rmSync(c.archivo, {force: true}); fs.rmSync(c.archivo + '.meta.json', {force: true});
    // un archivo del usuario con el mismo nombre NO hereda la procedencia de la instantánea
    const tmp = path.join(RAIZ, '.tmp', 'fred_unrate.csv'); fs.mkdirSync(path.dirname(tmp), {recursive: true}); fs.writeFileSync(tmp, 'fecha,UNRATE\n2020-01-01,3.5\n2020-02-01,3.5\n');
    const r2 = compilar({...spec, datos: {d: {...spec.datos.d, archivo: '.tmp/fred_unrate.csv'}}});
    fs.rmSync(tmp, {force: true});
    ok(r2.informe.errores.some((e) => /sin fuente/.test(e)), 'un archivo propio con el mismo nombre no hereda la procedencia (sigue exigiendo fuente)');
  } finally { for (const f of movidos) fs.renameSync(f + '.bak', f); }
  ok(ids.every((id) => fs.existsSync(path.join(lib, id + '.csv')) || !movidos.some((f) => f.endsWith(id + '.csv'))), 'las descargas locales apartadas se restauraron');
}

if (sinRed) { console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nCatálogo y forma: OK (contrastes con la red omitidos)'); process.exit(fallos ? 1 : 0); }

// ── 3. Banco Mundial (indicadores nuevos por país) ─────────────────────────────────────────────────────────────
console.log('\nBanco Mundial · indicadores nuevos por país (consulta independiente: mrnev=1 y rangos de fecha)');
const WBU = 'https://api.worldbank.org/v2';
for (const [iso, k] of [['COL', 'co2_pc'], ['DEU', 'electricidad_pc'], ['BRA', 'tipo_cambio'], ['IND', 'gasto_salud'], ['NGA', 'deuda_externa'], ['CHL', 'tasa_prestamos'], ['JPN', 'internet'], ['ARG', 'mortalidad_infantil'], ['USA', 'exp_mercancias'], ['MEX', 'remesas']]) {
  const id = `pais_${iso}_${k}`, e = porId.get(id); if (!e) { ok(false, `${id} no está en el catálogo`); continue; }
  const {filas} = await bajar(id), [, ult] = await pedir(`${WBU}/country/${iso}/indicator/${e.args.indicador}?format=json&mrnev=1`);
  const a = filas.at(-1), p = filas[0], [, pri] = await pedir(`${WBU}/country/${iso}/indicator/${e.args.indicador}?format=json&date=${p[0].slice(0, 4)}:${+p[0].slice(0, 4) + 2}&per_page=10`);
  contraste('World Bank WDI', id, `last value (${a[0].slice(0, 4)})`, a[1], ult[0].value);
  ok(ult[0].date === a[0].slice(0, 4), `  año del último dato = ${ult[0].date}`);
  contraste('World Bank WDI', id, `first value (${p[0].slice(0, 4)})`, p[1], pri.find((r) => r.date === p[0].slice(0, 4))?.value);
  if (+p[0].slice(0, 4) > 1960) { const [, antes] = await pedir(`${WBU}/country/${iso}/indicator/${e.args.indicador}?format=json&date=1960:${+p[0].slice(0, 4) - 1}&per_page=100`); ok((antes ?? []).every((r) => r.value == null), `  nada antes de ${p[0].slice(0, 4)} (la fuente no tiene valores anteriores)`); }
}
console.log('\n  Coherencia interna WB: CO₂ total ≈ CO₂ per cápita × población');
for (const iso of ['COL', 'CHN', 'USA', 'DEU', 'BRA']) {
  const t = (await bajar(`pais_${iso}_co2_total`)).mapa, pc = (await bajar(`pais_${iso}_co2_pc`)).mapa, pob = (await bajar(`pais_${iso}_poblacion`)).mapa, y = [...t.keys()].at(-1);
  contraste('World Bank WDI', `pais_${iso}_co2_total`, `Mt CO2 (${y.slice(0, 4)}) vs per-capita × population`, t.get(y), num(pc.get(y)) * num(pob.get(y)) / 1e6, 0.01, 'two different indicators from the same source');
}

// ── 4. FRED vs BLS (fuente oficial independiente) y vs Tesoro ──────────────────────────────────────────────────
console.log('\nFRED · contraste con la API pública del BLS (misma magnitud, otro canal oficial)');
{
  const par = {USCONS: 'CES2000000001', MANEMP: 'CES3000000001', USGOVT: 'CES9000000001', USPBS: 'CES6000000001', CUSR0000SAF11: 'CUSR0000SAF11', CUSR0000SETB01: 'CUSR0000SETB01', CUSR0000SEHA: 'CUSR0000SEHA', CUSR0000SAS: 'CUSR0000SAS', CES0500000003: 'CES0500000003', LNS14000024: 'LNS14000024', CIVPART: 'LNS11300000', CPILFESL: 'CUSR0000SA0L1E'};
  const r = await pedir('https://api.bls.gov/publicAPI/v1/timeseries/data/', {opciones: {method: 'POST', headers: {...UA, 'Content-Type': 'application/json'}, body: JSON.stringify({seriesid: Object.values(par), startyear: String(new Date().getUTCFullYear() - 2), endyear: String(new Date().getUTCFullYear())})}});
  ok(r.status === 'REQUEST_SUCCEEDED', `BLS API: ${r.status} ${(r.message ?? []).join(' ').slice(0, 100)}`);
  const bls = Object.fromEntries((r.Results?.series ?? []).map((s) => [s.seriesID, s.data]));
  for (const [fred, codigo] of Object.entries(par)) {
    const id = 'fred_' + fred.toLowerCase(), {mapa} = await bajar(id), datos = (bls[codigo] ?? []).filter((d) => /^M(0[1-9]|1[0-2])$/.test(d.period)).slice(0, 6);
    if (!datos.length) { ok(false, `${id}: BLS no devolvió ${codigo}`); continue; }
    let iguales = 0, faltan = 0;
    for (const d of datos) { const mine = mapa.get(`${d.year}-${d.period.slice(1)}-01`); if (mine === undefined) faltan++; else if (Number(mine) === Number(d.value)) iguales++; }
    const pasa = iguales >= datos.length - 1 && iguales >= 1;   // el mes más reciente puede estar en proceso de publicación en uno de los dos canales
    filasVer.push({fuente: 'BLS Public API v1 (vs FRED)', serie: id, contraste: `last ${datos.length} months (${codigo})`, nuestro: `${iguales}/${datos.length} identical, ${faltan} not yet in FRED`, oficial: `BLS ${datos.at(-1).year}-${datos.at(-1).period}…${datos[0].year}-${datos[0].period}`, veredicto: pasa ? 'identical' : 'DISCREPANCY', nota: ''});
    ok(pasa, `${id} ≡ BLS ${codigo}: ${iguales}/${datos.length} meses idénticos (${faltan} sin publicar aún)`);
  }
}
console.log('\nFRED · rendimientos del Tesoro vs la curva oficial del Departamento del Tesoro');
{
  const anio = new Date().getUTCFullYear(), txt = await pedir(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${anio}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${anio}&page&_format=csv`, {json: false});
  const L = txt.trim().split(/\r?\n/), cab = L[0].split(',').map((c) => c.replace(/"/g, '')), filas = L.slice(1).map((l) => l.split(','));
  const col = {DGS1: '1 Yr', DGS5: '5 Yr', DGS7: '7 Yr', DGS20: '20 Yr', DGS3MO: '3 Mo', DGS1MO: '1 Mo'};
  for (const [fred, c] of Object.entries(col)) {
    const {mapa} = await bajar('fred_' + fred.toLowerCase()), i = cab.indexOf(c); let ig = 0, tot = 0;
    for (const f of filas.slice(0, 8)) { const [m, d, y] = f[0].split('/'), mine = mapa.get(`${y}-${m}-${d}`); if (mine === undefined || f[i] === '' || f[i] === undefined) continue; tot++; if (Number(mine) === Number(f[i])) ig++; }
    filasVer.push({fuente: 'U.S. Treasury par yield curve (vs FRED)', serie: 'fred_' + fred.toLowerCase(), contraste: `${tot} most recent days ("${c}")`, nuestro: `${ig}/${tot} identical`, oficial: 'home.treasury.gov daily_treasury_yield_curve', veredicto: tot > 0 && ig === tot ? 'identical' : 'DISCREPANCY', nota: ''});
    ok(tot >= 4 && ig === tot, `fred_${fred.toLowerCase()} ≡ curva oficial del Tesoro (${c}): ${ig}/${tot} días idénticos`);
  }
}

// ── 5. Tesoro de EE. UU. (FiscalData) ──────────────────────────────────────────────────────────────────────────
console.log('\nTesoro de EE. UU. · FiscalData');
{
  const FD = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
  const total = (await bajar('ust_deuda_total')).mapa, pub = (await bajar('ust_debt_held_public')).mapa, intra = (await bajar('ust_intragov_hold')).mapa;
  for (const f of ['2005-06-30', '2012-12-31', '2019-03-29', [...pub.keys()].at(-1)]) {
    const a = total.get(f), b = pub.get(f), c = intra.get(f);
    if (!a || !b || !c) { ok(false, `identidad: falta ${f}`); continue; }
    contraste('U.S. Treasury FiscalData', 'ust_debt_held_public + ust_intragov_hold', `identity = total debt (${f})`, (num(b) + num(c)).toFixed(2), num(a).toFixed(2), 0, 'three different fields of the same table');
  }
  for (const [id, filtro, ep] of [['ust_tasa_promedio_notes', 'security_desc:eq:Treasury Notes', 'v2/accounting/od/avg_interest_rates'], ['ust_cambio_cop', 'country_currency_desc:eq:Colombia-Peso', 'v1/accounting/od/rates_of_exchange']]) {
    const e = porId.get(id), {filas} = await bajar(id), campo = e.args.campo, cf = e.args.campoFecha ?? 'record_date';
    const j = await pedir(`${FD}/${ep}?format=json&fields=${cf},${campo}&filter=${encodeURIComponent(filtro)}&sort=-${cf}&page%5Bsize%5D=1`), a = filas.at(-1);
    ok(j.data[0][cf] === a[0], `  ${id}: última fecha ${a[0]} = ${j.data[0][cf]}`);
    contraste('U.S. Treasury FiscalData', id, `last value (${a[0]})`, a[1], j.data[0][campo]);
    const j2 = await pedir(`${FD}/${ep}?format=json&fields=${cf},${campo}&filter=${encodeURIComponent(filtro)}&sort=${cf}&page%5Bsize%5D=1`);
    contraste('U.S. Treasury FiscalData', id, `first value (${filas[0][0]})`, filas[0][1], j2.data[0][campo]);
    ok(j2.data[0][cf] === filas[0][0], `  ${id}: primera fecha ${filas[0][0]} = ${j2.data[0][cf]}`);
  }
}

// ── 6. Eurostat ────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\nEurostat · consultas independientes (sinceTimePeriod/untilTimePeriod) y cruces con el Banco Mundial y el FMI');
{
  const EU = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
  const consulta = async (e, extra) => { const j = await pedir(`${EU}/${e.args.dataset}?${new URLSearchParams({format: 'JSON', lang: 'EN', ...e.args.filtros, ...extra})}`); return Object.entries(j.dimension.time.category.index).sort((a, b) => a[1] - b[1]).filter(([, p]) => j.value?.[p] != null).map(([t, p]) => [t, j.value[p]]); };
  const aFecha = (t) => /^\d{4}$/.test(t) ? `${t}-01-01` : /Q/.test(t) ? `${t.slice(0, 4)}-${String((+t.slice(6) - 1) * 3 + 1).padStart(2, '0')}-01` : `${t}-01`;
  for (const id of ['eu_une_rt_m_de', 'eu_namq_10_gdp_es', 'eu_sts_inpr_m_fr', 'eu_hicp_cp01_de', 'eu_demo_pjan_it']) {
    const e = porId.get(id), {filas} = await bajar(id), u = filas.at(-1), p = filas[0];
    const tU = u[0].slice(0, 4) + (id.includes('demo') ? '' : id.includes('namq') ? `-Q${Math.floor((+u[0].slice(5, 7) - 1) / 3) + 1}` : '-' + u[0].slice(5, 7));
    const ult = (await consulta(e, {sinceTimePeriod: tU})).find(([t]) => aFecha(t) === u[0]);
    contraste('Eurostat', id, `last (${u[0]})`, u[1], ult?.[1]);
    const tP = id.includes('demo') ? p[0].slice(0, 4) : id.includes('namq') ? `${p[0].slice(0, 4)}-Q${Math.floor((+p[0].slice(5, 7) - 1) / 3) + 1}` : p[0].slice(0, 7);
    const pri = (await consulta(e, {untilTimePeriod: tP})).find(([t]) => aFecha(t) === p[0]);
    contraste('Eurostat', id, `first (${p[0]})`, p[1], pri?.[1]);
  }
  const pob = (await bajar('eu_demo_pjan_es')).filas.at(-1), wb = await pedir(`${WBU}/country/ESP/indicator/SP.POP.TOTL?format=json&date=${pob[0].slice(0, 4)}`);
  const wbv = wb[1]?.[0]?.value;
  if (wbv) contraste('Eurostat vs World Bank', 'eu_demo_pjan_es', `population of Spain ${pob[0].slice(0, 4)} (1 Jan vs annual average)`, pob[1], wbv, 0.02, 'different reference dates');
  else console.log(`  · el Banco Mundial aún no publica la población de España ${pob[0].slice(0, 4)}: cruce omitido`);
  const deuda = (await bajar('eu_gov_debt_de')).filas.at(-1), imf = await pedir(`https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/DEU`), fm = imf.values?.GGXWDG_NGDP?.DEU?.[deuda[0].slice(0, 4)];
  if (fm != null) { const d = Math.abs(num(deuda[1]) - fm); filasVer.push({fuente: 'Eurostat vs IMF DataMapper', serie: 'eu_gov_debt_de', contraste: `Germany general-government debt / GDP ${deuda[0].slice(0, 4)}`, nuestro: String(deuda[1]), oficial: String(fm), veredicto: d <= 2 ? `within ${d.toFixed(2)} pp` : 'DISCREPANCY', nota: 'IMF used only as a cross-reference (restricted licence); not redistributed'}); ok(d <= 2, `eu_gov_debt_de ${deuda[1]} vs FMI ${fm} (±${d.toFixed(2)} pp, ≤ 2 pp)`); }
}

// ── 7. Our World in Data ───────────────────────────────────────────────────────────────────────────────────────
console.log('\nOur World in Data · re-lectura con otro formato de columnas y cruces con el Banco Mundial (ONU)');
{
  for (const [id, slugOw] of [['ow_co2_emissions_per_capita', 'co2-emissions-per-capita'], ['ow_electricity_generation', 'electricity-generation']]) {
    const {filas} = await bajar(id), txt = await pedir(`https://ourworldindata.org/grapher/${slugOw}.csv?v=1&csvType=full&useColumnShortNames=false`, {json: false}), L = txt.trim().split(/\r?\n/);
    const w = L.slice(1).map((l) => l.split(',')).filter((c) => c[0] === 'World' && c[3] !== '');
    ok(w.length === filas.length && w.every((c, i) => c[2] === filas[i][0].slice(0, 4) && Number(c[3]) === Number(filas[i][1])), `${id}: ${filas.length} filas idénticas a la re-lectura (columnas largas) — ${w.length} en la fuente`);
    filasVer.push({fuente: 'Our World in Data', serie: id, contraste: 'full series vs re-read with long column names', nuestro: `${filas.length} rows`, oficial: `${w.length} rows`, veredicto: w.length === filas.length ? 'identical' : 'DISCREPANCY', nota: ''});
  }
  const cm = (await bajar('ow_child_mortality')).filas.at(-1), wbM = await pedir(`${WBU}/country/WLD/indicator/SH.DYN.MORT?format=json&date=${cm[0].slice(0, 4)}`);
  if (wbM[1]?.[0]?.value) contraste('OWID vs World Bank (UN IGME)', 'ow_child_mortality', `world under-5 mortality ${cm[0].slice(0, 4)}: OWID (per 100) × 10 vs WB (per 1,000)`, num(cm[1]) * 10, wbM[1][0].value, 0.03, 'same primary source (UN IGME)');
  const fe = (await bajar('ow_total_fertility_rate')).filas.at(-1), wbF = await pedir(`${WBU}/country/WLD/indicator/SP.DYN.TFRT.IN?format=json&date=${fe[0].slice(0, 4)}`);
  if (wbF[1]?.[0]?.value) contraste('OWID vs World Bank (UN WPP)', 'ow_total_fertility_rate', `world fertility rate ${fe[0].slice(0, 4)}`, fe[1], wbF[1][0].value, 0.02, 'the two publications use different editions or compilations of the demographic estimates; each series is faithful to its own source', true);
}

// ── 8. NASA GISTEMP, NOAA, USGS ────────────────────────────────────────────────────────────────────────────────
console.log('\nNASA GISTEMP · contraste con la versión .txt (centésimas de °C), todas las filas');
{
  const {filas} = await bajar('nasa_gistemp_glb'), txt = await pedir('https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt', {json: false}), esperado = new Map();
  for (const l of txt.split(/\r?\n/)) { const c = l.trim().split(/\s+/); if (!/^\d{4}$/.test(c[0]) || c.length < 13 || c[0] !== c[c.length - 1]) continue; for (let m = 0; m < 12; m++) if (/^-?\d+$/.test(c[1 + m])) esperado.set(`${c[0]}-${String(m + 1).padStart(2, '0')}-01`, +c[1 + m]); }
  const mapa = new Map(filas.map((r) => [r[0], r[1]]));
  let dif = 0; for (const [f, v] of esperado) if (!mapa.has(f) || Math.round(num(mapa.get(f)) * 100) !== v) dif++;
  ok(esperado.size === filas.length && dif === 0, `GLB: ${filas.length} meses; ${esperado.size} en el .txt; ${dif} diferencias`);
  filasVer.push({fuente: 'NASA GISTEMP', serie: 'nasa_gistemp_glb', contraste: 'all months (CSV in °C vs TXT in 0.01 °C)', nuestro: `${filas.length} months, ${dif} differences`, oficial: `${esperado.size} months`, veredicto: esperado.size === filas.length && dif === 0 ? 'identical' : 'DISCREPANCY', nota: ''});
}
console.log('\nNOAA GML · contraste con la versión .txt y conteo de meses interpolados omitidos');
for (const [id, txtUrl] of [['noaa_co2_mlo', 'co2/co2_mm_mlo.txt'], ['noaa_ch4_global', 'ch4/ch4_mm_gl.txt'], ['noaa_co2_global', 'co2/co2_mm_gl.txt']]) {
  const {filas} = await bajar(id), txt = await pedir(`https://gml.noaa.gov/webdata/ccgg/trends/${txtUrl}`, {json: false}), esperado = new Map(); let flag = 0;
  const mlo = /mlo/.test(id);
  for (const l of txt.split(/\r?\n/)) { if (!l.trim() || l.startsWith('#')) continue; const c = l.trim().split(/\s+/); if (c.length < 4 || !/^\d{4}$/.test(c[0])) continue; const interpolado = mlo ? (+c[5] < 0 || +c[6] < 0 || +c[3] <= -99) : +c[3] <= -99; if (interpolado) { flag++; continue; } esperado.set(`${c[0]}-${c[1].padStart(2, '0')}-01`, c[3]); }
  const mapa = new Map(filas.map((r) => [r[0], r[1]])); let dif = 0; for (const [f, v] of esperado) if (!mapa.has(f) || Number(mapa.get(f)) !== Number(v)) dif++;
  ok(esperado.size === filas.length && dif === 0, `${id}: ${filas.length} meses = ${esperado.size} válidos del .txt (${flag} marcados/interpolados omitidos), ${dif} diferencias`);
  filasVer.push({fuente: 'NOAA GML', serie: id, contraste: 'all months vs .txt file; months interpolated by NOAA omitted', nuestro: `${filas.length} months, ${dif} differences`, oficial: `${esperado.size} valid + ${flag} flagged`, veredicto: esperado.size === filas.length && dif === 0 ? 'identical' : 'DISCREPANCY', nota: ''});
}
console.log('\nNOAA CPC · ONI');
{
  const {filas, mapa} = await bajar('noaa_oni'), txt = await pedir('https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt', {json: false}), L = txt.trim().split(/\r?\n/).slice(1).map((l) => l.trim().split(/\s+/));
  ok(L.length === filas.length, `ONI: ${filas.length} trimestres = ${L.length} líneas de la fuente`);
  const ult = L.at(-1), SEAS = ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'], f = `${ult[1]}-${String(SEAS.indexOf(ult[0]) + 1).padStart(2, '0')}-01`;
  contraste('NOAA CPC', 'noaa_oni', `last season ${ult[0]} ${ult[1]} (dated ${f})`, mapa.get(f), ult[3]);
  contraste('NOAA CPC', 'noaa_oni', 'DJF 1950 (first value)', mapa.get('1950-01-01'), L[0][3]);
}
console.log('\nUSGS · conteo anual M ≥ 7 vs el listado de eventos (endpoint `query`, otro servicio)');
{
  const {mapa} = await bajar('usgs_sismos_m7_anual');
  for (const y of [1960, 2004, 2011, 2022]) {
    const csv = await pedir(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&starttime=${y}-01-01&endtime=${y + 1}-01-01&minmagnitude=7&orderby=time`, {json: false});
    contraste('USGS ComCat', 'usgs_sismos_m7_anual', `M ≥ 7 earthquakes in ${y} (count service vs lines of the event list)`, mapa.get(`${y}-01-01`), csv.trim().split(/\r?\n/).length - 1);
  }
  ok(!mapa.has(`${new Date().getUTCFullYear()}-01-01`), 'el año en curso (incompleto) no está en la serie');
}

// ── 9. datos.gov.co (ANH, crudo) ────────────────────────────────────────────────────────────────────────────────
console.log('\ndatos.gov.co · ANH producción fiscalizada de crudo (suma mensual en centésimas enteras)');
{
  const {mapa, filas} = await bajar('co_crudo_produccion');
  for (const [y, m] of [[2014, 1], [2019, 7], [2024, 6]]) {
    const q = new URLSearchParams({$select: 'produccion_bls', $where: `vigencia=${y} AND mes=${m}`, $limit: '50000'}), j = await pedir(`https://www.datos.gov.co/resource/fdvb-hsrf.json?${q}`);
    const suma = j.reduce((a, r) => a + Math.round(parseFloat(String(r.produccion_bls).replace(/,/g, '')) * 100), 0) / 100;
    contraste('datos.gov.co (ANH)', 'co_crudo_produccion', `barrels in ${y}-${String(m).padStart(2, '0')} (${j.length} records)`, mapa.get(`${y}-${String(m).padStart(2, '0')}-01`), suma.toFixed(2));
  }
  const total = +(await pedir('https://www.datos.gov.co/resource/fdvb-hsrf.json?$select=count(*)'))[0].count;
  ok(total > 0 && filas.length > 100, `${filas.length} meses a partir de ${total} registros de la fuente`);
}

// ── 10. Registro ───────────────────────────────────────────────────────────────────────────────────────────────
const hoy = new Date().toISOString().slice(0, 10), mal = filasVer.filter((f) => f.veredicto === 'DISCREPANCY');
const ver = JSON.parse(fs.readFileSync(rutaVerificado, 'utf8'));
ver._verificacion_datos_nuevos = {fecha: hoy, comprobaciones: filasVer.length, discrepancias: mal.length, filas: filasVer};
fs.writeFileSync(rutaVerificado, JSON.stringify(ver, null, 2));
if (DOC) {
  const por = {}; for (const f of filasVer) (por[f.fuente] ??= []).push(f);
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const md = [
    '# Data verification', '',
    `Generated by \`scripts/prueba-datos-nuevos.mjs --doc\` on **${hoy}** against the live official sources. ${filasVer.length} contrasts, **${mal.length} discrepancies**.`, '',
    'Method: every new adapter is checked against the official source through a request that is *independent* of the adapter code path (another endpoint, another parameter, another file format, or a cross-check against a second publisher / an accounting identity). Values are compared as numbers; "identical" means equal to the last digit the source publishes. Nothing is ever interpolated, rounded or filled in: gaps in the source are gaps in the data.', '',
    'This file contains no credentials, personal data or private paths. The raw per-check record (with the values compared) lives in `catalogo/verificado.json` (git-ignored) under `_verificacion_datos_nuevos`; the table below is the same record.', '',
    ...Object.entries(por).flatMap(([fuente, rows]) => ['## ' + fuente, '', '| Series | Check | Ours | Official / reference | Verdict |', '|---|---|---|---|---|', ...rows.map((r) => `| \`${esc(r.serie)}\` | ${esc(r.contraste)}${r.nota ? ` (${esc(r.nota)})` : ''} | ${esc(r.nuestro)} | ${esc(r.oficial)} | ${esc(r.veredicto)} |`), '']),
    '## Known, documented differences (not errors)', '',
    '- **World Bank vs IMF** (countries): GDP, inflation and population are compared for all countries by `scripts/verificar-paises.mjs`; the differences found (e.g. Ireland GDP, Sweden CPI definition) are listed in `catalogo/verificado.json` → `_verificacion_paises` and in `docs/COUNTRIES.md`.',
    '- **NOAA CO₂ at Mauna Loa**: months flagged by NOAA as interpolated (negative `sdev`) are dropped, which also removes March 1958 – April 1974 because the file does not distinguish measured from interpolated months in the Scripps-era rows.',
    '- **FRED latest month**: BLS and FRED can publish the most recent observation at slightly different times; the check tolerates one month of lag and reports how many months were identical.', ''];
  fs.writeFileSync(path.join(RAIZ, 'docs', 'data-verification.md'), md.join('\n'));
  console.log('\ndocs/data-verification.md escrito');
}
console.log(fallos ? `\n${fallos} comprobación(es) fallaron (${mal.length} discrepancias)` : `\nTodas las pruebas de datos nuevos pasan (${filasVer.length} contrastes, 0 discrepancias)`);
process.exit(fallos ? 1 : 0);
