// Adaptadores de datos abiertos de bancos centrales: BIS (Banco de Pagos Internacionales) y BCE (Banco Central Europeo), ambos por SDMX/CSV sin clave.
// Las URL, la licencia y la condición de cita se verificaron el 2026-11-09 (docs/diagnosticos/2026-11-09-datos.md).
//   BIS  https://stats.bis.org/api/v2/data/dataflow/BIS/<flujo>/1.0/<clave>?format=csv
//        Términos: https://data.bis.org/help/legal — uso sin restricción siempre que se cite al BIS como fuente, no se sugiera su aval, la traducción no se
//        presente como oficial, el producto comercial no cobre un extra por las estadísticas y no se presenten como consejo de inversión.
//   BCE  https://data-api.ecb.europa.eu/service/data/<flujo>/<clave>?format=csvdata
//        Política: https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html — reuso libre y gratuito citando
//        la fuente («Source: ECB statistics») SIN modificar las estadísticas ni sus metadatos; no cubre datos de terceros.
// Los valores se guardan tal como los publica la fuente (cadena exacta, sin redondear); los periodos se fechan al primer día (mes/trimestre/año).
import {t as tx, registrar} from '../motor/idioma.js';

registrar('cat', {
  e_sdmx_resp: {es: '{p}: la respuesta de {id} no es un CSV SDMX (¿error de la API?): {x}', en: '{p}: the response for {id} is not an SDMX CSV (API error?): {x}'},
  e_sdmx_multi: {es: '{p}: la clave {id} devolvió {n} series distintas; el adaptador espera exactamente una.', en: '{p}: the key {id} returned {n} different series; the adapter expects exactly one.'},
  e_sdmx_periodo: {es: '{p}: periodo no soportado «{v}» en {id}.', en: '{p}: unsupported period "{v}" in {id}.'},
  e_sdmx_vacio: {es: '{p}: {id} no trajo ningún valor.', en: '{p}: {id} returned no values.'},
  e_sdmx_orden: {es: '{p}: {id} trae periodos repetidos o desordenados (fila {i}: {v}).', en: '{p}: {id} has repeated or unordered periods (row {i}: {v}).'},
  n_sdmx_marcas: {es: ' · marcas de estado en la fuente: {f} (A = normal; E = estimado; P = provisional; otras: ver metadatos de la fuente)', en: ' · status flags in the source: {f} (A = normal; E = estimated; P = provisional; others: see the source metadata)'},
  n_sdmx_actualizada: {es: 'datos tal como los publica la fuente, sin modificar', en: 'data as published by the source, unmodified'},
});

/** Lector CSV mínimo (RFC 4180): comillas dobles, comas y saltos de línea dentro de campos entrecomillados. */
export function parsearCsv(texto) {
  const filas = []; let fila = [], campo = '', q = false;
  const s = texto.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
    else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; fila.push(campo); campo = ''; if (fila.length > 1 || fila[0] !== '') filas.push(fila); fila = []; }
    else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

/** Periodo SDMX → AAAA-MM-DD (primer día del periodo). Devuelve null si el formato no se reconoce. */
export function periodoAFecha(p) {
  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p))) return p;
  if ((m = /^(\d{4})-(\d{2})$/.exec(p))) return `${m[1]}-${m[2]}-01`;
  if ((m = /^(\d{4})-Q([1-4])$/.exec(p))) return `${m[1]}-${String((+m[2] - 1) * 3 + 1).padStart(2, '0')}-01`;
  if ((m = /^(\d{4})$/.exec(p))) return `${m[1]}-01-01`;
  return null;
}

const PROVEEDORES = {
  bis: {nombre: 'BIS', url: (flujo, clave, version) => `https://stats.bis.org/api/v2/data/dataflow/BIS/${flujo}/${version}/${clave}?format=csv`, portal: (flujo) => `https://data.bis.org/topics/${flujo}`, reintentos: 4},
  bce: {nombre: 'ECB', url: (flujo, clave) => `https://data-api.ecb.europa.eu/service/data/${flujo}/${clave}?format=csvdata`, portal: (flujo, clave) => `https://data.ecb.europa.eu/data/datasets/${flujo}/${flujo}.${clave}`, reintentos: 6},   // el portal del BCE devuelve 504 HTML de forma intermitente
};

