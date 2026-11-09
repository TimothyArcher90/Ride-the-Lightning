// Biblioteca de TRIMESTRES: el estado de resultados de cada empresa, trimestre a trimestre, listo para animarse como Sankey.
// Fuente: SEC EDGAR · XBRL «company facts» (datos oficiales de los reportes 10-Q/10-K; dominio público). Sin llaves ni descargas manuales.
// Reglas de exactitud:
//  · Cada cifra es un dato reportado (se guarda con su concepto XBRL) o una resta/suma EXACTA de datos reportados (se marca «derivado»).
//  · Q4 no se reporta aparte: se calcula como año completo − (Q1+Q2+Q3) (o − acumulado de 9 meses). Se marca.
//  · El diagrama cuadra por construcción: ingresos = costo de ventas + utilidad bruta; utilidad bruta = gastos operativos + utilidad operativa; etc.
//  · Lo que la fuente no desglosa (p. ej. líneas propias de una empresa) queda como «sin desglosar» y se avisa; no se inventa.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RAIZ} from './compilar.mjs';
import {detalleFiling, detalleTrimestre, www} from './xbrl.mjs';
import {leerUniverso, buscarUniverso, actualizarUniverso} from './universo.mjs';
import {t as tx, registrar} from '../motor/idioma.js';

// Notas, motivos y errores de la biblioteca de trimestres: siguen el idioma activo (es por defecto). Las etiquetas de los nodos
// («Ingresos», «Utilidad neta»…) quedan en español en los datos y se traducen al leer (glosario de motor/idioma.js).
registrar('tri', {
  o_basicos: {es: 'faltan datos básicos (ingresos, utilidad operativa, impuestos o utilidad neta)', en: 'basic data is missing (revenue, operating income, taxes or net income)'},
  o_ingresos: {es: 'ingresos no positivos', en: 'non-positive revenue'},
  o_bruta: {es: 'la utilidad operativa supera a la bruta (la fuente no cuadra con su propia estructura)', en: 'operating income exceeds gross profit (the source does not match its own structure)'},
  n_opex: {es: 'Los gastos operativos reportados ({a} M) difieren de ingresos − costo de ventas − utilidad operativa ({b} M); se usa la resta, que es la que cuadra el diagrama.', en: 'Reported operating expenses ({a} M) differ from revenue − cost of sales − operating income ({b} M); the subtraction is used because it makes the diagram balance.'},
  n_sin_detalle: {es: 'Detalle fino no disponible: {e}', en: 'Detailed breakdown unavailable: {e}'},
  n_lineas_mas: {es: 'Las líneas de gasto reportadas suman más que los gastos operativos del diagrama; se muestran sin desglosar.', en: 'The reported expense lines add up to more than the diagram\'s operating expenses; they are shown without a breakdown.'},
  n_sin_desglosar: {es: 'La fuente oficial resumida (XBRL «company facts») no desglosa {p} % de los gastos operativos (son líneas propias de la empresa). Se muestran juntos; el detalle fino se trae para los últimos trimestres.', en: 'The official summarized source (XBRL "company facts") does not break down {p}% of operating expenses (they are company-specific lines). They are shown together; the detailed breakdown is fetched for the latest quarters.'},
  n_ingresos_por: {es: 'Los ingresos se desglosan por «{e}» (suman los ingresos reportados con una diferencia menor a 0,5 %).', en: 'Revenue is broken down by "{e}" (it adds up to the reported revenue with a difference under 0.5%).'},
  n_sin_detalle_ahora: {es: 'Detalle fino no disponible ahora ({e}); se usa el resumen oficial.', en: 'Detailed breakdown not available right now ({e}); the official summary is used.'},
  m_perdida_op: {es: 'pérdida operativa (el flujo solo representa trimestres con utilidad; usa la cascada)', en: 'operating loss (the flow only represents profitable quarters; use the waterfall)'},
  m_perdida_neta: {es: 'pérdida neta (el flujo solo representa trimestres con utilidad; usa la cascada)', en: 'net loss (the flow only represents profitable quarters; use the waterfall)'},
  e_indice: {es: 'índice diario {f}: {m}', en: 'daily index {f}: {m}'},
  e_pendiente: {es: '{k}: la SEC ya publicó el {form} del {fin}, pero los datos estructurados aún no incluyen el trimestre; se reintenta en el próximo ciclo.', en: '{k}: the SEC has already published the {form} for {fin}, but the structured data does not include the quarter yet; it will be retried next cycle.'},
  e_no_trimestre: {es: 'No hay trimestre {fin} de {k} en la biblioteca.', en: 'There is no quarter {fin} for {k} in the library.'},
  e_sin_flujo_def: {es: 'no hay diagrama de flujo', en: 'there is no flow diagram'},
  e_no_bolsa: {es: 'No encuentro «{k}» en la bolsa de EE. UU.', en: 'Cannot find "{k}" on the US stock exchange list.'},
});

