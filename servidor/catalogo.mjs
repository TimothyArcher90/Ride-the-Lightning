// Biblioteca de series históricas: cada entrada se descarga COMPLETA desde su primer dato disponible y se guarda en
// datos/biblioteca/<id>.csv junto a un .meta.json con la procedencia (url, fecha de descarga, sha256, primer y último
// dato REALES). Lo que dice el catálogo sobre "inicio" nunca se asume: se mide al descargar y queda en
// catalogo/verificado.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RAIZ} from './compilar.mjs';
import {leerTabla, columnaFechas, columnaNumeros} from './datos.mjs';

const UA = 'RideTheLightning/0.1 (investigacion local; contacto: david@macrowise.co)';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(url, {reintentos = 3, texto = true, cabeceras = {}} = {}) {
  let ultimo;
  for (let k = 0; k < reintentos; k++) {
    try {
      const r = await fetch(url, {headers: {'User-Agent': UA, ...cabeceras}, signal: AbortSignal.timeout(90000)});
      if (r.status === 429 || r.status >= 500) { ultimo = new Error(`HTTP ${r.status} en ${url}`); await dormir(2500 * (k + 1)); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      return texto ? await r.text() : Buffer.from(await r.arrayBuffer());
    } catch (e) { ultimo = e; await dormir(1500 * (k + 1)); }
  }
  throw ultimo;
}

const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Cada adaptador devuelve {columnas:[...], filas:[[fecha, v1, v2…]], fuente:{…}} con la fecha como texto AAAA-MM-DD.
export const cache = {};
export const ADAPTADORES = {
  /** FRED: CSV público sin clave; sin parámetro de fecha devuelve TODA la historia. */
  async fred({id}) {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}`;
    const txt = await pedir(url);
    if (!/^observation_date|^DATE/i.test(txt)) throw new Error(`FRED no devolvió un CSV para ${id}`);
    const f = txt.trim().split(/\r?\n/).map((l) => l.split(','));
    return {columnas: ['fecha', id], filas: f.slice(1).map((r) => [r[0], r[1]]), url: `https://fred.stlouisfed.org/series/${id}`, urlDatos: url};
  },
  /** Coin Metrics Community API (sin clave): precio de referencia diario desde el primer dato. */
  async coinmetrics({activo, metrica = 'PriceUSD', inicio = '2009-01-01'}) {
    const filas = [];
    let url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=${activo}&metrics=${metrica}&frequency=1d&start_time=${inicio}&page_size=10000&paging_from=start`;
    const primera = url;
    while (url) {
      const j = JSON.parse(await pedir(url));
      for (const d of j.data) filas.push([d.time.slice(0, 10), d[metrica] ?? null]);
      url = j.next_page_url ?? null;
    }
    return {columnas: ['fecha', metrica], filas, url: `https://coinmetrics.io/community-network-data/`, urlDatos: primera};
  },
  /** Yahoo Finance (API de gráficos, no oficial): histórico máximo mensual o diario. */
  async yahoo({simbolo, intervalo = '1d', campo = 'close'}) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?period1=-2208988800&period2=${Math.floor(Date.now() / 1000)}&interval=${intervalo}&includeAdjustedClose=false`;
    const j = JSON.parse(await pedir(url));
    const r = j.chart?.result?.[0];
    if (!r) throw new Error(`Yahoo no devolvió datos para ${simbolo}: ${JSON.stringify(j.chart?.error)}`);
    const cierre = r.indicators.quote[0][campo];
    const off = r.meta?.gmtoffset ?? 0;
    const filas = r.timestamp.map((t, i) => [new Date((t + off) * 1000).toISOString().slice(0, 10), cierre[i] ?? null]);
    return {columnas: ['fecha', campo], filas, url: `https://finance.yahoo.com/quote/${encodeURIComponent(simbolo)}/history/`, urlDatos: url};
  },
  /** Our World in Data (CC BY): CSV completo de un gráfico, filtrando una entidad. */
  async owid({slug, entidad, columna}) {
    const url = `https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`;
    const txt = await pedir(url);
    const t = txt.trim().split(/\r?\n/).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '')));
    const cab = t[0].map((x) => x.trim()), minus = cab.map((x) => x.toLowerCase()), iE = minus.indexOf('entity'), iY = minus.indexOf('year');
    const iV = columna ? cab.indexOf(columna) : cab.length - 1;
    if (iE < 0 || iY < 0 || iV < 0) throw new Error(`Estructura inesperada en ${slug}: ${cab.join(' | ')}`);
    const filas = t.slice(1).filter((r) => r[iE] === entidad && r[iV] !== '').map((r) => [`${r[iY]}-01-01`, r[iV]]);
    if (!filas.length) throw new Error(`OWID ${slug}: sin filas para "${entidad}"`);
    return {columnas: ['fecha', cab[iV]], filas, url: `https://ourworldindata.org/grapher/${slug}`, urlDatos: url, anual: true};
  },

  /** Banco Mundial · Pink Sheet (precios mensuales de ~70 commodities desde 1960). La URL del xlsx cambia en cada edición: se descubre en la página oficial. */
  async bancomundial({columna}) {
    const pg = 'https://www.worldbank.org/en/research/commodity-markets';
    const wb = await (cache.pink ??= (async () => {
      const html = await pedir(pg);
      const url = [...html.matchAll(/https?:[^"'\s]*CMO-Historical-Data-Monthly\.xlsx/g)].map((m) => m[0])[0];
      if (!url) throw new Error('No encontré el enlace al xlsx del Pink Sheet en la página del Banco Mundial.');
      const XLSX = (await import('xlsx')).default;
      return {url, libro: XLSX.read(await pedir(url, {texto: false}), {cellNF: true, raw: true}), XLSX};
    })());
    const ws = wb.libro.Sheets['Monthly Prices'], X = wb.XLSX, rg = X.utils.decode_range(ws['!ref']);
    const val = (R, C) => ws[X.utils.encode_cell({r: R, c: C})]?.v;
    const limpio = (s) => String(s ?? '').replace(/\s*\*+\s*$/, '').replace(/\s+/g, ' ').trim();
    let col = -1;
    for (let C = 1; C <= rg.e.c; C++) if (limpio(val(4, C)) === columna) col = C;
    if (col < 0) throw new Error(`Columna "${columna}" no existe en el Pink Sheet.`);
    const filas = [];
    for (let R = 6; R <= rg.e.r; R++) {
      const m = String(val(R, 0) ?? '').match(/^(\d{4})M(\d{2})$/), v = val(R, col);
      if (m && typeof v === 'number') filas.push([`${m[1]}-${m[2]}-01`, v]);
    }
    return {columnas: ['fecha', columna], filas, url: pg, urlDatos: wb.url, unidad: String(val(5, col) ?? '').replace(/^\(|\)$/g, ''), notaFuente: String(val(3, 0) ?? '')};
  },
  /** Robert Shiller (Yale): bolsa de EE. UU., dividendos, beneficios, IPC y bono a 10 años desde 1871. */
  async shiller({columna}) {
    const url = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
    const wb = await (cache.shiller ??= (async () => { const XLSX = (await import('xlsx')).default; return {XLSX, libro: XLSX.read(await pedir(url, {texto: false}), {raw: true})}; })());
    const ws = wb.libro.Sheets.Data, X = wb.XLSX, rg = X.utils.decode_range(ws['!ref']);
    const idx = {P: 1, D: 2, E: 3, CPI: 4, GS10: 6, 'Real Price': 7, 'Real Dividend': 8, 'Real Earnings': 10};
    const col = idx[columna]; if (col === undefined) throw new Error(`Columna Shiller desconocida: ${columna}. Admitidas: ${Object.keys(idx).join(', ')}`);
    const filas = [];
    for (let R = 8; R <= rg.e.r; R++) {
      const d = ws[X.utils.encode_cell({r: R, c: 0})]?.v, v = ws[X.utils.encode_cell({r: R, c: col})]?.v;
      if (typeof d !== 'number' || typeof v !== 'number') continue;
      const y = Math.floor(d + 1e-9), m = Math.round((d - y) * 100);
      if (m < 1 || m > 12) continue;
      filas.push([`${y}-${String(m).padStart(2, '0')}-01`, v]);
    }
    return {columnas: ['fecha', columna], filas, url: 'http://www.econ.yale.edu/~shiller/data.htm', urlDatos: url};
  },
  /** NBP (Banco Central de Polonia), API oficial sin clave. kurs: tipo de cambio medio (tabla A, desde 2002-01-02); zloto: precio del oro por gramo (desde 2013-01-02). Máx. 367 días por petición → se pide por tramos. */
  async nbp({tipo = 'kurs', tabla = 'a', codigo}) {
    const inicio = tipo === 'zloto' ? Date.UTC(2013, 0, 2) : Date.UTC(2002, 0, 2), fin = Date.now(), d = (ms) => new Date(ms).toISOString().slice(0, 10), filas = [];
    for (let a = inicio; a <= fin; a += 360 * 86400000) {
      const b = Math.min(fin, a + 359 * 86400000);
      const u = tipo === 'zloto' ? `https://api.nbp.pl/api/cenyzlota/${d(a)}/${d(b)}/?format=json` : `https://api.nbp.pl/api/exchangerates/rates/${tabla}/${codigo}/${d(a)}/${d(b)}/?format=json`;
      let txt; try { txt = await pedir(u); } catch (e) { if (/HTTP 404/.test(e.message)) continue; throw e; }   // 404 = sin publicaciones en ese tramo
      const j = JSON.parse(txt);
      if (tipo === 'zloto') j.forEach((r) => filas.push([r.data, r.cena])); else j.rates.forEach((r) => filas.push([r.effectiveDate, r.mid]));
      await dormir(120);
    }
    return {columnas: ['fecha', tipo === 'zloto' ? 'PLN_por_gramo_oro' : `PLN_por_${String(codigo).toUpperCase()}`], filas, url: 'https://api.nbp.pl/', urlDatos: tipo === 'zloto' ? 'https://api.nbp.pl/api/cenyzlota/' : `https://api.nbp.pl/api/exchangerates/rates/${tabla}/${codigo}/`};
  },
  /** GUS · Bank Danych Lokalnych (API oficial). Valores nacionales (nivel 0 = Polska). El nombre y la unidad se leen de los metadatos oficiales de la variable. */
  async gus({variable}) {
    const base = 'https://bdl.stat.gov.pl/api/v1';
    const meta = JSON.parse(await pedir(`${base}/variables/${variable}?format=json&lang=pl`, {cabeceras: {Accept: 'application/json'}}));
    const filas = [];
    for (let p = 0; p < 20; p++) {
      const j = JSON.parse(await pedir(`${base}/data/by-variable/${variable}?unit-level=0&format=json&page-size=100&page=${p}&lang=pl`, {cabeceras: {Accept: 'application/json'}}));
      for (const r of j.results ?? []) for (const v of r.values ?? []) if (v.val != null) filas.push([`${v.year}-01-01`, v.val]);
      if (!j.links?.next) break;
      await dormir(250);
    }
    const tema = JSON.parse(await pedir(`${base}/subjects/${meta.subjectId}?format=json&lang=pl`, {cabeceras: {Accept: 'application/json'}})).name;
    const nombre = [meta.n1, meta.n2, meta.n3].filter(Boolean).join(' · ');
    return {columnas: ['fecha', `GUS_${variable}`], filas, url: `https://bdl.stat.gov.pl/bdl/dane/podgrup/temat`, urlDatos: `${base}/data/by-variable/${variable}?unit-level=0`, unidad: meta.measureUnitName && meta.measureUnitName !== '-' ? meta.measureUnitName : 'Sin unidad en los metadatos de BDL (índice)', notaFuente: `BDL · tema ${meta.subjectId} «${tema}» · variable ${variable}: ${nombre}`};
  },
  /** CSV/XLSX público en una URL fija (Shiller, Banco Mundial, BoE…): se descarga tal cual y se lee con la ingesta común. */
  async archivo({url, extension = 'csv', hoja, filaEncabezado, colX, colY}) {
    const buf = await pedir(url, {texto: false});
    const tmp = path.join(RAIZ, '.tmp', `dl_${crypto.randomBytes(4).toString('hex')}.${extension}`);
    fs.mkdirSync(path.dirname(tmp), {recursive: true}); fs.writeFileSync(tmp, buf);
    try {
      const t = leerTabla(tmp, {hoja, filaEncabezado});
      const fx = columnaFechas(t, colX, {anio: true}), fy = columnaNumeros(t, colY);
      const filas = fx.valores.map((ms, i) => (ms == null || fy.valores[i] == null ? null : [iso(ms), fy.valores[i]])).filter(Boolean);
      return {columnas: ['fecha', colY], filas, url, urlDatos: url};
    } finally { fs.rmSync(tmp, {force: true}); }
  },
};

export const rutaCatalogo = path.join(RAIZ, 'catalogo', 'series.json');
export const rutaVerificado = path.join(RAIZ, 'catalogo', 'verificado.json');
export const leerCatalogo = () => JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8'));
const leerVerificado = () => (fs.existsSync(rutaVerificado) ? JSON.parse(fs.readFileSync(rutaVerificado, 'utf8')) : {});

export function buscar(consulta = '', catalogo = leerCatalogo()) {
  const q = consulta.toLowerCase().split(/\s+/).filter(Boolean), ver = leerVerificado();
  return catalogo
    .filter((e) => q.every((p) => `${e.id} ${e.nombre} ${e.categoria} ${(e.etiquetas ?? []).join(' ')}`.toLowerCase().includes(p)))
    .map((e) => ({id: e.id, nombre: e.nombre, categoria: e.categoria, unidad: e.unidad, frecuencia: e.frecuencia, fuente: e.fuente_original, verificado: ver[e.id] ? {inicio: ver[e.id].inicio, fin: ver[e.id].fin, filas: ver[e.id].filas, descargado: ver[e.id].descargado} : null}));
}

/** Descarga una entrada del catálogo (historia COMPLETA) y la guarda con su procedencia. */
export async function descargar(entrada) {
  const ad = ADAPTADORES[entrada.adaptador];
  if (!ad) throw new Error(`Adaptador desconocido: ${entrada.adaptador}`);
  const r = await ad(entrada.args);
  const dir = path.join(RAIZ, 'datos', 'biblioteca');
  fs.mkdirSync(dir, {recursive: true});
  const archivo = path.join(dir, `${entrada.id}.csv`);
  const filas = r.filas.filter((f) => f[0] && f[1] !== '' && f[1] !== '.' && f[1] != null);
  if (!filas.length) throw new Error(`${entrada.id}: la descarga no trajo filas con valor`);
  const csv = [r.columnas.join(','), ...filas.map((f) => f.join(','))].join('\n') + '\n';
  fs.writeFileSync(archivo, csv);
  const sha = crypto.createHash('sha256').update(csv).digest('hex');
  const hoy = new Date().toISOString().slice(0, 10);
  const meta = {
    id: entrada.id, sha256: sha, descargado: hoy,
    fuente: {corto: entrada.fuente_corto ?? null, nombre: entrada.fuente_original + (entrada.titulo_fuente ? ` — ${entrada.titulo_fuente}` : ''), url: r.url, urlDatos: r.urlDatos, obtenido: hoy, licencia: entrada.licencia ?? null, unidad: entrada.unidad ?? r.unidad ?? null, frecuencia: entrada.frecuencia, notaFuente: r.notaFuente ?? null},
    filas: filas.length, inicio: filas[0][0], fin: filas[filas.length - 1][0], nota: entrada.nota ?? null,
  };
  fs.writeFileSync(archivo + '.meta.json', JSON.stringify(meta, null, 2));
  const ver = leerVerificado();
  ver[entrada.id] = {inicio: meta.inicio, fin: meta.fin, filas: meta.filas, descargado: hoy, sha256: sha, url: r.url};
  fs.writeFileSync(rutaVerificado, JSON.stringify(ver, null, 2));
  return {archivo, ...meta};
}
