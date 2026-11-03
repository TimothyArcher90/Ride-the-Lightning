// Servidor HTTP local (solo 127.0.0.1) que sirve el motor, las fuentes y los archivos del proyecto.
// Lo usan el render en segundo plano y el estudio. Nada sale de la máquina.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './compilar.mjs';

const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.csv': 'text/csv; charset=utf-8'};

const RAICES = {'/motor/': 'motor', '/fuentes/': 'fuentes', '/web/': 'web', '/archivos/': '.', '/salidas/': 'salidas'};
const PERMITIDO_ARCHIVOS = ['entradas', 'datos', 'specs'];

export function servirEstatico(req, res) {
  const url = new URL(req.url, 'http://x');
  let ruta = decodeURIComponent(url.pathname);
  if (ruta === '/render.html') ruta = '/web/render.html';
  if (ruta === '/') ruta = '/web/estudio.html';
  const base = Object.keys(RAICES).find((p) => ruta.startsWith(p));
  if (!base) return false;
  const rel = ruta.slice(base.length);
  const dir = path.resolve(RAIZ, RAICES[base]);
  const abs = path.resolve(dir, rel);
  if (!abs.startsWith(dir + path.sep)) { res.writeHead(403).end('Prohibido'); return true; }
  if (base === '/archivos/' && !PERMITIDO_ARCHIVOS.includes(rel.split('/')[0])) { res.writeHead(403).end('Prohibido'); return true; }
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404).end('No existe'); return true; }
  res.writeHead(200, {'Content-Type': MIME[path.extname(abs).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
  fs.createReadStream(abs).pipe(res);
  return true;
}

export function iniciarServidor(puerto = 0, manejador = null) {
  return new Promise((ok) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (manejador && ((await manejador(req, res)) || res.headersSent)) return;
        if (!servirEstatico(req, res)) res.writeHead(404).end('No existe');
      } catch (e) { res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'}).end(String(e.stack ?? e)); }
    });
    server.listen(puerto, '127.0.0.1', () => ok({server, puerto: server.address().port, cerrar: () => new Promise((r) => server.close(r))}));
  });
}
