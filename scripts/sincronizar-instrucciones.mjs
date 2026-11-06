// Mantiene CLAUDE.md, AGENTS.md y GEMINI.md IDÉNTICOS (un cambio o aprendizaje en uno se replica en los otros).
//   node scripts/sincronizar-instrucciones.mjs             copia el más reciente sobre los otros dos
//   node scripts/sincronizar-instrucciones.mjs --verificar  solo comprueba; sale con 1 si difieren (apto para CI/pruebas)
// Fuente de verdad: el archivo con la fecha de modificación más reciente. Sin red, determinista.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOMBRES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'];
const verificar = process.argv.includes('--verificar');
const rutas = NOMBRES.map((n) => path.join(RAIZ, n));
const existentes = rutas.filter((r) => fs.existsSync(r));
if (!existentes.length) { console.error('No hay CLAUDE.md, AGENTS.md ni GEMINI.md'); process.exit(1); }
const fuente = existentes.reduce((a, b) => (fs.statSync(b).mtimeMs > fs.statSync(a).mtimeMs ? b : a));
const contenido = fs.readFileSync(fuente);
const distintos = rutas.filter((r) => !fs.existsSync(r) || !fs.readFileSync(r).equals(contenido));
if (!distintos.length) { console.log(`OK: los tres archivos son idénticos (${contenido.length} bytes)`); process.exit(0); }
if (verificar) { console.error(`DIFIEREN: ${distintos.map((r) => path.basename(r)).join(', ')} (fuente: ${path.basename(fuente)})`); process.exit(1); }
for (const r of distintos) { fs.copyFileSync(fuente, r); console.log(`copiado ${path.basename(fuente)} -> ${path.basename(r)}`); }
