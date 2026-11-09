// Dev tool: frame strips of gallery cases at several instants, to judge animation (dead time, abrupt starts) and label placement.
// Usage: node scripts/tira-cuadros.mjs <outDir> <formato h|v> <n frames> [caso1,caso2,...]
// Writes <outDir>/<caso>-<h|v>.jpg (n frames side by side, scaled) and never touches examples/ or docs/.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {vistaPrevia} from '../servidor/render.mjs';
import {CASOS} from './galeria-casos.mjs';

const [outArg = '.tmp/tiras', fmt = 'h', nArg = '6', solo = ''] = process.argv.slice(2);
const OUT = path.resolve(RAIZ, outArg), N = +nArg, formato = fmt === 'v' ? 'vertical' : 'horizontal', ids = solo.split(',').filter(Boolean);
fs.mkdirSync(OUT, {recursive: true});
for (const caso of CASOS) {
  if (ids.length && !ids.includes(caso.id)) continue;
  if (caso.faltan().length || caso.restringido) { console.log(`- ${caso.id}: skipped`); continue; }
  try {
    const dir = path.join(OUT, '_datos', caso.id); fs.mkdirSync(dir, {recursive: true});
    let spec;
    if (caso.manual) spec = caso.manual(formato, dir); else {
      const r = generar({...caso.entrada(formato, dir), formato, camara: formato === 'vertical' ? 'dinamico' : 'documental'});
      spec = r.spec; if (caso.ajuste) { spec = JSON.parse(JSON.stringify(spec)); caso.ajuste(spec); }
    }
    delete spec._fuente;
    const plano = compilar(spec).spec, d = plano.duracion;
    const ts = Array.from({length: N}, (_, i) => +(0.4 + (d - 0.7) * (i / (N - 1)) ** 1.0).toFixed(2));
    const fr = await vistaPrevia(plano, ts, {dir: path.join(OUT, '_fr', caso.id), nombre: caso.id, escala: +(process.env.RTL_ESC ?? 0.3)});
    const lista = path.join(OUT, '_fr', `${caso.id}.txt`);
    const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...fr.flatMap((f) => ['-i', f]), '-filter_complex', `hstack=inputs=${fr.length}`, '-q:v', '3', path.join(OUT, `${caso.id}-${fmt}.jpg`)]);
    console.log(`${r.status === 0 ? '✓' : '✗'} ${caso.id} (${ts.join(', ')})`);
  } catch (e) { console.log(`✗ ${caso.id}: ${e.message}`); }
}
