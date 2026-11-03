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

export const DIR = path.join(RAIZ, 'datos', 'trimestres');
const UA = process.env.RTL_SEC_UA ?? 'RideTheLightning/1.0 (herramienta local de graficas)';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const DIA = 86400000, dias = (a, b) => (Date.parse(b) - Date.parse(a)) / DIA;
export const empresas = () => JSON.parse(fs.readFileSync(path.join(RAIZ, 'catalogo', 'empresas.json'), 'utf8'));
const cik10 = (c) => String(c).padStart(10, '0');

async function sec(url, reintentos = 3) {
  let ultimo;
  for (let k = 0; k < reintentos; k++) {
    try {
      const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate'}, signal: AbortSignal.timeout(120000)});
      if (r.status === 429 || r.status >= 500) { ultimo = new Error(`SEC respondió ${r.status}`); await dormir(3000 * (k + 1)); continue; }
      if (!r.ok) throw new Error(`SEC respondió ${r.status} en ${url}`);
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
    if (resto != null) trimestrales.set(a.end, {val: resto, inicio: null, filed: a.filed, form: a.form, accn: a.accn, derivado: true, nota});
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
function construir(fin, S) {
  const pick = (lista) => { for (const c of lista) { const q = S[c]?.trimestrales.get(fin); if (q) return {c, ...q}; } return null; };
  const rev = pick(REV), cg = pick(COGS), op = pick(OPINC), tax = pick(TAX), net = pick(NET);
  if (!rev || !op || !net || !tax) return {omitido: 'faltan datos básicos (ingresos, utilidad operativa, impuestos o utilidad neta)'};
  if (!(rev.val > 0)) return {omitido: 'ingresos no positivos'};
  const notas = [], derivados = [], fuentes = [], usa = (x, rol) => { fuentes.push({rol, concepto: x.c, valor: x.val, derivado: x.derivado || undefined, nota: x.nota}); if (x.derivado) derivados.push(`${rol} (${x.nota})`); };
  usa(rev, 'Ingresos'); usa(op, 'Utilidad operativa'); usa(tax, 'Impuestos'); usa(net, 'Utilidad neta'); if (cg) usa(cg, 'Costo de ventas');
  const costo = cg && cg.val > 0 ? cg.val : 0, bruta = rev.val - costo;
  if (bruta < op.val - Math.abs(bruta) * 0.001) return {omitido: 'la utilidad operativa supera a la bruta (la fuente no cuadra con su propia estructura)'};
  const opexTotal = bruta - op.val;
  // gastos operativos: contraste con lo reportado
  const rep = pick(OPEX_TOTAL) ?? (pick(COSTS_ALL) && cg ? {...pick(COSTS_ALL), val: pick(COSTS_ALL).val - cg.val, c: 'CostsAndExpenses − costo de ventas'} : null);
  if (rep && Math.abs(rep.val - opexTotal) / opexTotal > 0.01) notas.push(`Los gastos operativos reportados (${(rep.val / 1e6).toFixed(0)} M) difieren de ingresos − costo de ventas − utilidad operativa (${(opexTotal / 1e6).toFixed(0)} M); se usa la resta, que es la que cuadra el diagrama.`);
  // líneas de gasto: sin duplicar (SG&A excluye marketing y administración por separado)
  let lineas = [];
  const toma = (grupo) => grupo.map((l) => { const x = pick(l.c); if (x) usa(x, l.label); return x && x.val > 0 ? {nombre: l.label, valor: x.val} : null; }).filter(Boolean);
  lineas.push(...toma(LINEAS.id));
  const sga = toma(LINEAS.sga); lineas.push(...(sga.length ? sga : toma(LINEAS.mk)));
  const otros = toma(LINEAS.otros); lineas.push(...otros);
  let suma = lineas.reduce((s, l) => s + l.valor, 0);
  if (suma > opexTotal * 1.005) { lineas = lineas.filter((l) => !otros.includes(l)); suma = lineas.reduce((s, l) => s + l.valor, 0); }
  if (suma > opexTotal * 1.005) { lineas = []; suma = 0; notas.push('Las líneas de gasto reportadas suman más que los gastos operativos del diagrama; se muestran sin desglosar.'); }
  // si «otros gastos operativos» ya está entre las líneas, el resto se une a ella
  const resto = opexTotal - suma;
  if (resto > opexTotal * 0.005) {
    const share = resto / opexTotal, ya = lineas.find((l) => l.nombre === 'Otros gastos operativos');
    if (ya) ya.valor += resto; else lineas.push({nombre: share > 0.25 ? 'Gastos operativos sin desglosar' : 'Otros gastos operativos', valor: resto});
    if (share > 0.25) notas.push(`La fuente oficial resumida (XBRL «company facts») no desglosa ${(share * 100).toFixed(0)} % de los gastos operativos (son líneas propias de la empresa). Se muestran juntos; el detalle está en su reporte 10-Q/10-K.`);
  }
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
  if (!(op.val > 0)) motivoSankey = 'pérdida operativa (el flujo solo representa trimestres con utilidad; usa la cascada)';
  else if (!(netOp > 0)) motivoSankey = 'pérdida neta (el flujo solo representa trimestres con utilidad; usa la cascada)';
  else {
    F = []; const f = (o, d, v, t) => { if (v > 1e-9) F.push({origen: o, destino: d, valor: Math.round(v), tipo: t ?? ''}); };
    if (costo > 0) { f('Ingresos', 'Utilidad bruta', bruta, 'beneficio'); f('Ingresos', 'Costo de ventas', costo, 'costo'); }
    const padre = costo > 0 ? 'Utilidad bruta' : 'Ingresos';
    f(padre, 'Utilidad operativa', op.val, 'beneficio'); f(padre, 'Gastos operativos', opexTotal, 'costo');
    [...lineas].sort((a, b) => b.valor - a.valor).forEach((l) => f('Gastos operativos', l.nombre, l.valor, 'costo'));
    let fuente = 'Utilidad operativa';
    if (E < 0) { f('Utilidad operativa', 'Utilidad antes de impuestos', op.val, 'neutral'); f('Otros ingresos', 'Utilidad antes de impuestos', -E, 'neutral'); fuente = 'Utilidad antes de impuestos'; }
    f(fuente, 'Utilidad neta', netOp, 'beneficio'); f(fuente, 'Impuestos', T, 'costo'); if (E > 0) f('Utilidad operativa', 'Otros (no operativos)', E, 'costo');
    if (B > 0) f('Beneficio fiscal', 'Utilidad neta', B, 'beneficio');
  }
  return {flujos: F, motivoSankey, puente: P, fuentes, derivados, notas, ingresos: rev.val, bruta, op: op.val, net: net.val, filed: rev.filed, form: rev.form, accn: rev.accn, derivadoQ4: !!(rev.derivado || op.derivado || net.derivado)};
}

const escala = (rev) => (rev >= 1e10 ? {divisor: 1e9, prefijo: 'US$ ', sufijo: ' mil M', decimales: 1, unidad: 'miles de millones de US$'} : {divisor: 1e6, prefijo: 'US$ ', sufijo: ' M', decimales: 0, unidad: 'millones de US$'});

/** Descarga (o usa el caché) los hechos de la empresa y escribe todos sus trimestres. */
export async function actualizarEmpresa(ticker, {forzar = false, desde = '2009-01-01'} = {}) {
  const e = empresas().find((x) => x.ticker === ticker); if (!e) throw new Error(`Empresa desconocida: ${ticker}`);
  const dir = path.join(DIR, ticker), crudo = path.join(DIR, '_sec', `${ticker}.facts.json`);
  fs.mkdirSync(dir, {recursive: true}); fs.mkdirSync(path.dirname(crudo), {recursive: true});
  let datos;
  if (!forzar && fs.existsSync(crudo) && Date.now() - fs.statSync(crudo).mtimeMs < 6 * 3600e3) datos = JSON.parse(fs.readFileSync(crudo, 'utf8'));
  else { datos = await sec(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik10(e.cik)}.json`); fs.writeFileSync(crudo, JSON.stringify(datos)); }
  const facts = datos.facts, S = {};
  for (const c of [...REV, ...COGS, ...OPEX_TOTAL, ...COSTS_ALL, ...OPINC, ...TAX, ...NET, ...Object.values(LINEAS).flat().flatMap((l) => l.c)]) S[c] = serieDe(facts, c);
  const mesFin = mesFinAnual(Object.values(S)), fines = new Set();
  for (const c of REV) for (const fin of S[c]?.trimestrales.keys() ?? []) fines.add(fin);
  const hoy = new Date().toISOString().slice(0, 10), lista = [], omitidos = [], previo = leerIndice(ticker), nuevos = [];
  for (const fin of [...fines].sort()) {
    if (fin < desde) continue;
    const r = construir(fin, S); const et = etiquetaTrimestre(fin, mesFin);
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
    lista.push({fin, ...et, archivo: archivo ? rel(archivo) : null, puente: rel(puente), motivoSankey: r.motivoSankey, publicado: r.filed, form: r.form, accn: r.accn, ingresos: r.ingresos, utilidadOperativa: r.op, utilidadNeta: r.net, margenOperativo: r.op / r.ingresos, q4Calculado: r.derivadoQ4, notas: r.notas, presentacion: pres});
    if (!previo?.trimestres.some((t) => t.fin === fin)) nuevos.push(et.etiqueta);
  }
  const ultimoAccn = lista.length ? lista.reduce((a, b) => (b.publicado > a.publicado ? b : a)).accn : null;
  fs.writeFileSync(path.join(dir, 'indice.json'), JSON.stringify({ticker, nombre: e.nombre, cik: e.cik, actualizado: new Date().toISOString(), mesFinAnual: mesFin, ultimoAccn, trimestres: lista.sort((a, b) => (a.fin < b.fin ? 1 : -1)), omitidos}, null, 2));
  return {ticker, trimestres: lista.length, omitidos: omitidos.length, nuevos, ultimo: lista[0]?.etiqueta};
}

export const leerIndice = (ticker) => { const f = path.join(DIR, ticker, 'indice.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
export function listarEmpresas() { return empresas().map((e) => { const i = leerIndice(e.ticker); return {ticker: e.ticker, nombre: e.nombre, trimestres: i?.trimestres.length ?? 0, ultimo: i?.trimestres[0]?.etiqueta ?? null, ultimoFin: i?.trimestres[0]?.fin ?? null, actualizado: i?.actualizado ?? null}; }); }

/** Agente vigilante: ¿publicó la empresa un 10-Q/10-K nuevo? Si sí, reconstruye sus trimestres. Barato: una sola petición pequeña por empresa. */
export async function vigilar({tickers = null} = {}) {
  const nuevos = [], errores = [];
  for (const e of empresas().filter((x) => !tickers || tickers.includes(x.ticker))) {
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
      else errores.push(`${e.ticker}: la SEC ya publicó el ${ultimo.form} del ${ultimo.fin}, pero los datos estructurados aún no incluyen el trimestre; se reintenta en el próximo ciclo.`);
    } catch (err) { errores.push(`${e.ticker}: ${err.message}`); }
  }
  return {nuevos, errores};
}

/** Ficha lista para usar en una pieza: ruta, fuente y presentación del trimestre elegido. */
export function itemTrimestre(ticker, fin, uso = 'sankey') {
  const idx = leerIndice(ticker), t = idx?.trimestres.find((x) => x.fin === fin);
  if (!t) throw new Error(`No hay trimestre ${fin} de ${ticker} en la biblioteca.`);
  const ruta = uso === 'sankey' ? t.archivo : t.puente;
  if (!ruta) throw new Error(`${idx.nombre} ${t.etiqueta}: ${t.motivoSankey ?? 'no hay diagrama de flujo'}.`);
  const meta = JSON.parse(fs.readFileSync(path.join(RAIZ, ruta + '.meta.json'), 'utf8')), p = meta.presentacion;
  return {origen: 'archivo', ruta, tabla: uso === 'sankey' ? 'flujos' : 'categorias', nombre: `${idx.nombre} · ${t.etiqueta}`, fuente: {nombre: meta.fuente.nombre, url: meta.fuente.url, obtenido: meta.fuente.obtenido, licencia: meta.fuente.licencia},
    divisor: p.divisor, prefijo: p.prefijo, sufijo: p.sufijo, decimales: p.decimales, unidad: p.unidad, trimestre: {ticker, fin, etiqueta: t.etiqueta, nombre: idx.nombre}, notasFuente: t.notas};
}