export const DIR = path.join(RAIZ, 'datos', 'trimestres');
const UA = process.env.RTL_SEC_UA ?? 'RideTheLightning/1.0 (herramienta local de graficas)';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const DIA = 86400000, dias = (a, b) => (Date.parse(b) - Date.parse(a)) / DIA;
// 16 destacadas (historia completa desde 2009) + toda la bolsa de EE. UU. (lista oficial de la SEC; se baja al elegirla o de noche)
const destacadas = () => JSON.parse(fs.readFileSync(path.join(RAIZ, 'catalogo', 'empresas.json'), 'utf8')).map((e) => ({...e, destacada: true}));
export const empresas = () => { const d = destacadas(), t = new Set(d.map((e) => e.ticker)); return [...d, ...leerUniverso().filter((e) => !t.has(e.ticker))]; };
export const esDestacada = (ticker) => destacadas().some((e) => e.ticker === ticker);
const haceAnios = (n) => new Date(Date.now() - n * 365.25 * DIA).toISOString().slice(0, 10);
const cik10 = (c) => String(c).padStart(10, '0');

async function sec(url, reintentos = 3) {
  let ultimo;
  for (let k = 0; k < reintentos; k++) {
    try {
      const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate'}, signal: AbortSignal.timeout(120000)});
      if (r.status === 429 || r.status >= 500) { ultimo = new Error(tx('sec.e_resp', {s: r.status})); await dormir(3000 * (k + 1)); continue; }
      if (!r.ok) throw new Error(tx('sec.e_resp_url', {s: r.status, u: url}));
      return await r.json();
    } catch (e) { ultimo = e; await dormir(1500 * (k + 1)); }
  }
  throw ultimo;
}

// ── lectura de hechos ───────────────────────────────────────────────────────────────────────────────────────────
function serieDe(facts, concepto) {
  const f = facts?.['us-gaap']?.[concepto]; if (!f) return null;
  const items = (f.units?.USD ?? []).filter((x) => x.start && x.end);
  if (!items.length) return null;
  const porClave = new Map();   // (inicio|fin) → el reporte más reciente (reexpresiones incluidas)
  for (const x of items) { const k = `${x.start}|${x.end}`; const p = porClave.get(k); if (!p || x.filed > p.filed) porClave.set(k, x); }
  const todos = [...porClave.values()], trimestrales = new Map(), anuales = [], acum9 = [];
  for (const x of todos) { const d = dias(x.start, x.end); if (d >= 80 && d <= 100) trimestrales.set(x.end, {val: x.val, inicio: x.start, filed: x.filed, form: x.form, accn: x.accn, derivado: false}); else if (d >= 350 && d <= 380) anuales.push(x); else if (d >= 255 && d <= 285) acum9.push(x); }
  // Q4 = año − (Q1+Q2+Q3), o año − acumulado de 9 meses
  for (const a of anuales) {
    if (trimestrales.has(a.end)) continue;
    const dentro = [...trimestrales.entries()].filter(([fin, q]) => q.inicio >= a.start && fin < a.end && dias(fin, a.end) > 30);
    let resto = null, nota = null;
    const n9 = acum9.find((x) => x.start === a.start && dias(x.end, a.end) > 60 && dias(x.end, a.end) < 120);
    if (n9) { resto = a.val - n9.val; nota = 'año − acumulado de 9 meses'; }
    else if (dentro.length === 3) { resto = a.val - dentro.reduce((s, [, q]) => s + q.val, 0); nota = 'año − (Q1+Q2+Q3)'; }
    if (resto != null) trimestrales.set(a.end, {val: resto, inicio: null, inicioAnio: a.start, filed: a.filed, form: a.form, accn: a.accn, derivado: true, nota});
  }
  return {trimestrales, anuales};
}

