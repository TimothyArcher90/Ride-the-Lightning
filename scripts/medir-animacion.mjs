// Dev tool: measures how every gallery model REVEALS over time (dead time, abrupt starts, flat tails).
// Renders N frames across each case, writes <out>/<caso>/meta.json (layer window, times) and the PNGs; then run
//   python scripts/curva-animacion.py <out>
// to get, per case, the share of the final picture that is already on screen at 5/10/25/50/75/90/99 % of the layer window.
// Usage: node scripts/medir-animacion.mjs <outDir> <h|v> <n frames> [caso1,caso2,...]
import fs from 'node:fs';
import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {vistaPrevia} from '../servidor/render.mjs';
import {CASOS} from './galeria-casos.mjs';

const [outArg = '.tmp/anim', fmt = 'h', nArg = '24', solo = ''] = process.argv.slice(2);
const OUT = path.resolve(RAIZ, outArg), N = +nArg, formato = fmt === 'v' ? 'vertical' : 'horizontal', ids = solo.split(',').filter(Boolean);
for (const caso of CASOS) {
  if (ids.length && !ids.includes(caso.id)) continue;
  if (caso.faltan().length || caso.restringido) continue;
  try {
    const dir = path.join(OUT, caso.id); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(path.join(dir, 'datos'), {recursive: true});
    let spec;
    if (caso.manual) spec = caso.manual(formato, path.join(dir, 'datos')); else {
      const r = generar({...caso.entrada(formato, path.join(dir, 'datos')), formato, camara: formato === 'vertical' ? 'dinamico' : 'documental'});
      spec = r.spec; if (caso.ajuste) { spec = JSON.parse(JSON.stringify(spec)); caso.ajuste(spec); }
    }
    delete spec._fuente;
    const plano = compilar(spec).spec, d = plano.duracion;
    const dato = plano.capas.filter((c) => c.t && !['titulo', 'sello', 'contador', 'llamada', 'zona', 'cortina', 'imagen'].includes(c.tipo));
    const ventana = dato.length ? [Math.min(...dato.map((c) => c.t[0])), Math.max(...dato.map((c) => c.t[1]))] : [0.5, d - 1];
    const ts = Array.from({length: N}, (_, i) => +(ventana[0] - 0.4 + (ventana[1] - ventana[0] + 1.2) * (i / (N - 1))).toFixed(3)).map((t) => Math.max(0, Math.min(d - 0.05, t)));
    await vistaPrevia(plano, [...ts, +(d - 0.3).toFixed(2)], {dir, nombre: 'f', escala: 0.18});
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({id: caso.id, tipos: dato.map((c) => c.tipo), ventana, ts, duracion: d, final: +(d - 0.3).toFixed(2)}));
    console.log(`✓ ${caso.id} ventana ${ventana.map((x) => x.toFixed(1)).join('–')}`);
  } catch (e) { console.log(`✗ ${caso.id}: ${e.message}`); }
}
