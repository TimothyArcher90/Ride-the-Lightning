// Pruebas: (1) el mismo dato en 9 formatos da exactamente las mismas tablas; (2) las reglas de exactitud rechazan lo dudoso;
// (3) los 5 tipos de gráfica compilan y se dibujan. Los datos son SINTÉTICOS y se rotulan como fixture: no se publican.
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {vistaPrevia} from '../servidor/render.mjs';

const dir = path.join(RAIZ, '.tmp', 'prueba'); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };

// ── datos de referencia ──
const N = 36, fechas = Array.from({length: N}, (_, i) => new Date(Date.UTC(2020, i, 1)));
const A = fechas.map((_, i) => 1000 + i * 12.5 + Math.sin(i / 3) * 40), B = fechas.map((_, i) => 50 + i * 0.75 + Math.cos(i / 4) * 3), C = fechas.map((_, i) => 1234.5 + (i % 7) * 100.25);
const aoa = [['Fecha', 'Alfa', 'Beta', 'Gamma'], ...fechas.map((d, i) => [d, A[i], B[i], C[i]])];
const serial = (d) => (d.getTime() - Date.UTC(1899, 11, 30)) / 86400000;   // número de serie de Excel (fecha civil, sin zona horaria)
const iso = (d) => d.toISOString().slice(0, 10);
const FUENTE = {nombre: 'Fixture sintético de prueba (no es un dato real)', url: '', obtenido: '2026-11-03'};
const specDe = (archivo, extra = {}) => ({version: 1, datos: {d: {archivo: path.relative(RAIZ, archivo).replace(/\\/g, '/'), x: 'Fecha', tipoX: 'fecha', fuente: FUENTE, columnas: [{col: 'Alfa'}, {col: 'Beta'}, {col: 'Gamma'}], ...extra}}, capas: [{tipo: 'linea', datos: 'd'}]});

// ── 1. formatos ──
console.log('\n1) Mismo dato, nueve formatos');
const libro = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa.map((r, i) => (i ? [serial(r[0]), r[1], r[2], r[3]] : r)));
for (let r = 2; r <= N + 1; r++) ws['A' + r].z = 'yyyy-mm-dd';   // celdas de fecha reales de Excel
ws['!cols'] = [{wch: 12}]; XLSX.utils.book_append_sheet(libro, ws, 'Datos');
const archivos = {};
for (const [ext, tipo] of [['xlsx', 'xlsx'], ['xls', 'biff8'], ['xlsb', 'xlsb'], ['ods', 'ods']]) { const f = path.join(dir, `datos.${ext}`); XLSX.writeFile(libro, f, {bookType: tipo}); archivos[ext] = {f, extra: ext === 'ods' ? {fechaSerial: true} : {}}; }   // el escritor ODS de SheetJS no guarda el formato de fecha: serial declarado
ok(compilar(specDe(path.join(dir, 'datos.ods'))).informe.errores.some((e) => /fechaSerial/.test(e)), 'números en la columna de fechas sin declarar → ERROR con la pista fechaSerial (no adivina)');
fs.writeFileSync(path.join(dir, 'datos.csv'), aoa.map((r, i) => (i ? [iso(r[0]), r[1], r[2], r[3]] : r).join(',')).join('\n')); archivos.csv = {f: path.join(dir, 'datos.csv'), extra: {}};
fs.writeFileSync(path.join(dir, 'datos.tsv'), aoa.map((r, i) => (i ? [iso(r[0]), r[1], r[2], r[3]] : r).join('\t')).join('\n')); archivos.tsv = {f: path.join(dir, 'datos.tsv'), extra: {}};
const coma = (v) => String(v).replace('.', ','); const miles = (v) => { const [e, d] = v.toFixed(9).split('.'); return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d; };
fs.writeFileSync(path.join(dir, 'es.csv'), '﻿' + aoa.map((r, i) => (i ? [iso(r[0]).split('-').reverse().join('/'), miles(r[1]), miles(r[2]), miles(r[3])] : r).join(';')).join('\n')); archivos.es = {f: path.join(dir, 'es.csv'), extra: {decimal: ',', formatoFecha: 'dmy'}};
fs.writeFileSync(path.join(dir, 'datos.json'), JSON.stringify(aoa.slice(1).map((r) => ({Fecha: iso(r[0]), Alfa: r[1], Beta: r[2], Gamma: r[3]})))); archivos.json = {f: path.join(dir, 'datos.json'), extra: {}};
const ref = compilar(specDe(archivos.csv.f)).spec.tablas.d;
for (const [nombre, {f, extra}] of Object.entries(archivos)) {
  const {spec, informe} = compilar(specDe(f, extra));
  if (!informe.ok) { ok(false, `${nombre}: ${informe.errores[0]}`); continue; }
  const t = spec.tablas.d;
  const mismo = t.x.length === ref.x.length && t.x.every((v, i) => v === ref.x[i]) && t.series.every((s, k) => s.y.every((v, i) => Math.abs(v - ref.series[k].y[i]) < 1e-6));
  ok(mismo, `${nombre.padEnd(5)} → ${t.x.length} filas, fechas y valores idénticos a la referencia`);
}

