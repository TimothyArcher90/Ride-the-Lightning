// Accesibilidad y proveniencia de cada exportación (render y vista previa).
//  - <nombre>.alt.txt           descripción accesible GENERADA desde el spec compilado (nada escrito a mano).
//  - <nombre>.proveniencia.json sha256 de cada dato, fecha de acceso, fuente y licencia por serie, versión del motor, parámetros.
// Determinista: mismo spec compilado + mismos datos = mismo contenido (la «fecha de acceso» es la que quedó en el .meta.json del dato).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fmtNum, fmtFecha} from '../motor/nucleo.js';
import {conIdioma} from '../motor/idioma.js';
import {RAIZ} from './compilar.mjs';

const TXT = {
  es: {
    intro: (t) => `Gráfica animada${t ? `: «${t}»` : ''}.`,
    rango: (a, b) => `Muestra datos desde ${a} hasta ${b}.`,
    serie: (n, v) => `${n}: empieza en ${v.ini} (${v.fIni}), termina en ${v.fin} (${v.fFin}); máximo ${v.max} (${v.fMax}); mínimo ${v.min} (${v.fMin}).`,
    cats: (n, top, bajo, total) => `Comparación de ${n} categorías: la mayor es ${top}; la menor es ${bajo}; suma ${total}.`,
    flujos: (n, e, tot) => `Diagrama de flujos con ${n} nodos y ${e} enlaces; total ${tot}.`,
    fuente: (f) => `Fuente: ${f}.`,
    duracion: (s, fps) => `Duración ${s} s a ${fps} fotogramas por segundo.`,
    sinDatos: 'No contiene series de datos.',
    nota: 'Descripción generada automáticamente a partir de los datos de la pieza.',
  },
  en: {
    intro: (t) => `Animated chart${t ? `: "${t}"` : ''}.`,
    rango: (a, b) => `Shows data from ${a} to ${b}.`,
    serie: (n, v) => `${n}: starts at ${v.ini} (${v.fIni}), ends at ${v.fin} (${v.fFin}); maximum ${v.max} (${v.fMax}); minimum ${v.min} (${v.fMin}).`,
    cats: (n, top, bajo, total) => `Comparison of ${n} categories: the largest is ${top}; the smallest is ${bajo}; total ${total}.`,
    flujos: (n, e, tot) => `Flow diagram with ${n} nodes and ${e} links; total ${tot}.`,
    fuente: (f) => `Source: ${f}.`,
    duracion: (s, fps) => `Duration ${s} s at ${fps} frames per second.`,
    sinDatos: 'Contains no data series.',
    nota: 'Description generated automatically from the piece data.',
  },
};

const fx = (tipoX, v) => (tipoX === 'fecha' ? fmtFecha(v, 'dia') : String(v));

function describirSerie(tab, s, T) {
  let ini = null, fin = null, max = null, min = null;
  for (let i = 0; i < tab.x.length; i++) {
    const v = s.y[i]; if (v == null || Number.isNaN(v)) continue;
    const p = {v, x: tab.x[i]};
    ini ??= p; fin = p;
    if (max === null || v > max.v) max = p;
    if (min === null || v < min.v) min = p;
  }
  if (!ini) return null;
  const f = (p) => fmtNum(p.v, s.fmt ?? {});
  return T.serie(s.nombre, {ini: f(ini), fIni: fx(tab.tipoX, ini.x), fin: f(fin), fFin: fx(tab.tipoX, fin.x), max: f(max), fMax: fx(tab.tipoX, max.x), min: f(min), fMin: fx(tab.tipoX, min.x)});
}

