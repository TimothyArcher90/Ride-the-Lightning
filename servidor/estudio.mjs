// Estudio local: `npm run iniciar`. Solo escucha en 127.0.0.1; los datos y los renders no salen de este equipo.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, execSync} from 'node:child_process';
import crypto from 'node:crypto';
import {iniciarServidor} from './web.mjs';
import {compilar, RAIZ, rutaSegura} from './compilar.mjs';
import {renderizar} from './render.mjs';
import {buscar, descargar, leerCatalogo} from './catalogo.mjs';
import {inspeccionar, FORMATOS} from './datos.mjs';
import {iniciarVivo, eventos, estadoVivo} from './vivo.mjs';
import {salud, licencia} from './analisis.mjs';
import {PLANTILLAS, CAMARAS, analizar, generar} from './plantillas.mjs';
import {detectarTabla} from './tablas.mjs';
import {empresas as empresasCat, buscarEmpresas, asegurarEmpresa, esDestacada, leerIndice, itemTrimestre, seriesDeEmpresa, construidas as construidasLista} from './trimestres.mjs';
import {leerUniverso} from './universo.mjs';
import {chat, pararChat, reiniciarChat} from './chat.mjs';
import {recomendar} from './visualizador.mjs';

// Tablas de ejemplo (se copian a entradas/ para usarlas con un clic). Las cifras son de demostración y así se rotulan.
const EJEMPLOS = {
  flujos: {archivo: 'estado_resultados_ejemplo.csv', tabla: 'flujos', nombre: 'Estado de resultados (ejemplo)', prefijo: 'US$ ', sufijo: ' mil M', decimales: 1},
  composicion: {archivo: 'composicion_ejemplo.csv', tabla: 'categorias', nombre: 'Ingresos por línea (ejemplo)', prefijo: 'US$ ', sufijo: ' mil M', decimales: 1},
  puente: {archivo: 'puente_ejemplo.csv', tabla: 'categorias', nombre: 'De ingresos a utilidad neta (ejemplo)', prefijo: 'US$ ', sufijo: ' mil M', decimales: 1},
};
const FUENTE_EJEMPLO = 'EJEMPLO de demostración · cifras tomadas de una imagen pública de App Economy Insights, sin verificar contra el reporte oficial';

const PUERTO = Number(process.env.RTL_PUERTO ?? 5180);
const trabajos = new Map();
const json = (res, obj, code = 200) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(obj)); return true; };
const cuerpo = (req, max = 200e6) => new Promise((ok, mal) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > max) { mal(new Error('Archivo demasiado grande')); req.destroy(); } else c.push(d); }); req.on('end', () => ok(Buffer.concat(c))); req.on('error', mal); });
const nombreSeguro = (n) => String(n).replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 120);


