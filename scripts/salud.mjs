// `node scripts/salud.mjs` (o `npm run salud`): chequeo de SALUD del entorno y de los datos. Busca los fallos que no hacen ruido:
//   · herramientas: ffmpeg/ffprobe en el PATH con libx264 y prores_ks; navegador (Edge/Chrome) que arranque; Node ≥ 18
//   · fuentes tipográficas: Geist y Geist Mono en disco y realmente cargadas por la página de render (sin ellas el texto saldría en otra fuente, sin error)
//   · catálogo: ids duplicados, series sin fuente/licencia, CSV descargados que ya no están en el catálogo (huérfanos) o sin su .meta.json, deriva español↔inglés
//   · datos vivos: el actualizador 24/7 (catalogo/estado-vivo.json y actualizaciones.jsonl): última pasada reciente, series con errores, series que no avanzan
// Salida: una línea por chequeo (✓ ok · ! aviso · ✗ error) con la causa y qué hacer. Código 1 solo si hay ✗.
//   --rapido  omite el arranque del navegador (para el chequeo previo a subir cambios)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {RAIZ} from '../servidor/compilar.mjs';

const rapido = process.argv.includes('--rapido');
const filas = [];
const ok = (n, m = '') => filas.push(['✓', n, m]), aviso = (n, m) => filas.push(['!', n, m]), mal = (n, m) => filas.push(['✗', n, m]);
const leer = (f, def = null) => { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8')); } catch { return def; } };
const dias = (iso) => (Date.now() - new Date(iso).getTime()) / 86400000;

// ── herramientas ──
const mayor = Number(process.versions.node.split('.')[0]);
mayor >= 18 ? ok('Node', process.version) : mal('Node', `${process.version}: se necesita 18 o superior`);
for (const bin of ['ffmpeg', 'ffprobe']) {
  const r = spawnSync(bin, ['-version'], {encoding: 'utf8'});
  if (r.error || r.status !== 0) mal(bin, `no está en el PATH: sin él no se pueden exportar videos. Instálalo (winget install Gyan.FFmpeg) y reinicia la terminal.`);
  else ok(bin, (r.stdout.split('\n')[0] ?? '').slice(0, 60));
}
{
  const r = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], {encoding: 'utf8'});
  if (!r.error) for (const enc of ['libx264', 'prores_ks']) (r.stdout ?? '').includes(enc) ? ok(`codificador ${enc}`) : mal(`codificador ${enc}`, 'este ffmpeg no lo trae: el MP4 de referencia o el ProRes con alfa no saldrían. Usa la versión «full» de ffmpeg.');
}

// ── tipografías ──
for (const f of ['Geist.ttf', 'GeistMono.ttf']) {
  const p = path.join(RAIZ, 'fuentes', f);
  fs.existsSync(p) && fs.statSync(p).size > 20000 ? ok(`fuente ${f}`, `${Math.round(fs.statSync(p).size / 1024)} KB`) : mal(`fuente ${f}`, `falta o está dañada en fuentes/: el render usaría una fuente de reserva sin avisar.`);
}

// ── navegador + fuentes realmente cargadas ──
if (!rapido) {
  try {
    const {lanzarNavegador} = await import('../servidor/render.mjs'), {iniciarServidor} = await import('../servidor/web.mjs');
    const srv = await iniciarServidor(0), nav = await lanzarNavegador();
    try {
      const pag = await nav.newPage({viewport: {width: 800, height: 600}});
      await pag.goto(`http://127.0.0.1:${srv.puerto}/render.html`);
      await pag.waitForFunction(() => window.RTL_LISTO === true, null, {timeout: 20000});
      const r = await pag.evaluate(async () => { await Promise.all([document.fonts.load('800 40px Geist'), document.fonts.load('500 20px "Geist Mono"')]); return {g: document.fonts.check('800 40px Geist'), m: document.fonts.check('500 20px "Geist Mono"')}; });
      ok('navegador', 'arranca y carga la página de render');
      r.g && r.m ? ok('fuentes en la página de render', 'Geist y Geist Mono cargadas') : mal('fuentes en la página de render', 'la página no cargó Geist/Geist Mono: revisa fuentes/ y la ruta /fuentes del servidor.');
    } finally { await nav.close(); await srv.cerrar(); }
  } catch (e) { mal('navegador', `${String(e.message).split('\n')[0]} — instala Edge o Chrome.`); }
}

