// Núcleo compartido (navegador y Node): easing, escalas, formato numérico/fecha y paleta de marca.
// Sin DOM. Todo es función pura del tiempo: el mismo t da siempre el mismo fotograma.

import d3ticks from './vendor/d3-array/ticks.js';
import {idioma, MESES_CORTO, MESES_LARGO as ML, LOCALE_NUM, SUFIJO_PCT, ANTES_CRISTO, FECHA_DIA} from './idioma.js';   // ISC, d3-array 3.2.4 (ver docs/THIRD_PARTY_NOTICES.md)

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;

export const ease = {
  lin: (t) => t,
  in2: (t) => t * t,
  out2: (t) => 1 - (1 - t) * (1 - t),
  io2: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  io3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out3: (t) => 1 - Math.pow(1 - t, 3),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

/** Progreso 0..1 de t en [t0,t1] con easing. */
export const prog = (t, t0, t1, e = ease.io3) => e(clamp((t - t0) / Math.max(1e-9, t1 - t0)));

// Paleta oficial MacroWise (manual visual 2026). Los 3 acentos tienen significado fijo.
export const PALETA = {
  fondo: '#1A1A17', tarjeta: '#232320', profundo: '#0C0C14',
  piedra: '#CBC6BC', piedraClara: '#D6D1C8', piedraOscura: '#B8B3A9',
  oro: '#C9A84C', teal: '#50B5A2', purpura: '#73247D',
  blanco: '#FFFFFF',
};
/** Nombres de color admitidos en las specs -> hex. */
export const COLOR = {
  oro: PALETA.oro, teal: PALETA.teal, purpura: '#A24FB0', piedra: PALETA.piedra, blanco: PALETA.blanco,
  rosa: '#E4584A', amarillo: '#F2C230', rojo: '#D9534F', verde: '#4FB477',
};
/** Orden en que se asignan colores a las series que no declaran uno, y color del resplandor de fondo. Lo cambia el tema. */
export const TEMA = {nombre: 'oscuro', orden: ['oro', 'teal', 'purpura', 'piedra'], brillo: '#C9A84C'};
const TEMAS = {
  // marca MacroWise (por defecto)
  oscuro: {paleta: {}, orden: ['oro', 'teal', 'purpura', 'piedra'], brillo: '#C9A84C'},
  // casi negro + línea rosa-roja + amarillo de «momento» (referencia: Johnny Harris 2025)
  harris: {paleta: {fondo: '#121212', tarjeta: '#1E1E1E', profundo: '#050505'}, orden: ['rosa', 'teal', 'amarillo', 'piedra'], brillo: '#E4584A', color: {oro: '#E4584A'}},   // aquí «oro» (el color de la serie principal en las plantillas) es el rosa-rojo; el amarillo de momento es «amarillo»
  // gris carbón + teal como color de dato (referencia: Caspian Report 2025)
  carbon: {paleta: {fondo: '#3B3C3D', tarjeta: '#2C2D2E', profundo: '#18191A'}, orden: ['teal', 'piedra', 'oro', 'purpura'], brillo: '#50B5A2'},
};
export const TEMAS_DISPONIBLES = Object.keys(TEMAS);
const BASE = {paleta: {...PALETA}, color: {...COLOR}};
/** Aplica un tema (colores de fondo, orden de series, resplandor). Se llama al construir cada escena. */
export function aplicarTema(nombre = 'oscuro') {
  const t = TEMAS[nombre] ?? TEMAS.oscuro;
  Object.assign(PALETA, BASE.paleta, t.paleta);
  Object.assign(COLOR, BASE.color, t.color ?? {});
  TEMA.nombre = TEMAS[nombre] ? nombre : 'oscuro'; TEMA.orden = t.orden; TEMA.brillo = t.brillo;
}
export const colorDe = (c, i = 0) => {
  if (c && COLOR[c]) return COLOR[c];
  if (c && /^#[0-9a-f]{6}$/i.test(c)) return c;
  return COLOR[TEMA.orden[i % TEMA.orden.length]];
};
const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mezcla = (a, b, k) => {
  const A = h2r(a), B = h2r(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join('');
};
export const rgba = (hex, a) => { const [r, g, b] = h2r(hex); return `rgba(${r},${g},${b},${a})`; };

// ── Formato (es-CO: coma decimal, punto de miles) ─────────────────────────────────────────────────
const nf = new Map();
const formatoNum = (dec) => {
  const k = `${idioma()}:${dec}`;
  if (!nf.has(k)) nf.set(k, new Intl.NumberFormat(LOCALE_NUM[idioma()], {minimumFractionDigits: dec, maximumFractionDigits: dec}));
  return nf.get(k);
};
/** fmt = {prefijo, sufijo, decimales}. El valor ya viene dividido por su `divisor`. */
export function fmtNum(v, fmt = {}) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (v === 0) v = 0;   // evita «-0»
  let dec = fmt.decimales ?? 2;
  if (dec === 'auto') { const a = Math.abs(v); dec = a >= 1000 ? 0 : a >= 1 ? 2 : a >= 0.01 ? 4 : 6; }   // cifras significativas según la magnitud
  return `${fmt.prefijo ?? ''}${formatoNum(dec).format(v)}${fmt.sufijo ?? ''}`;
}
export function fmtSigno(v, fmt = {}) {
  const s = v > 0 ? '+' : v < 0 ? '−' : '';
  return s + fmtNum(Math.abs(v), fmt);
}
export const fmtPct = (p, dec = 1) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${formatoNum(dec).format(Math.abs(p))}${SUFIJO_PCT[idioma()]}`;

/** ms UTC de una fecha; válido para años < 100 y negativos (Date.UTC los mapea mal). */
export function utc(y, m = 1, d = 1) { const t = new Date(0); t.setUTCFullYear(y, m - 1, d); t.setUTCHours(0, 0, 0, 0); return t.getTime(); }

const MESES = new Proxy([], {get: (_, i) => MESES_CORTO[idioma()][i]});   // lee el idioma vigente en cada uso
export const MESES_LARGO = new Proxy([], {get: (_, i) => (i === 'length' ? 12 : ML[idioma()][i])});
/** ms (UTC) -> texto. modo: 'dia' (12 mar 2020) | 'mes' (mar 2020) | 'anio' (2020). */
export function fmtFecha(ms, modo = 'dia') {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), m = MESES[d.getUTCMonth()], dd = d.getUTCDate();
  const ya = y <= 0 ? `${1 - y}${ANTES_CRISTO[idioma()]}` : `${y}`;
  return modo === 'anio' ? ya : modo === 'mes' ? `${m} ${ya}` : FECHA_DIA[idioma()](dd, m, ya);
}

// ── Escalas y ticks ─────────────────────────────────────────────────────────────────────────────────
/**
 * Ticks «bonitos» (1-2-5) para un rango numérico con el algoritmo de d3-array (vendorizado, ISC): sin error de coma flotante
 * (0,1·3 da 0,3 y no 0,30000000000000004, que ensuciaba el paso y los decimales declarados). `max` = máximo de marcas por tramo
 * (rango ÷ paso ≤ max, la misma regla de siempre): se elige el paso más fino que cumple, así un eje pequeño no se llena de números.
 */
export function ticksNum(a, b, max = 6) {
  if (!(b - a > 0)) return [a];
  for (let c = max + 1; c >= 1; c--) {
    const t = d3ticks(a, b, c);
    if (t.length >= 2 && (b - a) / (t[1] - t[0]) <= max + 1e-9) return t;
  }
  const t = d3ticks(a, b, 1);
  return t.length ? t : [a];
}
/** Ticks de calendario para un eje de fechas (ms UTC). */
export function ticksFecha(a, b, max = 7) {
  // de lo más fino a lo más grueso: se elige el paso más fino que cabe en `max` marcas
  const cand = [['d', 1], ['d', 7], ['d', 14], ['m', 1], ['m', 3], ['m', 6], ['y', 1], ['y', 2], ['y', 5], ['y', 10], ['y', 20], ['y', 25], ['y', 50],
    ['y', 100], ['y', 200], ['y', 250], ['y', 500], ['y', 1000], ['y', 2000], ['y', 5000]];
  const A = new Date(a);
  for (const [u, n] of cand) {
    const ts = [];
    if (u === 'y') {
      for (let y = Math.ceil(A.getUTCFullYear() / n) * n; ts.length <= max; y += n) { const t = utc(y, 1, 1); if (t > b) break; if (t >= a) ts.push(t); }
    } else if (u === 'm') {
      let y = A.getUTCFullYear(), m = Math.floor(A.getUTCMonth() / n) * n;
      for (; ts.length <= max;) { const t = utc(y, m + 1, 1); if (t > b) break; if (t >= a) ts.push(t); m += n; if (m >= 12) { m -= 12; y++; } }
    } else {
      const dia = 86400000;
      for (let t = Math.ceil(a / (n * dia)) * n * dia; t <= b && ts.length <= max; t += n * dia) ts.push(t);
    }
    if (ts.length <= max && ts.length >= 2) return {ticks: ts, unidad: u, paso: n};
  }
  return {ticks: [a, b], unidad: 'y', paso: 1};
}
export function etiquetaTick(ms, unidad) {
  const d = new Date(ms);
  if (unidad === 'y') return `${d.getUTCFullYear()}`;
  if (unidad === 'm') return d.getUTCMonth() === 0 ? `${d.getUTCFullYear()}` : `${MESES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

/** Búsqueda binaria: primer índice con x[i] >= v. */
export function lowerBound(x, v) {
  let lo = 0, hi = x.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (x[m] < v) lo = m + 1; else hi = m; }
  return lo;
}
/** Valor interpolado de la serie y(x) en xv (null si cae en un hueco). */
export function valorEn(x, y, xv) {
  if (!x.length) return null;
  if (xv <= x[0]) return y[0];
  if (xv >= x[x.length - 1]) return y[x.length - 1];
  const i = lowerBound(x, xv);
  const x0 = x[i - 1], x1 = x[i], y0 = y[i - 1], y1 = y[i];
  if (y0 == null || y1 == null) return y1 ?? y0;
  return x1 === x0 ? y1 : lerp(y0, y1, (xv - x0) / (x1 - x0));
}

/** Interpola dos rangos [a,b] en (centro, log-amplitud): el zoom se siente constante, sin acelerones. */
export function mezclaRango(r0, r1, k) {
  const c0 = (r0[0] + r0[1]) / 2, c1 = (r1[0] + r1[1]) / 2;
  const s0 = Math.max(1e-12, r0[1] - r0[0]), s1 = Math.max(1e-12, r1[1] - r1[0]);
  const c = lerp(c0, c1, k), s = Math.exp(lerp(Math.log(s0), Math.log(s1), k));
  return [c - s / 2, c + s / 2];
}
