// Núcleo compartido (navegador y Node): easing, escalas, formato numérico/fecha y paleta de marca.
// Sin DOM. Todo es función pura del tiempo: el mismo t da siempre el mismo fotograma.

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
};
export const colorDe = (c, i = 0) => {
  if (c && COLOR[c]) return COLOR[c];
  if (c && /^#[0-9a-f]{6}$/i.test(c)) return c;
  return [COLOR.oro, COLOR.teal, COLOR.purpura, COLOR.piedra][i % 4];
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
  if (!nf.has(dec)) nf.set(dec, new Intl.NumberFormat('es-CO', {minimumFractionDigits: dec, maximumFractionDigits: dec}));
  return nf.get(dec);
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
export const fmtPct = (p, dec = 1) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${formatoNum(dec).format(Math.abs(p))} %`;

/** ms UTC de una fecha; válido para años < 100 y negativos (Date.UTC los mapea mal). */
export function utc(y, m = 1, d = 1) { const t = new Date(0); t.setUTCFullYear(y, m - 1, d); t.setUTCHours(0, 0, 0, 0); return t.getTime(); }

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** ms (UTC) -> texto. modo: 'dia' (12 mar 2020) | 'mes' (mar 2020) | 'anio' (2020). */
export function fmtFecha(ms, modo = 'dia') {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), m = MESES[d.getUTCMonth()], dd = d.getUTCDate();
  const ya = y <= 0 ? `${1 - y} a. C.` : `${y}`;
  return modo === 'anio' ? ya : modo === 'mes' ? `${m} ${ya}` : `${dd} ${m} ${ya}`;
}

// ── Escalas y ticks ─────────────────────────────────────────────────────────────────────────────────
/** Ticks "bonitos" (1-2-5) para un rango numérico. */
export function ticksNum(a, b, max = 6) {
  const span = b - a;
  if (!(span > 0)) return [a];
  const raw = span / max, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const paso = [1, 2, 5, 10].map((m) => m * mag).find((s) => span / s <= max) ?? 10 * mag;
  const out = [];
  for (let v = Math.ceil(a / paso - 1e-9) * paso; v <= b + 1e-9; v += paso) out.push(Math.round(v / paso) * paso);
  return out;
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
