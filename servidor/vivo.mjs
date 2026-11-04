// Datos vivos: refresca cada serie descargada según su frecuencia, sin que nadie baje ni pase un archivo.
//  · Cada serie tiene su intervalo (mercados ≈ 15 min, cambios NBP 2 h, macro 6 h, fuentes lentas diario). Fallos → espera creciente.
//  · Si cambia un dato, avisa (evento) y reconstruye las tablas combinadas que dependen de él.
//  · Las piezas cuya spec lleva "vivo":{…} se re-renderizan solas (versionadas v1, v2…), con un mínimo entre renders.
// "Tiempo real" aquí = sondeo frecuente (≥ 15 min) de fuentes públicas: ninguna de ellas ofrece streaming gratuito.
import fs from 'node:fs';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {leerCatalogo, descargar, cache} from './catalogo.mjs';
import {combinar} from './biblioteca.mjs';
import {compilar, RAIZ} from './compilar.mjs';
import {renderizar} from './render.mjs';
import {vigilar as vigilarSec, itemTrimestre, construirUniverso} from './trimestres.mjs';
import {generar} from './plantillas.mjs';

export const eventos = new EventEmitter();
const ESTADO = path.join(RAIZ, 'catalogo', 'estado-vivo.json');
const LOG = path.join(RAIZ, 'catalogo', 'actualizaciones.jsonl');
export const INTERVALO_MIN = {yahoo: 15, coinmetrics: 15, nbp: 120, fred: 360, gus: 1440, bancomundial: 720, shiller: 1440, owid: 1440, archivo: 1440,
  // fuentes de la ampliación (2026-11-04): series anuales/mensuales que no cambian cada día; usgs_sismos hace ~126 peticiones por descarga
  usgs_sismos: 10080, worldbank: 4320, eurostat: 720, tesoro: 720, fiscaldata: 720, nasa_giss: 1440, noaa_gml: 1440, noaa_oni: 1440, socrata_suma: 1440};