/** Descarga UNA serie SDMX en CSV (clave completa) y la devuelve en el formato común de los adaptadores. */
export async function descargarSdmx(prov, {flujo, clave, version = '1.0'}, pedir) {
  const P = PROVEEDORES[prov], id = `${flujo}/${clave}`, urlDatos = P.url(flujo, clave, version);
  const filasCsv = parsearCsv(await pedir(urlDatos, {reintentos: P.reintentos}));
  const cab = filasCsv[0] ?? [], iT = cab.indexOf('TIME_PERIOD'), iV = cab.indexOf('OBS_VALUE'), iS = cab.indexOf('OBS_STATUS');
  if (iT < 0 || iV < 0) throw new Error(tx('cat.e_sdmx_resp', {p: P.nombre, id, x: filasCsv.slice(0, 2).map((f) => f.join(',')).join(' ').slice(0, 160)}));
  const iTit = cab.indexOf('TITLE'), iTitC = cab.indexOf('TITLE_COMPL');
  const llaves = new Set(), filas = [], marcas = new Set();
  let titulo = '';
  for (const r of filasCsv.slice(1)) {
    if (r.length < cab.length - 2) continue;
    llaves.add(r.slice(0, Math.min(iT, iV)).join('|'));
    titulo ||= String((iTitC >= 0 ? r[iTitC] : '') || (iTit >= 0 ? r[iTit] : '') || '').trim();
    if (r[iV] === '' || r[iV] == null) continue;   // sin valor: se omite, nunca se rellena
    const f = periodoAFecha(r[iT]);
    if (!f) throw new Error(tx('cat.e_sdmx_periodo', {p: P.nombre, v: r[iT], id}));
    filas.push([f, r[iV]]);
    if (iS >= 0 && r[iS]) marcas.add(r[iS]);
  }
  if (llaves.size > 1) throw new Error(tx('cat.e_sdmx_multi', {p: P.nombre, id, n: llaves.size}));
  if (!filas.length) throw new Error(tx('cat.e_sdmx_vacio', {p: P.nombre, id}));
  filas.sort((a, b) => a[0].localeCompare(b[0]));
  for (let i = 1; i < filas.length; i++) if (filas[i][0] <= filas[i - 1][0]) throw new Error(tx('cat.e_sdmx_orden', {p: P.nombre, id, i: i + 1, v: filas[i][0]}));
  const flags = [...marcas].filter((x) => x !== 'A').sort();   // 'A' = normal: solo se anotan las marcas que avisan de algo (estimado, provisional, ruptura…)
  return {columnas: ['fecha', `${P.nombre}_${flujo}_${clave.replace(/[^A-Za-z0-9]+/g, '_')}`], filas, url: P.portal(flujo, clave), urlDatos,
    notaFuente: `${titulo || id} (${id}) · ${tx('cat.n_sdmx_actualizada')}${flags.length ? tx('cat.n_sdmx_marcas', {f: flags.join(',')}) : ''}`};
}

/** Registra los adaptadores `bis` y `bce` en el mapa común de catalogo.mjs (mismo patrón que fuentes_extra.mjs). */
export function instalar(ADAPTADORES, pedir) {
  ADAPTADORES.bis = (args) => descargarSdmx('bis', args, pedir);
  ADAPTADORES.bce = (args) => descargarSdmx('bce', args, pedir);
}

// ── Catálogo ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export const FECHA_ABIERTA = '2026-11-09';
const URL_BIS_LEGAL = 'https://data.bis.org/help/legal';
const URL_BCE_LEGAL = 'https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html';

