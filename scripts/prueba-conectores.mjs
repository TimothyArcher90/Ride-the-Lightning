// Prueba de los conectores de datos abiertos SIN llave (Banco Mundial, FMI, Eurostat, Tesoro de EE. UU., TRM de Colombia).
// Descarga 1 serie REAL de cada fuente por el mismo camino que usa el catálogo y comprueba: filas > 0, fechas estrictamente crecientes,
// ningún NaN, .meta.json con procedencia (fuente, url, fecha de descarga, licencia, sha256) y que el primer y el último dato coincidan con
// una consulta INDEPENDIENTE a la fuente (otra petición, otro parámetro). También verifica que las respuestas vacías o inválidas se rechazan.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {descargar, ADAPTADORES} from '../servidor/catalogo.mjs';
import {descargarAdHoc} from '../servidor/biblioteca.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const UA = {'User-Agent': 'RideTheLightning/0.1 (prueba de conectores)'};
const get = async (u) => { const r = await fetch(u, {headers: UA}); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r.json(); };

/** Comprobaciones comunes de forma + procedencia. */
function forma(m, esperaLicencia = true) {
  const csv = fs.readFileSync(m.archivo, 'utf8').trim().split('\n'), cab = csv[0].split(','), filas = csv.slice(1).map((l) => l.split(','));
  ok(cab[0] === 'fecha' && cab.length === 2, `cabecera "${csv[0]}" (fecha,valor)`);
  ok(filas.length > 0 && filas.length === m.filas, `filas > 0 (${filas.length}) y coinciden con el meta`);
  ok(filas.every((r) => /^-?\d{4}-\d{2}-\d{2}$/.test(r[0])), 'todas las fechas son AAAA-MM-DD');
  ok(filas.every((r, i) => i === 0 || r[0] > filas[i - 1][0]), 'fechas estrictamente crecientes');
  ok(filas.every((r) => r[1] !== '' && Number.isFinite(Number(r[1]))), 'ningún valor vacío ni NaN');
  const meta = JSON.parse(fs.readFileSync(m.archivo + '.meta.json', 'utf8'));
  ok(meta.sha256 === crypto.createHash('sha256').update(fs.readFileSync(m.archivo)).digest('hex'), 'sha256 del meta = sha256 del archivo');
  ok(meta.fuente?.nombre && meta.fuente?.url?.startsWith('http') && meta.fuente?.urlDatos?.startsWith('http') && /^\d{4}-\d{2}-\d{2}$/.test(meta.fuente?.obtenido ?? ''), 'meta cita fuente + URL + URL de datos + fecha de descarga');
  ok(!esperaLicencia || !!meta.fuente?.licencia, `licencia declarada: ${meta.fuente?.licencia}`);
  ok(meta.inicio === filas[0][0] && meta.fin === filas[filas.length - 1][0], `inicio/fin del meta = primera/última fila (${meta.inicio} → ${meta.fin})`);
  return {filas, meta};
}
const igual = (a, b) => Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(b)));
async function rechaza(nombre, fn, patron) {
  try { await fn(); ok(false, `${nombre}: debía fallar y no falló`); } catch (e) { ok(patron.test(e.message), `${nombre}: rechazado con «${e.message.slice(0, 90)}»`); }
}

// ── Banco Mundial: PIB de México (US$ corrientes) ──────────────────────────────────────────────────────────────
console.log('\nBanco Mundial · NY.GDP.MKTP.CD · MEX');
{
  const m = await descargar({id: 'prueba_wb_gdp_mex', adaptador: 'worldbank', args: {indicador: 'NY.GDP.MKTP.CD', pais: 'MEX'}, unidad: 'US$ corrientes', frecuencia: 'Anual', fuente_original: 'Banco Mundial — WDI', licencia: 'CC BY 4.0'});
  const {filas} = forma(m);
  const base = 'https://api.worldbank.org/v2/country/MEX/indicator/NY.GDP.MKTP.CD?format=json';
  const [, ult] = await get(`${base}&mrnev=1`), [, pri] = await get(`${base}&date=1960:1962`);
  const primero = pri.filter((r) => r.value != null).sort((a, b) => a.date.localeCompare(b.date))[0];
  ok(ult[0].date === filas[filas.length - 1][0].slice(0, 4) && igual(ult[0].value, filas[filas.length - 1][1]), `último (${ult[0].date}: ${ult[0].value}) coincide con la fuente (mrnev=1)`);
  ok(primero.date === filas[0][0].slice(0, 4) && igual(primero.value, filas[0][1]), `primero (${primero.date}: ${primero.value}) coincide con la fuente (date=1960:1962)`);
}
await rechaza('Banco Mundial indicador inexistente', () => ADAPTADORES.worldbank({indicador: 'XX.NO.EXISTE', pais: 'MEX'}), /no devolvió datos|solo nulos/);

