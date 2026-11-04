// Diseño de áreas (treemap) con d3-hierarchy vendorizado (ISC, motor/vendor/d3-hierarchy): squarify con razón áurea (celdas apaisadas: el texto
// cabe mejor que en cuadrados) y resquarify (conserva las filas del diseño anterior cuando solo cambian los valores: estabilidad entre trimestres).
// Función pura: mismos datos y mismo rectángulo dan siempre las mismas celdas. Nunca altera un valor: el área de cada celda es proporcional al suyo.
import squarify from './vendor/d3-hierarchy/treemap/squarify.js';
import resquarify from './vendor/d3-hierarchy/treemap/resquarify.js';

/**
 * items: [{valor, anterior?}] con valor > 0. Devuelve un arreglo [x, y, w, h] por item, en el MISMO orden, dentro del rectángulo R = {x, y, w, h}.
 * Con `estable` y `anterior` en todos los items, primero se diseña con los valores anteriores y luego se «re-cuadra» con los actuales: las filas se mantienen,
 * así una celda se mueve poco entre un trimestre y el siguiente en vez de saltar a otro sitio.
 */
export function celdas(items, R, {estable = false} = {}) {
  const idx = items.map((_, i) => i), usarAnt = estable && items.every((it) => it.anterior > 0);
  const base = (it) => (usarAnt ? it.anterior : it.valor);
  idx.sort((a, b) => base(items[b]) - base(items[a]) || a - b);   // orden determinista (desempate por posición)
  const hijos = idx.map((i) => ({i, value: base(items[i])})), raiz = {value: hijos.reduce((s, n) => s + n.value, 0), children: hijos};
  (usarAnt ? resquarify : squarify)(raiz, 0, 0, R.w, R.h);
  if (usarAnt) { hijos.forEach((n) => { n.value = items[n.i].valor; }); raiz.value = hijos.reduce((s, n) => s + n.value, 0); resquarify(raiz, 0, 0, R.w, R.h); }
  const out = new Array(items.length);
  hijos.forEach((n) => { out[n.i] = [R.x + n.x0, R.y + n.y0, n.x1 - n.x0, n.y1 - n.y0]; });
  return out;
}
