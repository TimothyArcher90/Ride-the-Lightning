// SISTEMA DE DISEÑO de Ride the Lightning: una sola fuente de verdad para tipografía, márgenes, zona segura, contraste,
// pie de fuente y movimiento. Puro y determinista (sin DOM). Lo usan motor/capas.js y las pruebas; si otro módulo
// (p. ej. motor/capas_extra.js o servidor/plantillas_extra.mjs) crea capas o textos nuevos, debe importar de aquí:
//
//   import {tipo, fuente, ZONA, margenes, contraste, pie, MOV, retardo, entrada} from './diseno.js';
//   const px = tipo(env, 'clave');            // tamaño en píxeles del rol «clave» para el formato actual
//   ctx.font = fuente(env, 'clave', 700);     // fuente completa lista para canvas (Geist 700, tamaño del rol)
//   const {x0, x1, y0, y1} = margenes(env);   // rejilla: área útil (x1 ya respeta la zona segura en vertical)
//   const t = entrada(env.t, inicio, i);      // progreso 0..1 con easing de entrada y retardo escalonado por elemento i
//
// ROLES TIPOGRÁFICOS (px sobre un lienzo de 1080 de lado corto; el vertical es 1080×1920, el horizontal 1920×1080)
//   cifra      número protagonista (el año del contador, la cifra grande)      vertical 96 · horizontal 96
//   titulo     título de la pieza                                              vertical 60 (mín. 44) · horizontal 60 (mín. 40)
//   clave      nombres, valores y porcentajes: lo que hay que leer             vertical ≥ 40 · horizontal ≥ 28
//   secundario ejes, unidades, notas de método                                 vertical ≥ 32 · horizontal ≥ 24
//   pie        «Fuente: … · fecha · RTL»                                       vertical ≥ 28 · horizontal ≥ 22
// En vertical el celular se ve a ~1/3 del tamaño de una pantalla: por eso los pisos son el doble de los de horizontal.
//
// ZONA SEGURA (TikTok/Reels): en vertical no puede haber NADA con x ≥ 72,2 % del ancho e y ≥ 43,75 % del alto.

import {t} from './idioma.js';

export const ZONA = {x: 0.722, y: 0.4375};

/** Pisos de tamaño por rol y formato. `escalarFuente` sube cualquier tamaño suelto al piso de su banda. */
export const TIPO = {
  vertical: {cifra: 96, titulo: 60, tituloMin: 44, sub: 34, clave: 40, secundario: 32, pie: 28},
  horizontal: {cifra: 96, titulo: 60, tituloMin: 40, sub: 28, clave: 28, secundario: 24, pie: 22},
};
export const tipo = (env, rol) => (env.H > env.W ? TIPO.vertical : TIPO.horizontal)[rol] * (env.u ?? 1);   // × u: la vista previa a media escala conserva las proporciones

// Estado de formato para el constructor de fuentes (lo fija Escena.dibujar al empezar cada fotograma).
let VERTICAL = false, ESC = 1;
export const fijarFormato = (vertical, u = 1) => { VERTICAL = !!vertical; ESC = u || 1; };
export const esVertical = () => VERTICAL;

/**
 * Banda de un tamaño suelto → su piso. Los tamaños antiguos de las capas (15-26 px) eran ilegibles en un celular;
 * en vez de reescribir cada llamada, TODA fuente pasa por aquí y nunca baja del piso de su banda.
 *   ≤ 21 px  → secundario (ejes, unidades)      22-35 px → clave (nombres y valores)      ≥ 36 → se respeta
 */
export function escalarFuente(px) {
  const T = VERTICAL ? TIPO.vertical : TIPO.horizontal, p = px / ESC;   // los tamaños de las capas ya vienen × u; las bandas se miden en px de 1080
  if (p <= 21.5) return Math.max(p, T.secundario) * ESC;
  if (p < 36) return Math.max(p, T.clave) * ESC;
  return px;
}
export const fuenteCss = (peso, px, mono = false) => `${peso} ${Math.round(px)}px ${mono ? '"Geist Mono", ui-monospace, monospace' : '"Geist", system-ui, sans-serif'}`;
export const fuente = (env, rol, peso = 600, mono = false) => fuenteCss(peso, tipo(env, rol), mono);

/** Rejilla: márgenes laterales de 72 px (6,7 % del ancho vertical) y área útil que respeta la zona segura. */
export function margenes(env) {
  const {W, H} = env, vert = H > W, m = Math.round(W * (vert ? 0.0667 : 0.0417));
  return {m, x0: m, x1: vert ? Math.round(W * ZONA.x) - 6 : W - m, y0: Math.round(H * (vert ? 0.26 : 0.24)), y1: Math.round(H * (vert ? 0.86 : 0.88)), pieY: H - Math.round(H * (vert ? 0.03 : 0.045))};
}