const REV = ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueGoodsNet'];
const COGS = ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold', 'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization'];
const OPEX_TOTAL = ['OperatingExpenses'];
const COSTS_ALL = ['CostsAndExpenses'];
const OPINC = ['OperatingIncomeLoss'];
const TAX = ['IncomeTaxExpenseBenefit'];
const NET = ['NetIncomeLoss', 'ProfitLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic'];
const LINEAS = {   // grupo → [{label, conceptos}]
  id: [{k: 'id', label: 'Investigación y desarrollo', c: ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost']}],
  sga: [{k: 'sga', label: 'Ventas, generales y administración', c: ['SellingGeneralAndAdministrativeExpense']}],
  mk: [{k: 'mk', label: 'Marketing y ventas', c: ['SellingAndMarketingExpense', 'MarketingExpense']}, {k: 'ga', label: 'Administración', c: ['GeneralAndAdministrativeExpense']}],
  otros: [{k: 'rs', label: 'Reestructuración', c: ['RestructuringCharges']}, {k: 'ot', label: 'Otros gastos operativos', c: ['OtherCostAndExpenseOperating']}],
};

export const etiquetaTrimestre = (fin, mesFin) => {
  const m = +fin.slice(5, 7), y = +fin.slice(0, 4), k = Math.floor((((m - mesFin + 12 - 1) % 12) / 3)) + 1, fy = m > mesFin ? y + 1 : y;
  return {q: `Q${k}`, fy, etiqueta: `Q${k} FY${fy}`};
};
const mesFinAnual = (series) => {
  const c = new Map(); for (const s of series) for (const a of s?.anuales ?? []) { const m = +a.end.slice(5, 7); c.set(m, (c.get(m) ?? 0) + 1); }
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;
};

/** Arma el diagrama de un trimestre. Devuelve {flujos, fuentes, derivados, notas} o {omitido: motivo}. */
function construir(fin, S, pools = null, anual = null) {
  const pick = (lista) => { for (const c of lista) { const q = S[c]?.trimestrales.get(fin); if (q) return {c, ...q}; } return null; };
  const rev = pick(REV), cg = pick(COGS), op = pick(OPINC), tax = pick(TAX), net = pick(NET);
  if (!rev || !op || !net || !tax) return {omitido: tx('tri.o_basicos')};
  if (!(rev.val > 0)) return {omitido: tx('tri.o_ingresos')};
  const notas = [], derivados = [], fuentes = [], usa = (x, rol) => { fuentes.push({rol, concepto: x.c, valor: x.val, derivado: x.derivado || undefined, nota: x.nota}); if (x.derivado) derivados.push(`${rol} (${x.nota})`); };
  usa(rev, 'Ingresos'); usa(op, 'Utilidad operativa'); usa(tax, 'Impuestos'); usa(net, 'Utilidad neta'); if (cg) usa(cg, 'Costo de ventas');
  const costo = cg && cg.val > 0 ? cg.val : 0, bruta = rev.val - costo;
  if (bruta < op.val - Math.abs(bruta) * 0.001) return {omitido: tx('tri.o_bruta')};
  const opexTotal = bruta - op.val;
  // gastos operativos: contraste con lo reportado
  const rep = pick(OPEX_TOTAL) ?? (pick(COSTS_ALL) && cg ? {...pick(COSTS_ALL), val: pick(COSTS_ALL).val - cg.val, c: 'CostsAndExpenses − costo de ventas'} : null);
  if (rep && Math.abs(rep.val - opexTotal) / opexTotal > 0.01) notas.push(tx('tri.n_opex', {a: (rep.val / 1e6).toFixed(0), b: (opexTotal / 1e6).toFixed(0)}));
  // líneas de gasto: sin duplicar (SG&A excluye marketing y administración por separado)
  let lineas = [], det = null;
  if (pools) { try { det = detalleTrimestre(pools, {fin, ingresos: rev.val, opexTotal, costoConceptos: COGS, anual}); } catch (e) { notas.push(tx('tri.n_sin_detalle', {e: e.message})); } }
  if (det?.avisos?.length) notas.push(...det.avisos);
  if (det?.lineas) {   // líneas del archivo XBRL completo del reporte (incluye las propias de la empresa): suman exactamente los gastos operativos
    lineas = det.lineas.map((l) => ({nombre: l.nombre, valor: l.valor}));
    det.lineas.forEach((l) => fuentes.push({rol: l.nombre, concepto: l.concepto, valor: l.valor, origen: 'XBRL completo del reporte'}));
    const resto0 = opexTotal - lineas.reduce((s, l) => s + l.valor, 0);
    if (Math.abs(resto0) > opexTotal * 0.0005) lineas.push({nombre: 'Otros gastos operativos', valor: Math.max(resto0, 0)});
    lineas = lineas.filter((l) => l.valor > 0);
  } else {
  const toma = (grupo) => grupo.map((l) => { const x = pick(l.c); if (x) usa(x, l.label); return x && x.val > 0 ? {nombre: l.label, valor: x.val} : null; }).filter(Boolean);
  lineas.push(...toma(LINEAS.id));
  const sga = toma(LINEAS.sga); lineas.push(...(sga.length ? sga : toma(LINEAS.mk)));
  const otros = toma(LINEAS.otros); lineas.push(...otros);
  let suma = lineas.reduce((s, l) => s + l.valor, 0);
  if (suma > opexTotal * 1.005) { lineas = lineas.filter((l) => !otros.includes(l)); suma = lineas.reduce((s, l) => s + l.valor, 0); }
  if (suma > opexTotal * 1.005) { lineas = []; suma = 0; notas.push(tx('tri.n_lineas_mas')); }
  // si «otros gastos operativos» ya está entre las líneas, el resto se une a ella
  const resto = opexTotal - suma;
  if (resto > opexTotal * 0.005) {
    const share = resto / opexTotal, ya = lineas.find((l) => l.nombre === 'Otros gastos operativos');
    if (ya) ya.valor += resto; else lineas.push({nombre: share > 0.25 ? 'Gastos operativos sin desglosar' : 'Otros gastos operativos', valor: resto});
    if (share > 0.25) notas.push(tx('tri.n_sin_desglosar', {p: (share * 100).toFixed(0)}));
  }
  }
  // ingresos por producto o segmento (solo con detalle fino): el nodo «Ingresos» pasa a ser la suma de sus partes
  const segmentos = det?.ingresosPorLinea?.length ? det.ingresosPorLinea : null;
  if (segmentos) { fuentes.push(...segmentos.map((s) => ({rol: `Ingresos · ${s.nombre}`, concepto: s.miembro, valor: s.valor, origen: 'XBRL completo del reporte'}))); notas.push(tx('tri.n_ingresos_por', {e: (det.eje ?? '').split(':').pop().replace(/Axis$/, '')})); }
  // por debajo de la utilidad operativa: otros (no operativos) = utilidad neta + impuestos − utilidad operativa. Exacto por construcción.
  const otroNeto = net.val + tax.val - op.val;   // + = ingreso no operativo, − = gasto no operativo
  derivados.push('Utilidad bruta = ingresos − costo de ventas', 'Gastos operativos = utilidad bruta − utilidad operativa', 'Otros (no operativos) = utilidad neta + impuestos − utilidad operativa');
  // puente (cascada): sirve para CUALQUIER trimestre, también con pérdidas o beneficio fiscal
  const P = [{concepto: 'Ingresos', valor: rev.val, tipo: 'inicio'}];
  if (costo > 0) { P.push({concepto: 'Costo de ventas', valor: -costo, tipo: ''}, {concepto: 'Utilidad bruta', valor: bruta, tipo: 'total'}); }
  [...lineas].sort((a, b) => b.valor - a.valor).forEach((l) => P.push({concepto: l.nombre, valor: -l.valor, tipo: ''}));
  P.push({concepto: 'Utilidad operativa', valor: op.val, tipo: 'total'});
  if (Math.abs(otroNeto) > 0) P.push({concepto: otroNeto >= 0 ? 'Otros ingresos' : 'Otros (no operativos)', valor: otroNeto, tipo: ''});
  if (tax.val !== 0) P.push({concepto: tax.val > 0 ? 'Impuestos' : 'Beneficio fiscal', valor: -tax.val, tipo: ''});
  P.push({concepto: 'Utilidad neta', valor: net.val, tipo: 'total'});
  // Sankey: solo trimestres con utilidad (un flujo no puede ser negativo)
  let F = null, motivoSankey = null;
  const B = tax.val < 0 ? -tax.val : 0, T = tax.val > 0 ? tax.val : 0, netOp = net.val - B, E = op.val - netOp - T;   // E = gasto no operativo (si > 0)
  if (!(op.val > 0)) motivoSankey = tx('tri.m_perdida_op');
  else if (!(netOp > 0)) motivoSankey = tx('tri.m_perdida_neta');
  else {
    F = []; const f = (o, d, v, t) => { if (v > 1e-9) F.push({origen: o, destino: d, valor: Math.round(v), tipo: t ?? ''}); };
    const usados = new Set(['Ingresos', 'Utilidad bruta', 'Costo de ventas', 'Gastos operativos', 'Utilidad operativa', 'Utilidad antes de impuestos', 'Utilidad neta', 'Impuestos', 'Otros (no operativos)', 'Otros ingresos', 'Beneficio fiscal', ...lineas.map((l) => l.nombre)]);
    if (segmentos) segmentos.forEach((s) => f(usados.has(s.nombre) ? `${s.nombre} (ingresos)` : s.nombre, 'Ingresos', s.valor, 'ingreso'));
    if (costo > 0) { f('Ingresos', 'Utilidad bruta', bruta, 'beneficio'); f('Ingresos', 'Costo de ventas', costo, 'costo'); }
    const padre = costo > 0 ? 'Utilidad bruta' : 'Ingresos';
    f(padre, 'Utilidad operativa', op.val, 'beneficio'); f(padre, 'Gastos operativos', opexTotal, 'costo');
    [...lineas].sort((a, b) => b.valor - a.valor).forEach((l) => f('Gastos operativos', l.nombre, l.valor, 'costo'));
    let fuente = 'Utilidad operativa';
    if (E < 0) { f('Utilidad operativa', 'Utilidad antes de impuestos', op.val, 'neutral'); f('Otros ingresos', 'Utilidad antes de impuestos', -E, 'neutral'); fuente = 'Utilidad antes de impuestos'; }
    f(fuente, 'Utilidad neta', netOp, 'beneficio'); f(fuente, 'Impuestos', T, 'costo'); if (E > 0) f('Utilidad operativa', 'Otros (no operativos)', E, 'costo');
    if (B > 0) f('Beneficio fiscal', 'Utilidad neta', B, 'beneficio');
  }
  return {flujos: F, motivoSankey, puente: P, fuentes, derivados, notas, detalleFino: !!(det?.lineas || segmentos), conSegmentos: !!segmentos, ingresos: rev.val, bruta, op: op.val, net: net.val, filed: rev.filed, form: rev.form, accn: rev.accn, derivadoQ4: !!(rev.derivado || op.derivado || net.derivado)};
}

const escala = (rev) => (rev >= 1e10 ? {divisor: 1e9, prefijo: 'US$ ', sufijo: ' mil M', decimales: 1, unidad: 'miles de millones de US$'} : {divisor: 1e6, prefijo: 'US$ ', sufijo: ' M', decimales: 0, unidad: 'millones de US$'});

/** Descarga (o usa el caché) los hechos de la empresa y escribe todos sus trimestres. */
async function poolsDe(e, fin, S) {
  const mapa = REV.map((c) => S[c]?.trimestrales).find((m) => m && m.has(fin)), rev = mapa?.get(fin); if (!rev) return {};
  const pools = [await detalleFiling(e.cik, rev.accn)];
  if (!rev.derivado) return {pools};
  const q3 = [...mapa.entries()].find(([f, q]) => !q.derivado && dias(f, fin) >= 80 && dias(f, fin) <= 100);   // el Q4 se calcula como año − 9 meses: hace falta el reporte del Q3
  if (!q3 || !rev.inicioAnio) return {pools};
  pools.push(await detalleFiling(e.cik, q3[1].accn));
  return {pools, anual: {inicioAnio: rev.inicioAnio, finQ3: q3[0]}};
}

export async function actualizarEmpresa(ticker, {forzar = false, desde = '2009-01-01', detalle = 4} = {}) {
  const e = empresas().find((x) => x.ticker === ticker); if (!e) throw new Error(`Empresa desconocida: ${ticker}`);
  const dir = path.join(DIR, ticker), crudo = path.join(DIR, '_sec', `${ticker}.facts.json`);
  fs.mkdirSync(dir, {recursive: true}); fs.mkdirSync(path.dirname(crudo), {recursive: true});
  let datos;
  if (!forzar && fs.existsSync(crudo) && Date.now() - fs.statSync(crudo).mtimeMs < 6 * 3600e3) datos = JSON.parse(fs.readFileSync(crudo, 'utf8'));
  else { datos = await sec(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10(e.cik)}.json`); if (esDestacada(ticker)) fs.writeFileSync(crudo, JSON.stringify(datos)); }   // el crudo (5–15 MB) solo se guarda de las destacadas: el resto se vuelve a pedir si hace falta
  const facts = datos.facts, S = {};
  for (const c of [...REV, ...COGS, ...OPEX_TOTAL, ...COSTS_ALL, ...OPINC, ...TAX, ...NET, ...Object.values(LINEAS).flat().flatMap((l) => l.c)]) S[c] = serieDe(facts, c);
  const mesFin = mesFinAnual(Object.values(S)), fines = new Set();
  for (const c of REV) for (const fin of S[c]?.trimestrales.keys() ?? []) fines.add(fin);
  const hoy = new Date().toISOString().slice(0, 10), lista = [], omitidos = [], previo = leerIndice(ticker), nuevos = [];
  const conDetalle = new Set([...fines].sort().slice(-detalle));   // el detalle fino (archivo XBRL completo) se trae para el último año
  for (const fin of [...fines].sort()) {
    if (fin < desde) continue;
    let pools = null, anual = null, errDetalle = null;
    if (conDetalle.has(fin)) { try { ({pools = null, anual = null} = await poolsDe(e, fin, S)); } catch (err) { errDetalle = err.message; } }
    const r = construir(fin, S, pools, anual); const et = etiquetaTrimestre(fin, mesFin);
    if (!r.omitido && errDetalle) r.notas.push(tx('tri.n_sin_detalle_ahora', {e: errDetalle}));
    if (r.omitido) { omitidos.push({fin, etiqueta: et.etiqueta, motivo: r.omitido}); continue; }
    const pres = escala(r.ingresos), meta = (sha, filas, extra = {}) => JSON.stringify({
      id: `${ticker}_${fin}`, empresa: {ticker, nombre: e.nombre, cik: e.cik, entidad: datos.entityName}, periodo: {fin, ...et},
      fuente: {nombre: `SEC EDGAR · reporte ${r.form} de ${e.nombre} (${et.etiqueta})`, corto: 'SEC EDGAR', url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10(e.cik)}.json`, licencia: 'Dominio público (Gobierno de EE. UU.)', obtenido: hoy, publicado: r.filed, accesion: r.accn},
      presentacion: pres, sha256: sha, filas, inicio: fin, fin, derivados: r.derivados, notas: r.notas, valoresReportados: r.fuentes, q4Calculado: r.derivadoQ4, ...extra,
    }, null, 2);
    const escribe = (archivo, csv, filas, extra) => { const sha = crypto.createHash('sha256').update(csv).digest('hex'); if (!fs.existsSync(archivo) || crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex') !== sha) fs.writeFileSync(archivo, csv); fs.writeFileSync(archivo + '.meta.json', meta(sha, filas, extra)); };
    const rel = (a) => path.relative(RAIZ, a).replace(/\\/g, '/');
    let archivo = null;
    const cs = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));   // CSV correcto: «Ventas, generales…» lleva comillas
    if (r.flujos) { archivo = path.join(dir, `${fin}.csv`); escribe(archivo, 'origen,destino,valor,tipo\n' + r.flujos.map((f) => [f.origen, f.destino, f.valor, f.tipo].map(cs).join(',')).join('\n') + '\n', r.flujos.length, {uso: 'sankey'}); }
    const puente = path.join(dir, `${fin}.puente.csv`);
    escribe(puente, 'concepto,valor,tipo\n' + r.puente.map((p) => [p.concepto, p.valor, p.tipo].map(cs).join(',')).join('\n') + '\n', r.puente.length, {uso: 'cascada'});
    lista.push({fin, ...et, archivo: archivo ? rel(archivo) : null, puente: rel(puente), motivoSankey: r.motivoSankey, publicado: r.filed, form: r.form, accn: r.accn, ingresos: r.ingresos, utilidadOperativa: r.op, utilidadNeta: r.net, margenOperativo: r.op / r.ingresos, q4Calculado: r.derivadoQ4, notas: r.notas, detalleFino: r.detalleFino, conSegmentos: r.conSegmentos, presentacion: pres});
    if (!previo?.trimestres.some((t) => t.fin === fin)) nuevos.push(et.etiqueta);
  }
  // serie de tiempo con los resultados trimestrales (para líneas, comparaciones y paneles con las plantillas de series)
  if (lista.length >= 2) {
    const asc = [...lista].sort((x, y) => (x.fin < y.fin ? -1 : 1)), pres = escala(Math.max(...asc.map((x) => x.ingresos))), csvS = 'fecha,ingresos,utilidad_operativa,utilidad_neta,margen_operativo\n' + asc.map((x) => [x.fin, x.ingresos, x.utilidadOperativa, x.utilidadNeta, (x.margenOperativo * 100).toFixed(2)].join(',')).join('\n') + '\n', fS = path.join(dir, 'serie.csv');
    fs.writeFileSync(fS, csvS);
    fs.writeFileSync(fS + '.meta.json', JSON.stringify({id: `${ticker}_serie`, empresa: {ticker, nombre: e.nombre, cik: e.cik}, fuente: {nombre: `SEC EDGAR · reportes 10-Q/10-K de ${e.nombre}`, corto: 'SEC EDGAR', url: `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10(e.cik)}.json`, licencia: 'Dominio público (Gobierno de EE. UU.)', obtenido: hoy}, presentacion: pres, sha256: crypto.createHash('sha256').update(csvS).digest('hex'), filas: asc.length, inicio: asc[0].fin, fin: asc.at(-1).fin}, null, 2));
  }
  const ultimoAccn = lista.length ? lista.reduce((a, b) => (b.publicado > a.publicado ? b : a)).accn : null;
  fs.writeFileSync(path.join(dir, 'indice.json'), JSON.stringify({ticker, nombre: e.nombre, cik: e.cik, actualizado: new Date().toISOString(), mesFinAnual: mesFin, ultimoAccn, trimestres: lista.sort((a, b) => (a.fin < b.fin ? 1 : -1)), omitidos}, null, 2));
  return {ticker, trimestres: lista.length, omitidos: omitidos.length, nuevos, ultimo: lista[0]?.etiqueta};
}