// ── FMI DataMapper: crecimiento real del PIB de EE. UU. ────────────────────────────────────────────────────────
console.log('\nFMI · NGDP_RPCH · USA');
{
  const m = await descargar({id: 'prueba_imf_ngdp_usa', adaptador: 'imf', args: {indicador: 'NGDP_RPCH', pais: 'USA'}, unidad: '% anual', frecuencia: 'Anual', fuente_original: 'FMI — WEO', licencia: 'Términos del FMI'});
  const {filas} = forma(m);
  const v = (await get('https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH')).values.NGDP_RPCH.USA, anios = Object.keys(v).sort(), tope = new Date().getUTCFullYear() - 1;
  const ultimo = anios.filter((a) => +a <= tope).pop();
  ok(filas[0][0] === `${anios[0]}-01-01` && igual(filas[0][1], v[anios[0]]), `primero (${anios[0]}: ${v[anios[0]]}) coincide con la fuente`);
  ok(filas[filas.length - 1][0] === `${ultimo}-01-01` && igual(filas[filas.length - 1][1], v[ultimo]), `último (${ultimo}: ${v[ultimo]}) coincide con la fuente`);
  ok(anios[anios.length - 1] > ultimo && filas.every((r) => +r[0].slice(0, 4) <= tope), `proyecciones excluidas por defecto (la fuente llega a ${anios[anios.length - 1]}, la serie a ${ultimo})`);
  ok(/proyecci/i.test(m.fuente.notaFuente), 'la nota declara que se excluyen proyecciones');
}
await rechaza('FMI país inexistente', () => ADAPTADORES.imf({indicador: 'NGDP_RPCH', pais: 'ZZZ'}), /no tiene/);

