// El cierre de marca es DETERMINISTA: toda pieza compilada queda `hold` s quieta y su MP4 termina en el video de cierre de MacroWise (horizontal y vertical).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
delete process.env.RTL_SIN_CIERRE;
const {compilar, RAIZ, configCierre} = await import('../servidor/compilar.mjs');
const {anexarCierre} = await import('../servidor/render.mjs');
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const cfg = configCierre();
const dir = path.join(RAIZ, '.tmp', 'prueba-cierre'); fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 's.csv'), ['fecha,v', '2020-01-01,1', '2020-02-01,2', '2020-03-01,3', '2020-04-01,2', ''].join('\n'));
const base = (extra = {}) => ({version: 1, titulo: 'Prueba', formato: 'horizontal', fps: 30, duracion: 10, ...extra, datos: {d: {archivo: '.tmp/prueba-cierre/s.csv', x: 'fecha', tipoX: 'fecha', columnas: [{col: 'v', nombre: 'Serie', color: 'oro', unidad: 'puntos'}], fuente: {nombre: 'Prueba', corto: 'Prueba', obtenido: '2026-11-09', licencia: 'Dominio público'}}},
  capas: [{tipo: 'titulo', texto: 'Prueba', t: [0.2, 9.5]}, {tipo: 'linea', id: 'g', datos: 'd', t: [0.5, 6]}]});
const dur = (f) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).stdout.trim());
const dim = (f) => spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], {encoding: 'utf8'}).stdout.trim();

console.log('Cierre de marca determinista');
ok(cfg && cfg.activo && cfg.hold >= 5, 'marca/cierre.json activo y con hold ≥ 5 s');
ok(fs.existsSync(path.join(RAIZ, cfg.h)) && fs.existsSync(path.join(RAIZ, cfg.v)), 'existen los videos de cierre horizontal y vertical');
ok(dim(path.join(RAIZ, cfg.h)) === '1920,1080' && dim(path.join(RAIZ, cfg.v)) === '1080,1920', 'horizontal 1920x1080 y vertical 1080x1920');
// negro mate TOTAL: fuera del logo no puede haber bandas grises (el original traía RGB 3-4 en bandas; se limpia a 0). Máximo permitido en el clip suelto: 2 (ruido del codec, invisible); tras anexarlo debe ser 0.
const maxFondo = (f, w, h, t) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', f, '-vf', `crop=${w}:200:0:0,format=rgb24`, '-frames:v', '1', '-f', 'rawvideo', '-'], {maxBuffer: 1 << 26}); const b = r.stdout; let m = 0; for (let i = 0; i < b.length; i++) if (b[i] > m) m = b[i]; return m; };
for (const [n, w, h] of [['h', 1920, 1080], ['v', 1080, 1920]]) { const m = [0.3, 1.5, 3, 4.5, 5.5].map((t) => maxFondo(path.join(RAIZ, n === 'h' ? cfg.h : cfg.v), w, h, t)); ok(Math.max(...m) <= 2, `cierre ${n === 'h' ? 'horizontal' : 'vertical'}: fondo negro mate (máx RGB ${Math.max(...m)} ≤ 2, sin bandas grises)`); }
const a = compilar(base());
ok(a.informe.ok && a.spec.duracion === 10 + cfg.hold, 'una pieza cualquiera compila y su duración crece hold (' + a.spec.duracion + ' s)');
ok(a.spec.capas.find((k) => k.tipo === 'titulo').t[1] === 9.5 + cfg.hold, 'las capas que duraban hasta el final se prolongan (la imagen final no se apaga)');
const off = compilar(base({cierre: false}));
ok(off.spec.duracion === 10 && off.spec.cierre === false, 'cierre:false lo desactiva (sin hold y marcado para el render)');
ok(compilar(a.spec).spec.duracion === a.spec.duracion, 'idempotente: recompilar no lo alarga otra vez');
// anexado real con videos sintéticos (horizontal y vertical): duración = D0 + clip − fundido, mismo tamaño, con pista de audio
for (const [nombre, w, h, plano] of [['h', 1920, 1080, {ancho: 1920, alto: 1080}], ['v', 1080, 1920, {ancho: 1080, alto: 1920}]]) {
  const mp4 = path.join(dir, `s_${nombre}.mp4`);
  spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `testsrc2=s=${w}x${h}:r=30:d=3`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', mp4]);
  const r = anexarCierre(mp4, {...plano, fps: 30, duracion: 3}, 'borrador');
  const esperado = 3 + dur(path.join(RAIZ, nombre === 'h' ? cfg.h : cfg.v)) - cfg.fundido;
  ok(r.anexado && Math.abs(dur(mp4) - esperado) < 0.15 && dim(mp4) === `${w},${h}`, `${nombre === 'h' ? 'horizontal' : 'vertical'}: anexa el cierre (${dur(mp4).toFixed(2)} s ≈ ${esperado.toFixed(2)} s, ${dim(mp4)})`);
  const au = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', mp4], {encoding: 'utf8'}).stdout.trim();
  ok(au === 'aac', `${nombre === 'h' ? 'horizontal' : 'vertical'}: lleva pista de audio (${au})`);
}
process.env.RTL_SIN_CIERRE = '1';
ok(anexarCierre(path.join(dir, 's_h.mp4'), {ancho: 1920, alto: 1080, fps: 30, duracion: 3}).anexado === false, 'RTL_SIN_CIERRE=1 lo apaga (solo pruebas)');
fs.rmSync(dir, {recursive: true, force: true});
console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodas las pruebas del cierre pasan');
process.exit(fallos ? 1 : 0);