const metaDe = (id) => { const f = path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv.meta.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
const ficha = (e) => { const m = metaDe(e.id); return {id: e.id, nombre: e.nombre, categoria: e.categoria, unidad: m?.fuente?.unidad ?? e.unidad ?? '', frecuencia: e.frecuencia, fuente: e.fuente_original, url: m?.fuente?.url ?? null, licencia: licencia(e), salud: salud(e, m),
  descargada: !!m, inicio: m?.inicio ?? null, fin: m?.fin ?? null, filas: m?.filas ?? null, etiquetas: e.etiquetas ?? [], nota: e.nota ?? null}; };
/** Descarga (historia completa) lo que falte de la biblioteca antes de usarlo: la persona nunca baja un archivo. */
const asegurar = async (series) => { const cat = leerCatalogo(); for (const s of series ?? []) if (s.origen === 'biblioteca' && !metaDe(s.id)) { const en = cat.find((x) => x.id === s.id); if (en) await descargar(en); } };

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
        if (IMG.includes(ext)) return json(res, {ruta: rel, tipo: 'imagen'});
        const insp = inspeccionar(dest, {});
        return json(res, {ruta: rel, tipo: 'datos', inspeccion: insp, tabla: detectarTabla(insp.columnas.map((c) => c.nombre))});
      }
      case '/api/ejemplo': {
        const e = EJEMPLOS[q.get('id')]; if (!e) return json(res, {error: 'Ese ejemplo no existe'}, 404);
        fs.mkdirSync(path.join(RAIZ, 'entradas'), {recursive: true});
        fs.copyFileSync(path.join(RAIZ, 'ejemplos', e.archivo), path.join(RAIZ, 'entradas', e.archivo));
        return json(res, {ruta: `entradas/${e.archivo}`, tabla: e.tabla, nombre: e.nombre, fuente: {nombre: FUENTE_EJEMPLO, obtenido: new Date().toISOString().slice(0, 10)}, prefijo: e.prefijo, sufijo: e.sufijo, decimales: e.decimales});
      }
      case '/api/empresas': {   // biblioteca de trimestres: empresas disponibles (con búsqueda simple)
        // sin texto: las 16 destacadas; con texto: búsqueda en TODA la bolsa de EE. UU. (ticker o nombre)
        return json(res, {empresas: buscarEmpresas(q.get('q') ?? ''), total: leerUniverso().length || empresasCat().length});
      }
      case '/api/trimestres': {   // trimestres de una empresa; si aún no están, se bajan de la SEC en ese momento (10-20 s)
        const t = String(q.get('ticker') ?? '').toUpperCase();
        let i; try { i = await asegurarEmpresa(t); } catch (e) { return json(res, {error: e.message}, 404); }
        return json(res, {ticker: t, nombre: i.nombre, actualizado: i.actualizado, destacada: esDestacada(t), trimestres: i.trimestres.map((x) => ({fin: x.fin, etiqueta: x.etiqueta, fy: x.fy, q: x.q, publicado: x.publicado, form: x.form, ingresos: x.ingresos, utilidadNeta: x.utilidadNeta, margenOperativo: x.margenOperativo, q4Calculado: x.q4Calculado, sankey: !!x.archivo, motivoSankey: x.motivoSankey, detalleFino: !!x.detalleFino, conSegmentos: !!x.conSegmentos, notas: x.notas})), omitidos: i.omitidos,
          sinDatos: i.trimestres.length === 0 ? 'Esta empresa no presenta ingresos, costos y utilidad operativa como una empresa industrial o de servicios (bancos, aseguradoras, fondos y empresas nuevas suelen quedar fuera). No se inventa nada.' : null});
      }
      case '/api/serie-empresa': { try { return json(res, await seriesDeEmpresa(String(q.get('ticker') ?? '').toUpperCase())); } catch (e) { return json(res, {error: e.message}, 404); } }
      case '/api/datos': {   // mapa de lo que hay: series de mercado y macro, empresas (SEC) y archivos propios
        const lsE = fs.existsSync(path.join(RAIZ, 'entradas')) ? fs.readdirSync(path.join(RAIZ, 'entradas')).filter((f) => !f.endsWith('.meta.json') && f !== '.gitkeep') : [];
        const emp = buscarEmpresas('').length, cons = construidasLista();
        return json(res, {series: {catalogo: leerCatalogo().length, descargadas: fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca')) ? fs.readdirSync(path.join(RAIZ, 'datos', 'biblioteca')).filter((f) => f.endsWith('.csv')).length : 0},
          empresas: {bolsa: leerUniverso().length, destacadas: emp, enBiblioteca: cons.length, trimestres: cons.reduce((s, t) => s + (leerIndice(t)?.trimestres.length ?? 0), 0)}, propios: lsE.length});
      }
      case '/api/trimestre': return json(res, itemTrimestre(String(q.get('ticker')).toUpperCase(), q.get('fin'), q.get('uso') === 'puente' ? 'puente' : 'sankey'));
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
      case '/api/chat': { const b = JSON.parse((await cuerpo(req)).toString('utf8')); chat(req, res, {mensaje: String(b.mensaje ?? '').slice(0, 4000), spec: b.spec}); return true; }
      case '/api/chat-parar': return json(res, {parado: pararChat()});
      case '/api/chat-nuevo': return json(res, {nuevo: true, parado: reiniciarChat()});
      case '/api/vivo': return json(res, estadoVivo());
      case '/api/eventos': {
        res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive'});
        const f = (ev) => (e) => res.write(`event: ${ev}\ndata: ${JSON.stringify(e)}\n\n`), tipos = ['serie', 'derivado', 'render-inicio', 'render', 'error', 'trimestre'], hs = tipos.map((t) => [t, f(t)]);
        hs.forEach(([t, h]) => eventos.on(t, h)); res.write(': conectado\n\n');
        const ping = setInterval(() => res.write(': ping\n\n'), 25000);
        req.on('close', () => { clearInterval(ping); hs.forEach(([t, h]) => eventos.off(t, h)); });
        return true;
      }
      case '/api/biblioteca': {
        const cat = leerCatalogo(), qq = (q.get('q') ?? '').toLowerCase().split(/\s+/).filter(Boolean), c = q.get('categoria');
        const lista = cat.filter((e) => (!c || e.categoria === c) && qq.every((p) => `${e.id} ${e.nombre} ${e.categoria} ${(e.etiquetas ?? []).join(' ')}`.toLowerCase().includes(p))).slice(0, 60).map(ficha);
        const cats = [...cat.reduce((m, e) => m.set(e.categoria, (m.get(e.categoria) ?? 0) + 1), new Map())].map(([nombre, n]) => ({nombre, n})).sort((a, b) => b.n - a.n);
        return json(res, {series: lista, categorias: cats, total: cat.length});
      }
      case '/api/plantillas': return json(res, {plantillas: PLANTILLAS, camaras: Object.entries(CAMARAS).map(([id, c]) => ({id, ...c}))});
      case '/api/analizar': { const {series} = JSON.parse((await cuerpo(req)).toString('utf8')); await asegurar(series); return json(res, analizar(series)); }
      case '/api/recomendar': { const ent = JSON.parse((await cuerpo(req)).toString('utf8')); await asegurar(ent.series); return json(res, {recomendadas: recomendar(ent)}); }
      case '/api/generar': { const ent = JSON.parse((await cuerpo(req)).toString('utf8')); await asegurar(ent.series); const r = generar(ent); return json(res, {...r, spec: r.spec}); }
      case '/api/abrir': {
        const {ruta} = JSON.parse((await cuerpo(req)).toString('utf8')), abs = path.resolve(ruta);
        if (!abs.startsWith(path.join(RAIZ, 'salidas'))) return json(res, {error: 'Solo se pueden abrir carpetas de salidas.'}, 400);
        spawn('explorer.exe', [fs.existsSync(abs) && fs.statSync(abs).isFile() ? `/select,${abs}` : abs], {detached: true, stdio: 'ignore'}).unref(); return json(res, {ok: true});
      }
      case '/api/trabajo': return json(res, trabajos.get(q.get('id')) ?? {estado: 'desconocido'});
      default: return json(res, {error: 'Ruta desconocida'}, 404);
    }
  } catch (e) { return json(res, {error: String(e.message ?? e)}, 400); }
}

