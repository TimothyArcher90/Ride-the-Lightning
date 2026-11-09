// Detalle fino de un reporte (10-Q/10-K) a partir de su archivo XBRL completo en www.sec.gov:
//  · líneas de gasto operativo (incluidas las PROPIAS de la empresa, p. ej. Fulfillment de Amazon), según su archivo de cálculo (_cal.xml);
//  · ingresos por producto o segmento (dimensiones del XBRL).
// www.sec.gov exige identificarse con un contacto real: David Arango autorizó usar su correo para esto (2026-11-03). Se puede cambiar con RTL_SEC_CONTACTO.
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './compilar.mjs';
import {t as tx, registrar} from '../motor/idioma.js';

// Mensajes de la SEC y del detalle XBRL (los usa también trimestres.mjs): siguen el idioma activo (es por defecto).
registrar('sec', {
  e_resp: {es: 'SEC respondió {s}', en: 'SEC responded {s}'},
  e_resp_url: {es: 'SEC respondió {s} en {u}', en: 'SEC responded {s} for {u}'},
  e_sin_instancia: {es: 'El reporte {a} no trae archivo XBRL de instancia.', en: 'Filing {a} has no XBRL instance file.'},
  a_lineas: {es: 'Las líneas de gasto de {p} suman {a} M y los gastos operativos son {b} M: se usa el desglose resumido.', en: 'The expense lines of {p} add up to {a} M and operating expenses are {b} M: the summarized breakdown is used.'},
});

const CONTACTO = process.env.RTL_SEC_CONTACTO ?? 'david@macrowise.co';
const UA = `RideTheLightning/1.0 (herramienta local de graficas; contacto: ${CONTACTO})`;
const CACHE = path.join(RAIZ, 'datos', 'trimestres', '_sec');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
let ultimaPeticion = 0;
export async function www(url, {json = false, reintentos = 3} = {}) {
  let ultimo;
  for (let k = 0; k < reintentos; k++) {
    const espera = 180 - (Date.now() - ultimaPeticion); if (espera > 0) await dormir(espera);   // la SEC pide menos de 10 peticiones por segundo
    ultimaPeticion = Date.now();
    try {
      const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate'}, signal: AbortSignal.timeout(120000)});
      if (r.status === 429 || r.status >= 500) { ultimo = new Error(tx('sec.e_resp', {s: r.status})); await dormir(3000 * (k + 1)); continue; }
      if (!r.ok) throw new Error(tx('sec.e_resp_url', {s: r.status, u: url}));
      return json ? await r.json() : await r.text();
    } catch (e) { ultimo = e; await dormir(1500 * (k + 1)); }
  }
  throw ultimo;
}

// Traducciones de las etiquetas más comunes (el resto queda con el nombre oficial en inglés: nunca se inventa una traducción).
const ES = {
  'online stores': 'Tiendas online', 'physical stores': 'Tiendas físicas', 'third-party seller services': 'Servicios a vendedores', 'advertising services': 'Publicidad', 'subscription services': 'Suscripciones',
  'amazon web services': 'AWS (nube)', 'aws': 'AWS (nube)', 'other': 'Otros', 'other services': 'Otros servicios', 'fulfillment': 'Logística', 'technology and infrastructure': 'Tecnología e infraestructura',
  'technology and content': 'Tecnología y contenido', 'marketing': 'Marketing', 'sales and marketing': 'Marketing y ventas', 'selling and marketing': 'Marketing y ventas', 'general and administrative': 'Administración',
  'research and development': 'Investigación y desarrollo', 'selling, general and administrative': 'Ventas, generales y administración', 'other operating expense (income), net': 'Otros gastos operativos', 'other operating income (expense), net': 'Otros gastos operativos', 'other operating expense, net': 'Otros gastos operativos',
  'iphone': 'iPhone', 'mac': 'Mac', 'ipad': 'iPad', 'wearables, home and accessories': 'Wearables y accesorios', 'services': 'Servicios', 'products': 'Productos', 'product': 'Productos', 'service': 'Servicios',
  'google search & other': 'Búsqueda de Google', 'youtube ads': 'Anuncios en YouTube', 'google network': 'Red de Google', 'google subscriptions, platforms, and devices': 'Suscripciones y dispositivos', 'google cloud': 'Google Cloud', 'other bets': 'Otras apuestas',
  'productivity and business processes': 'Productividad y procesos', 'intelligent cloud': 'Nube inteligente', 'more personal computing': 'Computación personal', 'family of apps': 'Familia de apps', 'reality labs': 'Reality Labs',
  'data center': 'Centros de datos', 'gaming': 'Videojuegos', 'professional visualization': 'Visualización profesional', 'automotive': 'Automotriz', 'oem and other': 'OEM y otros', 'compute & networking': 'Cómputo y redes', 'graphics': 'Gráficos',
  'automotive sales': 'Venta de autos', 'energy generation and storage': 'Energía', 'services and other': 'Servicios y otros', 'automotive regulatory credits': 'Créditos regulatorios', 'subscription': 'Suscripciones', 'advertising': 'Publicidad',
};
const norm = (s) => String(s).toLowerCase().replace(/[-,]/g, ' ').replace(/\s+/g, ' ').trim();
const ESN = Object.fromEntries(Object.entries(ES).map(([k, v]) => [norm(k), v]));
const traducir = (en) => { const k = String(en).replace(/\s*\[Member\]\s*$/i, '').replace(/\s*\[Line Items\]\s*$/i, '').trim(); return ESN[norm(k)] ?? k; };
const partir = (nombre) => String(nombre).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/Member$/, '').replace(/Expense$/, '').trim();

