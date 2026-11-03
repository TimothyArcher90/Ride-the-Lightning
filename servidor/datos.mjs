// Ingesta de datos: CSV/TSV/TXT, JSON, XLSX/XLS/XLSB/ODS/FODS -> tabla normalizada, con reglas de exactitud.
// Principio: NUNCA se adivina. Una fecha ambigua (12/03/2020), un decimal con coma sin declarar o un texto en una
// columna numérica son ERRORES con fila y valor, no suposiciones silenciosas.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import XLSX from 'xlsx';
import {utc} from '../motor/nucleo.js';

export const FORMATOS_HOJA = ['.xlsx', '.xlsm', '.xlsb', '.xls', '.ods', '.fods'];
export const FORMATOS_TEXTO = ['.csv', '.tsv', '.txt', '.tab'];
export const FORMATOS = [...FORMATOS_HOJA, ...FORMATOS_TEXTO, '.json'];

export const hashArchivo = (ruta) => crypto.createHash('sha256').update(fs.readFileSync(ruta)).digest('hex');

const NULOS = new Set(['', '.', 'na', 'n/a', '#n/a', 'nan', 'null', 'none', '-', '--', '—', '..', '...', '…', 'n.a.', 'nd']);
const esNulo = (v) => v === null || v === undefined || (typeof v === 'string' && NULOS.has(v.trim().toLowerCase()));

