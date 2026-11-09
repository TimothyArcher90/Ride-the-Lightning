// Cierre de marca de TODOS los videos de Ride the Lightning: marca/cierre/macrowise-cierre-h.mp4 (el original aprobado por David, 1920x1080, 5,77 s, fondo negro,
// logo MacroWise que se enfoca, reflejo y fundido) y su versión VERTICAL derivada de él (mismo movimiento, mismo reflejo, mismo audio mudo).
// El vertical coloca el logo DENTRO de la zona segura universal de reels (izq 122, der 242, arriba 269, abajo 672 sobre 1080x1920): ancho 716 px, centrado en la zona.
// El original trae el "negro" NO uniforme (bandas de RGB 3-4 arriba y abajo que se ven como barras grises): se LIMPIA a negro mate total (RGB 0) restando un piso de 10 y reescalando (sin cortes duros: el reflejo conserva su degradado).
// Uso: node scripts/construir-cierre.mjs [ruta/al/original.mp4]   (sin argumento regenera h y v desde marca/cierre/macrowise-cierre-original.mp4)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), DIR = path.join(RAIZ, 'marca', 'cierre');
const O = path.join(DIR, 'macrowise-cierre-original.mp4'), H = path.join(DIR, 'macrowise-cierre-h.mp4'), V = path.join(DIR, 'macrowise-cierre-v.mp4');
fs.mkdirSync(DIR, {recursive: true});
if (process.argv[2]) fs.copyFileSync(path.resolve(process.argv[2]), O);
const LIMPIA = "scale=in_range=tv:out_range=pc:in_color_matrix=bt709,format=gbrp,lutrgb=r='clip((val-10)*255/245,0,255)':g='clip((val-10)*255/245,0,255)':b='clip((val-10)*255/245,0,255)',scale=out_range=tv:out_color_matrix=bt709";
const enc = (vf, salida) => spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', O, '-vf', vf, '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', '30', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', salida], {encoding: 'utf8'});
// zona segura universal vertical (mw_editor/zonas.py): x 122..838, y 269..1248 → centro (480, 758.5). El contenido del original ocupa x 207..1714, y 408..800 (con el reflejo).
const ZS = {x0: 122, ancho: 716, cy: 758}, CROP = {w: 1680, h: 520, x: 120, y: 340};
const alto = Math.round(CROP.h * ZS.ancho / CROP.w / 2) * 2, y0 = Math.round(ZS.cy - alto / 2);
const vf = `crop=${CROP.w}:${CROP.h}:${CROP.x}:${CROP.y},scale=${ZS.ancho}:${alto}:flags=lanczos,${LIMPIA},pad=1080:1920:${ZS.x0}:${y0}:black,format=yuv420p`;
let r = enc(`${LIMPIA},format=yuv420p`, H); if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
r = enc(vf, V);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('OK', H, '+', V, `(logo ${ZS.ancho}x${alto} en x=${ZS.x0}, y=${y0})`);
