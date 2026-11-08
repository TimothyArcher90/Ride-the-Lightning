// Estudio local: `npm run iniciar`. Solo escucha en 127.0.0.1; los datos y los renders no salen de este equipo.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, execSync} from 'node:child_process';
import crypto from 'node:crypto';
import {iniciarServidor} from './web.mjs';
import {compilar, RAIZ, rutaSegura} from './compilar.mjs';
import {renderizar} from './render.mjs';
import {buscar, descargar, leerCatalogo, coincideBusqueda} from './catalogo.mjs';
import {inspeccionar, FORMATOS, metaSerie} from './datos.mjs';
import {iniciarVivo, eventos, estadoVivo} from './vivo.mjs';
import {salud, licencia} from './analisis.mjs';
import {PLANTILLAS, CAMARAS, analizar, generar} from './plantillas.mjs';
import {detectarTabla} from './tablas.mjs';
import {empresas as empresasCat, buscarEmpresas, asegurarEmpresa, esDestacada, leerIndice, itemTrimestre, seriesDeEmpresa, construidas as construidasLista} from './trimestres.mjs';
import {leerUniverso} from './universo.mjs';
import {chat, pararChat, reiniciarChat} from './chat.mjs';
import {recomendar} from './visualizador.mjs';
import {tr} from '../web/i18n.js';   // diccionario único es/en (claves «srv_…» para los mensajes del servidor)

const IDIOMAS = ['es', 'en'];
// Idioma de los mensajes de consola: RTL_LANG, o el del sistema (español si el equipo está en español, inglés si no).
const LS = IDIOMAS.includes(process.env.RTL_LANG) ? process.env.RTL_LANG : /^es/i.test(Intl.DateTimeFormat().resolvedOptions().locale) ? 'es' : 'en';

// Tablas de ejemplo (se copian a entradas/ para usarlas con un clic). Las cifras son de demostración y así se rotulan.
const EJEMPLOS = {
  flujos: {archivo: 'estado_resultados_ejemplo.csv', tabla: 'flujos', nombre: 'srv_ex_flujos', prefijo: 'US$ ', decimales: 1},
  composicion: {archivo: 'composicion_ejemplo.csv', tabla: 'categorias', nombre: 'srv_ex_composicion', prefijo: 'US$ ', decimales: 1},
  puente: {archivo: 'puente_ejemplo.csv', tabla: 'categorias', nombre: 'srv_ex_puente', prefijo: 'US$ ', decimales: 1},
};

const PUERTO = Number(process.env.RTL_PUERTO ?? 5180);
const trabajos = new Map();
const json = (res, obj, code = 200) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(obj)); return true; };
const cuerpo = (req, max = 200e6, lang = 'en') => new Promise((ok, mal) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > max) { mal(new Error(tr('srv_muy_grande', null, lang))); req.destroy(); } else c.push(d); }); req.on('end', () => ok(Buffer.concat(c))); req.on('error', mal); });
const nombreSeguro = (n) => String(n).replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 120);


