// Render determinista: navegador sin ventana (Edge/Chrome del equipo) dibuja cada fotograma del canvas y ffmpeg
// codifica. Entregables fijos: MP4 de referencia (libx264 crf 17, slow, yuv420p) y ProRes 4444 CON ALFA para
// Premiere. Los subtítulos no se queman: esta herramienta no produce ninguno.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {iniciarServidor} from './web.mjs';
import {RAIZ} from './compilar.mjs';

const CANDIDATOS = [
  ['channel', 'msedge'], ['channel', 'chrome'],
  ['path', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
  ['path', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
];
export async function lanzarNavegador() {
  const fallos = [];
  for (const [tipo, v] of CANDIDATOS) {
    try { return await chromium.launch(tipo === 'channel' ? {channel: v, headless: true} : {executablePath: v, headless: true}); }
    catch (e) { fallos.push(`${v}: ${String(e.message).split('\n')[0]}`); }
  }
  throw new Error('No encontré Edge ni Chrome para dibujar. ' + fallos.join(' | '));
}

async function abrirPagina(spec, ancho, alto, puerto, navegador) {
  const pagina = await navegador.newPage({viewport: {width: 800, height: 600}});
  pagina.on('pageerror', (e) => { throw e; });
  await pagina.goto(`http://127.0.0.1:${puerto}/render.html`);
  await pagina.waitForFunction(() => window.RTL_LISTO === true);
  await pagina.evaluate(([s, w, h]) => window.RTL.cargar(s, w, h), [spec, ancho, alto]);
  return pagina;
}

const datosPng = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

/** Vista previa: PNGs de los instantes pedidos (segundos). Con fondo, tal como se verá en el MP4. */
export async function vistaPrevia(spec, tiempos, {dir, nombre = 'vista', escala = 0.5, sinFondo = false} = {}) {
  const srv = await iniciarServidor(0), nav = await lanzarNavegador();
  try {
    const ancho = Math.round((spec.ancho * escala) / 2) * 2, alto = Math.round((spec.alto * escala) / 2) * 2;
    const pag = await abrirPagina(spec, ancho, alto, srv.puerto, nav);
    fs.mkdirSync(dir, {recursive: true});
    const out = [];
    for (const t of tiempos) {
      const url = await pag.evaluate(([tt, sf]) => { window.RTL.cuadro(tt, {sinFondo: sf}); return window.RTL.png(); }, [t, sinFondo]);
      const f = path.join(dir, `${nombre}_t${String(t).replace('.', '_')}.png`);
      fs.writeFileSync(f, datosPng(url)); out.push(f);
    }
    return out;
  } finally { await nav.close(); await srv.cerrar(); }
}

/**
 * Auditoría de textos (el equivalente al "revisar_proyecto" de Electric Eye): recorre la pieza cada 0,2 s y comprueba que
 * ningún texto pise a otro ni se salga del cuadro. Los ejes pueden tocarse entre sí; todo lo demás, no.
 */
export async function auditarColisiones(spec, {paso = 0.2} = {}) {
  const srv = await iniciarServidor(0), nav = await lanzarNavegador();
  try {
    const pag = await abrirPagina(spec, spec.ancho, spec.alto, srv.puerto, nav);
    const ts = []; for (let t = 0; t <= spec.duracion + 1e-6; t += paso) ts.push(+t.toFixed(3));
    const cuadros = await pag.evaluate((l) => window.RTL.auditar(l), ts);
    const u = Math.min(spec.ancho, spec.alto) / 1080, m = 4 * u, W = spec.ancho, H = spec.alto, ev = new Map();
    const choca = (a, b) => a[0] < b[2] - m && a[2] > b[0] + m && a[1] < b[3] - m && a[3] > b[1] + m;
    for (const {t, registro} of cuadros) {
      for (let i = 0; i < registro.length; i++) {
        const A = registro[i];
        if (A.caja[0] < -2 || A.caja[1] < -2 || A.caja[2] > W + 2 || A.caja[3] > H + 2) { const k = `fuera:${A.tipo}:${A.id ?? ''}`; (ev.get(k) ?? ev.set(k, {tipo: 'se sale del cuadro', a: A, ts: []}).get(k)).ts.push(t); }
        for (let j = i + 1; j < registro.length; j++) {
          const Bq = registro[j];
          if (A.tipo.startsWith('eje') && Bq.tipo.startsWith('eje')) continue;
          if (A.id && A.id === Bq.id && (A.tipo === 'eje-x' || A.tipo === 'eje-y')) continue;
          if (choca(A.caja, Bq.caja)) { const k = `${A.tipo}:${A.id ?? ''}|${Bq.tipo}:${Bq.id ?? ''}`; (ev.get(k) ?? ev.set(k, {tipo: 'se pisan', a: A, b: Bq, ts: []}).get(k)).ts.push(t); }
        }
      }
    }
    const problemas = [...ev.values()].map((e) => ({tipo: e.tipo, a: `${e.a.tipo}${e.a.id ? ' (' + e.a.id + ')' : ''}`, b: e.b ? `${e.b.tipo}${e.b.id ? ' (' + e.b.id + ')' : ''}` : null, desde: e.ts[0], hasta: e.ts[e.ts.length - 1]}));
    return {ok: problemas.length === 0, problemas, instantes: ts.length};
  } finally { await nav.close(); await srv.cerrar(); }
}

function siguienteVersion(dir, base) {
  fs.mkdirSync(dir, {recursive: true});
  let v = 1; while (fs.existsSync(path.join(dir, `${base}_v${v}.mp4`)) || fs.existsSync(path.join(dir, `${base}_v${v}.json`))) v++;
  return v;
}

function ffmpegArgs(tipo, fps, salida, calidad) {
  const entrada = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-'];
  if (tipo === 'mp4') {
    return [...entrada, '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-crf', calidad === 'final' ? '17' : '23', '-preset', calidad === 'final' ? 'slow' : 'veryfast',
      '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', salida];
  }
  return [...entrada, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0', salida];
}

async function pasada(spec, {tipo, salida, calidad, puerto, navegador, ancho, alto, muestras, onProgreso}) {
  const pag = await abrirPagina(spec, ancho, alto, puerto, navegador);
  const fps = spec.fps, total = Math.round(spec.duracion * fps);
  const ff = spawn('ffmpeg', ffmpegArgs(tipo, fps, salida, calidad), {stdio: ['pipe', 'ignore', 'pipe']});
  let err = ''; ff.stderr.on('data', (d) => (err += d));
  const cerrado = new Promise((ok) => ff.on('close', ok));
  ff.stdin.on('error', () => {});
  for (let i = 0; i < total; i++) {
    const url = await pag.evaluate(([t, o]) => { window.RTL.cuadro(t, o); return window.RTL.png(); }, [i / fps, {sinFondo: tipo === 'alfa', muestras, obturador: 0.4 / fps}]);
    if (!ff.stdin.write(datosPng(url))) await new Promise((r) => ff.stdin.once('drain', r));
    if (onProgreso && i % 5 === 0) onProgreso({tipo, cuadro: i + 1, total});
  }
  ff.stdin.end();
  const code = await cerrado;
  await pag.close();
  if (code !== 0) throw new Error(`ffmpeg (${tipo}) terminó con código ${code}: ${err.slice(-600)}`);
  if (onProgreso) onProgreso({tipo, cuadro: total, total});
}

export function sonda(archivo) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,pix_fmt,nb_read_frames,r_frame_rate,duration', '-of', 'json', archivo], {encoding: 'utf8'});
  try { return JSON.parse(r.stdout).streams[0]; } catch { return null; }
}

/**
 * calidad 'final' (1920×1080 o 1080×1920, 4 subfotogramas de desenfoque, crf 17 slow) | 'borrador' (mitad de tamaño, rápido).
 * alfa: además del MP4, un .mov ProRes 4444 sin fondo para montar en Premiere.
 */
export async function renderizar(spec, informe, {nombre, calidad = 'final', alfa = true, salidaDir = path.join(RAIZ, 'salidas'), onProgreso, forzar = false} = {}) {
  const aud = await auditarColisiones(spec);
  if (!aud.ok && !forzar) throw new Error('Textos que se pisan o se salen del cuadro: ' + aud.problemas.slice(0, 6).map((p) => `${p.a}${p.b ? ' × ' + p.b : ''} (${p.desde}–${p.hasta} s)`).join('; ') + '. Corrige la spec (separa llamadas en el tiempo, acorta textos) o usa forzar.');
  const base = (nombre ?? spec.titulo ?? 'grafica').replace(/[^\w.-]+/g, '_').slice(0, 60) || 'grafica';
  const dir = path.join(salidaDir, base);
  const v = siguienteVersion(dir, base), pref = path.join(dir, `${base}_v${v}`);
  const escala = calidad === 'final' ? 1 : 0.5;
  const ancho = Math.round((spec.ancho * escala) / 2) * 2, alto = Math.round((spec.alto * escala) / 2) * 2;
  const muestras = calidad === 'final' ? 16 : 1;   // máximo; el motor usa solo las que el movimiento de cámara exige
  const srv = await iniciarServidor(0), nav = await lanzarNavegador();
  const t0 = Date.now(), salidas = {};
  try {
    await pasada(spec, {tipo: 'mp4', salida: `${pref}.mp4`, calidad, puerto: srv.puerto, navegador: nav, ancho, alto, muestras, onProgreso});
    salidas.mp4 = `${pref}.mp4`;
    if (alfa) { await pasada(spec, {tipo: 'alfa', salida: `${pref}_alfa.mov`, calidad, puerto: srv.puerto, navegador: nav, ancho, alto, muestras, onProgreso}); salidas.alfa = `${pref}_alfa.mov`; }
  } finally { await nav.close(); await srv.cerrar(); }
  // contacto: 12 fotogramas repartidos, para revisar de un vistazo
  const contacto = `${pref}_contacto.png`;
  spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', salidas.mp4, '-vf', `fps=12/${spec.duracion},scale=640:-1,tile=4x3`, '-frames:v', '1', contacto]);
  if (fs.existsSync(contacto)) salidas.contacto = contacto;
  fs.writeFileSync(`${pref}.json`, JSON.stringify({generado: new Date().toISOString(), calidad, spec_compilada_titulo: spec.titulo, informe}, null, 2));
  salidas.informe = `${pref}.json`;
  const verif = {mp4: sonda(salidas.mp4), alfa: salidas.alfa ? sonda(salidas.alfa) : null};
  return {salidas, version: v, segundos: Math.round((Date.now() - t0) / 1000), verificacion: verif, cuadros: Math.round(spec.duracion * spec.fps)};
}