// ── 2. reglas de exactitud ──
console.log('\n2) Reglas de exactitud');
const tiene = (s, re) => compilar(s).informe.errores.some((e) => re.test(e));
fs.writeFileSync(path.join(dir, 'amb.csv'), 'Fecha,Alfa\n03/04/2020,1\n04/04/2020,2\n05/04/2020,3\n'); // 03/04 ambigua
ok(tiene({datos: {d: {archivo: '.tmp/prueba/amb.csv', x: 'Fecha', fuente: FUENTE, columnas: [{col: 'Alfa'}]}}, capas: []}, /ambigua/), 'fecha ambigua 03/04/2020 sin formatoFecha → ERROR');
fs.writeFileSync(path.join(dir, 'txt.csv'), 'Fecha,Alfa\n2020-01-01,1\n2020-02-01,abc\n2020-03-01,3\n');
ok(tiene({datos: {d: {archivo: '.tmp/prueba/txt.csv', x: 'Fecha', fuente: FUENTE, columnas: [{col: 'Alfa'}]}}, capas: []}, /fila 3.*abc/), 'texto "abc" en columna numérica → ERROR con su fila');
const base = specDe(archivos.csv.f);
ok(tiene({...base, datos: {d: {...base.datos.d, fuente: undefined}}}, /sin fuente/), 'serie sin fuente → ERROR');
ok(tiene({...base, capas: [{tipo: 'linea', id: 'g', datos: 'd'}, {tipo: 'titulo', texto: 'Subió un 40 %'}]}, /número escrito a mano/), 'cifra escrita a mano en un texto → ERROR');
ok(compilar({...base, capas: [{tipo: 'linea', id: 'g', datos: 'd'}, {tipo: 'titulo', texto: 'Subió {pct:12}'}]}).informe.ok, 'la misma idea con marcador {pct:12} → compila');
ok(tiene({...base, capas: [{tipo: 'linea', id: 'g', datos: 'd'}, {tipo: 'llamada', capa: 'g', ancla: {fecha: '2031-01-01'}, texto: 'x'}]}, /no hay dato cerca/), 'ancla en fecha sin datos (2031) → ERROR, no inventa el punto');
ok(compilar(specDe(archivos.csv.f, {desde: '2021-01'})).informe.avisos.some((a) => /RECORTADA/.test(a)), 'recortar la serie con "desde" → aviso explícito');

// ── 3. los 5 tipos de gráfica ──
console.log('\n3) Cinco tipos de gráfica (fixtures sintéticos)');
const wide = ['Año,Brasil,Chile,Colombia,México,Perú,Argentina', ...Array.from({length: 21}, (_, i) => [`${2000 + i}-01-01`, ...[100, 80, 70, 120, 40, 90].map((b, k) => (b * (1 + (i * (0.03 + k * 0.012)) + Math.sin(i + k) * 0.08)).toFixed(2))].join(','))].join('\n');
fs.writeFileSync(path.join(dir, 'carrera.csv'), wide);
fs.writeFileSync(path.join(dir, 'cats.csv'), 'Pais,Valor\nBrasil,12.4\nChile,8.1\nColombia,-3.2\nMéxico,15.9\nPerú,4.4\nArgentina,-6.7\n');
fs.writeFileSync(path.join(dir, 'xy.csv'), 'X,Y\n' + Array.from({length: 60}, (_, i) => `${(i * 0.7 + Math.sin(i) * 2).toFixed(3)},${(3 + i * 0.5 + Math.cos(i * 1.7) * 4).toFixed(3)}`).join('\n'));
const cols = (names) => names.map((n, i) => ({col: n, nombre: n, color: ['oro', 'teal', 'purpura', 'piedra'][i % 4], decimales: 1, unidad: 'unidades de prueba'}));
const T = 6;
const spec5 = {version: 1, titulo: 'prueba', formato: 'horizontal', fps: 30, duracion: 7, datos: {
    c: {archivo: '.tmp/prueba/carrera.csv', x: 'Año', tipoX: 'fecha', fuente: FUENTE, columnas: cols(['Brasil', 'Chile', 'Colombia', 'México', 'Perú', 'Argentina'])},
    k: {archivo: '.tmp/prueba/cats.csv', x: 'Pais', tipoX: 'cat', fuente: FUENTE, columnas: cols(['Valor'])},
    xy: {archivo: '.tmp/prueba/xy.csv', x: 'X', tipoX: 'num', fuente: FUENTE, columnas: cols(['Y'])}},
  capas: [
    {tipo: 'titulo', texto: 'Prueba de {n} tipos', t: [0, 5]},
  ]};
const casos = [
  ['carrera', {tipo: 'carrera', datos: 'c', top: 6, t: [0.3, 6], formatoX: 'anio'}],
  ['barras', {tipo: 'barras', datos: 'k', orientacion: 'h', orden: 'desc', colorSigno: true, t: [0.3, 3]}],
  ['dispersion', {tipo: 'dispersion', datos: 'xy', t: [0.3, 3], etiquetaX: 'variable x', etiquetaY: 'variable y'}],
  ['calor', {tipo: 'calor', datos: 'c', t: [0.3, 3]}],
];
for (const [nombre, capa] of casos) {
  const s = {...spec5, capas: [{tipo: 'titulo', texto: `Prueba · ${nombre}`, t: [0, 5]}, capa]};
  const {spec, informe} = compilar(s);
  if (!informe.ok) { ok(false, `${nombre}: ${informe.errores.join(' | ')}`); continue; }
  const f = await vistaPrevia(spec, [nombre === 'carrera' ? 4 : 5], {dir: path.join(dir, 'vistas'), nombre, escala: 0.5});
  ok(fs.statSync(f[0]).size > 15000, `${nombre}: compila y se dibuja (${path.relative(RAIZ, f[0])})`);
}
console.log(fallos ? `\n✗ ${fallos} prueba(s) fallaron` : '\n✓ todas las pruebas pasaron');
process.exit(fallos ? 1 : 0);
