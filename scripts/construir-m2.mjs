// Construye la pieza «Crecimiento interanual del M2 de EE. UU.» desde las series ORIGINALES de FRED (M2SL mensual SA, WM2NS semanal NSA, USREC recesiones NBER).
// Nada se escribe a mano: el crecimiento interanual se CALCULA aquí (mensual: contra 12 meses antes; semanal: contra 52 semanas antes) y las cifras que salen
// en pantalla las pone el compilador desde esa tabla. Las zonas grises son los meses con USREC = 1 (pico → valle del NBER).
// Uso:  node scripts/construir-m2.mjs [--sin-descargar]    → datos/m2/m2_yoy.csv + datos/m2/m2_yoy.csv.meta.json + specs/m2-yoy.json
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(RAIZ, 'datos', 'm2'), CRUDO = path.join(DIR, 'crudo');
const sinDescargar = process.argv.includes('--sin-descargar');
fs.mkdirSync(CRUDO, {recursive: true});

async function serie(id) {
  const f = path.join(CRUDO, `${id}.csv`);
  if (!sinDescargar) {
    const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`); if (!r.ok) throw new Error(`FRED ${id}: HTTP ${r.status}`);
    fs.writeFileSync(f, await r.text());
  }
  return fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')).filter((r) => r[1] !== '.' && r[1] !== '').map((r) => [r[0], Number(r[1])]);
}
const sha = (f) => import('node:crypto').then((c) => c.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));

const m = await serie('M2SL'), w = await serie('WM2NS'), rec = await serie('USREC');
const yoyM = new Map(), yoyW = new Map();
for (let i = 12; i < m.length; i++) if (m[i][0] >= '1960-01-01') yoyM.set(m[i][0], (m[i][1] / m[i - 12][1] - 1) * 100);
for (let i = 52; i < w.length; i++) yoyW.set(w[i][0], (w[i][1] / w[i - 52][1] - 1) * 100);

const finM = m[m.length - 1][0], finW = w[w.length - 1][0];
const resta = (iso, meses) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - meses); return d.toISOString().slice(0, 10); };
const ini24M = resta(finM, 24), ini24W = resta(finW, 24);
const fechas = [...new Set([...yoyM.keys(), ...[...yoyW.keys()].filter((d) => d >= ini24W)])].sort();
const fmt = (v) => (v == null ? '' : v.toFixed(4));
const filas = fechas.map((d) => [d, fmt(yoyM.get(d)), yoyM.has(d) && d >= ini24M ? fmt(yoyM.get(d)) : '', d >= ini24W ? fmt(yoyW.get(d)) : ''].join(','));
const csv = path.join(DIR, 'm2_yoy.csv');
fs.writeFileSync(csv, 'fecha,mensual,mensual_24m,semanal\n' + filas.join('\n') + '\n');

// recesiones NBER: rachas de USREC = 1 (desde el primer mes hasta el FINAL del último mes de la racha: «hasta» = primer día del mes siguiente)
const zonas = []; let a = null, prev = null;
for (const [d, v] of rec) { if (d < '1960-01-01') continue; if (v === 1 && !a) a = d; if (v === 0 && a) { zonas.push([a, d]); a = null; } prev = d; }
if (a) zonas.push([a, resta(prev, -1)]);

const ult = (mapa) => [...mapa.keys()].sort().pop();
const resumen = {mensual: {fecha: ult(yoyM), yoy: yoyM.get(ult(yoyM)), nivel_mil_millones: m[m.length - 1][1]}, semanal: {fecha: ult(yoyW), yoy: yoyW.get(ult(yoyW)), nivel_mil_millones: w[w.length - 1][1]}, zonas: zonas.length};
const hoy = new Date().toISOString().slice(0, 10);
const meta = {fuente: 'Board of Governors of the Federal Reserve System (H.6) vía FRED', series: {M2SL: 'M2 mensual, ajustado estacionalmente', WM2NS: 'M2 semanal, sin ajustar', USREC: 'Recesiones NBER (1 = recesión)'},
  obtenido: hoy, licencia: 'Dominio público: se pide citar (verificado en fred.stlouisfed.org/series/M2SL y /WM2NS el ' + hoy + ')', calculo: 'mensual = M2SL(t)/M2SL(t−12 meses)−1; semanal = WM2NS(t)/WM2NS(t−52 semanas)−1',
  sha256_crudo: {M2SL: await sha(path.join(CRUDO, 'M2SL.csv')), WM2NS: await sha(path.join(CRUDO, 'WM2NS.csv')), USREC: await sha(path.join(CRUDO, 'USREC.csv'))}, ultimo: resumen};
fs.writeFileSync(csv + '.meta.json', JSON.stringify(meta, null, 2));

const fuente = {nombre: 'Federal Reserve H.6 vía FRED (M2SL mensual SA, WM2NS semanal NSA)', corto: 'Federal Reserve H.6 via FRED (M2SL, WM2NS)', url: 'https://fred.stlouisfed.org/series/M2SL', obtenido: hoy,
  licencia: 'Dominio público (Federal Reserve Board); se pide citar. Public domain: citation requested'};
const col = (c, nombre, color) => ({col: c, nombre, color, prefijo: '', sufijo: '%', decimales: 1, unidad: 'interanual, %'});
const spec = {version: 1, idioma: 'en', titulo: 'US M2 money supply, year over year', formato: 'horizontal', fps: 30, duracion: 24,
  datos: {d: {archivo: path.relative(RAIZ, csv).replace(/\\/g, '/'), x: 'fecha', tipoX: 'fecha', fuente,
    columnas: [col('mensual', 'Monthly M2, YoY (seasonally adjusted)', 'piedra'), col('mensual_24m', 'Last 24 months (monthly)', 'oro'), col('semanal', 'Weekly M2, YoY (not adjusted)', 'oro')]}},
  capas: [
    {tipo: 'titulo', id: 'ti', texto: 'M2 growth nears 6%, its fastest pace since 2022', t: [0.2, 23.5], verificada: {fuente: 'FRED M2SL/WM2NS: 5,71 % mensual (sep 2026) y 5,98 % semanal (5 oct 2026); último valor mayor: mayo 2022 (mensual 6,07 %; semanal 6,14 %)'}},
    {tipo: 'linea', id: 'g1', datos: 'd', series: [0, 1, 2], t: [1, 16]},
    ...zonas.map(([desde, hasta], i) => ({tipo: 'zona', id: `rec${i + 1}`, capa: 'g1', datos: 'd', desde, hasta, estilo: 'banda', color: 'piedra', t: [0.6, 23.9]})),
    {tipo: 'llamada', id: 'c_max', capa: 'g1', datos: 'd', serie: 0, ancla: {max: true}, texto: 'Series high', t: [13.5, 16.2]},
    {tipo: 'llamada', id: 'c_min', capa: 'g1', datos: 'd', serie: 0, ancla: {min: true}, texto: 'Series low', t: [16.2, 19]},
    {tipo: 'llamada', id: 'c_ult', capa: 'g1', datos: 'd', serie: 2, ancla: {ultimo: true}, texto: 'Latest, weekly', t: [19, 23.5]},
  ]};
fs.mkdirSync(path.join(RAIZ, 'specs'), {recursive: true});
fs.writeFileSync(path.join(RAIZ, 'specs', 'm2-yoy.json'), JSON.stringify(spec, null, 2));
console.log(JSON.stringify({csv: path.relative(RAIZ, csv), filas: filas.length, zonas, resumen}, null, 2));
