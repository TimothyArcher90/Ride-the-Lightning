// Adaptadores de fuentes abiertas adicionales (sin llave): Tesoro de EE. UU. (FiscalData genérico), NASA GISTEMP, NOAA GML (CO2, CH4, N2O),
// NOAA CPC (ONI/El Niño), USGS (sismos por año) y datos.gov.co (producción fiscalizada de crudo, suma mensual).
// Se instalan en ADAPTADORES desde catalogo.mjs (`instalar`), sin importar catalogo.mjs (evita ciclos). Misma convención que los demás:
// devuelven {columnas, filas:[[AAAA-MM-DD, valor]], url, urlDatos, unidad, notaFuente}. NUNCA interpolan: lo que la fuente marca como
// faltante o interpolado se omite y se declara en `notaFuente`.

import {t as tx, registrar} from '../motor/idioma.js';

// Errores y notas de procedencia: siguen el idioma activo (es por defecto).
registrar('fx', {
  e_fiscal: {es: 'FiscalData no devolvió datos para {e}: {x}', en: 'FiscalData returned no data for {e}: {x}'},
  e_fiscal_vacio: {es: 'FiscalData {e} {f}: ningún valor en {c}.', en: 'FiscalData {e} {f}: no value in {c}.'},
  e_gistemp: {es: 'NASA GISTEMP {r}: no encontré la fila de encabezados.', en: 'NASA GISTEMP {r}: header row not found.'},
  e_noaa_cols: {es: 'NOAA GML {a}: columnas inesperadas ({c})', en: 'NOAA GML {a}: unexpected columns ({c})'},
  e_noaa_vacio: {es: 'NOAA GML {a}: sin filas válidas.', en: 'NOAA GML {a}: no valid rows.'},
  e_oni: {es: 'NOAA ONI: sin filas.', en: 'NOAA ONI: no rows.'},
  e_usgs: {es: 'USGS devolvió «{t}» para {y}', en: 'USGS returned "{t}" for {y}'},
  e_socrata: {es: 'Socrata {d}: {x}', en: 'Socrata {d}: {x}'},
  e_socrata_vacio: {es: 'Socrata {d}: sin filas válidas.', en: 'Socrata {d}: no valid rows.'},
  n_fiscal: {es: ' · filtro {f}', en: ' · filter {f}'},
  n_fiscal_cola: {es: ' · cadenas exactas de la API, sin redondear', en: ' · exact strings from the API, unrounded'},
  n_gistemp: {es: 'NASA GISS Surface Temperature Analysis v4 (GISTEMP), serie {r} tierra+océano (ERSSTv5). Meses con "***" omitidos. Citar: GISTEMP Team; Lenssen et al. (2024).', en: 'NASA GISS Surface Temperature Analysis v4 (GISTEMP), {r} land+ocean series (ERSSTv5). Months marked "***" omitted. Cite: GISTEMP Team; Lenssen et al. (2024).'},
  n_noaa: {es: 'NOAA Global Monitoring Laboratory · {a} · columna «{c}» · meses interpolados o sin dato por la propia fuente omitidos: {n}.', en: 'NOAA Global Monitoring Laboratory · {a} · column "{c}" · months interpolated or missing in the source itself omitted: {n}.'},
  n_oni: {es: 'NOAA Climate Prediction Center · ONI. Fecha = mes central del trimestre móvil (DJF → enero). ≥ +0,5 °C durante 5 trimestres seguidos = El Niño; ≤ −0,5 °C = La Niña.', en: 'NOAA Climate Prediction Center · ONI. Date = central month of the rolling season (DJF → January). ≥ +0.5 °C for 5 consecutive seasons = El Niño; ≤ −0.5 °C = La Niña.'},
  n_usgs: {es: 'USGS ComCat · conteo por año calendario UTC (starttime ≤ t < endtime) · solo años completos ({d}–{h}) · el catálogo histórico antes de ~1973 es incompleto para magnitudes bajas; para M ≥ 7 se considera razonablemente completo desde 1900. Las revisiones de magnitud de USGS pueden cambiar un conteo.', en: 'USGS ComCat · count per UTC calendar year (starttime ≤ t < endtime) · complete years only ({d}–{h}) · the historical catalog before ~1973 is incomplete for low magnitudes; for M ≥ 7 it is considered reasonably complete since 1900. USGS magnitude revisions can change a count.'},
  n_socrata: {es: '{n} registros de la fuente sumados por mes (centésimas enteras) · registros con valor o periodo inválido omitidos: {m}. Suma = total nacional de los registros publicados; puede cambiar si el operador corrige reportes.', en: '{n} source records summed by month (whole hundredths) · records with an invalid value or period omitted: {m}. Sum = national total of the published records; it may change if the operator corrects reports.'},
});

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MESES3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mm = (n) => String(n).padStart(2, '0');

