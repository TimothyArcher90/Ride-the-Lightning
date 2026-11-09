// Funde las series de BIS y BCE (servidor/datos_abiertos.mjs) en catalogo/series.json SIN tocar las previas y regenera el overlay inglés.
// Idempotente: las entradas añadidas llevan `abierta: "<fecha>"`; al repetirlo se reemplazan solo esas. Si un id ya existe sin esa marca, se respeta
// la entrada previa. No descarga nada (sin red): solo escribe el catálogo. Uso: node scripts/construir-abiertas.mjs [--sin-ingles]
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rutaCatalogo} from '../servidor/catalogo.mjs';
import {entradasAbiertas} from '../servidor/datos_abiertos.mjs';
import {revisarEsquema} from '../servidor/esquemas.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prev = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8')).filter((e) => !e.abierta);
const ids = new Set(prev.map((e) => e.id)), nuevas = [], saltadas = [];
for (const e of entradasAbiertas('es')) {
  if (ids.has(e.id)) { saltadas.push(e.id); continue; }
  ids.add(e.id); nuevas.push(e);
}
const campos = ['id', 'nombre', 'categoria', 'adaptador', 'args', 'unidad', 'frecuencia', 'fuente_original', 'fuente_corto', 'licencia', 'cita', 'esquema', 'licencia_estado', 'licencia_verificada', 'licencia_url'];
for (const e of nuevas) {
  for (const c of campos) if (e[c] === undefined || e[c] === '') throw new Error(`${e.id}: falta ${c}`);
  const m = revisarEsquema(e.esquema); if (m.length) throw new Error(`${e.id}: esquema inválido (${m.join(', ')})`);
  if (e.esquema.unidad !== e.unidad) throw new Error(`${e.id}: la unidad del esquema no coincide con la del catálogo`);
}
fs.writeFileSync(rutaCatalogo, JSON.stringify([...prev, ...nuevas], null, 2));
console.log(`catálogo: ${prev.length} previas + ${nuevas.length} de BIS/BCE = ${prev.length + nuevas.length}` + (saltadas.length ? ` · ya existían (respetadas): ${saltadas.join(', ')}` : ''));
if (!process.argv.includes('--sin-ingles')) {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'construir-ingles.mjs'), '--sin-informe'], {cwd: RAIZ, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
