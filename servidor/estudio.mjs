// Estudio local: `npm run iniciar`. Solo escucha en 127.0.0.1; los datos y los renders no salen de este equipo.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import crypto from 'node:crypto';
import {iniciarServidor} from './web.mjs';
import {compilar, RAIZ, rutaSegura} from './compilar.mjs';
import {renderizar} from './render.mjs';
import {buscar, descargar, leerCatalogo} from './catalogo.mjs';
import {inspeccionar, FORMATOS} from './datos.mjs';
import {iniciarVivo, eventos, estadoVivo} from './vivo.mjs';

const PUERTO = Number(process.env.RTL_PUERTO ?? 5180);
const trabajos = new Map();
const json = (res, obj, code = 200) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(obj)); return true; };
const cuerpo = (req, max = 200e6) => new Promise((ok, mal) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > max) { mal(new Error('Archivo demasiado grande')); req.destroy(); } else c.push(d); }); req.on('end', () => ok(Buffer.concat(c))); req.on('error', mal); });
const nombreSeguro = (n) => String(n).replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 120);

async function api(req, res) {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return false;
  const q = url.searchParams;
  try {
    switch (url.pathname) {
      case '/api/specs': return json(res, fs.readdirSync(path.join(RAIZ, 'specs')).filter((f) => f.endsWith('.json')));
      case '/api/spec': {
        const f = rutaSegura(path.join('specs', nombreSeguro(q.get('n'))));
        if (req.method === 'POST') { fs.writeFileSync(f, (await cuerpo(req)).toString('utf8')); return json(res, {ok: true}); }
        return json(res, JSON.parse(fs.readFileSync(f, 'utf8')));
      }
      case '/api/compilar': { const spec = JSON.parse((await cuerpo(req)).toString('utf8')); return json(res, compilar(spec)); }
      case '/api/catalogo': return json(res, buscar(q.get('q') ?? ''));
      case '/api/bajar': {
        const e = leerCatalogo().find((x) => x.id === q.get('id')); if (!e) return json(res, {error: 'No está en el catálogo'}, 404);
        const m = await descargar(e);
        return json(res, {archivo: path.relative(RAIZ, m.archivo).replace(/\\/g, '/'), meta: m, columnas: fs.readFileSync(m.archivo, 'utf8').split('\n')[0].split(',')});
      }
      case '/api/entradas': {
        const ls = (d) => (fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d)).filter((f) => !f.endsWith('.meta.json') && f !== '.gitkeep').map((f) => `${d}/${f}`) : []);
        return json(res, {entradas: ls('entradas'), biblioteca: ls('datos/biblioteca')});
      }
      case '/api/subir': {
        const n = nombreSeguro(q.get('nombre') ?? 'archivo'), ext = path.extname(n).toLowerCase();
        const IMG = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
        if (![...FORMATOS, ...IMG].includes(ext)) return json(res, {error: `Formato no admitido: ${ext}. Datos: ${FORMATOS.join(' ')} · Imágenes: ${IMG.join(' ')}`}, 400);
        fs.mkdirSync(path.join(RAIZ, 'entradas'), {recursive: true});
        const dest = path.join(RAIZ, 'entradas', n);
        fs.writeFileSync(dest, await cuerpo(req));
        const rel = `entradas/${n}`;
        return json(res, IMG.includes(ext) ? {ruta: rel, tipo: 'imagen'} : {ruta: rel, tipo: 'datos', inspeccion: inspeccionar(dest, {})});
      }
      case '/api/inspeccionar': return json(res, inspeccionar(rutaSegura(q.get('archivo')), {hoja: q.get('hoja') || undefined, filaEncabezado: q.get('fila') ? +q.get('fila') : undefined}));
      case '/api/render': {
        const {spec: s, calidad = 'borrador', alfa = false, nombre} = JSON.parse((await cuerpo(req)).toString('utf8'));
        const {spec, informe} = compilar(s);
        if (!informe.ok) return json(res, {error: 'La spec no compila', informe}, 400);
        const id = crypto.randomBytes(4).toString('hex'), t = {id, estado: 'en curso', progreso: null};
        trabajos.set(id, t);
        renderizar(spec, informe, {nombre: nombre ?? s.titulo, calidad, alfa, onProgreso: (p) => (t.progreso = p)})
          .then((r) => Object.assign(t, {estado: 'listo', resultado: r})).catch((e) => Object.assign(t, {estado: 'error', error: String(e.message ?? e)}));
        return json(res, {id});
      }
      case '/api/vivo': return json(res, estadoVivo());
      case '/api/eventos': {
        res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive'});
        const f = (ev) => (e) => res.write(`event: ${ev}\ndata: ${JSON.stringify(e)}\n\n`), tipos = ['serie', 'derivado', 'render-inicio', 'render', 'error'], hs = tipos.map((t) => [t, f(t)]);
        hs.forEach(([t, h]) => eventos.on(t, h)); res.write(': conectado\n\n');
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        req.on('close', () => { clearInterval(ping); hs.forEach(([t, h]) => eventos.off(t, h)); });
        return true;
      }
      case '/api/trabajo': return json(res, trabajos.get(q.get('id')) ?? {estado: 'desconocido'});
      default: return json(res, {error: 'Ruta desconocida'}, 404);
    }
  } catch (e) { return json(res, {error: String(e.message ?? e)}, 400); }
}

const {puerto} = await iniciarServidor(PUERTO, api);
const url = `http://127.0.0.1:${puerto}/`;
console.log(`Ride the Lightning · estudio en ${url}  (Ctrl+C para cerrar)`);
if (process.env.RTL_VIVO !== '0') iniciarVivo();
if (!process.env.RTL_SIN_NAVEGADOR) spawn('cmd', ['/c', 'start', '', url], {detached: true, stdio: 'ignore'}).unref();