function detectarDelim(txt) {
  const l = txt.split(/\r?\n/).slice(0, 8).join('\n');
  const c = {',': (l.match(/,/g) || []).length, ';': (l.match(/;/g) || []).length, '\t': (l.match(/\t/g) || []).length, '|': (l.match(/\|/g) || []).length};
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
}
function parseDelimitado(txt, delim) {
  const filas = []; let fila = [], cel = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cel += '"'; i++; } else q = false; } else cel += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { fila.push(cel); cel = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; fila.push(cel); cel = ''; if (fila.some((c) => c !== '')) filas.push(fila); fila = []; }
    else cel += ch;
  }
  fila.push(cel); if (fila.some((c) => c !== '')) filas.push(fila);
  return filas.map((f) => f.map((c) => (c === '' ? null : c)));
}
const esFormatoFecha = (z) => { const s = String(z).replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, ''); return /[dy]/i.test(s) && !/[#0]/.test(s); };
const pad = (n, l = 2) => String(n).padStart(l, '0');

function filasDeHoja(ws) {
  const r = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1');
  const out = [];
  for (let R = r.s.r; R <= r.e.r; R++) {
    const fila = [];
    for (let C = r.s.c; C <= r.e.c; C++) {
      const c = ws[XLSX.utils.encode_cell({r: R, c: C})];
      if (!c) { fila.push(null); continue; }
      if (c.t === 'n') {
        if (c.z && esFormatoFecha(c.z)) {
          const d = XLSX.SSF.parse_date_code(c.v);
          fila.push(d.H || d.M || d.S ? `${d.y}-${pad(d.m)}-${pad(d.d)}T${pad(d.H)}:${pad(d.M)}:${pad(Math.floor(d.S))}` : `${d.y}-${pad(d.m)}-${pad(d.d)}`);
        } else fila.push(c.v);
      } else if (c.t === 'd') fila.push(c.v.toISOString().slice(0, 10));
      else if (c.t === 's') fila.push(c.v);
      else if (c.t === 'b') fila.push(c.v ? 1 : 0);
      else fila.push(null);
    }
    out.push(fila);
  }
  return out;
}

/** Devuelve {columnas, filas, formato, hoja, hojas, hash, avisos}. filaEncabezado es 1-based sobre la hoja. */
export function leerTabla(ruta, {hoja, filaEncabezado} = {}) {
  if (!fs.existsSync(ruta)) throw new Error(`No existe el archivo: ${ruta}`);
  const ext = path.extname(ruta).toLowerCase();
  const avisos = [];
  let crudo, hojas = null, hojaUsada = null;
  if (ext === '.json') {
    const j = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    if (Array.isArray(j) && j.length && typeof j[0] === 'object' && !Array.isArray(j[0])) {
      const cols = [...new Set(j.flatMap((o) => Object.keys(o)))];
      crudo = [cols, ...j.map((o) => cols.map((c) => o[c] ?? null))];
    } else if (Array.isArray(j) && Array.isArray(j[0])) crudo = j;
    else if (j && typeof j === 'object') {
      const cols = Object.keys(j), n = Math.max(...cols.map((c) => j[c].length));
      crudo = [cols, ...Array.from({length: n}, (_, i) => cols.map((c) => j[c][i] ?? null))];
    } else throw new Error('JSON no reconocido: usa un arreglo de objetos, un arreglo de filas o {columna:[valores]}');
  } else if (FORMATOS_TEXTO.includes(ext)) {
    const txt = fs.readFileSync(ruta, 'utf8').replace(/^﻿/, '');
    crudo = parseDelimitado(txt, ext === '.tsv' || ext === '.tab' ? '\t' : detectarDelim(txt));
  } else if (FORMATOS_HOJA.includes(ext)) {
    const wb = XLSX.readFile(ruta, {cellNF: true, raw: true});
    hojas = wb.SheetNames;
    hojaUsada = hoja ?? hojas[0];
    if (!wb.Sheets[hojaUsada]) throw new Error(`La hoja "${hojaUsada}" no existe. Hojas: ${hojas.join(', ')}`);
    if (hojas.length > 1 && !hoja) avisos.push(`El libro tiene ${hojas.length} hojas (${hojas.join(', ')}); se usó la primera ("${hojaUsada}"). Indica "hoja" para elegir.`);
    crudo = filasDeHoja(wb.Sheets[hojaUsada]);
  } else throw new Error(`Formato no soportado: ${ext}. Admitidos: ${FORMATOS.join(' ')}`);

  let h = filaEncabezado ? filaEncabezado - 1 : crudo.findIndex((f) => f.filter((v) => !esNulo(v)).length >= 2 && f.filter((v) => !esNulo(v)).every((v) => typeof v === 'string' && Number.isNaN(Number(v))));
  if (h < 0) throw new Error('No encontré fila de encabezados (texto en todas sus celdas). Indica "filaEncabezado" (1 = primera fila).');
  if (h > 0) avisos.push(`Encabezado detectado en la fila ${h + 1}; se ignoraron ${h} fila(s) previas.`);
  const columnas = crudo[h].map((c, i) => (esNulo(c) ? `col${i + 1}` : String(c).trim()));
  const filas = crudo.slice(h + 1).filter((f) => f.some((v) => !esNulo(v)));
  return {columnas, filas, formato: ext.slice(1), hoja: hojaUsada, hojas, hash: hashArchivo(ruta), avisos, filaEncabezado: h + 1};
}

export function indiceColumna(tabla, nombre) {
  const i = tabla.columnas.findIndex((c) => c === nombre);
  if (i < 0) {
    const ci = tabla.columnas.findIndex((c) => c.toLowerCase() === String(nombre).toLowerCase());
    if (ci >= 0) return ci;
    throw new Error(`No existe la columna "${nombre}". Columnas: ${tabla.columnas.join(' | ')}`);
  }
  return i;
}

/** Números: acepta number y strings inequívocos. Con decimal=',' acepta 1.234,56. Todo lo demás es un error con su fila. */
export function columnaNumeros(tabla, col, {decimal} = {}) {
  const ci = indiceColumna(tabla, col), valores = [], invalidos = [];
  let nulos = 0;
  tabla.filas.forEach((f, k) => {
    let v = f[ci];
    if (esNulo(v)) { valores.push(null); nulos++; return; }
    if (typeof v === 'number') { valores.push(v); return; }
    let s = String(v).trim().replace(/\s/g, '').replace(/^\$|^US\$|%$/g, '');
    if (decimal === ',') s = /^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s;
    else if (decimal === '.') s = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) ? s.replace(/,/g, '') : s;
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) valores.push(Number(s));
    else { valores.push(null); invalidos.push({fila: tabla.filaEncabezado + 1 + k, valor: String(v)}); }
  });
  return {valores, nulos, invalidos};
}

