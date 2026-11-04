// Contrasta el último dato del Banco Mundial (WDI) contra el FMI (WEO) y, para países de la UE, contra Eurostat; y la deuda del FMI contra
// Eurostat (UE) / Tesoro de EE. UU. / Banco Mundial (gobierno central, otra definición). Misma fecha de referencia (año del dato del BM).
// Escribe catalogo/verificado.json → _verificacion_paises (el resto del archivo no se toca). No interpola ni corrige datos: solo compara y avisa.
import fs from 'node:fs';
import {ADAPTADORES, rutaVerificado} from '../servidor/catalogo.mjs';
import {PAISES, actualizarUltimos} from '../servidor/paises.mjs';

const get = async (u) => { for (let k = 0; k < 4; k++) { try { const r = await fetch(u, {headers: {'User-Agent': 'RideTheLightning/0.1'}}); if (r.ok) return r.json(); } catch {} await new Promise((r) => setTimeout(r, 2000 * (k + 1))); } throw new Error('sin respuesta ' + u); };
const hoy = new Date().toISOString().slice(0, 10), tope = new Date().getUTCFullYear() - 1;
const cache = await actualizarUltimos(), ult = cache.ultimos;
const imf = {};
for (const c of ['NGDPD', 'PCPIPCH', 'LP', 'GGXWDG_NGDP']) imf[c] = (await get(`https://www.imf.org/external/datamapper/api/v1/${c}`)).values[c];
const wbGob = {};   // deuda del gobierno CENTRAL (BM): definición distinta de la del gobierno general del FMI
for (const r of (await get(`https://api.worldbank.org/v2/country/${PAISES.map((p) => p.iso3).join(';')}/indicator/GC.DOD.TOTL.GD.ZS?format=json&mrnev=1&per_page=1000`))[1] ?? []) if (r.value != null) wbGob[r.countryiso3code] = {valor: r.value, anio: +r.date};

const UE = {DEU: 'DE', FRA: 'FR', ITA: 'IT', ESP: 'ES', NLD: 'NL', POL: 'PL', IRL: 'IE', SWE: 'SE'};
const eu = async (dataset, filtros) => { const r = await ADAPTADORES.eurostat({dataset, filtros}); const f = r.filas; return Object.fromEntries(f.map(([d, v]) => [d.slice(0, 4), v])); };