// ── Contraste (WCAG 2.1) ────────────────────────────────────────────────────────────────────────────────────────
const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
export const luminancia = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
/** Razón de contraste entre dos colores [r,g,b] o '#rrggbb'. ≥ 4,5 es el mínimo para texto normal. */
export function contraste(a, b) {
  const A = typeof a === 'string' ? h2r(a) : a, B = typeof b === 'string' ? h2r(b) : b;
  const la = luminancia(A), lb = luminancia(B);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Hace legible un color de TEXTO claro sobre el fondo oscuro: si su contraste con el fondo es < min lo aclara (mezcla con blanco) lo justo.
 * Los colores oscuros (tinta sobre una barra de color) y los que ya cumplen no se tocan.
 */
export function legible(hex, fondo, min = 4.6) {
  if (typeof hex !== 'string' || hex[0] !== '#' || hex.length !== 7 || typeof fondo !== 'string') return hex;
  const A = h2r(hex), F = h2r(fondo);
  if (luminancia(A) <= luminancia(F) * 1.05 || contraste(A, F) >= min) return hex;
  for (let k = 0.05; k <= 1.001; k += 0.05) {
    const m = A.map((v) => Math.round(v + (255 - v) * k));
    if (contraste(m, F) >= min) return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return '#ffffff';
}

// ── Movimiento ──────────────────────────────────────────────────────────────────────────────────────────────────
// Curvas Material (cubic-bezier) resueltas por Newton: entrada (0,0,.2,1), estándar (.4,0,.2,1), salida (.4,0,1,1).
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s;
  return (t) => { if (t <= 0) return 0; if (t >= 1) return 1; let s = t; for (let i = 0; i < 8; i++) { const e = X(s) - t, d = (3 * ax * s + 2 * bx) * s + cx; if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; } return Y(s); };
}
export const CURVA = {entrada: bezier(0, 0, 0.2, 1), estandar: bezier(0.4, 0, 0.2, 1), salida: bezier(0.4, 0, 1, 1)};
export const MOV = {
  entrada: 0.55,        // s: un elemento que aparece
  salida: 0.4,          // s: un elemento que se va (más corta que la entrada)
  escalon: 0.04,        // s: retardo entre elementos de un grupo (30-50 ms)
  topeGrupo: 0.8,       // s: un grupo nunca tarda más que esto en terminar de entrar
  lectura: 3,           // s: todo texto visible al menos 3 s
  cifraQuieta: 1.5,     // s: una cifra suelta se queda quieta ≥ 1,5 s tras llegar
};
/** Retardo del elemento i de un grupo de n: 40 ms cada uno, pero el grupo entero nunca pasa de MOV.topeGrupo. */
export const retardo = (i, n) => Math.min(MOV.escalon, MOV.topeGrupo / Math.max(1, n)) * i;
/** Progreso 0..1 de entrada del elemento i (de n) que empieza en t0: easing de desaceleración, nunca lineal. */
export function entrada(t, t0, i = 0, n = 1, dur = MOV.entrada) { const k = Math.min(1, Math.max(0, (t - t0 - retardo(i, n)) / dur)); return CURVA.entrada(k); }
export const salida = (t, t1, dur = MOV.salida) => 1 - CURVA.salida(Math.min(1, Math.max(0, (t - t1) / dur)));

// ── Pie de fuente ───────────────────────────────────────────────────────────────────────────────────────────────
/** «Fuente: <nombre> · <fecha del último dato> · RTL» (el pie obligatorio de toda pieza). */
export const textoPie = (nombre, fecha) => `${t('fuente')}: ${[nombre, fecha].filter(Boolean).join(' · ')} · RTL`;
/** Parte un texto en líneas que caben en `ancho` (por palabras; si una palabra sola no cabe, se corta con «…»). */
export function envolver(ctx, s, ancho, maxLineas = 3) {
  const pal = String(s).split(' '), out = []; let l = '';
  for (const p of pal) {
    const c = l ? `${l} ${p}` : p;
    if (ctx.measureText(c).width <= ancho || !l) l = c; else { out.push(l); l = p; }
  }
  if (l) out.push(l);
  if (out.length > maxLineas) { const resto = out.slice(maxLineas - 1).join(' '); out.length = maxLineas - 1; out.push(resto); }
  return out.map((x) => { while (x.length > 4 && ctx.measureText(x).width > ancho) x = x.slice(0, -2) + '…'; return x; });
}