// Como Electric Eye: un doble clic siempre deja en marcha la versión recién actualizada. Si ya había un estudio abierto
// (se comprueba que es este programa) se cierra esa sesión y se arranca de nuevo.
const liberarPuerto = (p) => {
  try {
    const pids = new Set(execSync('netstat -ano -p tcp').toString().split(/\r?\n/).filter((l) => /LISTENING/i.test(l) && new RegExp(`:${p}\\s`).test(l)).map((l) => l.trim().split(/\s+/).pop()).filter((x) => x && x !== '0' && x !== String(process.pid)));
    for (const pid of pids) execSync(`taskkill /F /PID ${pid}`, {stdio: 'ignore'});
    return pids.size > 0;
  } catch { return false; }
};
const previo = await fetch(`http://127.0.0.1:${PUERTO}/web/estudio.html`, {signal: AbortSignal.timeout(1500)}).then((r) => r.text(), () => null);
if (previo) {
  if (/Ride the Lightning/.test(previo) && process.platform === 'win32' && liberarPuerto(PUERTO)) { console.log('  Cerrando la sesión anterior de Ride the Lightning...'); await new Promise((r) => setTimeout(r, 1500)); }
  else { console.log(`  El puerto ${PUERTO} está ocupado por otro programa: cierra ese programa o usa RTL_PUERTO.`); process.exit(1); }
}
const {puerto} = await iniciarServidor(PUERTO, api);
const url = `http://127.0.0.1:${puerto}/`;
console.log(`Ride the Lightning · estudio en ${url}  (Ctrl+C para cerrar)`);
if (process.env.RTL_VIVO !== '0') iniciarVivo();
if (!process.env.RTL_SIN_NAVEGADOR) spawn('cmd', ['/c', 'start', '', url], {detached: true, stdio: 'ignore'}).unref();