const leer = () => (fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : {});
const guardar = (e) => fs.writeFileSync(ESTADO, JSON.stringify(e, null, 2));
const log = (o) => { const l = {t: new Date().toISOString(), ...o}; fs.appendFileSync(LOG, JSON.stringify(l) + '\n'); eventos.emit(o.tipo, l); return l; };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export const estadoVivo = () => leer();
const descargada = (id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv.meta.json`));

export function vencidas(ahora = Date.now()) {
  const est = leer();
  return leerCatalogo().filter((e) => descargada(e.id)).filter((e) => {
    const s = est[e.id], base = INTERVALO_MIN[e.adaptador] ?? 1440;
    if (!s?.ultimoIntento) return true;
    const espera = s.errores ? Math.min(360, base * 2 ** s.errores) : base;
    return ahora - new Date(s.ultimoIntento).getTime() >= espera * 60000;
  });
}

export async function actualizarSerie(e) {
  const est = leer(), previo = est[e.id] ?? {}, antes = descargada(e.id) ? JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'biblioteca', `${e.id}.csv.meta.json`), 'utf8')) : null;
  est[e.id] = {...previo, ultimoIntento: new Date().toISOString()};
  try {
    const m = await descargar(e);
    const cambio = !antes || antes.sha256 !== m.sha256;
    est[e.id] = {ultimoIntento: est[e.id].ultimoIntento, ultimoExito: est[e.id].ultimoIntento, fin: m.fin, filas: m.filas, sha256: m.sha256, errores: 0, ultimoCambio: cambio ? est[e.id].ultimoIntento : previo.ultimoCambio};
    guardar(est);
    if (cambio) log({tipo: 'serie', id: e.id, nombre: e.nombre, filas: m.filas, fin: m.fin, filasAntes: antes?.filas ?? null, finAntes: antes?.fin ?? null});
    return {id: e.id, cambio, fin: m.fin, filas: m.filas};
  } catch (err) {
    est[e.id].errores = (previo.errores ?? 0) + 1; est[e.id].error = String(err.message ?? err);
    guardar(est); log({tipo: 'error', id: e.id, error: est[e.id].error, reintentos: est[e.id].errores});
    return {id: e.id, cambio: false, error: est[e.id].error};
  }
}

/** Reconstruye tablas combinadas cuyos componentes cambiaron. Devuelve los ids de derivados reconstruidos. */
function reconstruirDerivados(cambiados) {
  const dir = path.join(RAIZ, 'datos', 'derivados'), hechos = [];
  if (!fs.existsSync(dir)) return hechos;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.meta.json'))) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (meta.receta && meta.receta.ids.some((i) => cambiados.has(i))) { try { combinar(meta.receta); hechos.push(meta.id); log({tipo: 'derivado', id: meta.id}); } catch (e) { log({tipo: 'error', id: meta.id, error: e.message}); } }
  }
  return hechos;
}

const idsDeSpec = (spec) => {
  const ids = new Set();
  for (const d of Object.values(spec.datos ?? {})) {
    const m = String(d.archivo ?? '').replace(/\\/g, '/').match(/datos\/(biblioteca|derivados)\/([^/]+)\.csv$/);
    if (!m) continue;
    if (m[1] === 'biblioteca') ids.add(m[2]);
    else { const mf = path.join(RAIZ, 'datos', 'derivados', m[2] + '.csv.meta.json'); if (fs.existsSync(mf)) (JSON.parse(fs.readFileSync(mf, 'utf8')).receta?.ids ?? []).forEach((i) => ids.add(i)); ids.add(m[2]); }
  }
  return ids;
};

let colaRender = Promise.resolve();
/** Re-renderiza las specs con "vivo" que dependan de lo cambiado. Serializado: un render a la vez. */
function renderVivas(cambiados) {
  const dir = path.join(RAIZ, 'specs');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    let spec; try { spec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    if (!spec.vivo) continue;
    const deps = idsDeSpec(spec); if (![...deps].some((i) => cambiados.has(i))) continue;
    const est = leer(), key = '_render:' + f, minMs = (spec.vivo.minEntreRendersMin ?? 360) * 60000;
    if (est[key] && Date.now() - new Date(est[key]).getTime() < minMs) continue;
    est[key] = new Date().toISOString(); guardar(est);
    colaRender = colaRender.then(async () => {
      const {spec: p, informe} = compilar(spec);
      if (!informe.ok) return log({tipo: 'error', id: f, error: 'spec viva no compila: ' + informe.errores[0]});
      log({tipo: 'render-inicio', spec: f});
      try {
        const r = await renderizar(p, informe, {nombre: path.basename(f, '.json'), calidad: spec.vivo.render ?? 'final', alfa: spec.vivo.alfa ?? true});
        log({tipo: 'render', spec: f, version: r.version, salidas: r.salidas});
      } catch (e) { log({tipo: 'error', id: f, error: 'render: ' + e.message}); }
    });
  }
}

/** Agente de resultados trimestrales: cada 4 h pregunta a la SEC si alguna empresa de la biblioteca publicó un 10-Q/10-K nuevo.
 *  Si sí: suma el trimestre a la biblioteca, guarda su spec (specs/trimestre-<TICKER>-<AÑO>-<Q>.json), avisa y deja listo un borrador en video. */
export async function vigilarTrimestres({forzar = false} = {}) {
  const est = leer(), k = '_trimestres';
  if (!forzar && est[k] && Date.now() - new Date(est[k]).getTime() < 240 * 60000) return null;
  est[k] = new Date().toISOString(); guardar(est);
  const r = await vigilarSec();
  for (const n of r.nuevos) for (const et of n.etiquetas) {
    try {
      const fin = leerIdx(n.ticker).trimestres.find((t) => t.etiqueta === et)?.fin; if (!fin) continue;
      const uso = leerIdx(n.ticker).trimestres.find((t) => t.etiqueta === et)?.archivo ? 'sankey' : 'puente', item = itemTrimestre(n.ticker, fin, uso);
      const g = generar({plantilla: uso === 'sankey' ? 'resultados' : 'puente', series: [item], formato: 'horizontal', camara: 'documental'});
      const nombre = `trimestre-${n.ticker}-${et.replace(/\s+/g, '-')}`;
      fs.writeFileSync(path.join(RAIZ, 'specs', nombre + '.json'), JSON.stringify(g.spec, null, 2));
      log({tipo: 'trimestre', ticker: n.ticker, nombre: n.nombre, etiqueta: et, publicado: n.publicado, form: n.form, spec: nombre + '.json'});
      const {spec: p, informe} = compilar(g.spec);
      if (informe.ok) colaRender = colaRender.then(async () => { try { const rr = await renderizar(p, informe, {nombre, calidad: 'borrador', alfa: false}); log({tipo: 'render', spec: nombre + '.json', version: rr.version, salidas: rr.salidas}); } catch (e) { log({tipo: 'error', id: nombre, error: 'render: ' + e.message}); } });
    } catch (e) { log({tipo: 'error', id: `${n.ticker} ${et}`, error: e.message}); }
  }
  r.errores.forEach((e) => log({tipo: 'error', id: 'sec', error: e}));
  return r;
}
const leerIdx = (t) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'trimestres', t, 'indice.json'), 'utf8'));

/** Trabajo de noche (1:00–6:00): baja a la biblioteca las empresas de la bolsa de EE. UU. que aún faltan, de las más grandes a las más pequeñas. Retoma donde quedó. */
let universoEnMarcha = false;
export async function trabajoNocturno({forzar = false} = {}) {
  const h = new Date().getHours(); if ((!forzar && (h < 1 || h >= 6)) || universoEnMarcha) return null;
  universoEnMarcha = true; log({tipo: 'inicio', nota: 'trabajo nocturno: construyendo la biblioteca de la bolsa de EE. UU.'});
  try { const r = await construirUniverso({minutos: forzar ? 180 : Math.max(5, (6 - h) * 60 - 10)}); log({tipo: 'universo', ...r}); return r; }
  catch (e) { log({tipo: 'error', id: 'universo', error: String(e.message ?? e)}); return null; }
  finally { universoEnMarcha = false; }
}

/** Un ciclo: actualiza lo vencido (o todo con forzar), reconstruye derivados y lanza renders vivos. */
export async function ciclo({forzar = false, ids = null} = {}) {
  for (const k of Object.keys(cache)) delete cache[k];                        // el Pink Sheet / Shiller se vuelven a bajar frescos
  const lista = ids ? leerCatalogo().filter((e) => ids.includes(e.id)) : forzar ? leerCatalogo().filter((e) => descargada(e.id)) : vencidas();
  const cambiados = new Set(), res = [];
  for (const e of lista) { const r = await actualizarSerie(e); res.push(r); if (r.cambio) cambiados.add(e.id); await dormir(400); }
  try { await vigilarTrimestres(); } catch (e) { log({tipo: 'error', id: 'trimestres', error: String(e.message ?? e)}); }
  if (cambiados.size) { reconstruirDerivados(cambiados).forEach((d) => cambiados.add(d)); renderVivas(cambiados); }
  return {revisadas: lista.length, cambiadas: [...cambiados], errores: res.filter((r) => r.error).map((r) => `${r.id}: ${r.error}`)};
}

let timer = null, corriendo = false;
/** Arranca el actualizador permanente. Seguro de llamar una vez por proceso. */
export function iniciarVivo({cadaSeg = 60} = {}) {
  if (timer) return;
  const tick = async () => { trabajoNocturno().catch(() => {}); if (corriendo) return; corriendo = true; try { await ciclo(); } catch (e) { log({tipo: 'error', id: 'ciclo', error: String(e.message ?? e)}); } finally { corriendo = false; } };
  setTimeout(tick, 5000); timer = setInterval(tick, cadaSeg * 1000);
  log({tipo: 'inicio', nota: `actualizador vivo activo; series monitoreadas: ${leerCatalogo().filter((e) => descargada(e.id)).length}`});
}
export function detenerVivo() { clearInterval(timer); timer = null; }