const fila = (iso3, indicador, anio, bm, fmi, otra, otraNombre, unidad, umbral, tipo, extra = {}) => {
  const d = bm == null || fmi == null ? null : (tipo === 'rel' ? Math.abs(bm - fmi) / Math.abs(bm) * 100 : Math.abs(bm - fmi));
  const ve = d == null ? 'sin_comparacion' : d <= umbral[0] ? 'coincide' : d <= umbral[1] ? 'diferencia_menor' : 'discrepancia';
  return {fecha: hoy, iso3, indicador, anio, bancoMundial: bm, fmi, otraFuente: otra ?? null, otraFuenteNombre: otraNombre ?? null, unidad, diferencia: d == null ? null : +d.toFixed(3), diferenciaEn: tipo === 'rel' ? '% relativo' : 'puntos', veredicto: ve, ...extra};
};
const out = [];
for (const p of PAISES) {
  const i = p.iso3;
  // PIB (US$): WB vs FMI NGDPD (miles de millones)
  let b = ult.pib[i];
  if (b) out.push(fila(i, 'pib', b.anio, b.valor, imf.NGDPD[i]?.[b.anio] == null ? null : imf.NGDPD[i][b.anio] * 1e9, null, null, 'US$ corrientes', [1, 5], 'rel'));
  b = ult.inflacion[i];
  if (b) out.push(fila(i, 'inflacion', b.anio, b.valor, imf.PCPIPCH[i]?.[b.anio] ?? null, null, null, '% anual', [0.3, 1], 'abs'));
  b = ult.poblacion[i];
  if (b) out.push(fila(i, 'poblacion', b.anio, b.valor, imf.LP[i]?.[b.anio] == null ? null : imf.LP[i][b.anio] * 1e6, null, null, 'personas', [1, 3], 'rel'));
}
// Eurostat (UE): inflación armonizada anual media, población a 1 de enero, deuda de las administraciones públicas % PIB
for (const [iso, geo] of Object.entries(UE)) {
  const hicp = await eu('prc_hicp_aind', {geo, coicop: 'CP00', unit: 'RCH_A_AVG'}), pob = await eu('demo_pjan', {geo, freq: 'A', unit: 'NR', age: 'TOTAL', sex: 'T'}), deu = await eu('gov_10dd_edpt1', {geo, freq: 'A', unit: 'PC_GDP', sector: 'S13', na_item: 'GD'});
  const a = out.find((x) => x.iso3 === iso && x.indicador === 'inflacion'); if (a) { a.otraFuente = hicp[a.anio] ?? null; a.otraFuenteNombre = 'Eurostat IPCA (media anual, CP00)'; }
  const c = out.find((x) => x.iso3 === iso && x.indicador === 'poblacion'); if (c) { c.otraFuente = pob[c.anio] ?? null; c.otraFuenteNombre = 'Eurostat demo_pjan (1 de enero)'; }
  const anioD = ult.deuda_pib[iso]?.anio;
  if (anioD) out.push(fila(iso, 'deuda_pib', anioD, null, imf.GGXWDG_NGDP[iso]?.[anioD] ?? null, deu[anioD] ?? null, 'Eurostat gov_10dd_edpt1 (deuda de las AA. PP., % PIB)', '% del PIB', [2, 5], 'abs'));
  const d = out.at(-1); if (anioD && d.fmi != null && d.otraFuente != null) { d.diferencia = +Math.abs(d.fmi - d.otraFuente).toFixed(3); d.veredicto = d.diferencia <= 2 ? 'coincide' : d.diferencia <= 5 ? 'diferencia_menor' : 'discrepancia'; }
}
// Deuda del FMI vs gobierno central del BM (otra definición: solo orientativo, no genera aviso por sí solo)
for (const p of PAISES) {
  const i = p.iso3, g = wbGob[i]; if (UE[i] || !g || imf.GGXWDG_NGDP[i]?.[g.anio] == null) continue;
  const r = fila(i, 'deuda_pib', g.anio, null, imf.GGXWDG_NGDP[i][g.anio], g.valor, 'Banco Mundial GC.DOD.TOTL.GD.ZS (gobierno CENTRAL)', '% del PIB', [2, 5], 'abs');
  r.diferencia = +Math.abs(r.fmi - g.valor).toFixed(3); r.veredicto = 'otra_definicion'; r.nota_def = r.diferencia > 5 ? 'Difiere más de 5 puntos, pero mide el gobierno central y el FMI el general: no es un error de dato.' : 'Misma magnitud pese a ser definiciones distintas.';
  out.push(r);
}
// EE. UU.: deuda federal total (Tesoro) / PIB del BM vs deuda general bruta / PIB del FMI
{
  const t = await ADAPTADORES.tesoro({campo: 'tot_pub_debt_out_amt'}), b = ult.pib.USA, f = t.filas.filter(([d]) => d <= `${b.anio}-12-31`).pop(), ratio = Number(f[1]) / b.valor * 100;
  const r = fila('USA', 'deuda_pib', b.anio, null, imf.GGXWDG_NGDP.USA[b.anio], +ratio.toFixed(2), `Tesoro EE. UU. Debt to the Penny (${f[0]}: ${f[1]}) / PIB del BM`, '% del PIB', [2, 5], 'abs');
  r.diferencia = +Math.abs(r.fmi - ratio).toFixed(3); r.veredicto = 'otra_definicion'; r.nota_def = 'Tesoro = deuda federal bruta; FMI = gobierno general (incluye estados y municipios, netea otros conceptos).'; out.push(r);
}
// Notas visibles en la ficha solo si hay discrepancia (>umbral alto) contra una fuente de la MISMA definición
const nombreInd = {pib: 'el PIB', inflacion: 'la inflación', poblacion: 'la población', deuda_pib: 'la deuda pública'};
for (const r of out) {
  if (r.veredicto !== 'discrepancia') continue;
  const otra = r.otraFuente != null && r.indicador !== 'pib' ? ` (${r.otraFuenteNombre} da ${r.otraFuente}${Math.abs(r.otraFuente - r.fmi) <= Math.abs(r.otraFuente - r.bancoMundial) ? ', más cerca del FMI: posible diferencia de definición del índice o del año' : ''})` : '';
  if (r.indicador === 'deuda_pib') r.nota = `Verificación: para ${r.anio} Eurostat (${r.otraFuente} % del PIB) y el FMI (${r.fmi} %) difieren ${r.diferencia} puntos. Se muestra la cifra del FMI por ser la única serie homogénea de todos los países; contrastar con Eurostat antes de rotular.`;
  else r.nota = `Verificación: para ${r.anio}, ${nombreInd[r.indicador]} del Banco Mundial (${r.bancoMundial}) y la del FMI (${r.fmi}) difieren ${r.diferencia} ${r.diferenciaEn}${otra}. Se muestra la del Banco Mundial (cuentas nacionales oficiales publicadas, licencia CC BY 4.0); el FMI puede ser una estimación.`;
}
const ver = JSON.parse(fs.readFileSync(rutaVerificado, 'utf8'));
ver._verificacion_paises = {fecha: hoy, criterio: 'Misma fecha de referencia (año del dato del Banco Mundial). Umbrales — PIB y población: ≤1 % coincide, ≤3–5 % diferencia menor, más = discrepancia; inflación: ≤0,3 pp / ≤1 pp; deuda: ≤2 pp / ≤5 pp. «otra_definicion» = se compara contra una magnitud que no es la misma (gobierno central, deuda federal) y es solo orientativa.',
  licencias: {
    bancoMundial: 'CC BY 4.0 por defecto para los datasets del propio Banco (datacatalog.worldbank.org/public-licenses, leído 2026-11-04): uso comercial permitido con atribución e indicando cambios; algunos datos de terceros traen licencia propia (revisar la página del indicador).',
    fmi: 'imf.org/en/About/copyright-and-terms (leído 2026-11-04): los datos estadísticos pueden descargarse, copiarse y redistribuirse mostrando la atribución al IMF como fuente y sin alterar su naturaleza ni exactitud (toda transformación se declara); el «Contenido» solo admite uso personal no comercial y su reutilización amplia o comercial requiere permiso; la descarga sistemática/automatizada y el uso para entrenar LLM requieren permiso escrito (copyright@imf.org). Veredicto: la redistribución de cifras con cita es viable, pero el uso comercial sistemático no está autorizado sin permiso: pedirlo antes de monetizar a escala. Las series del FMI del catálogo llevan licencia que el compilador marca como restringida hasta entonces.'},
  resumen: Object.fromEntries(['pib', 'inflacion', 'poblacion', 'deuda_pib'].map((k) => [k, out.filter((r) => r.indicador === k).reduce((a, r) => (a[r.veredicto] = (a[r.veredicto] ?? 0) + 1, a), {})])),
  comparaciones: out};
fs.writeFileSync(rutaVerificado, JSON.stringify(ver, null, 2));
console.log(JSON.stringify(ver._verificacion_paises.resumen, null, 1));
for (const r of out.filter((x) => x.veredicto === 'discrepancia')) console.log(r.iso3, r.indicador, r.anio, 'BM', r.bancoMundial, 'FMI', r.fmi, 'otra', r.otraFuente, 'dif', r.diferencia, r.diferenciaEn);
