// Renders the example videos of the three distribution models (enjambre, cordillera, corriente), horizontal, draft quality.
// Same method as scripts/generar-galeria.mjs (videos()). Usage: node scripts/video-distribucion.mjs
import fs from 'node:fs'; import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {renderizar} from '../servidor/render.mjs';
import {CASOS, dirDatos} from './galeria-casos.mjs';
const VID = path.join(RAIZ, 'examples', 'video'), TMP = path.join(RAIZ, '.tmp', 'galeria-dist');
for (const id of ['enjambre', 'cordillera', 'corriente']) {
  const c = CASOS.find((x) => x.id === id); if (c.faltan().length) { console.log('falta', id, c.faltan()); continue; }
  const r0 = generar({...c.entrada('horizontal', dirDatos(c)), formato: 'horizontal', camara: 'documental'});
  let spec = r0.spec; if (c.ajuste) { spec = JSON.parse(JSON.stringify(spec)); c.ajuste(spec); }
  const {spec: plano, informe} = compilar(spec); if (!informe.ok) throw new Error(informe.errores[0]);
  const r = await renderizar(plano, informe, {nombre: id, calidad: 'borrador', alfa: false, salidaDir: TMP, forzar: false});
  const dest = path.join(VID, `${id}-h.mp4`); fs.copyFileSync(r.salidas.mp4, dest);
  console.log(id, plano.duracion + ' s', Math.round(fs.statSync(dest).size / 1024) + ' KB');
}