const PAISES_BIS = [   // código BIS → [nombre es, nombre en, etiqueta es, etiqueta en]
  ['US', 'EE. UU.', 'United States'], ['XM', 'Zona euro', 'Euro area'], ['JP', 'Japón', 'Japan'], ['GB', 'Reino Unido', 'United Kingdom'], ['CO', 'Colombia', 'Colombia'],
  ['MX', 'México', 'Mexico'], ['BR', 'Brasil', 'Brazil'], ['CL', 'Chile', 'Chile'], ['CN', 'China', 'China'],
];
// Brasil: la tasa anualizada de 1986-1994 refleja la hiperinflación (hasta 355.085 % en feb-1990); el rango del esquema lo admite y la nota lo advierte.
const HIPER_BR = {es: ' Brasil: entre 1986 y 1994 la tasa anualizada llega a miles de por ciento (hiperinflación; máx. 355.085 % en feb-1990), así que en una gráfica con la historia completa solo se verá esa época; para comparar con hoy, acota el inicio y dilo en pantalla (p. ej. desde el Plan Real, jul-1994).',
  en: ' Brazil: between 1986 and 1994 the annualized rate reaches thousands of percent (hyperinflation; peak 355,085% in Feb 1990), so a chart of the full history will only show that era; to compare with today, set a later start and say so on screen (e.g. from the Real Plan, Jul 1994).'};
const BIS = {
  cita: {es: 'Fuente: BIS (Banco de Pagos Internacionales)', en: 'Source: BIS (Bank for International Settlements)'},
  pie: 'BIS',   // texto que el sello de fuente debe llevar para cumplir la cita
  licencia: {es: 'Uso sin restricción citando al BIS como fuente (https://data.bis.org/help/legal): sin sugerir su aval, sin cobro adicional por las estadísticas en un producto comercial y sin presentarlas como consejo de inversión; una traducción no es oficial del BIS',
    en: 'Unrestricted use citing the BIS as the source (https://data.bis.org/help/legal): no implied BIS endorsement, no additional charge for the statistics in a commercial product, and not presented as investment advice; a translation is not an official BIS translation'},
};
const BCE = {
  cita: {es: 'Source: ECB statistics', en: 'Source: ECB statistics'},   // redacción literal de la política del BCE
  pie: 'ECB statistics',
  licencia: {es: 'Reuso libre y gratuito citando la fuente («Source: ECB statistics») y SIN modificar las estadísticas ni sus metadatos; no cubre datos de terceros (política de reuso del BCE/SEBC)',
    en: 'Free reuse at no charge citing the source ("Source: ECB statistics") and WITHOUT modifying the statistics or their metadata; does not cover third-party data (ECB/ESCB reuse policy)'},
};

/**
 * Entradas del catálogo de los adaptadores BIS y BCE. idioma 'es' (por defecto) → entradas completas para series.json.
 * idioma 'en' → solo el texto visible traducido (overlay para series.en.json; nunca id/adaptador/args/unidad).
 */
