// Funde las series de servidor/ampliacion.mjs en catalogo/series.json SIN tocar las previas (ni las de país, que genera construir-paises.mjs).
// Idempotente: las entradas añadidas por este script llevan `ampliacion: "<fecha>"`; al repetirlo se reemplazan solo esas.
// Si un id de la ampliación ya existe en el catálogo previo, se respeta la entrada previa (no se sobrescribe).
import fs from 'node:fs';
import {rutaCatalogo} from '../servidor/catalogo.mjs';
import {entradasAmpliacion} from '../servidor/ampliacion.mjs';

const FECHA = '2026-11-04';
const prev = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8')).filter((e) => !e.ampliacion);
const ids = new Set(prev.map((e) => e.id)), nuevas = [], saltadas = [];
for (const e of entradasAmpliacion()) {
  if (ids.has(e.id)) { saltadas.push(e.id); continue; }
  ids.add(e.id); nuevas.push({...e, ampliacion: FECHA});
}
const campos = ['id', 'nombre', 'categoria', 'adaptador', 'args', 'unidad', 'frecuencia', 'fuente_original', 'fuente_corto', 'licencia'];
for (const e of nuevas) for (const c of campos) if (e[c] === undefined || e[c] === '') throw new Error(`${e.id}: falta ${c}`);
fs.writeFileSync(rutaCatalogo, JSON.stringify([...prev, ...nuevas], null, 2));
console.log(`catálogo: ${prev.length} previas + ${nuevas.length} de la ampliación = ${prev.length + nuevas.length}` + (saltadas.length ? ` · ya existían (respetadas): ${saltadas.join(', ')}` : ''));
const por = {}; for (const e of nuevas) por[e.adaptador] = (por[e.adaptador] ?? 0) + 1; console.log(por);