/** Fecha -> ms UTC. Formatos inequívocos; los ambiguos exigen formatoFecha ('dmy'|'mdy'). */
export function parseFecha(v, {formatoFecha, anio, serial} = {}) {
  if (v === null || v === undefined) return null;
  // un número solo es fecha si el autor lo declara: años (tipoX "anio") o número de serie de Excel (fechaSerial)
  if (typeof v === 'number') return serial ? Math.round((Date.UTC(1899, 11, 30) + v * 86400000) / 1000) * 1000 : anio ? utc(v, 1, 1) : NaN;
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(-?\d{1,6})-(\d{2})(?:-(\d{2}))?(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?Z?$/))) {
    return utc(+m[1], +m[2], m[3] ? +m[3] : 1) + (m[4] ? ((+m[4]) * 3600 + (+m[5]) * 60 + (+(m[6] ?? 0))) * 1000 : 0);
  }
  if ((m = s.match(/^(\d{4})[\/.](\d{2})[\/.](\d{2})$/))) return utc(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{4})\s*M(\d{2})$/i))) return utc(+m[1], +m[2], 1);
  if ((m = s.match(/^(\d{4})\s*-?\s*Q([1-4])$/i))) return utc(+m[1], (+m[2] - 1) * 3 + 1, 1);
  if ((m = s.match(/^(-?\d{1,6})$/)) && anio) return utc(+m[1], 1, 1);
  if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/))) {
    if (formatoFecha === 'dmy') return utc(+m[3], +m[2], +m[1]);
    if (formatoFecha === 'mdy') return utc(+m[3], +m[1], +m[2]);
    if (+m[1] > 12) return utc(+m[3], +m[2], +m[1]);          // 25/03/2020 solo puede ser d/m/y
    if (+m[2] > 12) return utc(+m[3], +m[1], +m[2]);          // 03/25/2020 solo puede ser m/d/y
    throw Object.assign(new Error('ambigua'), {ambigua: true});
  }
  return NaN;
}

export function columnaFechas(tabla, col, opc = {}) {
  const ci = indiceColumna(tabla, col), valores = [], invalidos = [];
  let ambiguas = 0;
  tabla.filas.forEach((f, k) => {
    try {
      const ms = parseFecha(f[ci], opc);
      if (ms === null) { valores.push(null); return; }
      if (Number.isNaN(ms)) { valores.push(null); invalidos.push({fila: tabla.filaEncabezado + 1 + k, valor: String(f[ci])}); return; }
      valores.push(ms);
    } catch (e) {
      if (!e.ambigua) throw e;
      ambiguas++; valores.push(null);
      if (invalidos.length < 5) invalidos.push({fila: tabla.filaEncabezado + 1 + k, valor: `${f[ci]} (ambigua: d/m/a o m/d/a — declara "formatoFecha")`});
    }
  });
  return {valores, invalidos, ambiguas};
}

/** Resumen para decidir cómo usar un archivo (lo usa el MCP y el estudio). */
export function inspeccionar(ruta, opc = {}) {
  const t = leerTabla(ruta, opc);
  const cols = t.columnas.map((nombre, i) => {
    const vals = t.filas.map((f) => f[i]).filter((v) => !esNulo(v));
    const num = vals.filter((v) => typeof v === 'number').length;
    const fech = vals.filter((v) => typeof v === 'string' && /^-?\d{1,6}-\d{2}/.test(v)).length;
    const tipo = !vals.length ? 'vacía' : fech / vals.length > 0.9 ? 'fecha' : num / vals.length > 0.9 ? 'número' : 'texto';
    return {nombre, tipo, vacios: t.filas.length - vals.length, ejemplo: vals.slice(0, 3), primero: vals[0] ?? null, ultimo: vals[vals.length - 1] ?? null};
  });
  return {archivo: ruta, formato: t.formato, hoja: t.hoja, hojas: t.hojas, filas: t.filas.length, hash: t.hash, filaEncabezado: t.filaEncabezado, columnas: cols, avisos: t.avisos};
}
