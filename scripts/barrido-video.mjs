// Barrido de fotogramas de un video YA renderizado: hojas de contacto cada `paso` segundos, para MIRAR cada instante en que algo aparece, se mueve o desaparece.
// Regla (aprendida el 2026-11-09 con el M2): el auditor de colisiones mide cajas de texto; NO ve un rótulo sobre la curva ni una marca de eje bajo el año en curso.
// Antes de entregar cualquier video hay que mirar este barrido (no solo 4 fotogramas sueltos) y, donde haya un segundo con cambios, subirlo a 0,2 s.
// Uso:  node scripts/barrido-video.mjs <video.mp4> [desde=0] [hasta=duracion] [paso=1] [columnas=3]   → <video>_barrido_<desde>-<hasta>.png junto al video
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const [, , video, d = '0', h, p = '1', c = '3'] = process.argv;
if (!video) { console.log('Uso: node scripts/barrido-video.mjs <video.mp4> [desde] [hasta] [paso] [columnas]'); process.exit(1); }
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim());
const desde = Number(d), hasta = h ? Number(h) : dur, paso = Number(p), cols = Number(c);
const tiempos = []; for (let t = desde; t <= hasta + 1e-6; t += paso) tiempos.push(+t.toFixed(3));
const filas = Math.ceil(tiempos.length / cols), W = 640;
const sel = tiempos.map((t) => `eq(n,${Math.round(t * 30)})`).join('+');
const out = path.join(path.dirname(video), `${path.basename(video, path.extname(video))}_barrido_${desde}-${hasta}.png`);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `select='${sel}',scale=${W}:-1,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${filas}`, '-frames:v', '1', out], {stdio: 'inherit'});
console.log(out, tiempos.length, 'fotogramas');
