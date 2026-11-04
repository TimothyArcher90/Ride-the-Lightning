// Colocación de etiquetas sin colisión. Determinista (cantidad fija de iteraciones, sin azar ni reloj).
//
// ATRIBUCIÓN: la relajación 1-D con fuerza de resorte hacia la posición deseada y repulsión entre vecinos que se solapan es la idea de
// labella.js (Twitter, Apache-2.0, https://github.com/twitter/labella.js, Copyright Twitter, Inc.). Aquí está reimplementada desde cero en ~40 líneas
// (no se copió código); se conserva el aviso en docs/THIRD_PARTY_NOTICES.md. La idea de los «hilos» de unión es la de d3fc label-layout (MIT).

/**
 * Reparte etiquetas a lo largo de un eje (1-D). items: [{x, w}] con x = centro deseado y w = ancho. Devuelve los centros finales en el MISMO orden:
 * ninguna se solapa con su vecina (hueco `gap`), todas quedan dentro de [min, max] y cada una queda lo más cerca posible de su deseo.
 * Si no caben todas en [min, max], se reparten parejo (el aviso `cabe: false` lo recibe quien llama).
 */
export function relajar1D(items, {min = -Infinity, max = Infinity, gap = 8, iter = 120} = {}) {
  const n = items.length, o = items.map((_, i) => i).sort((a, b) => items[a].x - items[b].x || a - b), W = o.map((i) => items[i].w), D = o.map((i) => items[i].x);
  const total = W.reduce((s, w) => s + w, 0) + gap * Math.max(0, n - 1), cabe = total <= max - min + 1e-6;
  let P = D.slice();
  for (let k = 0; k < iter; k++) {
    const F = P.map((p, i) => (D[i] - p) * 0.15);   // resorte hacia la posición deseada
    for (let i = 0; i + 1 < n; i++) {
      const sol = P[i] + W[i] / 2 + gap - (P[i + 1] - W[i + 1] / 2);
      if (sol > 0) { F[i] -= sol * 0.5; F[i + 1] += sol * 0.5; }   // repulsión entre vecinos que se pisan
    }
    P = P.map((p, i) => p + F[i]);
  }
  if (cabe) {   // garantía final: hacia la derecha nadie se solapa, y hacia la izquierda nadie se sale del límite
    P = P.map((p, i) => Math.max(p, min + W[i] / 2));
    for (let i = 1; i < n; i++) P[i] = Math.max(P[i], P[i - 1] + W[i - 1] / 2 + gap + W[i] / 2);
    for (let i = n - 1; i >= 0; i--) { const tope = (i === n - 1 ? max : P[i + 1] - W[i + 1] / 2 - gap) - W[i] / 2; if (P[i] > tope) P[i] = tope; }
  } else { let x = min; P = P.map((_, i) => { const c = x + W[i] / 2; x += W[i] + (max - min - W.reduce((s, w) => s + w, 0)) / Math.max(1, n - 1); return c; }); }
  const out = new Array(n); o.forEach((i, j) => { out[i] = P[j]; });
  out.cabe = cabe;
  return out;
}

/**
 * Parte `s` en líneas que caben en `ancho` SIN perder ni cortar nada: por palabras; si una palabra sola no cabe, devuelve null (quien llama decide:
 * achicar, usar un alias corto o sacar la etiqueta con un hilo). `maxLineas` es un tope duro: si no cabe, null. Nunca escribe «…».
 */
export function envolverEntero(ctx, s, ancho, maxLineas = 3) {
  const pal = String(s).split(' ').filter(Boolean), out = []; let l = '';
  for (const p of pal) {
    if (ctx.measureText(p).width > ancho) return null;
    const c = l ? `${l} ${p}` : p;
    if (ctx.measureText(c).width <= ancho) l = c; else { out.push(l); l = p; }
  }
  if (l) out.push(l);
  return out.length && out.length <= maxLineas ? out : null;
}