export const leerIndice = (ticker) => { const f = path.join(DIR, ticker, 'indice.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
export function listarEmpresas() { return empresas().map((e) => { const i = leerIndice(e.ticker); return {ticker: e.ticker, nombre: e.nombre, trimestres: i?.trimestres.length ?? 0, ultimo: i?.trimestres[0]?.etiqueta ?? null, ultimoFin: i?.trimestres[0]?.fin ?? null, actualizado: i?.actualizado ?? null}; }); }

/** Empresas que ya tienen trimestres en la biblioteca (destacadas + las bajadas al elegirlas o de noche). */
export const construidas = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((d) => fs.existsSync(path.join(DIR, d, 'indice.json'))) : []);

/** Quién presentó un 10-Q/10-K en una fecha (índice diario oficial de la SEC: una petición para toda la bolsa). null = ese día no hay índice (fin de semana o aún no publicado). */
async function presentadosEl(fecha) {
  const y = fecha.slice(0, 4), q = Math.ceil(+fecha.slice(4, 6) / 3);
  let txt; try { txt = await www(`https://www.sec.gov/Archives/edgar/daily-index/${y}/QTR${q}/form.${fecha}.idx`, {reintentos: 2}); } catch (e) { if (/ 40[34] /.test(e.message)) return null; throw e; }
  const ciks = new Set(); for (const l of txt.split('\n')) { const m = l.match(/^(10-[QK])\s+.*?\s(\d{4,10})\s+\d{8}\s+edgar\//); if (m) ciks.add(+m[2]); }
  return ciks;
}

/** Agente vigilante de TODA la biblioteca: lee el índice diario de la SEC (hoy y los 2 días anteriores) y actualiza solo a quien presentó un 10-Q/10-K.
 *  Si la SEC ya publicó el reporte pero sus datos estructurados aún no traen el trimestre, la empresa queda «pendiente» y se reintenta cada ciclo hasta 3 días. */
export async function vigilar({tickers = null} = {}) {
  const nuevos = [], errores = [], hoy = new Date(), ciks = new Set();
  let fallo = false;
  for (let d = 0; d < 3; d++) {
    const f = new Date(hoy.getTime() - d * DIA).toISOString().slice(0, 10).replace(/-/g, '');
    try { const c = await presentadosEl(f); if (c) c.forEach((x) => ciks.add(x)); } catch (e) { fallo = true; errores.push(tx('tri.e_indice', {f, m: e.message})); }
  }
  if (fallo && !ciks.size) return vigilarPorEmpresa({tickers, nuevos, errores});   // plan B: una petición por empresa destacada
  const lista = empresas().filter((e) => construidas().includes(e.ticker) && (!tickers || tickers.includes(e.ticker)));
  for (const e of lista) {
    const idx = leerIndice(e.ticker), pend = idx?.pendiente && Date.now() - Date.parse(idx.pendiente) < 3 * DIA;
    if (!ciks.has(+e.cik) && !pend) continue;
    try {
      const res = await actualizarEmpresa(e.ticker, {forzar: true, ...(esDestacada(e.ticker) ? {} : {desde: haceAnios(3)})}), i2 = leerIndice(e.ticker);
      if (res.nuevos.length) { nuevos.push({ticker: e.ticker, nombre: e.nombre, etiquetas: res.nuevos, publicado: new Date().toISOString().slice(0, 10), form: i2.trimestres.find((t) => t.etiqueta === res.nuevos[0])?.form ?? '10-Q'}); delete i2.pendiente; }
      else if (ciks.has(+e.cik) && !pend) i2.pendiente = new Date().toISOString();   // presentó, pero aún no hay trimestre nuevo en los datos estructurados
      fs.writeFileSync(path.join(DIR, e.ticker, 'indice.json'), JSON.stringify(i2, null, 2));
    } catch (err) { errores.push(`${e.ticker}: ${err.message}`); }
  }
  return {nuevos, errores};
}

async function vigilarPorEmpresa({tickers = null, nuevos = [], errores = []} = {}) {
  for (const e of destacadas().filter((x) => !tickers || tickers.includes(x.ticker))) {
    try {
      const idx = leerIndice(e.ticker); if (!idx) continue;   // solo vigila las que ya están en la biblioteca
      const s = await sec(`https://data.sec.gov/submissions/CIK${cik10(e.cik)}.json`), r = s.filings.recent;
      let ultimo = null; for (let i = 0; i < r.form.length; i++) if (['10-Q', '10-K'].includes(r.form[i]) && (!ultimo || r.filingDate[i] > ultimo.filed)) ultimo = {accn: r.accessionNumber[i], filed: r.filingDate[i], form: r.form[i], fin: r.reportDate[i]};
      await dormir(250);
      if (!ultimo || ultimo.accn === idx.ultimoAccn || ultimo.accn === idx.ultimoVisto) continue;
      const res = await actualizarEmpresa(e.ticker, {forzar: true});
      const marca = (accn) => { const i2 = leerIndice(e.ticker); if (i2) { i2.ultimoVisto = accn; fs.writeFileSync(path.join(DIR, e.ticker, 'indice.json'), JSON.stringify(i2, null, 2)); } };
      if (res.nuevos.length) { nuevos.push({ticker: e.ticker, nombre: e.nombre, etiquetas: res.nuevos, publicado: ultimo.filed, form: ultimo.form}); marca(ultimo.accn); }
      else if (res.omitidos && (leerIndice(e.ticker)?.omitidos ?? []).some((o) => o.fin === ultimo.fin)) marca(ultimo.accn);   // ya está, pero no es representable (pérdida)
      else errores.push(tx('tri.e_pendiente', {k: e.ticker, form: ultimo.form, fin: ultimo.fin}));
    } catch (err) { errores.push(`${e.ticker}: ${err.message}`); }
  }
  return {nuevos, errores};
}

/** Ficha lista para usar en una pieza: ruta, fuente y presentación del trimestre elegido. */
export function itemTrimestre(ticker, fin, uso = 'sankey') {
  const idx = leerIndice(ticker), t = idx?.trimestres.find((x) => x.fin === fin);
  if (!t) throw new Error(tx('tri.e_no_trimestre', {fin, k: ticker}));
  const ruta = uso === 'sankey' ? t.archivo : t.puente;
  if (!ruta) throw new Error(`${idx.nombre} ${t.etiqueta}: ${t.motivoSankey ?? tx('tri.e_sin_flujo_def')}.`);
  const meta = JSON.parse(fs.readFileSync(path.join(RAIZ, ruta + '.meta.json'), 'utf8')), p = meta.presentacion;
  return {origen: 'archivo', ruta, tabla: uso === 'sankey' ? 'flujos' : 'categorias', nombre: `${idx.nombre} · ${t.etiqueta}`, fuente: {nombre: meta.fuente.nombre, url: meta.fuente.url, obtenido: meta.fuente.obtenido, licencia: meta.fuente.licencia},
    divisor: p.divisor, prefijo: p.prefijo, sufijo: p.sufijo, decimales: p.decimales, unidad: p.unidad, trimestre: {ticker, fin, etiqueta: t.etiqueta, nombre: idx.nombre}, notasFuente: t.notas};
}

// ── búsqueda y construcción de toda la bolsa ────────────────────────────────────────────────────────────────────
/** Búsqueda por ticker o nombre en TODA la bolsa de EE. UU. (sin texto: las destacadas). Cada resultado dice si ya está en la biblioteca. */
export function buscarEmpresas(q, limite = 40) {
  const res = String(q ?? '').trim() ? buscarUniverso(q, limite) : destacadas();
  return res.map((e) => { const i = leerIndice(e.ticker); return {ticker: e.ticker, nombre: e.nombre, bolsa: e.bolsa ?? null, destacada: esDestacada(e.ticker), trimestres: i?.trimestres.length ?? 0, ultimo: i?.trimestres[0]?.etiqueta ?? null, enBiblioteca: !!i}; });
}

/** Baja los trimestres de una empresa si aún no están (los últimos 3 años; las destacadas, todo). Devuelve el índice. */
export async function asegurarEmpresa(ticker) {
  if (leerIndice(ticker)) return leerIndice(ticker);
  if (!empresas().some((e) => e.ticker === ticker)) { await actualizarUniverso().catch(() => {}); if (!empresas().some((e) => e.ticker === ticker)) throw new Error(tx('tri.e_no_bolsa', {k: ticker})); }
  await actualizarEmpresa(ticker, esDestacada(ticker) ? {} : {desde: haceAnios(3)});
  return leerIndice(ticker);
}

/** Trabajo de noche: recorre la bolsa de las más grandes a las más pequeñas y baja las que faltan, con pausa entre peticiones. Se puede cortar y retomar. */
export async function construirUniverso({limite = Infinity, minutos = 180, alAvanzar = null} = {}) {
  await actualizarUniverso().catch(() => {});
  const estadoF = path.join(DIR, '_universo_estado.json'), est = fs.existsSync(estadoF) ? JSON.parse(fs.readFileSync(estadoF, 'utf8')) : {};
  const fin = Date.now() + minutos * 60000; let hechas = 0, fallidas = 0, saltadas = 0;
  for (const e of leerUniverso()) {
    if (hechas >= limite || Date.now() > fin) break;
    if (leerIndice(e.ticker)) continue;
    if (est[e.ticker] && Date.now() - Date.parse(est[e.ticker].t) < 14 * DIA) { saltadas++; continue; }   // si falló hace poco (sin datos), no se insiste
    try { await actualizarEmpresa(e.ticker, esDestacada(e.ticker) ? {} : {desde: haceAnios(3)}); hechas++; delete est[e.ticker]; }
    catch (err) { fallidas++; est[e.ticker] = {t: new Date().toISOString(), error: String(err.message ?? err).slice(0, 160)}; }
    if ((hechas + fallidas) % 10 === 0) { fs.writeFileSync(estadoF, JSON.stringify(est)); alAvanzar?.({hechas, fallidas, ticker: e.ticker}); }
    await dormir(400);
  }
  fs.writeFileSync(estadoF, JSON.stringify(est));
  return {hechas, fallidas, saltadas, enBiblioteca: construidas().length, enUniverso: leerUniverso().length};
}

/** Series de tiempo de una empresa (ingresos, utilidad operativa, utilidad neta, margen operativo por trimestre), listas para las plantillas de series. */
export async function seriesDeEmpresa(ticker) {
  const idx = await asegurarEmpresa(ticker), f = path.join(DIR, ticker, 'serie.csv');
  if (!idx.trimestres.length || !fs.existsSync(f)) return {ticker, nombre: idx.nombre, series: []};
  const meta = JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')), p = meta.presentacion, ruta = path.relative(RAIZ, f).replace(/\\/g, '/');
  const base = {origen: 'archivo', ruta, x: 'fecha', tipoX: 'fecha', fuente: {nombre: meta.fuente.nombre, url: meta.fuente.url, obtenido: meta.fuente.obtenido, licencia: meta.fuente.licencia}};
  const money = {divisor: p.divisor, prefijo: p.prefijo, sufijo: p.sufijo, decimales: p.decimales, unidad: p.unidad};
  return {ticker, nombre: idx.nombre, desde: meta.inicio, hasta: meta.fin, series: [
    {...base, ...money, col: 'ingresos', nombre: `${idx.nombre} · Ingresos por trimestre`},
    {...base, ...money, col: 'utilidad_operativa', nombre: `${idx.nombre} · Utilidad operativa`},
    {...base, ...money, col: 'utilidad_neta', nombre: `${idx.nombre} · Utilidad neta`},
    {...base, col: 'margen_operativo', nombre: `${idx.nombre} · Margen operativo`, sufijo: ' %', decimales: 1, unidad: '% de los ingresos'},
  ]};
}