const atributos = (tag) => Object.fromEntries([...tag.matchAll(/([\w:.-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/** Lee y guarda en caché (pequeño) lo necesario de un reporte: hechos USD con ≤1 dimensión, árbol de cálculo y etiquetas. */
export async function detalleFiling(cik, accn) {
  const f = path.join(CACHE, `${accn}.detalle.json`);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accn.replace(/-/g, '')}`, idx = await www(`${base}/index.json`, {json: true}), nombres = idx.directory.item.map((i) => i.name);
  const inst = nombres.find((n) => /-\d{8}(_htm)?\.xml$/.test(n)), cal = nombres.find((n) => /_cal\.xml$/.test(n)), lab = nombres.find((n) => /_lab\.xml$/.test(n));
  if (!inst) throw new Error(tx('sec.e_sin_instancia', {a: accn}));
  const x = await www(`${base}/${inst}`);
  const ctx = {};
  for (const m of x.matchAll(/<context id="([^"]+)">([\s\S]*?)<\/context>/g)) {
    const b = m[2], s = (b.match(/<startDate>([^<]+)/) ?? [])[1], e = (b.match(/<endDate>([^<]+)/) ?? [])[1], dims = [...b.matchAll(/dimension="([^"]+)">([^<]+)</g)].map((d) => ({eje: d[1], miembro: d[2]}));
    if (s && e && dims.length <= 1) ctx[m[1]] = {s, e, d: dims[0] ?? null};
  }
  const hechos = [];
  for (const m of x.matchAll(/<([\w-]+):(\w+)\s([^>]*?contextRef="[^"]+"[^>]*)>([^<]+)</g)) {
    const a = atributos(m[3]); if (!/^usd$/i.test(a.unitRef ?? '')) continue;
    const c = ctx[a.contextRef]; if (!c) continue;
    const dias = (Date.parse(c.e) - Date.parse(c.s)) / 86400000; if (dias < 80) continue;
    const v = Number(m[4]); if (!Number.isFinite(v)) continue;
    hechos.push([`${m[1]}:${m[2]}`, v * (a.scale ? 1 : 1), c.s, c.e, c.d ? c.d.eje : '', c.d ? c.d.miembro : '']);
  }
  // árbol de cálculo: padre → [{hijo, peso}]
  const arbol = {};
  if (cal) {
    const xc = await www(`${base}/${cal}`);
    for (const enlace of xc.matchAll(/<(?:link:)?calculationLink[\s\S]*?<\/(?:link:)?calculationLink>/g)) {
      const locs = {}; for (const l of enlace[0].matchAll(/<(?:link:)?loc\s[^>]*>/g)) { const a = atributos(l[0]); locs[a['xlink:label']] = (a['xlink:href'] ?? '').split('#')[1]?.replace('_', ':'); }
      for (const ar of enlace[0].matchAll(/<(?:link:)?calculationArc\s[^>]*>/g)) { const a = atributos(ar[0]), p = locs[a['xlink:from']], h = locs[a['xlink:to']]; if (p && h) (arbol[p] ??= []).push({h, w: Number(a.weight ?? 1)}); }
    }
  }
  const etiquetas = {};
  if (lab) {
    const xl = await www(`${base}/${lab}`);
    const terse = new Set();   // la etiqueta corta («Fulfillment») gana a la larga («Fulfillment Expense»)
    for (const m of xl.matchAll(/<(?:link:)?label\s([^>]*)>([^<]*)<\/(?:link:)?label>/g)) {
      const a = atributos(m[1]), rol = a['xlink:role'] ?? ''; if (!a['xlink:label'] || !/\/(terseLabel|label)$/.test(rol)) continue;
      const id = a['xlink:label'].replace(/^lab_/, '').replace('_', ':'), esTerse = /terseLabel$/.test(rol);
      if (esTerse) { etiquetas[id] = m[2]; terse.add(id); } else if (!terse.has(id)) etiquetas[id] = m[2];
    }
  }
  // la caché guarda solo lo necesario (ingresos, su desglose, el gasto operativo y sus líneas): cientos de empresas no pueden pesar gigas
  const util = new Set(['us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax', 'us-gaap:Revenues', 'us-gaap:SalesRevenueNet', 'us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax', 'us-gaap:OperatingExpenses', 'us-gaap:CostsAndExpenses', ...(arbol['us-gaap:OperatingExpenses'] ?? []).map((c) => c.h), ...(arbol['us-gaap:CostsAndExpenses'] ?? []).map((c) => c.h)]);
  const out = {accn, cik, hechos: hechos.filter((h) => util.has(h[0])), arbol: Object.fromEntries(Object.entries(arbol).filter(([k]) => k === 'us-gaap:OperatingExpenses' || k === 'us-gaap:CostsAndExpenses')), etiquetas: Object.fromEntries(Object.entries(etiquetas).filter(([k]) => util.has(k) || /Member$/.test(k)))};
  fs.mkdirSync(CACHE, {recursive: true}); fs.writeFileSync(f, JSON.stringify(out));
  return out;
}

const decodificar = (s) => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const limpiarEtiqueta = (s) => decodificar(decodificar(s)).replace(/\s*\(["“].*$/, '').trim();   // dos pasadas: algunos filings llegan con doble escape (&amp;amp;)
const nombreDe = (det, id) => { const n = traducir(limpiarEtiqueta(det.etiquetas[id] ?? partir(id.split(':')[1]))); return n.length > 38 ? n.slice(0, 36).trimEnd() + '…' : n; };
/** Valor de un hecho en un periodo exacto; si no existe y es el trimestre final de un año: año − acumulado de 9 meses. */
function valor(pools, id, eje, miembro, ini, fin, anual = null) {
  const buscar = (s, e) => { for (const p of pools) for (const h of p.hechos) if (h[0] === id && h[3] === e && h[2] === s && h[4] === eje && h[5] === miembro) return h[1]; return null; };
  const v = buscar(ini, fin); if (v != null) return v;
  if (anual) { const a = buscar(anual.inicioAnio, fin), n = buscar(anual.inicioAnio, anual.finQ3); if (a != null && n != null) return a - n; }
  return null;
}
const fechaMas = (iso, d) => new Date(Date.parse(iso) + d * 86400000).toISOString().slice(0, 10);

/**
 * Detalle de un trimestre: {lineas:[{nombre, valor}], ingresosPorLinea:[{nombre, valor}], eje}. Verifica que cada desglose SUME lo que reporta la empresa;
 * si no suma (±0,5 %), ese desglose se descarta. `pools` = detalles de los reportes donde vive el trimestre (el 10-K y el 10-Q del Q3 para un Q4).
 */
export function detalleTrimestre(pools, {fin, ingresos, opexTotal, costoConceptos = [], anual = null}) {
  // periodo del trimestre: el contexto de ~3 meses que termina en `fin` (o el anual para un Q4 derivado)
  const base = pools.flatMap((p) => p.hechos).filter((h) => h[3] === fin && !h[4]);
  const dur = (h) => (Date.parse(h[3]) - Date.parse(h[2])) / 86400000;
  const ini = anual ? null : (base.find((h) => dur(h) >= 80 && dur(h) <= 100) ?? [])[2];
  const A = anual ? {inicioAnio: anual.inicioAnio, finQ3: anual.finQ3} : null;
  const v = (id, eje = '', mi = '') => (anual ? valor(pools, id, eje, mi, null, fin, A) : ini ? valor(pools, id, eje, mi, ini, fin) : null);
  const arbol = Object.assign({}, ...pools.map((p) => p.arbol)), det = {etiquetas: Object.assign({}, ...pools.map((p) => p.etiquetas))};
  const out = {lineas: null, ingresosPorLinea: null, avisos: []};
  // 1) líneas de gasto: hijos de CostsAndExpenses / OperatingExpenses en el cálculo oficial de la empresa (sin el costo de ventas)
  for (const padre of ['us-gaap:OperatingExpenses', 'us-gaap:CostsAndExpenses']) {
    const hijos = (arbol[padre] ?? []).filter((c) => !costoConceptos.includes(c.h.split(':')[1]) && !/CostOfRevenue|CostOfGoods|CostOfServices/.test(c.h));
    if (!hijos.length) continue;
    const L = hijos.map((c) => ({id: c.h, valor: (v(c.h) ?? NaN) * c.w})).filter((l) => Number.isFinite(l.valor) && Math.abs(l.valor) > 0);
    const suma = L.reduce((s, l) => s + l.valor, 0);
    if (L.length && Math.abs(suma - opexTotal) / opexTotal <= 0.005 && L.every((l) => l.valor > 0)) { out.lineas = L.map((l) => ({nombre: nombreDe(det, l.id), valor: l.valor, concepto: l.id})); break; }
    if (L.length) out.avisos.push(tx('sec.a_lineas', {p: padre, a: (suma / 1e6).toFixed(0), b: (opexTotal / 1e6).toFixed(0)}));
  }
  // 2) ingresos por producto/segmento: el eje cuyos miembros (los más finos) suman el total reportado
  const revIds = ['us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax', 'us-gaap:Revenues', 'us-gaap:SalesRevenueNet', 'us-gaap:RevenueFromContractWithCustomerIncludingAssessedTax'];
  for (const rid of revIds) {
    const ejes = new Map();
    for (const p of pools) for (const h of p.hechos) if (h[0] === rid && h[4] && h[3] === fin) { const m = ejes.get(h[4]) ?? new Set(); m.add(h[5]); ejes.set(h[4], m); }
    let mejor = null;
    for (const [eje, miembros] of ejes) {
      const M = [...miembros].map((mi) => ({mi, valor: v(rid, eje, mi)})).filter((m) => m.valor != null && m.valor > 0);
      const prueba = (lista) => lista.length >= 2 && lista.length <= 12 && Math.abs(lista.reduce((s, m) => s + m.valor, 0) - ingresos) / ingresos <= 0.005 ? lista : null;
      const propios = M.filter((m) => !m.mi.startsWith('us-gaap:') && !m.mi.startsWith('srt:'));
      const sel = prueba(propios) ?? prueba(M) ?? null;
      // preferencia: producto o servicio, luego segmentos de negocio, luego otros ejes; la geografía solo si no hay nada más. A igual prioridad, el desglose más fino
      const prio = /ProductOrServiceAxis/.test(eje) ? 0 : /StatementBusinessSegmentsAxis/.test(eje) ? 1 : /Geograph|Country|Region|Domestic|Foreign/i.test(eje) ? 5 : 3;
      if (sel && (!mejor || prio < mejor.prio || (prio === mejor.prio && sel.length > mejor.lista.length))) mejor = {eje, lista: sel, prio};
    }
    if (mejor) { out.ingresosPorLinea = mejor.lista.map((m) => ({nombre: nombreDe(det, m.mi), valor: m.valor, miembro: m.mi})).sort((a, b) => b.valor - a.valor); out.eje = mejor.eje; break; }
  }
  return out;
}
export {fechaMas};
