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

// ── COLOCACIÓN 2-D ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ATRIBUCIÓN: la idea de «elegir entre posiciones candidatas (derecha, arriba, abajo, izquierda…) y quedarse con la de menos solape» es la del README de
// kevinschaul/avoid-overlap; ese repositorio NO declara licencia, así que NO se copió ni se consultó su código: esto está derivado solo de la idea
// y reescrito desde cero. Determinista: orden fijo de candidatos, desempates por índice, pasadas fijas, sin azar ni reloj.

const LADOS = ['der', 'arr', 'aba', 'izq', 'arrDer', 'abaDer', 'arrIzq', 'abaIzq'];
const solape = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const toca = (c, r) => { const qx = Math.max(r[0], Math.min(c[0], r[2])), qy = Math.max(r[1], Math.min(c[1], r[3])); return (c[0] - qx) ** 2 + (c[1] - qy) ** 2 < c[2] * c[2]; };

/**
 * Coloca etiquetas rectangulares junto a sus puntos de anclaje (2-D) sin pisar otras etiquetas, obstáculos ni los propios datos.
 * items:  [{x, y, w, h, r?, pref?, prio?}]   x,y = anclaje (centro del punto), w,h = tamaño de la etiqueta, r = radio de la marca (def. 6), pref = orden de lados.
 * opciones: caja [x0,y0,x1,y1] límites; rects [[x0,y0,x1,y1]] zonas prohibidas (otras capas, ejes); puntos [[x,y,r]] datos a esquivar
 *           (p. ej. muestras de las líneas); gap separación al ancla; anillos 2 = (cerca, lejos con hilo).
 * Devuelve por ítem {x, y (esquina sup. izq.), lado, hilo (true = lejos, dibujar hilo), choques (0 = limpio)}; el array trae `.choques` (total).
 */
export function colocar2D(items, {caja = [-Infinity, -Infinity, Infinity, Infinity], rects = [], puntos = [], gap = 6, pasadas = 3} = {}) {
  const n = items.length, res = new Array(n).fill(null), marcas = items.map((it) => [it.x, it.y, it.r ?? 6]);
  const orden = items.map((_, i) => i).sort((a, b) => (items[a].prio ?? a) - (items[b].prio ?? b) || a - b);
  const cajaDe = (it, lado, d) => {
    const {x, y, w, h} = it, dd = d * 0.72;
    switch (lado) {
      case 'der': return [x + d, y - h / 2, x + d + w, y + h / 2];
      case 'izq': return [x - d - w, y - h / 2, x - d, y + h / 2];
      case 'arr': return [x - w / 2, y - d - h, x + w / 2, y - d];
      case 'aba': return [x - w / 2, y + d, x + w / 2, y + d + h];
      case 'arrDer': return [x + dd, y - dd - h, x + dd + w, y - dd];
      case 'abaDer': return [x + dd, y + dd, x + dd + w, y + dd + h];
      case 'arrIzq': return [x - dd - w, y - dd - h, x - dd, y - dd];
      default: return [x - dd - w, y + dd, x - dd, y + dd + h];
    }
  };
  const evaluar = (i, b, otros) => {
    let choq = 0, costo = 0;
    const fuera = (b[2] - b[0]) * (b[3] - b[1]) - solape(b, caja);
    if (fuera > 1) { choq++; costo += 40 * fuera + 4000; }
    for (const o of otros) { const s = solape(b, o); if (s > 0) { choq++; costo += 24 * s + 3000; } }
    for (const r of rects) { const s = solape(b, r); if (s > 0) { choq++; costo += 14 * s + 2500; } }
    for (let j = 0; j < n; j++) if (j !== i && toca(marcas[j], b)) { choq++; costo += 3500; }
    for (const p of puntos) if (toca([p[0], p[1], (p[2] ?? 3) + 1], b)) { choq++; costo += 600; }
    return {costo, choq};
  };
  const elegir = (i, otros) => {
    const it = items[i], lados = it.pref ?? LADOS, r0 = (it.r ?? 6) + gap;
    let mejor = null;
    [[1, false], [2.6 + it.h / (2 * r0), true]].forEach(([f, hilo], anillo) => lados.forEach((lado, q) => {
      const b = cajaDe(it, lado, r0 * f), e = evaluar(i, b, otros), costo = e.costo + q * 5 + anillo * 60 + (hilo ? (r0 * f) * 0.5 : 0);
      if (!mejor || costo < mejor.costo - 1e-9) mejor = {costo, choques: e.choq, x: b[0], y: b[1], lado, hilo, b};
    }));
    return mejor;
  };
  for (const i of orden) res[i] = elegir(i, res.filter((r) => r).map((r) => r.b));
  for (let p = 0; p < pasadas; p++) for (const i of orden) { const antes = res[i]; res[i] = null; res[i] = elegir(i, res.filter((r) => r).map((r) => r.b)) ?? antes; }
  const out = res.map((r) => ({x: r.x, y: r.y, lado: r.lado, hilo: r.hilo, choques: r.choques, b: r.b}));
  out.choques = out.reduce((s, r) => s + r.choques, 0);
  return out;
}

/** Extremos del hilo entre el ancla y su etiqueta: del borde de la marca (radio r) hasta el punto más cercano de la caja. [x1,y1,x2,y2] */
export function hiloEtiqueta(it, pos) {
  const b = pos.b, qx = Math.max(b[0], Math.min(it.x, b[2])), qy = Math.max(b[1], Math.min(it.y, b[3])), dx = qx - it.x, dy = qy - it.y, d = Math.hypot(dx, dy) || 1, r = it.r ?? 6;
  return [it.x + (dx / d) * r, it.y + (dy / d) * r, qx, qy];
}