/** Texto alternativo del spec compilado (puro; el idioma es spec.idioma, 'es' por defecto). */
export function descripcionAccesible(spec, informe = null) {
  const idi = spec.idioma === 'en' ? 'en' : 'es', T = TXT[idi];
  return conIdioma(idi, () => {
    const partes = [T.intro(spec.titulo)], tablas = Object.values(spec.tablas ?? {});
    let a = null, b = null, hubo = false;
    for (const tab of tablas) {
      if (tab.tipoX === 'flujos') {
        hubo = true; partes.push(T.flujos(tab.nodos?.length ?? 0, tab.enlaces?.length ?? 0, fmtNum(tab.total, tab.fmt ?? {}))); continue;
      }
      if (tab.tipoX === 'categorias') {
        const its = (tab.items ?? []).filter((x) => x.valor != null); if (!its.length) continue;
        hubo = true;
        const ord = [...its].sort((p, q) => q.valor - p.valor), f = (x) => `${x.nombre} (${fmtNum(x.valor, tab.fmt ?? {})})`;
        partes.push(T.cats(its.length, f(ord[0]), f(ord[ord.length - 1]), fmtNum(its.reduce((r, x) => r + x.valor, 0), tab.fmt ?? {}))); continue;
      }
      if (!tab.x?.length) continue;
      if (tab.tipoX === 'fecha') {
      if (a === null || tab.x[0] < a.v) a = {v: tab.x[0], t: tab.tipoX};
      if (b === null || tab.x[tab.x.length - 1] > b.v) b = {v: tab.x[tab.x.length - 1], t: tab.tipoX};
      }
      for (const s of tab.series ?? []) { const d = describirSerie(tab, s, T); if (d) { hubo = true; partes.push(d); } }
    }
    if (a && b) partes.splice(1, 0, T.rango(fx(a.t, a.v), fx(b.t, b.v)));
    if (!hubo) partes.push(T.sinDatos);
    for (const d of informe?.datos ?? []) if (d.fuente?.nombre) partes.push(T.fuente(`${d.fuente.corto ?? d.fuente.nombre}${d.fuente.licencia ? ` · ${d.fuente.licencia}` : ''}`));
    partes.push(T.duracion(spec.duracion, spec.fps));
    return [...new Set(partes)].join('\n') + '\n';
  });
}

// ── proveniencia ────────────────────────────────────────────────────────────────────────────────────────────
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
/** JSON canónico (claves ordenadas) para que el hash del spec no dependa del orden de inserción. */
const canon = (x) => (Array.isArray(x) ? `[${x.map(canon).join(',')}]` : x && typeof x === 'object' ? `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${canon(x[k])}`).join(',')}}` : JSON.stringify(x) ?? 'null');

let _motor = null;
export function versionMotor() {
  if (_motor) return _motor;
  let version = null; try { version = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).version; } catch {}
  const g = (...a) => { const r = spawnSync('git', a, {cwd: RAIZ, encoding: 'utf8'}); return r.status === 0 ? r.stdout.trim() : null; };
  const hash = g('rev-parse', 'HEAD');
  const sucio = hash ? (g('status', '--porcelain', '--', 'motor', 'servidor') ?? '') !== '' : null;
  return (_motor = {paquete: version, git: hash, cambios_sin_commit: sucio});
}

/** Proveniencia del spec compilado + informe. `extra` = parámetros de la exportación (calidad, alfa…). */
export function proveniencia(spec, informe, extra = {}) {
  const datos = (informe?.datos ?? []).map((d) => ({
    id: d.id, archivo: d.archivo ?? null, sha256: d.sha256 ?? null, filas: d.filas, inicio: d.inicio, fin: d.fin,
    fuente: d.fuente?.nombre ?? null, url: d.fuente?.url ?? null, url_datos: d.fuente?.urlDatos ?? null,
    fecha_acceso: d.fuente?.obtenido ?? null, licencia: d.fuente?.licencia ?? null,
    series: (d.series ?? []).map((s) => ({nombre: s.nombre, columna: s.col, unidad: s.unidad, fuente: d.fuente?.nombre ?? null, fecha_acceso: d.fuente?.obtenido ?? null, licencia: d.fuente?.licencia ?? null})),
  }));
  return {
    esquema: 'rtl-proveniencia/1',
    titulo: spec.titulo ?? '',
    motor: versionMotor(),
    spec_sha256: sha(canon(spec)),
    parametros: {ancho: spec.ancho, alto: spec.alto, fps: spec.fps, duracion: spec.duracion, formato: spec.formato, tema: spec.tema, idioma: spec.idioma ?? 'es', semilla: null, determinista: true, ...extra},
    datos,
    metodos: informe?.metodos ?? [],
  };
}

/** Escribe `<prefijo>.alt.txt` y `<prefijo>.proveniencia.json`; devuelve las rutas. */
export function escribirAccesibilidad(prefijo, spec, informe, extra = {}) {
  fs.mkdirSync(path.dirname(prefijo), {recursive: true});
  const alt = `${prefijo}.alt.txt`, prov = `${prefijo}.proveniencia.json`;
  fs.writeFileSync(alt, descripcionAccesible(spec, informe));
  fs.writeFileSync(prov, JSON.stringify(proveniencia(spec, informe, extra), null, 2) + '\n');
  return {alt, proveniencia: prov};
}
