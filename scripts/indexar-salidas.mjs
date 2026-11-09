// Reconstruye <destino>/INDICE_CARPETAS.md: inventario de TODO lo que hay en la carpeta de outputs (una fila por pieza; las `trimestre-*` se resumen en una sola).
// Complementa a INDICE.md (una fila por render, que escribe servidor/salidas.mjs). Uso: node scripts/indexar-salidas.mjs
import fs from 'node:fs';
import path from 'node:path';
import {salidaBase} from '../servidor/salidas.mjs';

const base = salidaBase();
const tam = (d) => { let n = 0, b = 0, m = 0; const rec = (p) => { for (const e of fs.readdirSync(p, {withFileTypes: true})) { const q = path.join(p, e.name); if (e.isDirectory()) rec(q); else { const s = fs.statSync(q); n++; b += s.size; if (s.mtimeMs > m) m = s.mtimeMs; } } }; rec(d); return {n, b, m}; };
const filas = []; let tri = {n: 0, b: 0, c: 0, m: 0};
for (const e of fs.readdirSync(base, {withFileTypes: true})) {
  if (!e.isDirectory()) continue;
  const t = tam(path.join(base, e.name));
  if (e.name.startsWith('trimestre-')) { tri.c++; tri.n += t.n; tri.b += t.b; tri.m = Math.max(tri.m, t.m); continue; }
  const vers = fs.readdirSync(path.join(base, e.name)).map((f) => /_v(\d+)\.mp4$/.exec(f)?.[1]).filter(Boolean).map(Number);
  filas.push({nombre: e.name, n: t.n, gb: t.b / 1e9, ult: vers.length ? 'v' + Math.max(...vers) : '—', fecha: new Date(t.m).toISOString().slice(0, 10)});
}
let md = `# Inventario de la carpeta de outputs de Ride the Lightning\n\nGenerado ${new Date().toISOString().slice(0, 16).replace('T', ' ')} con scripts/indexar-salidas.mjs · destino: ${base}\n\n| Pieza (carpeta) | Última versión | Archivos | Tamaño (GB) | Modificado |\n|---|---|---|---|---|\n`;
for (const f of filas.sort((a, b) => a.nombre.localeCompare(b.nombre))) md += `| ${f.nombre} | ${f.ult} | ${f.n} | ${f.gb.toFixed(2)} | ${f.fecha} |\n`;
if (tri.c) md += `| trimestre-* (${tri.c} carpetas, reportes SEC) | — | ${tri.n} | ${(tri.b / 1e9).toFixed(2)} | ${new Date(tri.m).toISOString().slice(0, 10)} |\n`;
md += '\nCada render nuevo se documenta además, fila por fila, en INDICE.md. El logo animado de MacroWise solo aparece en videos individuales que lo piden (directives/cierre_de_marca.md).\n';
fs.writeFileSync(path.join(base, 'INDICE_CARPETAS.md'), md);
console.log('OK', path.join(base, 'INDICE_CARPETAS.md'), `(${filas.length} piezas + ${tri.c} trimestres)`);