// ── Eurostat: IPCA de España, variación anual ──────────────────────────────────────────────────────────────────
console.log('\nEurostat · prc_hicp_manr · ES');
{
  const filtros = {geo: 'ES', coicop: 'CP00', unit: 'RCH_A'};
  const m = await descargar({id: 'prueba_eu_hicp_es', adaptador: 'eurostat', args: {dataset: 'prc_hicp_manr', filtros}, unidad: '% anual', frecuencia: 'Mensual', fuente_original: 'Eurostat', licencia: 'CC BY 4.0'});
  const {filas} = forma(m);
  const q = new URLSearchParams({format: 'JSON', lang: 'EN', ...filtros, sinceTimePeriod: filas[filas.length - 3][0].slice(0, 7)});
  const j = await get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?${q}`);
  const t = Object.entries(j.dimension.time.category.index).sort((a, b) => a[1] - b[1]), [tUlt, pUlt] = t[t.length - 1];
  ok(`${tUlt}-01` === filas[filas.length - 1][0].slice(0, 10) && igual(j.value[pUlt], filas[filas.length - 1][1]), `último (${tUlt}: ${j.value[pUlt]}) coincide con la fuente (sinceTimePeriod)`);
  const j2 = await get(`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr?${new URLSearchParams({format: 'JSON', lang: 'EN', ...filtros, untilTimePeriod: '1997-03'})}`);
  const t2 = Object.entries(j2.dimension.time.category.index).sort((a, b) => a[1] - b[1]).find(([, p]) => j2.value[p] != null);
  ok(`${t2[0]}-01` === filas[0][0] && igual(j2.value[t2[1]], filas[0][1]), `primero (${t2[0]}: ${j2.value[t2[1]]}) coincide con la fuente (untilTimePeriod)`);
}
await rechaza('Eurostat sin filtros', () => ADAPTADORES.eurostat({dataset: 'prc_hicp_manr', filtros: {geo: 'ES'}}), /faltan filtros|rechaz/);
await rechaza('Eurostat dataset inexistente', () => ADAPTADORES.eurostat({dataset: 'no_existe_xyz', filtros: {}}), /Eurostat|HTTP/);

// ── Tesoro de EE. UU.: deuda total al centavo ──────────────────────────────────────────────────────────────────
console.log('\nTesoro de EE. UU. · debt_to_penny');
{
  const m = await descargarAdHoc({id: 'prueba_ust_deuda', nombre: 'Deuda total EE. UU.', adaptador: 'tesoro', args: {campo: 'tot_pub_debt_out_amt'}, unidad: 'US$', frecuencia: 'Diaria'});
  const {filas, meta} = forma(m);
  ok(meta.fuente.licencia?.startsWith('Dominio público'), 'el camino ad hoc completa la licencia por defecto del adaptador');
  const u = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?format=json&fields=record_date,tot_pub_debt_out_amt&page%5Bsize%5D=1';
  const [ult, pri] = [(await get(`${u}&sort=-record_date`)).data[0], (await get(`${u}&sort=record_date`)).data[0]];
  ok(ult.record_date === filas[filas.length - 1][0] && ult.tot_pub_debt_out_amt === filas[filas.length - 1][1], `último (${ult.record_date}: ${ult.tot_pub_debt_out_amt}) coincide con la fuente, cadena exacta`);
  ok(pri.record_date === filas[0][0] && pri.tot_pub_debt_out_amt === filas[0][1], `primero (${pri.record_date}: ${pri.tot_pub_debt_out_amt}) coincide con la fuente, cadena exacta`);
}

// ── datos.gov.co: TRM ──────────────────────────────────────────────────────────────────────────────────────────
console.log('\nColombia · TRM (datos.gov.co)');
{
  const m = await descargar({id: 'prueba_co_trm', adaptador: 'trm', args: {}, unidad: 'COP por 1 US$', frecuencia: 'Diaria', fuente_original: 'Superfinanciera', licencia: 'CC BY-SA 4.0'});
  const {filas} = forma(m);
  const u = 'https://www.datos.gov.co/resource/32sa-8pi3.json?';
  const ult = (await get(u + new URLSearchParams({$order: 'vigenciadesde DESC', $limit: '1'})))[0], pri = (await get(u + new URLSearchParams({$order: 'vigenciadesde ASC', $limit: '1'})))[0];
  const total = +(await get(u + new URLSearchParams({$select: 'count(*)'})))[0].count;
  ok(ult.vigenciadesde.slice(0, 10) === filas[filas.length - 1][0] && ult.valor === filas[filas.length - 1][1], `último (${ult.vigenciadesde.slice(0, 10)}: ${ult.valor}) coincide con la fuente`);
  ok(pri.vigenciadesde.slice(0, 10) === filas[0][0] && pri.valor === filas[0][1], `primero (${pri.vigenciadesde.slice(0, 10)}: ${pri.valor}) coincide con la fuente`);
  ok(total === filas.length, `todas las filas de la fuente (${total}) están en el CSV (${filas.length}); nada omitido ni inventado`);
}

// ── BIS y BCE (SDMX/CSV): se baja por el catálogo y se contrasta con una consulta independiente (otra petición, otros parámetros) ──
console.log('\nBIS · tasa de política de la zona euro (WS_CBPOL, M.XM)');
const {leerCatalogo} = await import('../servidor/catalogo.mjs');
const enCat = (id) => ({...leerCatalogo().find((e) => e.id === id), id: `prueba_${id}`});
const csvIndep = async (u) => { const t = (await (await fetch(u, {headers: UA})).text()).trim().split('\n'); return t.slice(1).map((l) => l.split(',')); };
{
  const m = await descargar(enCat('bis_cbpol_xm'));
  const {filas, meta} = forma(m);
  const ult = (await csvIndep('https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.XM?format=csv&detail=dataonly&lastNObservations=1'))[0], pri = (await csvIndep('https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CBPOL/1.0/M.XM?format=csv&detail=dataonly&firstNObservations=1'))[0];
  ok(`${ult.at(-2)}-01` === filas.at(-1)[0] && ult.at(-1) === filas.at(-1)[1], `último (${ult.at(-2)}: ${ult.at(-1)}) coincide con la fuente, cadena exacta`);
  ok(`${pri.at(-2)}-01` === filas[0][0] && pri.at(-1) === filas[0][1], `primero (${pri.at(-2)}: ${pri.at(-1)}) coincide con la fuente, cadena exacta`);
  ok(meta.fuente.licencia_estado === 'atribucion' && meta.fuente.cita.startsWith('Fuente: BIS') && meta.validacion?.esquema?.frecuencia === 'M', 'el .meta.json guarda licencia verificada, cita y esquema');
}
console.log('\nBIS · crédito al sector privado / PIB de EE. UU. (WS_CREDIT_GAP, Q.US.P.A.A)');
{
  const m = await descargar(enCat('bis_credito_pib_us'));
  const {filas} = forma(m);
  const ult = (await csvIndep('https://stats.bis.org/api/v2/data/dataflow/BIS/WS_CREDIT_GAP/1.0/Q.US.P.A.A?format=csv&detail=dataonly&lastNObservations=1'))[0];
  const f = ult.at(-2).replace(/^(\d{4})-Q([1-4])$/, (_, y, q) => `${y}-${String((+q - 1) * 3 + 1).padStart(2, '0')}-01`);
  ok(f === filas.at(-1)[0] && ult.at(-1) === filas.at(-1)[1], `último (${ult.at(-2)}: ${ult.at(-1)}) coincide con la fuente, cadena exacta`);
  ok(filas.every((r) => /^\d{4}-(01|04|07|10)-01$/.test(r[0])), 'todas las fechas son inicio de trimestre');
}
console.log('\nBCE · tipo de cambio de referencia USD por EUR (EXR, mensual)');
{
  const m = await descargar(enCat('bce_eur_usd_m'));
  const {filas, meta} = forma(m);
  const ult = (await csvIndep('https://data-api.ecb.europa.eu/service/data/EXR/M.USD.EUR.SP00.A?format=csvdata&detail=dataonly&lastNObservations=1'))[0];
  ok(`${ult.at(-2)}-01` === filas.at(-1)[0] && ult.at(-1) === filas.at(-1)[1], `último (${ult.at(-2)}: ${ult.at(-1)}) coincide con la fuente, cadena exacta (sin modificar, como exige el BCE)`);
  ok(meta.fuente.cita === 'Source: ECB statistics' && /ECB statistics/.test(meta.fuente.corto), 'cita literal «Source: ECB statistics» y el pie «Fuente» la lleva');
}
console.log('\nBCE · curva de rendimientos AAA a 10 años (YC)');
{
  const m = await descargar(enCat('bce_curva_aaa_10y'));
  const {filas} = forma(m);
  const ult = (await csvIndep('https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y?format=csvdata&detail=dataonly&lastNObservations=1'))[0];
  ok(ult.at(-2) === filas.at(-1)[0] && ult.at(-1) === filas.at(-1)[1], `último (${ult.at(-2)}: ${ult.at(-1)}) coincide con la fuente, cadena exacta`);
}
await rechaza('BIS clave inexistente', () => ADAPTADORES.bis({flujo: 'WS_CBPOL', clave: 'M.ZZ'}), /HTTP 404|no es un CSV SDMX|no trajo ningún valor/);
await rechaza('BIS clave con varias series', () => ADAPTADORES.bis({flujo: 'WS_CBPOL', clave: 'M.*'}), /series distintas/);
await rechaza('BCE flujo inexistente', () => ADAPTADORES.bce({flujo: 'NOEXISTE', clave: 'A.B'}), /no es un CSV SDMX|HTTP 4/);

for (const id of ['prueba_wb_gdp_mex', 'prueba_imf_ngdp_usa', 'prueba_eu_hicp_es', 'prueba_ust_deuda', 'prueba_co_trm', 'prueba_bis_cbpol_xm', 'prueba_bis_credito_pib_us', 'prueba_bce_eur_usd_m', 'prueba_bce_curva_aaa_10y'])
  for (const ext of ['.csv', '.csv.meta.json']) fs.rmSync(new URL(`../datos/biblioteca/${id}${ext}`, import.meta.url), {force: true});
// la prueba no debe dejar rastro en catalogo/verificado.json
const rutaVer = new URL('../catalogo/verificado.json', import.meta.url), ver = JSON.parse(fs.readFileSync(rutaVer, 'utf8'));
for (const k of Object.keys(ver)) if (k.startsWith('prueba_')) delete ver[k];
fs.writeFileSync(rutaVer, JSON.stringify(ver, null, 2));

console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodos los conectores pasan');
process.exit(fallos ? 1 : 0);