const metaDe = (id) => metaSerie(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`));   // .meta.json o procedencia de la instantánea data/
const ficha = (e, idioma = 'es') => { const m = metaDe(e.id); return {id: e.id, nombre: e.nombre, categoria: e.categoria, unidad: m?.fuente?.unidad ?? e.unidad ?? '', frecuencia: e.frecuencia, fuente: e.fuente_original, url: m?.fuente?.url ?? null, licencia: licencia(e, idioma), salud: salud(e, m, Date.now(), idioma),
  descargada: !!m, inicio: m?.inicio ?? null, fin: m?.fin ?? null, filas: m?.filas ?? null, etiquetas: e.etiquetas ?? [], nota: e.nota ?? null}; };
/** Descarga (historia completa) lo que falte de la biblioteca antes de usarlo: la persona nunca baja un archivo. */
const asegurar = async (series) => { const cat = leerCatalogo(); for (const s of series ?? []) if (s.origen === 'biblioteca' && !metaDe(s.id)) { const en = cat.find((x) => x.id === s.id); if (en) await descargar(en); } };

async function api(req, res) {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return false;
  const q = url.searchParams;
  // El estudio manda `idioma=es|en` en TODAS las llamadas: fija el idioma de los mensajes y de la pieza (por defecto inglés).
  const lang = IDIOMAS.includes(q.get('idioma')) ? q.get('idioma') : 'en';
  const delCuerpo = async () => JSON.parse((await cuerpo(req, 200e6, lang)).toString('utf8'));
  try {
    switch (url.pathname) {
      case '/api/specs': return json(res, fs.readdirSync(path.join(RAIZ, 'specs')).filter((f) => f.endsWith('.json')));
      case '/api/spec': {
        const f = rutaSegura(path.join('specs', nombreSeguro(q.get('n'))));
        if (req.method === 'POST') { fs.writeFileSync(f, (await cuerpo(req)).toString('utf8')); return json(res, {ok: true}); }
        return json(res, JSON.parse(fs.readFileSync(f, 'utf8')));
      }
      case '/api/compilar': { const spec = await delCuerpo(); if (!IDIOMAS.includes(spec.idioma)) spec.idioma = lang; return json(res, compilar(spec)); }
      case '/api/catalogo': return json(res, buscar(q.get('q') ?? ''));
      case '/api/bajar': {
        const e = leerCatalogo().find((x) => x.id === q.get('id')); if (!e) return json(res, {error: tr('srv_no_catalogo', null, lang)}, 404);
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
        if (![...FORMATOS, ...IMG].includes(ext)) return json(res, {error: tr('srv_formato', {ext, datos: FORMATOS.join(' '), imgs: IMG.join(' ')}, lang)}, 400);
        fs.mkdirSync(path.join(RAIZ, 'entradas'), {recursive: true});
        const dest = path.join(RAIZ, 'entradas', n);
        fs.writeFileSync(dest, await cuerpo(req, 200e6, lang));
        const rel = `entradas/${n}`;
        if (IMG.includes(ext)) return json(res, {ruta: rel, tipo: 'imagen'});
        const insp = inspeccionar(dest, {});
        return json(res, {ruta: rel, tipo: 'datos', inspeccion: insp, tabla: detectarTabla(insp.columnas.map((c) => c.nombre))});
      }
      case '/api/ejemplo': {
        const e = EJEMPLOS[q.get('id')]; if (!e) return json(res, {error: tr('srv_no_ejemplo', null, lang)}, 404);
        fs.mkdirSync(path.join(RAIZ, 'entradas'), {recursive: true});
        fs.copyFileSync(path.join(RAIZ, 'ejemplos', e.archivo), path.join(RAIZ, 'entradas', e.archivo));
        return json(res, {ruta: `entradas/${e.archivo}`, tabla: e.tabla, nombre: tr(e.nombre, null, lang), fuente: {nombre: tr('srv_ex_fuente', null, lang), obtenido: new Date().toISOString().slice(0, 10)}, prefijo: e.prefijo, sufijo: tr('srv_ex_sufijo', null, lang), decimales: e.decimales});
      }
      case '/api/empresas': {   // biblioteca de trimestres: empresas disponibles (con búsqueda simple)
        // sin texto: las 16 destacadas; con texto: búsqueda en TODA la bolsa de EE. UU. (ticker o nombre)
        return json(res, {empresas: buscarEmpresas(q.get('q') ?? ''), total: leerUniverso().length || empresasCat().length});
      }
      case '/api/trimestres': {   // trimestres de una empresa; si aún no están, se bajan de la SEC en ese momento (10-20 s)
        const t = String(q.get('ticker') ?? '').toUpperCase();
        let i; try { i = await asegurarEmpresa(t); } catch (e) { return json(res, {error: e.message}, 404); }
        return json(res, {ticker: t, nombre: i.nombre, actualizado: i.actualizado, destacada: esDestacada(t), trimestres: i.trimestres.map((x) => ({fin: x.fin, etiqueta: x.etiqueta, fy: x.fy, q: x.q, publicado: x.publicado, form: x.form, ingresos: x.ingresos, utilidadNeta: x.utilidadNeta, margenOperativo: x.margenOperativo, q4Calculado: x.q4Calculado, sankey: !!x.archivo, motivoSankey: x.motivoSankey, detalleFino: !!x.detalleFino, conSegmentos: !!x.conSegmentos, notas: x.notas})), omitidos: i.omitidos,
          sinDatos: i.trimestres.length === 0 ? tr('srv_sin_datos_emp', null, lang) : null});
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
        const {spec: s, calidad = 'borrador', alfa = false, nombre} = await delCuerpo();
        if (!IDIOMAS.includes(s.idioma)) s.idioma = lang;   // el video sale en el idioma de la pieza
        const {spec, informe} = compilar(s);
        if (!informe.ok) return json(res, {error: tr('srv_no_compila', null, lang), informe}, 400);
        const id = crypto.randomBytes(4).toString('hex'), t = {id, estado: 'en curso', progreso: null};
        trabajos.set(id, t);
        renderizar(spec, informe, {nombre: nombre ?? s.titulo, calidad, alfa, onProgreso: (p) => (t.progreso = p)})
          .then((r) => Object.assign(t, {estado: 'listo', resultado: r})).catch((e) => Object.assign(t, {estado: 'error', error: String(e.message ?? e)}));
        return json(res, {id});
      }
      case '/api/chat': { const b = await delCuerpo(); chat(req, res, {mensaje: String(b.mensaje ?? '').slice(0, 4000), spec: b.spec, idioma: IDIOMAS.includes(b.idioma) ? b.idioma : lang}); return true; }
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
        const cat = leerCatalogo(lang), qq = (q.get('q') ?? '').toLowerCase().split(/\s+/).filter(Boolean), c = q.get('categoria');
        const ids = (q.get('ids') ?? '').split(',').filter(Boolean), desde = Math.max(0, +(q.get('desde') ?? 0) || 0);
        const todos = ids.length ? ids.map((i) => cat.find((e) => e.id === i)).filter(Boolean) : cat.filter((e) => (!c || e.categoria === c) && coincideBusqueda(e, qq));
        const lista = todos.slice(desde, desde + 24).map((e) => ficha(e, lang));
        const cats = [...cat.reduce((m, e) => m.set(e.categoria, (m.get(e.categoria) ?? 0) + 1), new Map())].map(([nombre, n]) => ({nombre, n})).sort((a, b) => b.n - a.n);
        return json(res, {series: lista, categorias: cats, total: cat.length, coinciden: todos.length, desde});
      }
      case '/api/paises': { const m = await import('./paises.mjs'); return json(res, {paises: m.listarPaises(lang)}); }
      case '/api/indicadores-pais': { const m = await import('./paises.mjs'); return json(res, {indicadores: m.indicadoresPais(lang)}); }
      case '/api/ranking-pais': { const m = await import('./paises.mjs'); return json(res, await m.rankingPais(String(q.get('clave') ?? ''), String(q.get('iso') ?? ''), lang)); }
      case '/api/ficha-pais': { const m = await import('./paises.mjs'); return json(res, await m.fichaPais(String(q.get('iso') ?? '').toUpperCase(), lang)); }
      case '/api/plantillas': return json(res, {plantillas: PLANTILLAS.filter((p) => !p.soloSpec), camaras: Object.entries(CAMARAS).map(([id, c]) => ({id, ...c}))});
      case '/api/analizar': { const {series} = await delCuerpo(); await asegurar(series); return json(res, analizar(series, lang)); }
      case '/api/recomendar': { const ent = await delCuerpo(); if (!IDIOMAS.includes(ent.idioma)) ent.idioma = lang; await asegurar(ent.series); return json(res, {recomendadas: recomendar(ent)}); }
      case '/api/generar': { const ent = await delCuerpo(); if (!IDIOMAS.includes(ent.idioma)) ent.idioma = lang; await asegurar(ent.series); const r = generar(ent); return json(res, {...r, spec: r.spec}); }
      case '/api/abrir': {
        const {ruta} = await delCuerpo(), abs = path.resolve(ruta);
        if (!abs.startsWith(path.join(RAIZ, 'salidas'))) return json(res, {error: tr('srv_solo_salidas', null, lang)}, 400);
        spawn('explorer.exe', [fs.existsSync(abs) && fs.statSync(abs).isFile() ? `/select,${abs}` : abs], {detached: true, stdio: 'ignore'}).unref(); return json(res, {ok: true});
      }
      case '/api/trabajo': return json(res, trabajos.get(q.get('id')) ?? {estado: 'desconocido'});
      default: return json(res, {error: tr('srv_ruta', null, lang)}, 404);
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
  if (/Ride the Lightning/.test(previo) && process.platform === 'win32' && liberarPuerto(PUERTO)) { console.log(tr('srv_cerrando', null, LS)); await new Promise((r) => setTimeout(r, 1500)); }
  else { console.log(tr('srv_puerto', {p: PUERTO}, LS)); process.exit(1); }
}
const {puerto} = await iniciarServidor(PUERTO, api);
const url = `http://127.0.0.1:${puerto}/`;
console.log(tr('srv_listo', {url}, LS));
if (process.env.RTL_VIVO !== '0') iniciarVivo();
if (!process.env.RTL_SIN_NAVEGADOR) spawn('cmd', ['/c', 'start', '', url], {detached: true, stdio: 'ignore'}).unref();
