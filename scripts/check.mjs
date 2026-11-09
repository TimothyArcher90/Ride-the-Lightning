// `npm run check`: corre TODAS las suites en el orden correcto (baratas primero: si falla una barata no se gasta tiempo en las pesadas),
// imprime un resumen con tiempos y sale con código distinto de 0 si algo falla.
//   node scripts/check.mjs                 todas las suites
//   node scripts/check.mjs --rapido        solo el subconjunto barato (lo que usa scripts/antes-de-subir.mjs)
//   node scripts/check.mjs --jobs=3        suites en paralelo (por defecto 2; cada suite es un proceso independiente)
//   node scripts/check.mjs --solo=idioma,hitos   solo las que contengan esos nombres
//   node scripts/check.mjs --seguir        no parar en el primer fallo (por defecto las pesadas se saltan si falla una barata)
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (n) => args.includes(n), val = (n) => (args.find((a) => a.startsWith(n + '=')) ?? '').slice(n.length + 1);
// barata = sin navegador o con pocas escenas. pesada = renderiza muchas escenas (minutos).
const SUITES = [
  {id: 'salud', archivo: 'salud.mjs', args: ['--rapido'], rapida: true},
  {id: 'prueba', archivo: 'prueba.mjs', rapida: true},
  {id: 'tablas', archivo: 'prueba-tablas.mjs', rapida: true},
  {id: 'hitos', archivo: 'prueba-hitos.mjs', rapida: true},
  {id: 'catalogo-ingles', archivo: 'prueba-catalogo-ingles.mjs', rapida: true},
  {id: 'ui-idioma', archivo: 'prueba-ui-idioma.mjs', rapida: true},
  {id: 'paises', archivo: 'prueba-paises.mjs', rapida: true},
  {id: 'cierre', archivo: 'prueba-cierre.mjs', rapida: true},
  {id: 'loess', archivo: 'prueba-loess.mjs', rapida: true},
  // pesadas (≈ 2-3 min cada una: renderizan decenas de escenas); van de más lenta a más rápida para que con --jobs el reparto sea parejo
  {id: 'plantillas', archivo: 'prueba-plantillas.mjs'},
  {id: 'calidad', archivo: 'prueba-calidad.mjs'},
  {id: 'visualizador', archivo: 'prueba-visualizador.mjs'},
  {id: 'idioma', archivo: 'prueba-idioma.mjs'},
  {id: 'universal', archivo: 'prueba-universal.mjs'},
];
const jobs = Math.max(1, Number(val('--jobs')) || 2), solo = val('--solo').split(',').filter(Boolean);
let lista = SUITES.filter((s) => fs.existsSync(path.join(RAIZ, 'scripts', s.archivo)));
if (flag('--rapido')) lista = lista.filter((s) => s.rapida);
if (solo.length) lista = lista.filter((s) => solo.some((x) => s.id.includes(x)));

const tiemposArchivo = path.join(RAIZ, '.tmp', 'check-tiempos.json');
let previos = {}; try { previos = JSON.parse(fs.readFileSync(tiemposArchivo, 'utf8')); } catch {}
const correr = (s) => new Promise((ok) => {
  const t0 = Date.now(); let out = '';
  const p = spawn(process.execPath, [path.join('scripts', s.archivo), ...(s.args ?? [])], {cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, RTL_SIN_CIERRE: '1'}});
  p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  p.on('close', (code) => ok({...s, code, seg: (Date.now() - t0) / 1000, out}));
  p.on('error', (e) => ok({...s, code: 1, seg: 0, out: String(e)}));
});

const resultados = [], pendientes = [...lista];
let fallo = false;
async function trabajador() {
  while (pendientes.length) {
    if (fallo && !flag('--seguir') && !pendientes[0].rapida) { const s = pendientes.shift(); resultados.push({...s, code: null, seg: 0, out: ''}); continue; }
    const s = pendientes.shift(), r = await correr(s);
    resultados.push(r);
    if (r.code !== 0) { fallo = true; console.log(`\n✗ ${s.id} (código ${r.code}) — últimas líneas:\n${r.out.split('\n').slice(-25).join('\n')}\n`); }
    else console.log(`✓ ${s.id}  ${r.seg.toFixed(0)} s`);
  }
}
const t0 = Date.now();
await Promise.all(Array.from({length: jobs}, trabajador));
const orden = new Map(lista.map((s, i) => [s.id, i]));
resultados.sort((a, b) => orden.get(a.id) - orden.get(b.id));
console.log('\n── Resumen ──');
for (const r of resultados) console.log(`${r.code === 0 ? '✓' : r.code === null ? '·' : '✗'} ${r.id.padEnd(16)} ${r.code === null ? 'saltada (falló una anterior)' : r.seg.toFixed(0) + ' s'}`);
const malas = resultados.filter((r) => r.code !== 0 && r.code !== null);
console.log(`\n${malas.length ? '✗ FALLAN: ' + malas.map((r) => r.id).join(', ') : '✓ todo en verde'} · ${resultados.length} suites · ${((Date.now() - t0) / 1000).toFixed(0)} s en total (jobs=${jobs})`);
try { fs.mkdirSync(path.dirname(tiemposArchivo), {recursive: true}); fs.writeFileSync(tiemposArchivo, JSON.stringify({...previos, ...Object.fromEntries(resultados.filter((r) => r.code === 0).map((r) => [r.id, +r.seg.toFixed(1)]))}, null, 1)); } catch {}
process.exit(malas.length ? 1 : 0);