export function entradasAbiertas(idioma = 'es') {
  const en = idioma === 'en', L = (o) => (en ? o.en : o.es), out = [];
  const meta = (prov, extra) => {
    const P = prov === 'bis' ? BIS : BCE, licUrl = prov === 'bis' ? URL_BIS_LEGAL : URL_BCE_LEGAL;
    return {cita: L(P.cita), cita_pie: P.pie, licencia: L(P.licencia), requiere_aviso: L(P.cita), licencia_estado: 'atribucion', licencia_verificada: FECHA_ABIERTA, licencia_url: licUrl, ...extra};
  };
  const entrada = (id, a, e) => {   // a: campos comunes (es+en), e: campos no traducibles solo del español
    const base = {nombre: L(a.nombre), categoria: L(a.categoria), etiquetas: a.etiquetas[en ? 1 : 0], frecuencia: L(a.frecuencia),
      fuente_original: L(a.fuente_original), fuente_corto: L(a.fuente_corto), nota: L(a.nota), ...a.meta};
    if (en) { const {licencia_estado, licencia_verificada, licencia_url, cita_pie, ...vis} = base; out.push({id, ...vis, unidad_vis: a.unidad.en}); }   // overlay: solo texto visible (cita y aviso incluidos)
    else out.push({id, ...base, adaptador: e.adaptador, args: e.args, unidad: a.unidad.es, esquema: e.esquema, abierta: FECHA_ABIERTA});
  };
  // BIS · tasas de política de bancos centrales (mensual, fin de periodo)
  for (const [c, pe, pi] of PAISES_BIS) entrada(`bis_cbpol_${c.toLowerCase()}`, {
    nombre: {es: `Tasa de política monetaria — ${pe} (BIS)`, en: `Central bank policy rate — ${pi} (BIS)`}, categoria: {es: 'Banca central', en: 'Central banking'},
    etiquetas: [['bis', 'tasa de política', 'banco central', 'tasas', c.toLowerCase(), pe.toLowerCase()], ['bis', 'policy rate', 'central bank', 'interest rates', c.toLowerCase(), pi.toLowerCase()]],
    unidad: {es: '% anual', en: '% per year'}, frecuencia: {es: 'Mensual (fin de mes)', en: 'Monthly (end of month)'},
    fuente_original: {es: 'BIS — Central bank policy rates (WS_CBPOL)', en: 'BIS — Central bank policy rates (WS_CBPOL)'}, fuente_corto: {es: `BIS · tasas de política · ${pe}`, en: `BIS · policy rates · ${pi}`},
    nota: {es: 'Tasa de política del banco central de la zona o país, al cierre de cada mes, tal como la publica el BIS. Las definiciones y los cambios de instrumento por país están en los metadatos del BIS (COMPILATION).' + (c === 'BR' ? HIPER_BR.es : ''),
      en: 'Central bank policy rate for the area or country, at the end of each month, as published by the BIS. Definitions and instrument changes by country are in the BIS metadata (COMPILATION).' + (c === 'BR' ? HIPER_BR.en : '')},
    meta: meta('bis'),
  }, {adaptador: 'bis', args: {flujo: 'WS_CBPOL', clave: `M.${c}`}, esquema: {unidad: '% anual', frecuencia: 'M', min: -2, max: c === 'BR' ? 400000 : 100, ...(c === 'BR' ? {} : {saltoMax: 30})}});
  // BIS · crédito al sector privado no financiero / PIB (trimestral)
  for (const [c, pe, pi] of PAISES_BIS) entrada(`bis_credito_pib_${c.toLowerCase()}`, {
    nombre: {es: `Crédito al sector privado no financiero / PIB — ${pe} (BIS)`, en: `Credit to the private non-financial sector / GDP — ${pi} (BIS)`}, categoria: {es: 'Deuda', en: 'Debt'},
    etiquetas: [['bis', 'credito', 'sector privado', 'deuda', 'pib', c.toLowerCase(), pe.toLowerCase()], ['bis', 'credit', 'private sector', 'debt', 'gdp', c.toLowerCase(), pi.toLowerCase()]],
    unidad: {es: '% del PIB', en: '% of GDP'}, frecuencia: {es: 'Trimestral', en: 'Quarterly'},
    fuente_original: {es: 'BIS — Credit-to-GDP gaps (WS_CREDIT_GAP), cifra observada', en: 'BIS — Credit-to-GDP gaps (WS_CREDIT_GAP), observed ratio'}, fuente_corto: {es: `BIS · crédito/PIB · ${pe}`, en: `BIS · credit/GDP · ${pi}`},
    nota: {es: 'Crédito total de todos los prestamistas al sector privado no financiero, como % del PIB (cifra observada, no la tendencia ni la brecha). Series trimestrales; el primer dato depende del país.',
      en: 'Total credit from all lenders to the private non-financial sector, as % of GDP (observed ratio, not the trend or the gap). Quarterly series; the first data point depends on the country.'},
    meta: meta('bis'),
  }, {adaptador: 'bis', args: {flujo: 'WS_CREDIT_GAP', clave: `Q.${c}.P.A.A`}, esquema: {unidad: '% del PIB', frecuencia: 'Q', min: 0, max: 400, saltoMax: 40}});
  // BCE · tipos de cambio de referencia del euro
  const FX = [['USD', 'dólar estadounidense', 'US dollar', 'D', 0.5, 2.0], ['USD', 'dólar estadounidense', 'US dollar', 'M', 0.5, 2.0], ['JPY', 'yen japonés', 'Japanese yen', 'D', 50, 250],
    ['GBP', 'libra esterlina', 'pound sterling', 'D', 0.4, 1.2], ['CHF', 'franco suizo', 'Swiss franc', 'D', 0.8, 2.0]];
  for (const [mon, ne, ni, fr, mn, mx] of FX) {
    const diaria = fr === 'D';
    entrada(`bce_eur_${mon.toLowerCase()}_${fr.toLowerCase()}`, {
      nombre: {es: `Tipo de cambio de referencia del euro: ${mon} por EUR (${diaria ? 'diario' : 'promedio mensual'}, BCE)`, en: `ECB euro reference exchange rate: ${mon} per EUR (${diaria ? 'daily' : 'monthly average'})`},
      categoria: {es: 'Divisas', en: 'Currencies'}, etiquetas: [['bce', 'ecb', 'euro', 'tipo de cambio', mon.toLowerCase(), ne], ['ecb', 'euro', 'exchange rate', 'fx', mon.toLowerCase(), ni]],
      unidad: {es: `${mon} por 1 EUR`, en: `${mon} per 1 EUR`}, frecuencia: diaria ? {es: 'Diaria (días hábiles)', en: 'Daily (business days)'} : {es: 'Mensual', en: 'Monthly'},
      fuente_original: {es: 'Banco Central Europeo — Euro foreign exchange reference rates (EXR)', en: 'European Central Bank — Euro foreign exchange reference rates (EXR)'},
      fuente_corto: {es: `ECB statistics · EXR · ${mon}/EUR ${diaria ? 'diario' : 'mensual'}`, en: `ECB statistics · EXR · ${mon}/EUR ${diaria ? 'daily' : 'monthly'}`},
      nota: {es: diaria ? `Tipo de cambio de referencia del BCE (publicado hacia las 14:15 CET) de ${ne} por 1 euro. Solo días hábiles; los fines de semana no se rellenan.` : `Promedio mensual del tipo de cambio de referencia del BCE de ${ne} por 1 euro.`,
        en: diaria ? `ECB reference rate (published around 2.15 pm CET) of the ${ni} per 1 euro. Business days only; weekends are not filled in.` : `Monthly average of the ECB reference rate of the ${ni} per 1 euro.`},
      meta: meta('bce'),
    }, {adaptador: 'bce', args: {flujo: 'EXR', clave: `${fr}.${mon}.EUR.SP00.A`}, esquema: {unidad: `${mon} por 1 EUR`, frecuencia: diaria ? 'D' : 'M', min: mn, max: mx, saltoMax: mon === 'JPY' ? 20 : mon === 'CHF' ? 0.4 : 0.3}});
  }
  // BCE · curva de rendimientos de la zona euro (bonos soberanos AAA, tipo spot)
  for (const [venc, ne, ni] of [['10Y', '10 años', '10-year'], ['2Y', '2 años', '2-year']]) entrada(`bce_curva_aaa_${venc.toLowerCase()}`, {
    nombre: {es: `Rendimiento de bonos soberanos AAA de la zona euro a ${ne} (curva spot, BCE)`, en: `Euro area AAA government bond yield, ${ni} spot rate (ECB yield curve)`},
    categoria: {es: 'Tasas', en: 'Interest rates'}, etiquetas: [['bce', 'ecb', 'bonos', 'rendimiento', 'curva de tipos', 'zona euro', ne], ['ecb', 'bonds', 'yield', 'yield curve', 'euro area', ni]],
    unidad: {es: '% anual', en: '% per year'}, frecuencia: {es: 'Diaria (días hábiles)', en: 'Daily (business days)'},
    fuente_original: {es: 'Banco Central Europeo — Euro area yield curves (YC)', en: 'European Central Bank — Euro area yield curves (YC)'}, fuente_corto: {es: `ECB statistics · YC · AAA ${ne}`, en: `ECB statistics · YC · AAA ${ni}`},
    nota: {es: 'Curva estimada por el BCE con el modelo de Svensson para bonos soberanos de la zona euro con calificación AAA (composición cambiante). Es un tipo estimado, no una cotización de mercado.',
      en: 'Curve estimated by the ECB with the Svensson model for euro area AAA-rated government bonds (changing composition). It is an estimated rate, not a market quote.'},
    meta: meta('bce'),
  }, {adaptador: 'bce', args: {flujo: 'YC', clave: `B.U2.EUR.4F.G_N_A.SV_C_YM.SR_${venc}`}, esquema: {unidad: '% anual', frecuencia: 'D', min: -2, max: 12, saltoMax: 1.5}});
  return out;
}