// ── catálogo ──
const cat = leer('catalogo/series.json', []);
if (!cat.length) mal('catálogo', 'catalogo/series.json vacío o ilegible: ejecuta npm run catalogo.');
else {
  const ids = new Set(), dup = [];
  for (const s of cat) { if (ids.has(s.id)) dup.push(s.id); ids.add(s.id); }
  dup.length ? mal('catálogo: ids duplicados', dup.slice(0, 5).join(', ')) : ok('catálogo', `${cat.length} series, sin ids duplicados`);
  const sinFuente = cat.filter((s) => !s.fuente_original || !s.licencia);
  sinFuente.length ? mal('catálogo: series sin fuente o licencia', `${sinFuente.length} (p. ej. ${sinFuente.slice(0, 3).map((s) => s.id).join(', ')}): regla de exactitud, toda serie lleva fuente.`) : ok('catálogo: fuente y licencia en todas las series');
  const en = leer('catalogo/series.en.json', null);
  if (en) { const cuenta = Array.isArray(en) ? en.length : Object.keys(en.series ?? en.en ?? en).length; cuenta >= cat.length * 0.99 ? ok('catálogo en inglés', `${cuenta} entradas`) : aviso('catálogo en inglés', `${cuenta} entradas frente a ${cat.length} en español: ejecuta node scripts/construir-ingles.mjs.`); }
  else aviso('catálogo en inglés', 'falta catalogo/series.en.json');
  const dir = path.join(RAIZ, 'datos', 'biblioteca');
  if (fs.existsSync(dir)) {
    const arch = fs.readdirSync(dir), csv = arch.filter((f) => f.endsWith('.csv')), metas = new Set(arch.filter((f) => f.endsWith('.meta.json')));
    const huerf = csv.filter((f) => !ids.has(f.slice(0, -4))), sinMeta = csv.filter((f) => !metas.has(f + '.meta.json'));
    huerf.length ? aviso('datos huérfanos', `${huerf.length} CSV en datos/biblioteca sin serie en el catálogo (p. ej. ${huerf.slice(0, 3).join(', ')}): el catálogo cambió o se renombró un id.`) : ok('datos/biblioteca', `${csv.length} series descargadas, todas en el catálogo`);
    sinMeta.length ? mal('datos sin procedencia', `${sinMeta.length} CSV sin .meta.json (p. ej. ${sinMeta.slice(0, 3).join(', ')}): sin fuente ni fecha no se puede citar.`) : ok('procedencia', 'cada CSV tiene su .meta.json');
    // vacío = solo encabezado (0 filas de datos); una fila sola puede ser legítima (p. ej. un indicador anual de un país)
    const vacios = csv.filter((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter((l) => l.trim()).length < 2);
    vacios.length ? mal('datos vacíos', `${vacios.length} CSV sin ninguna fila (p. ej. ${vacios.slice(0, 3).join(', ')}): una descarga falló en silencio; vuelve a bajarlos.`) : ok('datos: ningún CSV vacío');
  } else aviso('datos/biblioteca', 'no existe: aún no se ha descargado nada en este equipo.');
}

// ── datos vivos ──
const vivo = leer('catalogo/estado-vivo.json', null);
if (!vivo) aviso('actualizador 24/7', 'sin catalogo/estado-vivo.json: el actualizador nunca ha corrido aquí (Iniciar actualizador 24-7.bat).');
else {
  // Umbrales por serie, no globales: una descarga «vieja» depende del intervalo de su adaptador (usgs_sismos baja cada 7 días a propósito) y un dato
  // «estancado» depende de la frecuencia real de la serie (una anual solo avanza una vez al año: su último dato puede tener 11 meses y estar al día).
  const {INTERVALO_MIN} = await import('../servidor/vivo.mjs'), porId = new Map(cat.map((s) => [s.id, s]));
  const diasIntervalo = (id) => { const a = porId.get(id)?.adaptador; return (INTERVALO_MIN[a] ?? 1440) / 1440; };
  const umbralExito = (id) => Math.max(4, diasIntervalo(id) * 2 + 1);
  const diasFrecuencia = (id) => { const f = (porId.get(id)?.frecuencia ?? '').toLowerCase(); return f.startsWith('anual') ? 460 : f.startsWith('trimestral') ? 150 : f.startsWith('mensual') ? 75 : f.startsWith('semanal') ? 30 : 45; };
  const e = Object.entries(vivo), conError = e.filter(([, v]) => v.errores > 0), viejos = e.filter(([k, v]) => v.ultimoExito && dias(v.ultimoExito) > umbralExito(k));
  const ultima = e.map(([, v]) => v.ultimoIntento).filter(Boolean).sort().pop();
  ultima && dias(ultima) <= 2 ? ok('actualizador 24/7', `última pasada hace ${dias(ultima).toFixed(1)} días, ${e.length} series vivas`) : aviso('actualizador 24/7', `última pasada ${ultima ? 'hace ' + dias(ultima).toFixed(0) + ' días' : 'desconocida'}: el PC estuvo apagado o el actualizador no corre.`);
  conError.length ? aviso('series vivas con errores', `${conError.length}: ${conError.slice(0, 4).map(([k, v]) => `${k} (${v.errores})`).join(', ')}`) : ok('series vivas sin errores');
  // unas pocas atrasadas son normales (series anuales, fuentes lentas); si pasan del 10 % es que una FUENTE entera dejó de responder o cambió de formato
  const msgV = `${viejos.length} sin una descarga buena en más de su intervalo de actualización (p. ej. ${viejos.slice(0, 4).map(([k]) => k).join(', ')}): ¿la fuente cambió de formato o dejó de responder?`;
  viejos.length > e.length * 0.1 ? mal('series vivas sin éxito reciente', msgV) : viejos.length ? aviso('series vivas sin éxito reciente', msgV) : ok('series vivas con descarga reciente');
  const estancadas = e.filter(([k, v]) => v.fin && v.ultimoCambio && dias(v.ultimoCambio) > diasFrecuencia(k) && dias(v.fin) > diasFrecuencia(k));
  estancadas.length ? aviso('series que no avanzan', `${estancadas.length} sin dato nuevo según su frecuencia (anuales 460 días, trimestrales 150, mensuales 75, el resto 45) (p. ej. ${estancadas.slice(0, 3).map(([k]) => k).join(', ')}): pueden estar discontinuadas.`) : ok('series vivas avanzan');
}

for (const [i, n, m] of filas) console.log(`${i} ${n}${m ? ' — ' + m : ''}`);
const errores = filas.filter((f) => f[0] === '✗').length, avisos = filas.filter((f) => f[0] === '!').length;
console.log(`\n${errores ? '✗' : '✓'} salud: ${errores} error(es), ${avisos} aviso(s)`);
process.exit(errores ? 1 : 0);