export function instalar(ADAPTADORES, pedir) {
  /** FiscalData (api.fiscaldata.treasury.gov, sin clave), cualquier endpoint que tenga record_date + un campo numérico. El valor se conserva como cadena exacta. */
  ADAPTADORES.fiscaldata = async function fiscaldata({endpoint, campo, filtro, etiqueta, campoFecha = 'record_date'}) {
    const base = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/${endpoint}`, filas = [];
    const q = (p) => `${base}?format=json&sort=${campoFecha}&fields=${campoFecha},${campo}${filtro ? `&filter=${encodeURIComponent(filtro)}` : ''}&page%5Bsize%5D=10000&page%5Bnumber%5D=${p}`;
    let lab = campo;
    for (let p = 1; p <= 50; p++) {
      const j = JSON.parse(await pedir(q(p)));
      if (!Array.isArray(j.data)) throw new Error(tx('fx.e_fiscal', {e: endpoint, x: JSON.stringify(j).slice(0, 200)}));
      lab = j.meta?.labels?.[campo] ?? lab;
      for (const d of j.data) if (d[campo] != null && d[campo] !== 'null' && Number.isFinite(Number(d[campo]))) filas.push([d[campoFecha], d[campo]]);
      if (j.data.length < 10000) break;
    }
    if (!filas.length) throw new Error(tx('fx.e_fiscal_vacio', {e: endpoint, f: filtro ?? '', c: campo}));
    return {columnas: ['fecha', campo], filas, url: `https://fiscaldata.treasury.gov/datasets/`, urlDatos: q(1), notaFuente: `U.S. Treasury FiscalData · ${endpoint} · ${etiqueta ?? lab}${filtro ? tx('fx.n_fiscal', {f: filtro}) : ''}${tx('fx.n_fiscal_cola')}`};
  };

  /** NASA GISTEMP v4: anomalía mensual de temperatura (°C respecto de 1951-1980). Tabla ancha por año; '***' = sin dato (se omite). */
  ADAPTADORES.nasa_giss = async function nasaGiss({region = 'GLB'}) {
    const url = `https://data.giss.nasa.gov/gistemp/tabledata_v4/${region}.Ts+dSST.csv`, txt = await pedir(url), L = txt.trim().split(/\r?\n/);
    const iH = L.findIndex((l) => l.startsWith('Year,'));
    if (iH < 0) throw new Error(tx('fx.e_gistemp', {r: region}));
    const filas = [];
    for (const l of L.slice(iH + 1)) {
      const c = l.split(','); if (!/^\d{4}$/.test(c[0])) continue;
      for (let m = 0; m < 12; m++) if (c[1 + m] !== undefined && c[1 + m] !== '***' && c[1 + m] !== '') filas.push([`${c[0]}-${mm(m + 1)}-01`, c[1 + m]]);
    }
    return {columnas: ['fecha', `GISTEMP_${region}_anomalia_C`], filas, url: 'https://data.giss.nasa.gov/gistemp/', urlDatos: url, unidad: '°C (anomalía respecto de 1951-1980)',
      notaFuente: tx('fx.n_gistemp', {r: region})};
  };

  /** NOAA GML: medias mensuales de gases de efecto invernadero (CSV con comentarios '#'). Los meses que NOAA INTERPOLÓ (sdev negativa / ndays −1 / −99.99) se omiten: nunca se usan valores interpolados. */
  ADAPTADORES.noaa_gml = async function noaaGml({archivo, columna = 'average'}) {
    const url = `https://gml.noaa.gov/webdata/ccgg/trends/${archivo}`, txt = await pedir(url), L = txt.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
    const cab = L[0].split(',').map((x) => x.trim()), ix = (n) => cab.indexOf(n), iV = ix(columna), iY = ix('year'), iM = ix('month');
    if (iV < 0 || iY < 0 || iM < 0) throw new Error(tx('fx.e_noaa_cols', {a: archivo, c: cab.join('|')}));
    const iS = ix('sdev'), iN = ix('ndays'), filas = []; let omitidas = 0;
    for (const l of L.slice(1)) {
      const c = l.split(','); const v = c[iV]?.trim();
      const interpolado = (iS >= 0 && Number(c[iS]) < 0) || (iN >= 0 && Number(c[iN]) < 0) || Number(v) <= -99;
      if (interpolado || !Number.isFinite(Number(v)) || v === '') { omitidas++; continue; }
      filas.push([`${c[iY].trim()}-${mm(+c[iM])}-01`, v]);
    }
    if (!filas.length) throw new Error(tx('fx.e_noaa_vacio', {a: archivo}));
    const unidad = /co2/.test(archivo) ? 'ppm (fracción molar en aire seco)' : /ch4|n2o/.test(archivo) ? 'ppb (fracción molar en aire seco)' : 'Ver cabecera de la fuente';
    return {columnas: ['fecha', `${archivo.split('/').pop().replace('.csv', '')}_${columna}`], filas, url: 'https://gml.noaa.gov/ccgg/trends/', urlDatos: url, unidad,
      notaFuente: tx('fx.n_noaa', {a: archivo, c: columna, n: omitidas})};
  };

  /** NOAA CPC · Oceanic Niño Index (ONI), media móvil de 3 meses de la anomalía de TSM en Niño 3.4. Cada trimestre se fecha en su MES CENTRAL (DJF → enero). */
  ADAPTADORES.noaa_oni = async function noaaOni() {
    const url = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt', L = (await pedir(url)).split(/\r?\n/).filter((l) => l.trim()), SEAS = ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'], filas = [];
    for (const l of L.slice(1)) {
      const [s, y, , anom] = l.trim().split(/\s+/), i = SEAS.indexOf(s);
      if (i < 0 || !/^\d{4}$/.test(y) || !Number.isFinite(Number(anom))) continue;
      filas.push([`${y}-${mm(i + 1)}-01`, anom]);
    }
    if (!filas.length) throw new Error(tx('fx.e_oni'));
    return {columnas: ['fecha', 'ONI_anomalia_C'], filas, url: 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php', urlDatos: url, unidad: '°C (anomalía de TSM Niño 3.4, media móvil de 3 meses)',
      notaFuente: tx('fx.n_oni')};
  };

  /** USGS: número de terremotos de magnitud ≥ minmag por año calendario (UTC), vía el servicio `count` del catálogo ComCat. Solo años completos. */
  ADAPTADORES.usgs_sismos = async function usgsSismos({minmag = 7, desde = 1900}) {
    const filas = [], hasta = new Date().getUTCFullYear() - 1, base = 'https://earthquake.usgs.gov/fdsnws/event/1/count';
    for (let y = desde; y <= hasta; y++) {
      const t = (await pedir(`${base}?starttime=${y}-01-01&endtime=${y + 1}-01-01&minmagnitude=${minmag}`)).trim();
      if (!/^\d+$/.test(t)) throw new Error(tx('fx.e_usgs', {t: t.slice(0, 80), y}));
      filas.push([`${y}-01-01`, t]);
      await dormir(60);
    }
    return {columnas: ['fecha', `sismos_M${minmag}_mas`], filas, url: 'https://earthquake.usgs.gov/earthquakes/search/', urlDatos: `${base}?minmagnitude=${minmag}`, unidad: `Número de sismos de magnitud ≥ ${minmag} en el año`,
      notaFuente: tx('fx.n_usgs', {d: desde, h: hasta})};
  };

  /** datos.gov.co (Socrata): suma mensual de un campo numérico escrito como texto con comas de miles («25,866.00»). Se suma en centésimas enteras (sin error de coma flotante). */
  ADAPTADORES.socrata_suma = async function socrataSuma({dataset, anio, mes, valor, dominio = 'www.datos.gov.co'}) {
    const base = `https://${dominio}/resource/${dataset}.json`, acc = new Map(); let n = 0, malas = 0;
    for (let o = 0; o < 2000000; o += 50000) {
      const q = new URLSearchParams({$select: `${anio},${mes},${valor}`, $order: ':id', $limit: '50000', $offset: String(o)});
      const j = JSON.parse(await pedir(`${base}?${q}`));
      if (!Array.isArray(j)) throw new Error(tx('fx.e_socrata', {d: dataset, x: JSON.stringify(j).slice(0, 200)}));
      for (const r of j) {
        n++;
        const v = String(r[valor] ?? '').replace(/,/g, '').trim();
        if (!/^-?\d+(\.\d+)?$/.test(v) || !/^\d{4}$/.test(String(r[anio])) || !(+r[mes] >= 1 && +r[mes] <= 12)) { malas++; continue; }
        const k = `${r[anio]}-${mm(+r[mes])}-01`; acc.set(k, (acc.get(k) ?? 0) + Math.round(parseFloat(v) * 100));
      }
      if (j.length < 50000) break;
    }
    const filas = [...acc.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, c]) => [k, (c / 100).toFixed(2)]);
    if (!filas.length) throw new Error(tx('fx.e_socrata_vacio', {d: dataset}));
    return {columnas: ['fecha', valor], filas, url: `https://www.datos.gov.co/d/${dataset}`, urlDatos: base,
      notaFuente: tx('fx.n_socrata', {n, m: malas})};
  };
}
