// Capas dibujables. Cada capa es una función pura (env, capa) -> pinta en env.ctx para el instante env.t.
// Las gráficas publican en env.vistas[id] su proyección datos->píxel y en env.cabezas[id] el valor bajo la
// "cabeza" de la animación; las capas de anotación (llamada, zona, contador) las leen: así NADA se coloca a
// mano en píxeles, todo se ancla a un dato.
import {
  PALETA, clamp, lerp, ease, prog, colorDe, mezcla, rgba, fmtNum, fmtFecha, ticksNum, ticksFecha, etiquetaTick,
  lowerBound, valorEn, mezclaRango, fmtSigno, COLOR, TEMA, utc,
} from './nucleo.js';

import {escalarFuente, fuenteCss, tipo, ZONA, margenes, envolver, textoPie, MOV, CURVA, entrada as entradaEsc, retardo, contraste, legible} from './diseno.js';
// TODA fuente pasa por el sistema de diseño (motor/diseno.js): nunca baja del piso de legibilidad de su banda y formato.
const fnt = (peso, px, mono = false) => fuenteCss(peso, escalarFuente(px), mono);

export const Z = {imagen: 5, zona: 8, sankey: 10, donut: 10, cascada: 10, pendiente: 10, bump: 10, treemap: 10, waffle: 10, lollipop: 10, divergente: 10, linea: 10, barras: 10, carrera: 10, dispersion: 10, calor: 10, llamada: 20, contador: 25, titulo: 30, cortina: 40, sello: 50};

function caja(env, capa, def) {
  const c = capa.caja ?? def;
  return {x: c[0] * env.W, y: c[1] * env.H, w: c[2] * env.W, h: c[3] * env.H};
}
const CAJA_DEF = (env) => (env.H > env.W ? [0.16, 0.31, 0.55, 0.5] : [0.07, 0.25, 0.86, 0.58]);   // vertical: margen izquierdo para que las cifras del eje Y no salgan del cuadro
const aparece = (env, capa, t0) => prog(env.t, (capa.aparece ?? t0 - 0.5), (capa.aparece ?? t0 - 0.5) + 0.5, ease.out3);

function texto(ctx, s, x, y, font, color, align = 'left', base = 'alphabetic', alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha; ctx.font = font; ctx.fillStyle = legible(color, PALETA.fondo, 6.2); ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(s, x, y);
  ctx.restore();
}
/** Marca del eje X centrada en x, pero sin salirse por la derecha de la zona útil (en vertical, la zona segura del celular). */
function marcaX(env, s, x, y, font, color) {
  const {ctx, W, H, u} = env, lim = H > W ? ZONA.x * W - 6 : W - 20 * u;
  ctx.save(); ctx.font = font; const w = ctx.measureText(s).width; ctx.restore();
  if (x + w / 2 > lim) texto(ctx, s, lim, y, font, color, 'right'); else texto(ctx, s, x, y, font, color, 'center');
}
const mid = (px) => 0.35 * escalarFuente(px);   // desplazamiento para centrar en vertical un texto de tamaño px
const decTicks = (paso) => (paso >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(paso) - 1e-9)));

// ── Cámara por keyframes (en el espacio de los DATOS, no en píxeles: el texto siempre queda nítido) ─────────────
function dominioAuto(capa, tab, idxs) {
  if (capa._dom) return capa._dom;
  let ymin = Infinity, ymax = -Infinity;
  for (const i of idxs) for (const v of tab.series[i].y) if (v != null) { if (v < ymin) ymin = v; if (v > ymax) ymax = v; }
  const pad = (ymax - ymin) * 0.08 || 1;
  return (capa._dom = {x: [tab.x[0], tab.x[tab.x.length - 1]], y: [capa.cero ? Math.min(0, ymin - pad) : ymin - pad, ymax + pad]});
}
function ajustarY(tab, idxs, xr) {
  let ymin = Infinity, ymax = -Infinity;
  const a = Math.max(0, lowerBound(tab.x, xr[0]) - 1), b = Math.min(tab.x.length - 1, lowerBound(tab.x, xr[1]));
  for (const i of idxs) for (let k = a; k <= b; k++) { const v = tab.series[i].y[k]; if (v != null) { if (v < ymin) ymin = v; if (v > ymax) ymax = v; } }
  if (!isFinite(ymin)) return null;
  const pad = (ymax - ymin) * 0.12 || 1;
  return [ymin - pad, ymax + pad];
}
function estadosCamara(capa, tab, idxs) {
  if (capa._est) return capa._est;
  const dom = dominioAuto(capa, tab, idxs);
  const kfs = capa.camara?.length ? capa.camara : [{t: 0, x: 'auto', y: 'auto'}];
  return (capa._est = kfs.map((k) => {
    const x = k.x === 'auto' || !k.x ? dom.x : k.x;
    const y = k.y === 'auto' || !k.y ? dom.y : k.y === 'ajustar' ? (ajustarY(tab, idxs, x) ?? dom.y) : k.y;
    return {t: k.t, mov: k.mov ?? 1.1, x, y};
  }));
}
// Cámara «seguir» (Johnny Harris): una ventana que acompaña la cabeza de la línea y reescala el eje Y a lo que se ve;
// al terminar de dibujar se abre al plano completo. Pura función de t: el eje Y promedia 5 instantes recientes para no dar saltos.
function ventanaSeguir(capa, tab, idxs, t) {
  const dom = dominioAuto(capa, tab, idxs), [t0, t1] = capa.t ?? [0.5, 6], span = (dom.x[1] - dom.x[0]) * (capa.ventana ?? 0.28);
  const en = (tt) => {
    const xh = lerp(dom.x[0], dom.x[1], prog(tt, t0, t1, ease.io2));
    const a = Math.max(dom.x[0], xh - span * 0.85), b = Math.min(dom.x[1], a + span);
    return {x: [a, b], xh};
  };
  const w = en(Math.min(t, t1)), ys = [];
  // envolvente de unos instantes alrededor (algo hacia adelante): contiene siempre la cabeza de la línea y cambia suavemente
  for (const d of [-0.3, 0, 0.3, 0.6, 0.9]) { const q = en(clamp(t + d, t0, t1)); const y = ajustarY(tab, idxs, [q.x[0], Math.max(q.x[0] + span * 0.1, q.xh)]); if (y) ys.push(y); }
  const y = ys.length ? [Math.min(...ys.map((v) => v[0])), Math.max(...ys.map((v) => v[1]))] : dom.y;
  const abre = ease.io2(clamp((t - (t1 + 0.3)) / 1.3));
  return abre > 0 ? {x: mezclaRango(w.x, dom.x, abre), y: mezclaRango(y, dom.y, abre)} : {x: w.x, y};
}
function camaraEn(capa, tab, idxs, t) {
  if (capa.camara === 'seguir') return ventanaSeguir(capa, tab, idxs, t);
  const E = estadosCamara(capa, tab, idxs);
  let cur = E[0];
  let x = cur.x, y = cur.y;
  for (let i = 1; i < E.length; i++) {
    const ini = E[i].t - E[i].mov;
    if (t <= ini) break;
    const k = ease.io2(clamp((t - ini) / E[i].mov));   // curva suave: velocidad pico 2× la media (io3 daba 3× y la línea se volvía una banda)
    x = mezclaRango(E[i - 1].x, E[i].x, k); y = mezclaRango(E[i - 1].y, E[i].y, k);
    if (k < 1) break;
    x = E[i].x; y = E[i].y;
  }
  return {x, y};
}

// Escala logarítmica (series de siglos o de varios órdenes de magnitud): todo el encuadre trabaja en log10 y solo las
// etiquetas, el contador y las llamadas muestran/leen el valor original.
function tablaLog(capa, tab) {
  return (capa._tl ??= {...tab, series: tab.series.map((s) => ({...s, y: s.y.map((v) => (v > 0 ? Math.log10(v) : null))}))});
}
function ticksLog(a, b) {
  const out = [], span = b - a, e0 = Math.floor(a), e1 = Math.ceil(b), paso = span > 9 ? 2 : 1;
  for (let e = e0; e <= e1; e += paso) {
    for (const m of span < 2.2 ? [1, 2, 5] : [1]) { const v = e + Math.log10(m); if (v >= a - 1e-9 && v <= b + 1e-9) out.push(v); }
  }
  return out;
}
const fmtLog = (v) => { const x = Math.pow(10, v); return fmtNum(x, {decimales: Math.max(0, Math.min(4, -Math.floor(v + 1e-9)))}); };

/** Nombre junto a la cabeza de una línea: a la derecha si cabe dentro de la zona útil, si no a la izquierda. */
function etiquetaCabeza(env, h, nombre, y, px, peso, color, B) {
  const {ctx, u, W, H} = env, lim = H > W ? ZONA.x * W - 6 : W - 40 * u;
  ctx.font = fnt(peso, px); const w = ctx.measureText(nombre).width, der = h.x + 16 * u + w <= lim;
  texto(ctx, nombre, der ? h.x + 16 * u : h.x - 16 * u, y, fnt(peso, px), color, der ? 'left' : 'right');
}
// ── LÍNEA (multi-serie, doble eje, escala log, área, brillo, cabeza con pulso) ──────────────────────────────
function linea(env, capa) {
  const {ctx, u, t} = env;
  const orig = env.tablas[capa.datos], log = capa.escala === 'log';
  const tab = log ? tablaLog(capa, orig) : orig, n = tab.x.length;
  const B = caja(env, capa, CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 6];
  const idxs = capa.series ?? tab.series.map((_, i) => i);
  const der = new Set(capa.ejeDer ?? []);
  const izq = idxs.filter((i) => !der.has(i));
  const reveal = prog(t, t0, t1, ease.io2);
  const xmin = tab.x[0], xmax = tab.x[n - 1], xh = lerp(xmin, xmax, reveal);
  const cam = camaraEn(capa, tab, izq.length ? izq : idxs, t);
  const ap = aparece(env, capa, t0);
  if (ap <= 0) return;
  const px = (x) => B.x + ((x - cam.x[0]) / (cam.x[1] - cam.x[0])) * B.w;
  const pyL = (y) => B.y + B.h - ((y - cam.y[0]) / (cam.y[1] - cam.y[0])) * B.h;
  // eje derecho: ajusta a lo visible (exacto y continuo con la cámara)
  let yR = null;
  if (der.size) { yR = ajustarY(tab, [...der], cam.x) ?? [0, 1]; }
  const pyR = (y) => B.y + B.h - ((y - yR[0]) / (yR[1] - yR[0])) * B.h;
  const fmtL = tab.series[(izq[0] ?? idxs[0])].fmt;

  // Estado de la gráfica en cualquier instante tt (cámara + proyección): lo usan las anotaciones para decidir dónde ir
  // SIN depender del instante que se está dibujando (así la colocación es una función pura de los datos).
  const estadoEn = (tt) => {
    const c = camaraEn(capa, tab, izq.length ? izq : idxs, tt);
    const yR_ = der.size ? (ajustarY(tab, [...der], c.x) ?? [0, 1]) : null;
    const pxx = (x) => B.x + ((x - c.x[0]) / (c.x[1] - c.x[0])) * B.w;
    const pyl = (y) => B.y + B.h - ((y - c.y[0]) / (c.y[1] - c.y[0])) * B.h;
    const pyr = (y) => B.y + B.h - ((y - yR_[0]) / (yR_[1] - yR_[0])) * B.h;
    const py = (y, si) => { const v = log ? Math.log10(y) : y; return der.has(si) ? pyr(v) : pyl(v); };
    // ordenadas en pantalla de todas las series en la abscisa de pantalla sx (para no tapar la línea con una tarjeta)
    const lineaY = (sx) => {
      const xd = c.x[0] + ((sx - B.x) / B.w) * (c.x[1] - c.x[0]);
      if (xd < orig.x[0] || xd > orig.x[orig.x.length - 1]) return [];
      return idxs.map((si) => valorEn(orig.x, orig.series[si].y, xd)).filter((v) => v != null && (!log || v > 0)).map((v, k) => py(v, idxs[k]));
    };
    return {B, cam: c, px: pxx, py, lineaY};
  };
  if (capa.id) env.proy[capa.id] = estadoEn;

  ctx.save();
  ctx.globalAlpha = ap;
  const hx = px(xh), colorMarca = colorDe(tab.series[idxs[0]].color, idxs[0]);
  // eje Y: pocas marcas y discretas (menos tinta: lo importante lo dicen el contador y las llamadas)
  const ty = log ? ticksLog(cam.y[0], cam.y[1]) : ticksNum(cam.y[0], cam.y[1], 5), paso = ty.length > 1 ? ty[1] - ty[0] : 1, dec = Math.max(decTicks(paso), 0);
  ctx.lineWidth = 1 * u;
  for (const v of ty) {
    const y = pyL(v);
    if (y < B.y - 4 * u || y > B.y + B.h + 4 * u) continue;
    ctx.strokeStyle = rgba(PALETA.piedra, 0.06); ctx.beginPath(); ctx.moveTo(B.x, y); ctx.lineTo(B.x + B.w, y); ctx.stroke();
    texto(ctx, log ? fmtLog(v) : fmtNum(v, {decimales: dec}), B.x - 14 * u, y + mid(20 * u), fnt(500, 20 * u, true), PALETA.piedraOscura, 'right');
  }
  if (capa.ejeUnidad && fmtL?.unidad) texto(ctx, fmtL.unidad.toUpperCase(), B.x, B.y - 22 * u, fnt(500, 17 * u, true), PALETA.piedraOscura, 'left');
  if (yR) {
    const tr = ticksNum(yR[0], yR[1], 4), pr = tr.length > 1 ? tr[1] - tr[0] : 1;
    const c = colorDe(tab.series[[...der][0]].color, [...der][0]);
    for (const v of tr) texto(ctx, fmtNum(v, {decimales: decTicks(pr)}), B.x + B.w + 14 * u, pyR(v) + mid(20 * u), fnt(500, 20 * u, true), c, 'left');
    const fu = tab.series[[...der][0]].fmt?.unidad; if (fu) texto(ctx, fu.toUpperCase(), B.x + B.w, B.y - 22 * u, fnt(500, 17 * u, true), c, 'right');
  }
  // eje X + marca del año en curso (la cabeza siempre dice en qué año estamos: no se pierde el hilo)
  if (tab.tipoX === 'fecha') {
    const tf = ticksFecha(cam.x[0], cam.x[1], Math.max(2, Math.floor(B.w / (260 * u))));
    const enCurso = reveal > 0.001 && reveal < 0.999 && capa.marcaAnio !== false && hx >= B.x && hx <= B.x + B.w;
    for (const tk of tf.ticks) {
      const x = px(tk);
      if (x < B.x - 2 || x > B.x + B.w + 2) continue;
      if (enCurso && Math.abs(x - hx) < 120 * u) continue;
      marcaX(env, etiquetaTick(tk, tf.unidad), x, B.y + B.h + 40 * u, fnt(500, 20 * u, true), PALETA.piedraOscura);
    }
    if (enCurso) {
      const largo = cam.x[1] - cam.x[0] > 3 * 365.25 * 86400000, et = fmtFecha(xh, largo ? 'anio' : 'mes');
      ctx.font = fnt(800, 26 * u, true);
      const w = ctx.measureText(et).width + 30 * u, h = escalarFuente(26 * u) * 1.5, xx = clamp(hx - w / 2, B.x, B.x + B.w - w), yy = B.y + B.h + 10 * u;
      ctx.strokeStyle = colorMarca; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(hx, B.y + B.h); ctx.lineTo(hx, yy); ctx.stroke();
      ctx.fillStyle = colorMarca; ctx.fillRect(xx, yy, w, h);
      texto(ctx, et, xx + w / 2, yy + h / 2 + mid(26 * u), fnt(800, 26 * u, true), PALETA.fondo, 'center');
    }
  } else {
    for (const tk of ticksNum(cam.x[0], cam.x[1], 4)) marcaX(env, fmtNum(tk, {decimales: 0}), px(tk), B.y + B.h + 40 * u, fnt(500, 20 * u, true), PALETA.piedraOscura);
  }
  reg(env, 'eje-y', [Math.max(0, B.x - 130 * u), B.y - 8 * u, B.x - 4 * u, B.y + B.h + 8 * u], capa.id);
  reg(env, 'eje-x', [B.x, B.y + B.h + 6 * u, B.x + B.w, B.y + B.h + 70 * u], capa.id);
  // eje base
  ctx.strokeStyle = rgba(PALETA.piedra, 0.3); ctx.lineWidth = 1.5 * u;
  ctx.beginPath(); ctx.moveTo(B.x, B.y + B.h); ctx.lineTo(B.x + B.w, B.y + B.h); ctx.stroke();

  // series
  ctx.save();
  ctx.beginPath(); ctx.rect(B.x - 2, B.y - 12 * u, B.w + 4, B.h + 24 * u); ctx.clip();
  const cabezas = [];
  // «foco»: una serie protagonista y las demás atenuadas (la técnica de Johnny Harris: una sola línea manda y el resto da contexto)
  const foco = capa.foco ?? null, orden = foco != null ? [...idxs.filter((i) => i !== foco), foco] : idxs;
  orden.forEach((si, k) => {
    const s = tab.series[si], color = colorDe(s.color, si), py = der.has(si) ? pyR : pyL, mudo = foco != null && si !== foco;
    const a = Math.max(0, lowerBound(tab.x, cam.x[0]) - 1), b = Math.min(n - 1, lowerBound(tab.x, Math.min(cam.x[1], xh)));
    const P = new Path2D();
    let abierto = false, x0p = null, ult = null;
    const bucket = Math.max(1, Math.floor((b - a) / (B.w * 2)));
    for (let i = a; i <= b; i += bucket) {
      let y = s.y[i], xi = tab.x[i];
      if (xi > xh) break;
      if (y == null) { abierto = false; continue; }
      if (!abierto) { P.moveTo(px(xi), py(y)); abierto = true; if (x0p === null) x0p = px(xi); } else P.lineTo(px(xi), py(y));
      ult = [xi, y];
    }
    const yo = valorEn(orig.x, orig.series[si].y, xh);          // el valor mostrado siempre sale de los datos originales
    const yh = log ? (yo > 0 ? Math.log10(yo) : null) : yo;
    if (yh != null && ult && xh > ult[0]) { P.lineTo(px(xh), py(yh)); }
    if (yh == null || x0p === null) return;
    if (capa.area && !mudo) {
      const A = new Path2D(P);
      A.lineTo(px(xh), B.y + B.h); A.lineTo(x0p, B.y + B.h); A.closePath();
      const g = ctx.createLinearGradient(0, B.y, 0, B.y + B.h);
      g.addColorStop(0, rgba(color, 0.3)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.fill(A);
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (mudo) { ctx.save(); ctx.globalAlpha *= 0.42; ctx.strokeStyle = color; ctx.lineWidth = 2.4 * u; ctx.stroke(P); ctx.restore(); }
    else {
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 22 * u; ctx.strokeStyle = rgba(color, 0.55); ctx.lineWidth = 7 * u; ctx.stroke(P); ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 3.4 * u; ctx.stroke(P);
    }
    cabezas.push({si, color, x: px(xh), y: py(yh), valor: yo, nombre: s.nombre, fmt: s.fmt, s, mudo});
  });
  ctx.restore();

  // cabezas: punto + ondas + etiqueta. Los nombres se separan en vertical para que dos series cercanas no se pisen.
  const gapEt = escalarFuente(24 * u) * 1.2, visibles = cabezas.filter((h) => reveal > 0 && h.x >= B.x - 4 && h.x <= B.x + B.w + 4), yEt = new Map();
  if (visibles.length > 1) separar(visibles.map((h) => h.y), gapEt, B.y + gapEt / 2, B.y + B.h - gapEt / 2).forEach((y, i) => yEt.set(visibles[i], y));
  for (const h of cabezas) {
    if (reveal <= 0 || h.x < B.x - 4 || h.x > B.x + B.w + 4) continue;
    if (h.mudo) {   // serie de contexto: punto pequeño y nombre tenue, sin ondas
      ctx.fillStyle = rgba(h.color, 0.6); ctx.beginPath(); ctx.arc(h.x, h.y, 4.5 * u, 0, 7); ctx.fill();
      if (capa.etiquetas !== false) etiquetaCabeza(env, h, h.nombre, (yEt.get(h) ?? h.y) + mid(24 * u), 24 * u, 500, h.color, B);
      continue;
    }
    const ciclo = (t * 0.9) % 1;
    ctx.strokeStyle = rgba(h.color, (1 - ciclo) * 0.55 * (reveal < 1 ? 1 : 0.6)); ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.arc(h.x, h.y, (9 + 30 * ciclo) * u, 0, 7); ctx.stroke();
    ctx.fillStyle = PALETA.blanco; ctx.beginPath(); ctx.arc(h.x, h.y, 6.5 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = h.color; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(h.x, h.y, 9.5 * u, 0, 7); ctx.stroke();
    if (capa.etiquetas !== false && idxs.length > 1) {
      etiquetaCabeza(env, h, h.nombre, (yEt.get(h) ?? h.y) + mid(24 * u), 24 * u, 700, h.color, B);
    }
  }
  ctx.restore();

  if (capa.id) {
    env.vistas[capa.id] = {B, cam, tab, px, py: (y, si) => { const v = log ? Math.log10(y) : y; return der.has(si) ? pyR(v) : pyL(v); }, xh, ap, tipo: 'linea'};
    env.cabezas[capa.id] = {xh, ap, series: Object.fromEntries(cabezas.map((c) => [c.si, {valor: c.valor, color: c.color, nombre: c.nombre, fmt: c.fmt}]))};
  }
}

// ── BARRAS (vertical/horizontal, agrupadas, con signo) ──────────────────────────────────────────────────────
function barras(env, capa) {
  const {ctx, u, t, W, H} = env, vert = H > W;
  const tab = env.tablas[capa.datos], n = tab.x.length;
  const B = caja(env, capa, vert ? [0.065, 0.3, 0.64, 0.5] : CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 3];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const idxs = capa.series ?? tab.series.map((_, i) => i);
  const horiz = capa.orientacion ? capa.orientacion === 'h' : (vert && n > 3);   // en vertical (celular) las barras van acostadas: los nombres se leen enteros
  let orden = [...Array(n).keys()];
  if (capa.orden === 'desc') orden.sort((a, b) => (tab.series[idxs[0]].y[b] ?? -Infinity) - (tab.series[idxs[0]].y[a] ?? -Infinity));
  if (capa.maxBarras) orden = orden.slice(0, capa.maxBarras);
  let lo = 0, hi = -Infinity;
  for (const i of idxs) for (const k of orden) { const v = tab.series[i].y[k]; if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
  const span = hi - lo || 1; hi += span * 0.12; if (lo < 0) lo -= span * 0.08;
  const m = orden.length, ng = idxs.length, fmt = tab.series[idxs[0]].fmt;
  const fmtV = {...tab.series[idxs[0]].fmt, prefijo: '', sufijo: ''};
  const etiqueta = (k) => (tab.tipoX === 'fecha' ? fmtFecha(tab.x[k], capa.formatoX ?? 'anio') : String(tab.x[k]));
  ctx.save(); ctx.globalAlpha = ap;
  const ty = ticksNum(lo, hi, horiz ? 4 : 5), pasoT = ty.length > 1 ? ty[1] - ty[0] : 1, fT = fnt(500, 20 * u, true);
  const colorBarra = (v, si) => (capa.colorSigno ? (v >= 0 ? PALETA.teal : '#A24FB0') : colorDe(tab.series[si].color, si));
  if (fmt?.unidad) texto(ctx, fmt.unidad.toUpperCase(), B.x, B.y - 26 * u, fnt(500, 19 * u, true), PALETA.piedraOscura, 'left');
  if (horiz) {
    ctx.font = fnt(600, 26 * u); const LW = Math.min(B.w * 0.38, Math.max(...orden.map((k) => ctx.measureText(etiqueta(k)).width)) + 20 * u);
    ctx.font = fnt(600, 26 * u, true); const VW = Math.max(...orden.flatMap((k) => idxs.map((si) => ctx.measureText(fmtNum(tab.series[si].y[k] ?? 0, fmtV)).width))) + 16 * u;
    const x0 = B.x + LW, L = Math.max(40 * u, B.w - LW - VW), val = (v) => ((v - lo) / (hi - lo)) * L, rowH = Math.min(B.h / m, 120 * u), bh = (rowH * 0.64) / ng, y0 = B.y;
    for (const v of ticksNum(lo, hi, Math.max(2, Math.floor(L / (150 * u))))) { const x = x0 + val(v); ctx.strokeStyle = rgba(PALETA.piedra, 0.1); ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + rowH * m); ctx.stroke(); marcaX(env, fmtNum(v, {decimales: decTicks(pasoT)}), x, y0 + rowH * m + 40 * u, fT, PALETA.piedraOscura); }   // (pasoT sale de ty; con pocas marcas basta)
    reg(env, 'eje-x', [x0 - 30 * u, y0 + rowH * m + 6 * u, x0 + L + 30 * u, y0 + rowH * m + 56 * u], capa.id);
    const z = x0 + val(0);
    ctx.strokeStyle = rgba(PALETA.piedra, 0.45); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(z, y0); ctx.lineTo(z, y0 + rowH * m); ctx.stroke();
    orden.forEach((k, j) => {
      const g = entradaEsc(t, t0, j, m, 0.6), yb = y0 + j * rowH + (rowH - bh * ng) / 2;
      const et = etiqueta(k); texto(ctx, et, B.x + LW - 14 * u, y0 + j * rowH + rowH / 2 + mid(26 * u), fnt(600, 26 * u), PALETA.piedraClara, 'right');
      ctx.font = fnt(600, 26 * u); reg(env, 'etiqueta', [B.x + LW - 14 * u - ctx.measureText(et).width, y0 + j * rowH + rowH / 2 - 22 * u, B.x + LW - 14 * u, y0 + j * rowH + rowH / 2 + 12 * u], `${capa.id ?? 'barras'}:n:${k}`);
      idxs.forEach((si, q) => {
        const v = tab.series[si].y[k]; if (v == null) return;
        const color = colorBarra(v, si), xe = x0 + val(0) + (val(v) - val(0)) * g, y = yb + q * bh;
        const gr = ctx.createLinearGradient(z, 0, z + Math.abs(xe - z) + 1, 0); gr.addColorStop(0, rgba(color, 0.55)); gr.addColorStop(1, color);
        ctx.fillStyle = gr; ctx.fillRect(Math.min(z, xe), y, Math.max(Math.abs(xe - z), 1.5 * u), bh - 3 * u);
        if (capa.etiquetas !== false && g > 0.6) {
          const lbl = fmtNum(v * g, fmtV); ctx.font = fnt(600, 26 * u, true); const w = ctx.measureText(lbl).width, xv = v >= 0 ? xe + 10 * u : xe - 10 * u - w;
          texto(ctx, lbl, xv, y + bh / 2 + mid(26 * u), fnt(600, 26 * u, true), PALETA.piedraClara, 'left', 'alphabetic', g);
          reg(env, 'etiqueta', [xv, y + bh / 2 - 24 * u, xv + w, y + bh / 2 + 10 * u], `${capa.id ?? 'barras'}:v:${k}:${q}`);
        }
      });
    });
    ctx.restore(); return;
  }
  const L = B.h, val = (v) => ((v - lo) / (hi - lo)) * L, banda = B.w / m, gap = banda * 0.22, bw = (banda - gap) / ng;
  for (const v of ty) {
    const y = B.y + B.h - val(v);
    ctx.strokeStyle = rgba(PALETA.piedra, 0.1); ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(B.x, y); ctx.lineTo(B.x + B.w, y); ctx.stroke();
    texto(ctx, fmtNum(v, {decimales: decTicks(pasoT)}), B.x - 14 * u, y + mid(20 * u), fT, PALETA.piedraOscura, 'right');
  }
  reg(env, 'eje-y', [Math.max(0, B.x - 130 * u), B.y - 8 * u, B.x - 4 * u, B.y + B.h + 8 * u], capa.id);
  const z = B.y + B.h - val(0);
  ctx.strokeStyle = rgba(PALETA.piedra, 0.45); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(B.x, z); ctx.lineTo(B.x + B.w, z); ctx.stroke();
  ctx.font = fnt(500, 21 * u, true);
  const eti = orden.map((k) => etiqueta(k)), salto = Math.max(1, Math.ceil((Math.max(...eti.map((s) => ctx.measureText(s).width)) + 12 * u) / banda));   // si no caben todas, se rotula una de cada «salto»
  ctx.font = fnt(600, 20 * u, true); const vw = Math.max(...orden.map((k) => ctx.measureText(fmtNum(tab.series[idxs[0]].y[k] ?? 0, fmtV)).width));
  const rotuloValor = capa.etiquetas !== false && m <= 24 && vw * ng + 6 * u <= banda;
  orden.forEach((k, j) => {
    const g = entradaEsc(t, t0, j, m, 0.6);
    idxs.forEach((si, q) => {
      const v = tab.series[si].y[k]; if (v == null) return;
      const color = colorBarra(v, si), len = (val(v) - val(0)) * g, x = B.x + j * banda + gap / 2 + q * bw;
      const gr = ctx.createLinearGradient(0, z, 0, z - Math.max(1, len)); gr.addColorStop(0, rgba(color, 0.55)); gr.addColorStop(1, color);
      ctx.fillStyle = gr; ctx.fillRect(x, len >= 0 ? z - len : z, bw, Math.max(Math.abs(len), 1.5 * u));
      if (rotuloValor && g > 0.6) {
        const lbl = fmtNum(v * g, fmtV), yv = len >= 0 ? z - len - 12 * u : z - len + 34 * u;
        texto(ctx, lbl, x + bw / 2, yv, fnt(600, 20 * u, true), PALETA.piedraClara, 'center', 'alphabetic', g);
        reg(env, 'etiqueta', [x + bw / 2 - ctx.measureText(lbl).width / 2, yv - 30 * u, x + bw / 2 + ctx.measureText(lbl).width / 2, yv + 6 * u], `${capa.id ?? 'barras'}:v:${k}:${q}`);
      }
    });
    if (j % salto === 0) marcaX(env, eti[j], B.x + j * banda + banda / 2, B.y + B.h + 40 * u, fnt(500, 21 * u, true), PALETA.piedraOscura);
  });
  reg(env, 'eje-x', [B.x, B.y + B.h + 6 * u, B.x + B.w, B.y + B.h + 70 * u], capa.id);
  ctx.restore();
}

// ── CARRERA (bar chart race con rangos que se deslizan) ─────────────────────────────────────────────────────
// Diseño legible: en horizontal, nombre | barra | valor en una fila; en vertical (celular) el nombre y la cifra van arriba de cada barra.
function carrera(env, capa) {
  const {ctx, u, t, W, H} = env, vert = H > W;
  const tab = env.tablas[capa.datos], n = tab.x.length;
  const B = caja(env, capa, CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 10];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const f = prog(t, t0, t1, ease.lin) * (n - 1), i0 = Math.min(n - 2, Math.floor(f)), k = f - i0, ke = ease.io2(k);   // el tiempo de los datos avanza a ritmo constante (no es movimiento de interfaz)
  const S = tab.series.length, fila = vert ? 112 * u : 84 * u, top = Math.max(2, Math.min(capa.top ?? 8, S, Math.floor((B.h - (vert ? 70 * u : 0)) / fila)));
  const rango = (i) => {
    const o = tab.series.map((s, q) => ({q, v: s.y[i] ?? -Infinity})).sort((a, b) => b.v - a.v || a.q - b.q);
    const r = new Array(S); o.forEach((e, p) => (r[e.q] = p)); return r;
  };
  const r0 = rango(i0), r1 = rango(i0 + 1);
  const vals = tab.series.map((s) => { const a = s.y[i0], b = s.y[i0 + 1]; return a == null && b == null ? null : lerp(a ?? b, b ?? a, k); });
  const vmax = Math.max(...vals.filter((v) => v != null)) * 1.04 || 1;
  const y0 = B.y + (vert ? 70 * u : 0);
  ctx.save(); ctx.globalAlpha = ap;
  const fecha = tab.tipoX === 'fecha' ? fmtFecha(lerp(tab.x[i0], tab.x[i0 + 1], k), capa.formatoX ?? 'mes') : String(tab.x[Math.round(f)]);
  texto(ctx, fecha, vert ? B.x : B.x + B.w, vert ? B.y + 34 * u : B.y - 14 * u, fnt(800, 56 * u, true), PALETA.oro, vert ? 'left' : 'right');
  reg(env, 'etiqueta', vert ? [B.x, B.y - 30 * u, B.x + 360 * u, B.y + 50 * u] : [B.x + B.w - 360 * u, B.y - 70 * u, B.x + B.w, B.y + 4 * u], `${capa.id ?? 'carrera'}:fecha`);
  ctx.font = fnt(700, 26 * u); const LW = vert ? 0 : Math.min(B.w * 0.26, Math.max(...tab.series.map((s) => ctx.measureText(s.nombre).width)) + 24 * u);
  ctx.font = fnt(600, 24 * u, true); const VW = vert ? 0 : Math.max(...vals.filter((v) => v != null).map((v) => ctx.measureText(fmtNum(v, tab.series[0].fmt)).width)) + 24 * u;
  const orden = tab.series.map((_, q) => q).filter((q) => vals[q] != null).sort((a, b) => lerp(r0[b], r1[b], ke) - lerp(r0[a], r1[a], ke));
  for (const q of orden) {
    const pos = lerp(r0[q], r1[q], ke); if (pos > top - 0.5) continue;   // «top» filas visibles
    const y = y0 + pos * fila, color = colorDe(tab.series[q].color, q), alfa = clamp(top + 0.5 - pos, 0, 1);
    const bx = B.x + LW, bw = Math.max(3 * u, (vals[q] / vmax) * (B.w - LW - VW)), bh = vert ? 26 * u : 44 * u, by = vert ? y + fila - bh - 14 * u : y + (fila - bh) / 2;
    ctx.save(); ctx.globalAlpha *= alfa; ctx.shadowColor = color; ctx.shadowBlur = 12 * u;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, rgba(color, 0.55)); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh); ctx.restore();
    const vtxt = fmtNum(vals[q], tab.series[q].fmt); ctx.font = fnt(600, 26 * u, true); const wV = (capa._wv ??= Math.max(...tab.series.flatMap((sr) => sr.y.filter((v) => v != null).map((v) => ctx.measureText(fmtNum(v, sr.fmt)).width)))); ctx.font = fnt(700, 26 * u);
    const nom = vert ? cortar(ctx, tab.series[q].nombre, B.w - wV - 24 * u) : tab.series[q].nombre;
    if (vert) {
      texto(ctx, nom, B.x, y + 40 * u, fnt(700, 26 * u), PALETA.blanco, 'left', 'alphabetic', alfa);
      texto(ctx, vtxt, B.x + B.w, y + 40 * u, fnt(600, 26 * u, true), PALETA.piedraClara, 'right', 'alphabetic', alfa);
      if (alfa > 0.5) { ctx.font = fnt(700, 26 * u); reg(env, 'etiqueta', [B.x, y + 6 * u, B.x + ctx.measureText(nom).width, y + 50 * u], `${capa.id ?? 'carrera'}:n:${q}`); ctx.font = fnt(600, 26 * u, true); reg(env, 'etiqueta', [B.x + B.w - ctx.measureText(vtxt).width, y + 6 * u, B.x + B.w, y + 50 * u], `${capa.id ?? 'carrera'}:v:${q}`); }
    } else {
      texto(ctx, nom, bx - 16 * u, by + bh / 2 + mid(26 * u), fnt(700, 26 * u), PALETA.blanco, 'right', 'alphabetic', alfa);
      texto(ctx, vtxt, bx + bw + 14 * u, by + bh / 2 + mid(24 * u), fnt(600, 24 * u, true), PALETA.piedraClara, 'left', 'alphabetic', alfa);
      if (alfa > 0.5) { ctx.font = fnt(700, 26 * u); reg(env, 'etiqueta', [bx - 16 * u - ctx.measureText(nom).width, by - 4 * u, bx - 16 * u, by + bh + 4 * u], `${capa.id ?? 'carrera'}:n:${q}`); ctx.font = fnt(600, 24 * u, true); reg(env, 'etiqueta', [bx + bw + 14 * u, by - 4 * u, bx + bw + 14 * u + ctx.measureText(vtxt).width, by + bh + 4 * u], `${capa.id ?? 'carrera'}:v:${q}`); }
    }
  }
  ctx.restore();
}

// ── DISPERSIÓN (con regresión y R² calculados en la compilación) ────────────────────────────────────────────
function dispersion(env, capa) {
  const {ctx, u, t} = env;
  const tab = env.tablas[capa.datos], n = tab.x.length;
  const B = caja(env, capa, CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 4];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const s = tab.series[0], color = colorDe(s.color, 0);
  let xl = Infinity, xh = -Infinity, yl = Infinity, yh = -Infinity;
  for (let i = 0; i < n; i++) if (s.y[i] != null) { xl = Math.min(xl, tab.x[i]); xh = Math.max(xh, tab.x[i]); yl = Math.min(yl, s.y[i]); yh = Math.max(yh, s.y[i]); }
  const px0 = (xh - xl) * 0.06 || 1, py0 = (yh - yl) * 0.08 || 1; xl -= px0; xh += px0; yl -= py0; yh += py0;
  const X = (x) => B.x + ((x - xl) / (xh - xl)) * B.w, Y = (y) => B.y + B.h - ((y - yl) / (yh - yl)) * B.h;
  ctx.save(); ctx.globalAlpha = ap;
  const ty = ticksNum(yl, yh, 5), py_ = ty.length > 1 ? ty[1] - ty[0] : 1;
  for (const v of ty) { ctx.strokeStyle = rgba(PALETA.piedra, 0.1); ctx.beginPath(); ctx.moveTo(B.x, Y(v)); ctx.lineTo(B.x + B.w, Y(v)); ctx.stroke(); texto(ctx, fmtNum(v, {decimales: decTicks(py_)}), B.x - 14 * u, Y(v) + mid(20 * u), fnt(500, 20 * u, true), PALETA.piedraOscura, 'right'); }
  const tx = ticksNum(xl, xh, 4), px_ = tx.length > 1 ? tx[1] - tx[0] : 1;
  for (const v of tx) { ctx.strokeStyle = rgba(PALETA.piedra, 0.07); ctx.beginPath(); ctx.moveTo(X(v), B.y); ctx.lineTo(X(v), B.y + B.h); ctx.stroke(); marcaX(env, fmtNum(v, {decimales: decTicks(px_)}), X(v), B.y + B.h + 40 * u, fnt(500, 20 * u, true), PALETA.piedraOscura); }
  if (capa.etiquetaX) { texto(ctx, capa.etiquetaX, B.x + B.w, B.y + B.h + 84 * u, fnt(500, 20 * u, true), PALETA.piedraOscura, 'right'); ctx.font = fnt(500, 20 * u, true); reg(env, 'etiqueta', [B.x + B.w - ctx.measureText(capa.etiquetaX).width, B.y + B.h + 52 * u, B.x + B.w, B.y + B.h + 94 * u], `${capa.id ?? 'dispersion'}:ex`); }
  reg(env, 'eje-x', [B.x, B.y + B.h + 6 * u, B.x + B.w, B.y + B.h + 52 * u], capa.id); reg(env, 'eje-y', [Math.max(0, B.x - 130 * u), B.y - 8 * u, B.x - 4 * u, B.y + B.h + 8 * u], capa.id);
  if (capa.etiquetaY) { texto(ctx, capa.etiquetaY.toUpperCase(), B.x, B.y - 78 * u, fnt(500, 20 * u, true), PALETA.piedraOscura, 'left'); ctx.font = fnt(500, 20 * u, true); reg(env, 'etiqueta', [B.x, B.y - 116 * u, B.x + ctx.measureText(capa.etiquetaY.toUpperCase()).width, B.y - 70 * u], `${capa.id ?? 'dispersion'}:ey`); }
  for (let i = 0; i < n; i++) {
    if (s.y[i] == null) continue;
    const ini = t0 + (i / n) * (t1 - t0) * 0.8, g = prog(t, ini, ini + 0.35, ease.outBack);
    if (g <= 0) continue;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10 * u; ctx.fillStyle = rgba(color, 0.78);
    ctx.beginPath(); ctx.arc(X(tab.x[i]), Y(s.y[i]), 8 * u * g, 0, 7); ctx.fill(); ctx.restore();
  }
  const R = capa.regresion;
  if (R) {
    const w = prog(t, t1, t1 + 0.9, ease.io3);
    if (w > 0) {
      const xa = Math.max(xl, tab.x[0]), xb = lerp(xa, Math.min(xh, tab.x[n - 1]), w);
      ctx.save(); ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 3 * u; ctx.setLineDash([14 * u, 9 * u]);
      ctx.beginPath(); ctx.moveTo(X(xa), Y(R.m * xa + R.b)); ctx.lineTo(X(xb), Y(R.m * xb + R.b)); ctx.stroke(); ctx.restore();
      { const rt = `R² = ${fmtNum(R.r2, {decimales: 2})} · ${R.n} datos`; texto(ctx, rt, B.x + B.w, B.y - 22 * u, fnt(700, 26 * u, true), PALETA.blanco, 'right', 'alphabetic', w); ctx.font = fnt(700, 26 * u, true); reg(env, 'etiqueta', [B.x + B.w - ctx.measureText(rt).width, B.y - 62 * u, B.x + B.w, B.y - 8 * u], `${capa.id ?? 'dispersion'}:r2`); }
    }
  }
  ctx.restore();
}

// ── MAPA DE CALOR / MATRIZ DE CORRELACIÓN (la matriz se calcula en la compilación) ────────────────────────────
function calor(env, capa) {
  const {ctx, u, t} = env;
  const M = capa.matriz; if (!M) return;
  const B = caja(env, capa, env.H > env.W ? [0.05, 0.27, 0.66, 0.5] : [0.2, 0.2, 0.6, 0.66]);
  const [t0, t1] = capa.t ?? [0.5, 3];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const m = M.etiquetas.length, vert = env.H > env.W;
  ctx.font = fnt(700, 22 * u); const LW = Math.min(B.w * 0.36, Math.max(...M.etiquetas.map((e) => ctx.measureText(e).width)) + 24 * u);
  const cabeza = (vert ? 200 : 120) * u, side = Math.min(B.w - LW, B.h - cabeza) * 0.98, c = side / m;
  const ox = B.x + LW, oy = B.y + cabeza;
  const col = (v) => (v >= 0 ? mezcla(PALETA.tarjeta, PALETA.teal, v) : mezcla(PALETA.tarjeta, '#A24FB0', -v));
  ctx.save(); ctx.globalAlpha = ap;
  for (let i = 0; i < m; i++) {
    ctx.font = fnt(700, 22 * u); const nomC = cortar(ctx, M.etiquetas[i], LW - 20 * u);
    texto(ctx, nomC, ox - 14 * u, oy + i * c + c / 2 + mid(22 * u), fnt(700, 22 * u), PALETA.piedraClara, 'right');
    reg(env, 'etiqueta', [ox - 14 * u - ctx.measureText(nomC).width, oy + i * c + c / 2 - 26 * u, ox - 14 * u, oy + i * c + c / 2 + 12 * u], `${capa.id ?? 'calor'}:f:${i}`);
    ctx.save(); ctx.translate(ox + i * c + c / 2, oy - 14 * u); ctx.rotate(-Math.PI / 4);
    ctx.font = fnt(700, 22 * u); const nomR = cortar(ctx, M.etiquetas[i], cabeza * 1.5); texto(ctx, nomR, 0, 0, fnt(700, 22 * u), PALETA.piedraClara, 'left'); ctx.restore();
    for (let j = 0; j < m; j++) {
      const ini = t0 + ((Math.abs(i - j) + (i + j) * 0.15) / (m * 1.3)) * (t1 - t0), g = prog(t, ini, ini + 0.45, ease.outBack);
      if (g <= 0) continue;
      const v = M.valores[i][j];
      ctx.save(); ctx.translate(ox + j * c + c / 2, oy + i * c + c / 2); ctx.scale(g, g);
      const fondoC = col(v == null ? 0 : v), tinta = contraste(fondoC, PALETA.blanco) >= contraste(fondoC, PALETA.fondo) ? PALETA.blanco : PALETA.fondo;   // la cifra elige la tinta que más contrasta con su celda
      ctx.fillStyle = fondoC; ctx.fillRect(-c / 2 + 2 * u, -c / 2 + 2 * u, c - 4 * u, c - 4 * u);
      texto(ctx, v == null ? '—' : fmtNum(v, {decimales: 2}), 0, mid(26 * u), fnt(700, 26 * u, true), tinta, 'center');
      ctx.restore();
    }
  }
  ctx.restore();
}

// ── ANOTACIONES ANCLADAS A DATOS ────────────────────────────────────────────────────────────────────────────
function zona(env, capa) {
  const V = env.vistas[capa.capa]; if (!V) return;
  const {ctx, u, t} = env, {B} = V;
  const [t0, t1] = capa.t ?? [0, 99];
  const g = prog(t, t0, t0 + 0.6, ease.io3) * (1 - prog(t, t1, t1 + 0.4, ease.in2)); if (g <= 0) return;
  const color = colorDe(capa.color, 1);
  const xa = clamp(V.px(capa.x0), B.x, B.x + B.w), xb = clamp(V.px(capa.x1), B.x, B.x + B.w);
  if (xb - xa < 2) return;
  const w = (xb - xa);
  ctx.save(); ctx.globalAlpha *= V.ap;
  if (capa.estilo === 'banda') {   // banda de recesión/periodo: relleno más visible, sin guías discontinuas; entra de izquierda a derecha
    ctx.fillStyle = rgba(color, 0.26 * g); ctx.fillRect(xa, B.y, w * Math.min(1, g * 1.2), B.h);
  } else {
  ctx.fillStyle = rgba(color, 0.13 * g); ctx.fillRect(xa, B.y, w * Math.min(1, g * 1.2), B.h);
  ctx.strokeStyle = rgba(color, 0.7 * g); ctx.lineWidth = 2 * u; ctx.setLineDash([10 * u, 8 * u]);
  ctx.beginPath(); ctx.moveTo(xa, B.y); ctx.lineTo(xa, B.y + B.h); ctx.moveTo(xb, B.y); ctx.lineTo(xb, B.y + B.h); ctx.stroke();
  }
  if (capa.texto) texto(ctx, capa.texto.toUpperCase(), xa + w / 2, B.y + 30 * u, fnt(700, 21 * u, true), color, 'center', 'alphabetic', g);
  ctx.restore();
}

// ── Registro de cajas de texto ────────────────────────────────────────────────────────────────────────────────
// Aprendizaje de Electric Eye: nada de texto se coloca a ciegas. Cada texto reserva su caja, las tarjetas se colocan en
// el primer hueco libre (sin pisar títulos, contador, ejes, fuente ni la línea) y una auditoría recorre la pieza entera.
const reg = (env, tipo, c, id) => env.registro.push({tipo, caja: c, id});
const chocan = (a, b, m = 0) => a[0] < b[2] + m && a[2] + m > b[0] && a[1] < b[3] + m && a[3] + m > b[1];
const solape = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

function cajaTitulo(env, capa) {
  // BLOQUE DE TÍTULO (diseño): título (hasta 2 líneas en vertical) + subrayado + subtítulo/unidad. Se ajusta solo al ancho libre.
  const {ctx, u, W, H} = env, vert = H > W, pos = capa.pos ?? (vert ? [0.0667, 0.085] : [0.0417, 0.115]), x = pos[0] * W, y = pos[1] * H;
  const cont = env.capasTodas.find((k) => k.tipo === 'contador' && (k.alinea ?? (vert ? 'left' : 'right')) === 'right' && k.modo !== 'compacto');
  const libre = (cont && !vert ? cajaContador(env, cont).caja[0] - 28 * u : (vert ? ZONA.x * W - 6 : W * 0.94)) - x;
  const T = vert ? tipo(env, 'titulo') : tipo(env, 'titulo'), minimo = tipo(env, 'tituloMin'), maxL = vert ? 2 : 1;
  let tam = capa.tam ? capa.tam * u : T, lineas = [];
  const medir = () => { ctx.font = fuenteCssT(tam); return envolver(ctx, String(capa.texto ?? ''), libre, maxL); };
  lineas = medir();
  while ((lineas.length > maxL || lineas.some((l) => ctx.measureText(l).width > libre)) && tam > minimo) { tam -= 2 * u; lineas = medir(); }
  ctx.font = fuenteCssT(tam);
  const w = Math.max(...lineas.map((l) => ctx.measureText(l).width)), lh = tam * 1.12, ult = y + (lineas.length - 1) * lh;
  const subT = capa.sub ? tipo(env, 'sub') : 0, abajo = ult + 24 * u + (capa.sub ? subT * 1.25 + 6 * u : 0);
  return {x, y, w, tam, lh, lineas, texto: lineas.join(' '), ult, subT, caja: [x - 6 * u, y - tam, x + w + 6 * u, abajo]};
}
const fuenteCssT = (px) => fuenteCss(800, px);
function cajaContador(env, capa) {
  const {u, W, H} = env, vert = H > W;
  const pos = capa.pos ?? (vert ? [0.0667, 0.215] : [0.9583, 0.16]), al = capa.alinea ?? (vert ? 'left' : 'right');
  const x = pos[0] * W, y = pos[1] * H, compacto = capa.modo === 'compacto', ancho = (compacto ? (vert ? 640 : 460) : 520) * u;
  const arriba = y - (compacto ? 44 : 100) * u, abajo = y + (compacto ? 52 : (capa.modo === 'fecha' ? 20 : 160)) * u;
  return {x, y, al, ancho, caja: al === 'right' ? [x - ancho, arriba, x, abajo] : [x, arriba, x + ancho, abajo]};
}
/** Último dato mostrado: de los datos del plano (series de tiempo); si no hay fechas (tablas), la fecha de obtención. */
function datosSello(env, capa) {
  let txt = String(capa.texto ?? '').replace(/\s*\(obtenido [^)]*\) ?/g, '').replace(/^FUENTE\s*·\s*/i, '').trim();
  const m = String(capa.texto ?? '').match(/obtenido (\d{4})-(\d{2})-(\d{2})/);
  let fecha = capa.fecha ?? null;
  if (!fecha) {
    let best = null;
    for (const tab of Object.values(env.tablas ?? {})) if (tab.tipoX === 'fecha' && tab.x?.length > 1 && (!best || tab.x[tab.x.length - 1] > best.x[best.x.length - 1])) best = tab;
    if (best) {
      const n = best.x.length, pasos = []; for (let i = 1; i < Math.min(n, 400); i++) pasos.push((best.x[i] - best.x[i - 1]) / 86400000);
      pasos.sort((a, b) => a - b); const med = pasos[pasos.length >> 1];
      fecha = fmtFecha(best.x[n - 1], med <= 8 ? 'dia' : med >= 300 ? 'anio' : 'mes');
    } else if (m) fecha = 'obtenido ' + fmtFecha(utc(+m[1], +m[2], +m[3]), 'dia');
  }
  return {nombre: txt, fecha};
}
function cajaSello(env, capa) {
  // PIE OBLIGATORIO: «Fuente: <nombre> · <fecha del último dato> · RTL». Dentro de la zona segura y con tantas líneas como haga falta.
  const {ctx, u, W, H} = env, vert = H > W, px = tipo(env, 'pie'), D = margenes(env);
  const {nombre, fecha} = datosSello(env, capa);
  ctx.font = fuenteCss(500, px);
  const ancho = (vert ? ZONA.x * W - 8 : W - D.m) - D.m, lineas = envolver(ctx, textoPie(nombre, fecha), ancho, 3), lh = px * 1.3;
  const yTop = H - (vert ? 0.03 : 0.045) * H - (lineas.length - 1) * lh, w = Math.max(...lineas.map((l) => ctx.measureText(l).width));
  return {lineas, px, lh, x: D.m, y: yTop, caja: [D.m - 4 * u, yTop - px, D.m + w + 4 * u, yTop + (lineas.length - 1) * lh + px * 0.3]};
}
/** Cajas que no se mueven (título, contador, fuente, ejes): las tarjetas las esquivan. */
function fijas(env, S) {
  const {u} = env, B = S.B, out = [];
  for (const c of env.capasTodas) {
    if (c.tipo === 'titulo') out.push(cajaTitulo(env, c).caja);
    else if (c.tipo === 'contador') out.push(cajaContador(env, c).caja);
    else if (c.tipo === 'sello') out.push(cajaSello(env, c).caja);
  }
  out.push([B.x - 120 * u, B.y - 8 * u, B.x - 4 * u, B.y + B.h + 8 * u], [B.x, B.y + B.h + 6 * u, B.x + B.w, B.y + B.h + 56 * u]);
  return out;
}
/** ¿La tarjeta tapa la línea? Se muestrea la línea completa bajo la cámara de referencia. */
function lineaCruza(S, c, margen) {
  for (let i = 0; i <= 28; i++) {
    const sx = c[0] + ((c[2] - c[0]) * i) / 28;
    for (const sy of S.lineaY(sx)) if (sy > c[1] - margen && sy < c[3] + margen) return true;
  }
  return false;
}

/** Elige el primer hueco libre alrededor del punto. Devuelve el desplazamiento tarjeta−punto (fijo durante toda la llamada). */
function colocar(env, capa, cw, ch, k) {
  const {u, W, H} = env, proy = env.proy[capa.capa];
  const S = proy((capa.t?.[0] ?? 0) + 0.4), B = S.B;
  const P = [S.px(capa.x), S.py(capa.y, capa.serie ?? 0)], g = (capa.dy ?? 70) * u * k;
  const lim = k < 1 ? {x0: B.x, x1: B.x + B.w, y0: B.y, y1: B.y + B.h + 4 * u} : {x0: 28 * u, x1: (H > W ? ZONA.x * W - 8 : W - 28 * u), y0: 28 * u, y1: H * 0.86};
  const F = fijas(env, S);
  const orden = (capa.lado ?? 'arriba') === 'abajo' ? ['abajo', 'arriba', 'der', 'izq'] : ['arriba', 'abajo', 'der', 'izq'];
  let mejor = null, mejorPen = Infinity, n = 0;
  for (const lado of orden) for (const d of [1, 1.7, 2.5]) for (const s of [0, -0.3, 0.3, -0.6, 0.6]) {
    let cx, cy;
    if (lado === 'arriba') { cx = P[0] - cw / 2 + s * cw; cy = P[1] - g * d - ch; }
    else if (lado === 'abajo') { cx = P[0] - cw / 2 + s * cw; cy = P[1] + g * d; }
    else if (lado === 'der') { cx = P[0] + g * d; cy = P[1] - ch / 2 + s * ch; }
    else { cx = P[0] - g * d - cw; cy = P[1] - ch / 2 + s * ch; }
    cx += (capa.dx ?? 0) * u * k;
    const caja = [cx, cy, cx + cw, cy + ch];
    let pen = n++ * 0.01;
    if (caja[0] < lim.x0 || caja[2] > lim.x1 || caja[1] < lim.y0 || caja[3] > lim.y1) pen += 1000;
    for (const f of F) if (chocan(caja, f, 10 * u)) pen += 100 + solape(caja, f) / (u * u);
    if (lineaCruza(S, caja, 8 * u)) pen += 60;
    if (pen < mejorPen) { mejorPen = pen; mejor = [cx - P[0], cy - P[1]]; }
    if (pen < 1) return mejor;
  }
  return mejor;
}

function llamada(env, capa) {
  const V = env.vistas[capa.capa]; if (!V) return;
  const {ctx, u, t, W, H} = env, {B} = V;
  const [t0, t1] = capa.t ?? [0, 99];
  const tt = t - t0; if (tt < 0) return;
  const fin = 1 - prog(t, t1, t1 + 0.4, ease.in2); if (fin <= 0) return;
  const P = [V.px(capa.x), V.py(capa.y, capa.serie ?? 0)];
  if (P[0] < B.x - 10 * u || P[0] > B.x + B.w + 10 * u || P[1] < B.y - 40 * u || P[1] > B.y + B.h + 40 * u) return;
  const color = colorDe(capa.color, capa.serie ?? 0), k = clamp(B.w / (0.62 * W), 0.62, 1);
  // estilo «barra»: sin tarjeta. Una barra vertical que crece hasta el dato y el año arriba; la voz (o el título) lleva el resto.
  if (capa.estilo === 'barra') {
    const g = ease.out3(clamp(tt / 0.8)), yB = B.y + B.h, yT = lerp(yB, B.y + 8 * u, g), a0 = ctx.globalAlpha;
    ctx.save(); ctx.globalAlpha = a0 * fin * V.ap;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 16 * u; ctx.strokeStyle = color; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(P[0], yB); ctx.lineTo(P[0], yT); ctx.stroke(); ctx.restore();
    ctx.fillStyle = PALETA.blanco; ctx.beginPath(); ctx.arc(P[0], P[1], 6.5 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(P[0], P[1], 10 * u, 0, 7); ctx.stroke();
    if (g > 0.7 && capa.anioTxt) {
      ctx.font = fnt(800, 40 * u, true);
      const w = ctx.measureText(capa.anioTxt).width + 28 * u, x0 = clamp(P[0] - w / 2, B.x, B.x + B.w - w), y0 = B.y + 14 * u, al = clamp((g - 0.7) / 0.3);
      ctx.globalAlpha *= al; ctx.fillStyle = PALETA.tarjeta; ctx.fillRect(x0, y0, w, 56 * u); ctx.fillStyle = color; ctx.fillRect(x0, y0, w, 5 * u);
      texto(ctx, capa.anioTxt, x0 + w / 2, y0 + 44 * u, fnt(800, 40 * u, true), PALETA.blanco, 'center');
      reg(env, 'tarjeta', [x0, y0, x0 + w, y0 + 56 * u], capa.id);
    }
    ctx.restore();
    return;
  }
  // estilos «píldora» y «círculo» (Johnny Harris / Caspian): el dato se marca con un punto que se alarga a píldora con el
  // texto escrito letra a letra, o con un círculo dibujado en arco y la anotación escrita al lado. Sin tarjeta de varias líneas.
  if (capa.estilo === 'pildora' || capa.estilo === 'circulo') {
    const pil = capa.estilo === 'pildora', col = pil || !capa.color ? colorDe(capa.color ?? 'amarillo') : color;
    const msg = String(capa.texto ?? capa.anioTxt ?? ''), serif = `700 ${Math.round(30 * u * k)}px "DM Serif Display", Georgia, "Times New Roman", serif`;
    ctx.font = serif;
    const tw = ctx.measureText(msg).width, px_ = 22 * u * k, cw = tw + px_ * 2, ch = 56 * u * k;
    const off = (capa._off ??= colocar(env, capa, pil ? cw : tw + 16 * u, pil ? ch : 44 * u * k, k));
    let cx = P[0] + off[0], cy = P[1] + off[1];
    const lw = pil ? cw : tw + 16 * u, lh = pil ? ch : 44 * u * k, lim = k < 1 ? {x0: B.x, x1: B.x + B.w, y0: B.y, y1: B.y + B.h + 4 * u} : {x0: 28 * u, x1: (H > W ? ZONA.x * W - 8 : W - 28 * u), y0: 28 * u, y1: H * 0.86};
    cx = clamp(cx, lim.x0, Math.max(lim.x0, lim.x1 - lw)); cy = clamp(cy, lim.y0, Math.max(lim.y0, lim.y1 - lh));
    ctx.save(); ctx.globalAlpha *= fin * V.ap;
    const rad = (capa.radio ?? 44) * u * k;
    if (pil) {
      const dot = ease.outBack(clamp(tt / 0.3)), alarga = ease.out3(clamp((tt - 0.3) / 0.5));
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(P[0], P[1], 9 * u * dot, 0, 7); ctx.fill();
      const w = lerp(ch, cw, alarga), izq = P[0] < cx + cw / 2, x0 = izq ? cx : cx + cw - w;
      if (alarga > 0) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(P[0], P[1]);
        ctx.lineTo(lerp(P[0], clamp(P[0], cx, cx + cw), alarga), lerp(P[1], clamp(P[1], cy, cy + ch), alarga)); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x0, cy, w, ch, ch / 2); ctx.fill();
        const tp = clamp((tt - 0.8) / 1.25);
        if (tp > 0) texto(ctx, msg.slice(0, Math.ceil(msg.length * tp)), cx + px_, cy + ch * 0.68, serif, '#161412');
        if (alarga > 0.3) reg(env, 'tarjeta', [cx, cy, cx + cw, cy + ch], capa.id);
      }
    } else {
      const arco = ease.io2(clamp(tt / 0.7)), a0 = -Math.PI / 2 - 0.35;
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 12 * u; ctx.strokeStyle = col; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(P[0], P[1], rad * 1.25, rad, 0, a0, a0 + Math.PI * 2.15 * arco); ctx.stroke(); ctx.restore();
      const tp = clamp((tt - 0.7) / 1.0);
      if (tp > 0) {
        ctx.save(); ctx.font = serif; ctx.lineJoin = 'round'; ctx.lineWidth = 6 * u; ctx.strokeStyle = rgba(PALETA.fondo, 0.9);
        const s = msg.slice(0, Math.ceil(msg.length * tp)); ctx.strokeText(s, cx + 8 * u, cy + lh * 0.72); ctx.restore();
        texto(ctx, s, cx + 8 * u, cy + lh * 0.72, serif, col);
        reg(env, 'tarjeta', [cx, cy, cx + lw, cy + lh], capa.id);
      }
    }
    ctx.restore();
    return;
  }
  // contenido de la tarjeta: año grande · qué pasó (corto) · el dato. Nada más.
  const L = [];
  const fila = (s, peso, px, c, mono) => ({s, f: fnt(peso, px, mono), c, h: escalarFuente(px) * 1.25});
  if (capa.anioTxt) L.push(fila(capa.anioTxt, 800, 60 * u * k, color, true));
  if (capa.texto) L.push(fila(capa.texto, 700, 34 * u * k, PALETA.blanco));
  if (capa.valorTxt && !capa.sinValor) L.push(fila(capa.valorTxt, 600, 30 * u * k, PALETA.piedraClara, true));
  if (capa.detalle) L.push(fila(capa.detalle, 500, 22 * u * k, PALETA.piedraOscura, true));
  const pad = 26 * u * k;
  let cw = 0; for (const l of L) { ctx.font = l.f; cw = Math.max(cw, ctx.measureText(l.s).width); }
  cw += pad * 2 + 8 * u * k;
  const ch = L.reduce((a, l) => a + l.h, 0) + pad * 1.5;
  const off = (capa._off ??= colocar(env, capa, cw, ch, k));
  let cx = P[0] + off[0], cy = P[1] + off[1];
  const lim = k < 1 ? {x0: B.x, x1: B.x + B.w, y0: B.y, y1: B.y + B.h + 4 * u} : {x0: 28 * u, x1: (H > W ? ZONA.x * W - 8 : W - 28 * u), y0: 28 * u, y1: H * 0.86};
  cx = clamp(cx, lim.x0, Math.max(lim.x0, lim.x1 - cw)); cy = clamp(cy, lim.y0, Math.max(lim.y0, lim.y1 - ch));
  const a = ctx.globalAlpha;
  ctx.save(); ctx.globalAlpha = a * fin * V.ap;
  // onda de impacto sobre el dato
  const o = clamp(tt / 0.7);
  if (o < 1) { ctx.strokeStyle = rgba(color, (1 - o) * 0.9); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(P[0], P[1], (12 + 70 * ease.outExpo(o)) * u, 0, 7); ctx.stroke(); }
  // línea guía hasta el borde más cercano de la tarjeta
  const li = ease.out3(clamp(tt / 0.25)), nx = clamp(P[0], cx, cx + cw), ny = clamp(P[1], cy, cy + ch);
  ctx.strokeStyle = color; ctx.lineWidth = 2.5 * u;
  ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(lerp(P[0], nx, li), lerp(P[1], ny, li)); ctx.stroke();
  ctx.fillStyle = PALETA.blanco; ctx.beginPath(); ctx.arc(P[0], P[1], 6.5 * u, 0, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(P[0], P[1], 10 * u, 0, 7); ctx.stroke();
  // tarjeta con golpe seco: entra con rebote corto
  const sn = ease.outExpo(clamp((tt - 0.12) / 0.32)), esc = lerp(1.14, 1, sn), al = clamp((tt - 0.12) / 0.07);
  if (al > 0) {
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(cx + cw / 2, cy + ch / 2); ctx.scale(esc, esc);
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24 * u * k; ctx.shadowOffsetY = 8 * u * k;
    ctx.fillStyle = PALETA.tarjeta; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);              // tarjeta OPACA (Premiere mezcla las semitransparentes)
    ctx.shadowColor = 'transparent'; ctx.fillStyle = color; ctx.fillRect(-cw / 2, -ch / 2, 7 * u * k, ch);
    let y = -ch / 2 + pad * 0.55;
    for (const l of L) { y += l.h; texto(ctx, l.s, -cw / 2 + pad + 8 * u * k, y - l.h * 0.22, l.f, l.c); }
    ctx.restore();
    if (al > 0.3) reg(env, 'tarjeta', [cx, cy, cx + cw, cy + ch], capa.id);
  }
  ctx.restore();
}

function contador(env, capa) {
  const H = env.cabezas[capa.capa]; if (!H) return;
  const s = H.series[capa.serie ?? Object.keys(H.series)[0]]; if (!s) return;
  const {ctx, u, t} = env, V = env.vistas[capa.capa], vert = env.H > env.W;
  const [, t1] = capa.t ?? [0, 99];
  // mientras una tarjeta está activa, la tarjeta lleva el año y el dato: el contador se aparta (un protagonista a la vez)
  let activa = 0;
  for (const l of env.capasTodas) if (l.tipo === 'llamada' && l.capa === capa.capa) activa = Math.max(activa, prog(t, l.t[0], l.t[0] + 0.2, ease.out2) * (1 - prog(t, l.t[1] + 0.3, l.t[1] + 0.55, ease.in2)));
  const g = H.ap * (1 - prog(t, t1, t1 + 0.3, ease.in2)) * (1 - activa); if (g <= 0.01) { reg(env, 'contador-oculto', [0, 0, 0, 0], capa.id); return; }
  const C = cajaContador(env, capa), {x, y, al} = C;
  ctx.save(); ctx.globalAlpha *= g;
  const fecha = V?.tab.tipoX === 'fecha', un = String(s.fmt?.unidad ?? '').match(/\(([^)]+)\)/)?.[1] ?? s.fmt?.unidad;   // la unidad siempre acompaña al dato
  if (capa.modo === 'compacto') {
    // una fila: nombre (color de la serie) a la izquierda, cifra a la derecha; la unidad debajo
    const vtxt = fmtNum(s.valor, s.fmt), fV = fnt(700, 36 * u, true), fN = fnt(700, 30 * u, true);
    ctx.font = fV; const wv = ctx.measureText(vtxt).width; ctx.font = fN;
    let nom = String(capa.etiqueta ?? s.nombre).toUpperCase(); const lim = C.ancho - wv - 20 * u;
    while (nom.length > 4 && ctx.measureText(nom).width > lim) nom = nom.slice(0, -2);
    if (nom.length < String(capa.etiqueta ?? s.nombre).length) nom = nom.trimEnd() + '…';
    texto(ctx, nom, x, y, fN, s.color, 'left');
    texto(ctx, vtxt, x + C.ancho, y, fV, PALETA.blanco, 'right');
    if (un) texto(ctx, String(un).toUpperCase(), x, y + 44 * u, fnt(500, 18 * u, true), PALETA.piedraOscura, 'left');
  } else {
    // el año manda: grande y en el color de la serie; debajo el dato y su unidad
    texto(ctx, fecha ? fmtFecha(H.xh, 'anio') : fmtNum(H.xh, {decimales: 0}), x, y, fnt(800, 96 * u, true), s.color, al);
    if (capa.modo !== 'fecha') {
      texto(ctx, fmtNum(s.valor, s.fmt), x, y + 74 * u, fnt(700, 46 * u, true), PALETA.blanco, al);
      if (un) texto(ctx, String(un).toUpperCase(), x, y + 74 * u + 44 * u, fnt(500, 18 * u, true), PALETA.piedraOscura, al);
    }
  }
  ctx.restore();
  if (g > 0.3) reg(env, 'contador', C.caja, capa.id);
}

function titulo(env, capa) {
  const {ctx, u, t} = env;
  const [t0, t1] = capa.t ?? [0, 4];
  const sal = 1 - prog(t, t1, t1 + 0.4, ease.in2); if (t < t0 || sal <= 0) return;
  const T = cajaTitulo(env, capa), {x, y, w, tam, lh, lineas} = T, color = colorDe(capa.color, 0);
  ctx.save(); ctx.globalAlpha *= sal;
  const p = prog(t, t0, t0 + 0.55, ease.io3);
  lineas.forEach((l, i) => { ctx.save(); ctx.beginPath(); ctx.rect(x - 4 * u, y + i * lh - tam, (w + 8 * u) * p, tam * 1.5); ctx.clip(); texto(ctx, l, x, y + i * lh, fnt(800, tam), PALETA.blanco); ctx.restore(); });
  const r = prog(t, t0 + 0.2, t0 + 0.9, ease.out3);
  ctx.fillStyle = color; ctx.fillRect(x, T.ult + 16 * u, Math.min(w, 200 * u) * r, 4 * u);
  if (capa.sub) {
    ctx.font = fuenteCss(500, T.subT); let sb = String(capa.sub); while (sb.length > 6 && ctx.measureText(sb).width > T.w + 400 * u && ctx.measureText(sb).width > (env.H > env.W ? ZONA.x * env.W - x : env.W * 0.5)) sb = sb.slice(0, -2);
    texto(ctx, sb, x, T.ult + 24 * u + T.subT, fuenteCss(500, T.subT), PALETA.piedraClara, 'left', 'alphabetic', prog(t, t0 + 0.5, t0 + 1.0, ease.out3));
  }
  ctx.restore();
  reg(env, 'titulo', T.caja, capa.id);
}

function cortina(env, capa) {
  const {ctx, W, H, t} = env;
  const [t0, t1] = capa.t ?? [0, 0.6];
  if (t < t0 || t > t1) return;
  const k = (t - t0) / (t1 - t0), color = colorDe(capa.color, 0);
  const x = k < 0.5 ? lerp(-W, 0, ease.io3(k * 2)) : lerp(0, W, ease.io3((k - 0.5) * 2));
  env.ctx.fillStyle = color; ctx.fillRect(x, 0, W, H);
}

function imagen(env, capa) {
  const img = env.imgs[capa.archivo]; if (!img) return;
  const {ctx, u, t, W, H} = env, [t0, t1] = capa.t ?? [0, 99];
  const g = prog(t, t0, t0 + 0.5, ease.out3) * (1 - prog(t, t1, t1 + 0.4, ease.in2)); if (g <= 0) return;
  const B = caja(env, capa, [0, 0, 1, 1]);
  const z = lerp(capa.zoom?.[0] ?? 1, capa.zoom?.[1] ?? 1, prog(t, t0, t1, ease.lin));
  const cubrir = (capa.ajuste ?? 'cubrir') === 'cubrir';
  const s = (cubrir ? Math.max : Math.min)(B.w / img.width, B.h / img.height) * z;
  ctx.save(); ctx.globalAlpha *= g * (capa.opacidad ?? 1);
  ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip();
  ctx.drawImage(img, B.x + (B.w - img.width * s) / 2, B.y + (B.h - img.height * s) / 2, img.width * s, img.height * s);
  if (capa.borde) { ctx.strokeStyle = rgba(PALETA.piedra, 0.5); ctx.lineWidth = 2 * u; ctx.strokeRect(B.x, B.y, B.w, B.h); }
  ctx.restore();
}

function sello(env, capa) {
  const {ctx} = env, S = cajaSello(env, capa);
  ctx.save();
  S.lineas.forEach((l, i) => texto(ctx, l, S.x, S.y + i * S.lh, fuenteCss(500, S.px), rgba(PALETA.piedraClara, 0.92), 'left'));
  ctx.restore();
  reg(env, 'sello', S.caja, null);
}

// ── TABLAS: Sankey (flujos), donut (composición) y cascada (puente) ──────────────────────────────────────────────
// Los tamaños salen de los datos (nodos = suma de sus flujos); los porcentajes y variaciones se calculan aquí de esas mismas filas.
const colorTipo = (tipo) => ({ingreso: TEMA.nombre === 'harris' ? COLOR.amarillo : COLOR.oro, beneficio: COLOR.verde, costo: COLOR.rojo, neutral: PALETA.piedra}[tipo] ?? PALETA.piedra);
const pctTxt = (x) => (x > 0 && x < 0.05 ? '<0,1 %' : `${x.toFixed(x < 10 ? 1 : 0).replace('.', ',')} %`);
const variacionTxt = (v, ant) => { if (!(ant > 0)) return null; const p = (v / ant - 1) * 100; return `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(Math.abs(p) < 10 ? 1 : 0).replace('.', ',')} % a/a`; };
/** Texto con halo del color del fondo: legible aunque pase sobre una cinta o una barra. */
function rotulo(ctx, s, x, y, font, color, align = 'left', u = 1) {
  ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.lineWidth = 5 * u; ctx.strokeStyle = rgba(PALETA.fondo, 0.9); ctx.strokeText(s, x, y); ctx.fillStyle = legible(color, PALETA.fondo, 6.2); ctx.fillText(s, x, y); ctx.restore();
}
function cortar(ctx, s, ancho) { if (ctx.measureText(s).width <= ancho) return s; while (s.length > 3 && ctx.measureText(s + '…').width > ancho) s = s.slice(0, -1); return s.trimEnd() + '…'; }

function disenarSankey(env, capa, tab, B) {
  const {ctx, u, H, W} = env, vert = H > W, k = 1;
  const byName = new Map(tab.nodos.map((n) => [n.nombre, {...n}])), nodos = [...byName.values()];
  const enl = tab.enlaces.map((e) => ({...e, a: byName.get(e.origen), b: byName.get(e.destino)}));
  const ncol = Math.max(...nodos.map((n) => n.nivel)) + 1, base = byName.get(tab.baseNodo).valor;
  const cols = Array.from({length: ncol}, (_, c) => nodos.filter((n) => n.nivel === c));
  const f1 = fnt(700, 23 * u * k), f2 = fnt(500, 19 * u * k, true), s1 = escalarFuente(23 * u) * 1.2, s2 = escalarFuente(19 * u) * 1.25, s3 = escalarFuente(17 * u) * 1.25;
  const fmtV = vert ? {...tab.fmt, prefijo: '', sufijo: ''} : tab.fmt, det = (n) => `${fmtNum(n.valor, fmtV)}${n === byName.get(tab.baseNodo) || vert ? '' : ` · ${pctTxt((n.valor / base) * 100)}`}`;
  const colMax = Math.max(...nodos.map((n) => n.nivel)), esBorde0 = (n) => n.nivel === 0 || n.nivel === colMax;
  // vertical: nombre · cifra · % en tres líneas en los bordes; los nodos del medio solo llevan su nombre (si hay hueco)
  nodos.forEach((n) => { ctx.font = f1; n.l1 = cortar(ctx, n.nombre, vert ? (esBorde0(n) ? 245 * u - 20 * u : 240 * u) : B.w * 0.27); n.l2 = vert && !esBorde0(n) ? null : det(n); n.l3 = vert ? (esBorde0(n) && n !== byName.get(tab.baseNodo) ? pctTxt((n.valor / base) * 100) : null) : variacionTxt(n.valor, n.anterior); });
  const ancho = (n) => { ctx.font = f1; const a = ctx.measureText(n.l1).width; ctx.font = f2; return Math.max(a, n.l2 ? ctx.measureText(n.l2).width : 0, n.l3 ? ctx.measureText(n.l3).width : 0); };
  const LW = vert ? 245 * u : clamp(Math.max(...cols[0].map(ancho)) + 30 * u, 120 * u, B.w * 0.3), RW = vert ? 245 * u : clamp(Math.max(...cols[ncol - 1].map(ancho)) + 30 * u, 120 * u, B.w * 0.3);
  const nw = 26 * u * k, px0 = B.x + LW, px1 = B.x + B.w - RW, paso = (px1 - px0 - nw) / (ncol - 1);
  cols.forEach((c, i) => c.forEach((n) => { n.x = px0 + i * paso; }));
  const LH = s1 + s2 + (cols.flat().some((n) => n.l3) ? s3 : 0) + 10 * u, GAP = 10 * u, GAPM = (vert ? 40 : 64) * u, MARGEN = 50 * u, alto = B.h - MARGEN * 2, y0 = B.y + MARGEN;
  const esBorde = (c) => c === 0 || c === ncol - 1, gapDe = (c) => (esBorde(c) ? GAP : GAPM);
  const suma = (c, s) => cols[c].reduce((a, n) => a + Math.max(n.valor * s, esBorde(c) ? LH : 0), 0) + gapDe(c) * (cols[c].length - 1);
  let s = (alto * 0.96) / Math.max(...cols.map((c) => c.reduce((a, n) => a + n.valor, 0)));
  for (let g = 0; g < 80 && Math.max(...cols.map((_, c) => suma(c, s))) > alto; g++) s *= 0.96;
  const apilar = (c) => { let y = y0 + (alto - suma(c, s)) / 2; for (const n of cols[c]) { n.h = n.valor * s; n.slot = Math.max(n.h, esBorde(c) ? LH : 0); n.y = y + (n.slot - n.h) / 2; y += n.slot + gapDe(c); } };
  const cy = (n) => n.y + n.h / 2;
  cols[0].sort((a, b) => a.orden - b.orden); apilar(0);
  for (let c = 1; c < ncol; c++) {
    cols[c].forEach((n) => { const ins = enl.filter((e) => e.b === n); n._bary = ins.length ? ins.reduce((a, e) => a + cy(e.a) * e.valor, 0) / ins.reduce((a, e) => a + e.valor, 0) : 0; });
    cols[c].sort((a, b) => a._bary - b._bary || a.orden - b.orden); apilar(c);
  }
  // relajación: acerca cada nodo a sus vecinos sin cambiar el orden ni solaparse
  const colocar_ = (c, deseo) => {
    const L = cols[c], gap = gapDe(c);
    L.forEach((n) => { const d = deseo(n); n._d = d == null ? n.y + n.h / 2 : d; });
    let cursor = y0;   // hacia abajo: nadie se solapa con el anterior
    L.forEach((n) => { n._top = Math.max(n._d - n.slot / 2, cursor); cursor = n._top + n.slot + gap; });
    let limite = y0 + alto;   // hacia arriba: nada se sale por abajo
    for (let i = L.length - 1; i >= 0; i--) { const sobra = L[i]._top + L[i].slot - limite; if (sobra > 0) L[i]._top -= sobra; limite = L[i]._top - gap; }
    L.forEach((n) => { n.y = n._top + (n.slot - n.h) / 2; });
  };
  for (let pasada = 0; pasada < 4; pasada++) {
    for (let c = 1; c < ncol; c++) colocar_(c, (n) => { const e = enl.filter((q) => q.b === n); return e.length ? e.reduce((a, q) => a + cy(q.a) * q.valor, 0) / e.reduce((a, q) => a + q.valor, 0) : null; });
    for (let c = ncol - 2; c >= 0; c--) colocar_(c, (n) => { const e = enl.filter((q) => q.a === n); return e.length ? e.reduce((a, q) => a + cy(q.b) * q.valor, 0) / e.reduce((a, q) => a + q.valor, 0) : null; });
  }
  // desplazamientos de las cintas dentro de cada nodo (ordenadas por la altura del otro extremo: sin cruces innecesarios)
  nodos.forEach((n) => {
    let o = 0; enl.filter((e) => e.a === n).sort((p, q) => cy(p.b) - cy(q.b)).forEach((e) => { e.oa = o; e.th = e.valor * s; o += e.th; });
    o = 0; enl.filter((e) => e.b === n).sort((p, q) => cy(p.a) - cy(q.a)).forEach((e) => { e.ob = o; o += e.valor * s; });
  });
  // rótulos: los de los bordes van a los lados; los de en medio prueban arriba / abajo / a la derecha y se quedan con el primer sitio libre
  const f3 = fnt(600, 17 * u * k, true), cajas = [], lhs = [s1, s2, s3], libre = (c) => c[0] >= B.x - 2 && c[2] <= B.x + B.w + 2 && c[1] >= B.y - 30 * u && c[3] <= B.y + B.h + 30 * u && !cajas.some((o) => chocan(c, o, 6 * u));
  const medida = (n) => { ctx.font = f1; const w1 = ctx.measureText(n.l1).width; ctx.font = f2; const w2 = n.l2 ? ctx.measureText(n.l2).width : 0; ctx.font = f3; const w3 = n.l3 ? ctx.measureText(n.l3).width : 0; return {w: Math.max(w1, w2, w3), alto: s1 + (n.l2 ? s2 : 0) + (n.l3 ? s3 : 0) + 6 * u}; };
  for (const n of [...nodos].sort((a, b) => (a.nivel === 0 || a.nivel === ncol - 1 ? 0 : 1) - (b.nivel === 0 || b.nivel === ncol - 1 ? 0 : 1))) {
    const {w, alto: al} = medida(n), cxn = n.x + nw / 2, ccy = n.y + n.h / 2;
    const opts = n.nivel === 0 ? [['izq']] : n.nivel === ncol - 1 ? [['der']] : (n.tipo === 'costo' ? ['abajo', 'arriba', 'der', 'izq'] : ['arriba', 'abajo', 'izq', 'der']).map((x) => [x]);
    let mejor = null, mejorPen = Infinity;
    const intentos = opts.flatMap(([lado]) => (lado === 'arriba' || lado === 'abajo' ? [0, 1, 2].map((k) => [lado, k]) : [[lado, 0]]));   // arriba/abajo, y si no cabe, apilado más lejos
    for (const [lado, kk] of intentos) {
      let x, aling, yTop;
      if (lado === 'izq') { x = n.x - 14 * u; aling = 'right'; yTop = ccy - al / 2; }
      else if (lado === 'der') { x = n.x + nw + 14 * u; aling = 'left'; yTop = ccy - al / 2; }
      else { x = clamp(cxn, B.x + w / 2, B.x + B.w - w / 2); aling = 'center'; yTop = lado === 'arriba' ? n.y - 10 * u - al - kk * (al + 6 * u) : n.y + n.h + 8 * u + kk * (al + 6 * u); }
      const x0 = aling === 'right' ? x - w : aling === 'center' ? x - w / 2 : x, caja = [x0, yTop, x0 + w, yTop + al];
      const pen = cajas.reduce((s, o) => s + solape(caja, o), 0) + (caja[0] < B.x - 2 || caja[2] > B.x + B.w + 2 ? 1e9 : 0);   // si no hay hueco libre, el que menos estorba
      if (pen < mejorPen) { mejorPen = pen; mejor = {x, aling, yTop, w, al, caja}; }
      if (libre(caja)) { mejor = {x, aling, yTop, w, al, caja}; break; }
    }
    if (vert && !(n.nivel === 0 || n.nivel === ncol - 1) && mejorPen > 0) { n.lab = null; continue; }   // en vertical un nodo del medio sin hueco libre queda sin rótulo antes que pisar otro
    n.lab = mejor; cajas.push(mejor.caja);
  }
  return {nodos, enl, nw, ncol, cols, base, k, lhs};
}

function sankey(env, capa) {
  const {ctx, u, t, W, H} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.02, 0.26, 0.7, 0.6] : [0.035, 0.235, 0.93, 0.66]);
  const [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._lay ??= disenarSankey(env, capa, tab, B));
  const p = prog(t, t0, t1, ease.io2), rx = lerp(B.x, B.x + B.w, p), k = L.k;
  ctx.save(); ctx.globalAlpha *= ap;
  if (vert) {   // la unidad de todas las cifras, una sola vez y siempre visible
    const un = `${tab.fmt.prefijo ?? ''}${tab.fmt.sufijo ?? ''}`.trim() || tab.fmt.unidad || '', cap = `CIFRAS EN ${un}`.toUpperCase();
    if (un) { texto(ctx, cap, B.x, B.y - 10 * u, fnt(500, 18 * u, true), PALETA.piedraClara, 'left'); ctx.font = fnt(500, 18 * u, true); reg(env, 'etiqueta', [B.x, B.y - 10 * u - escalarFuente(18 * u), B.x + ctx.measureText(cap).width, B.y + 6 * u], `${capa.id ?? 'sankey'}:unidad`); }
  }
  // cintas: se dibujan de izquierda a derecha con un borde que avanza
  ctx.save(); ctx.beginPath(); ctx.rect(B.x - 4, B.y - 80 * u, rx - B.x + 4, B.h + 160 * u); ctx.clip();
  for (const e of L.enl) {
    const x0 = e.a.x + L.nw - 1, x1 = e.b.x + 1, ya = e.a.y + e.oa, yb = e.b.y + e.ob, h = e.th, m = (x0 + x1) / 2;
    const col = colorTipo(e.b.tipo === 'neutral' ? e.a.tipo : e.b.tipo);
    ctx.beginPath(); ctx.moveTo(x0, ya); ctx.bezierCurveTo(m, ya, m, yb, x1, yb); ctx.lineTo(x1, yb + h); ctx.bezierCurveTo(m, yb + h, m, ya + h, x0, ya + h); ctx.closePath();
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, rgba(colorTipo(e.a.tipo === 'neutral' ? e.b.tipo : e.a.tipo), 0.42)); g.addColorStop(1, rgba(col, 0.5));
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.restore();
  // nodos y rótulos: aparecen cuando el borde llega a ellos
  for (const n of L.nodos) {
    const a = clamp((rx - n.x) / (34 * u)); if (a <= 0) continue;
    const col = colorTipo(n.tipo), hh = n.h * ease.out3(a), cx = n.x + L.nw / 2, ccy = n.y + n.h / 2;
    ctx.fillStyle = col; ctx.fillRect(n.x, ccy - hh / 2, L.nw, Math.max(hh, 1.5 * u));
    const la = clamp((rx - n.x - 14 * u) / (70 * u)); if (la <= 0 || !n.lab) continue;
    ctx.save(); ctx.globalAlpha *= la;
    const f1 = fnt(700, 23 * u * k), f2 = fnt(500, 19 * u * k, true), f3 = fnt(600, 17 * u * k, true), {x, aling: al, yTop, al: alto, caja} = n.lab;
    const [lh1, lh2, lh3] = L.lhs;
    rotulo(ctx, n.l1, x, yTop + lh1 - 4 * u, f1, PALETA.blanco, al, u);
    if (n.l2) rotulo(ctx, n.l2, x, yTop + lh1 + lh2 - 4 * u, f2, PALETA.piedraClara, al, u);
    if (n.l3) rotulo(ctx, n.l3, x, yTop + lh1 + (n.l2 ? lh2 : 0) + lh3 - 4 * u, f3, env.H > env.W ? PALETA.piedraClara : (n.valor >= n.anterior ? COLOR.verde : COLOR.rojo), al, u);
    reg(env, 'etiqueta', caja, `${capa.id ?? 'sankey'}:${n.nombre}`);
    ctx.restore();
  }
  ctx.restore();
}

/** Filas de una leyenda: caben `maxF`; si hay más partes, las más pequeñas se suman en una fila «Otras N partes» (suma y % exactos de los datos). */
function filasLeyenda(items, total, maxF, pal) {
  const fila = (it, i) => ({nombre: it.nombre, valor: it.valor, pct: (it.valor / total) * 100, col: pal[i % pal.length], idx: [i]});
  if (items.length <= maxF) return items.map(fila);
  const vis = items.slice(0, maxF - 1), resto = items.slice(maxF - 1), sum = resto.reduce((a, x) => a + x.valor, 0);
  return [...vis.map(fila), {nombre: `Otras ${resto.length} partes`, valor: sum, pct: (sum / total) * 100, col: PALETA.piedra, idx: resto.map((_, j) => maxF - 1 + j), agregada: true}];
}
/** Una fila de leyenda con nombre (clave), cifra con unidad (secundario) y porcentaje grande. Ocupa `rh` de alto. */
function filaLeyenda(env, capa, f, x, y, rh, lw, la, idBase) {
  const {ctx, u} = env, fN = fnt(700, 26 * u), fV = fnt(500, 20 * u, true), fP = fnt(800, 38 * u, true);
  ctx.save(); ctx.globalAlpha *= la;
  ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(x + 12 * u, y + rh * 0.36, 9 * u, 0, 7); ctx.fill();
  ctx.font = fP; const wP = ctx.measureText(pctTxt(f.pct)).width;
  ctx.font = fN; const nombre = cortar(ctx, f.nombre, lw - 44 * u - wP - 16 * u), wN = ctx.measureText(nombre).width;
  rotulo(ctx, nombre, x + 36 * u, y + rh * 0.43, fN, PALETA.blanco, 'left', u);
  rotulo(ctx, fmtNum(f.valor, idBase.fmt), x + 36 * u, y + rh * 0.84, fV, PALETA.piedraClara, 'left', u);
  rotulo(ctx, pctTxt(f.pct), x + lw, y + rh * 0.5, fP, f.col, 'right', u);
  ctx.font = fV; const wV = ctx.measureText(fmtNum(f.valor, idBase.fmt)).width;
  reg(env, 'etiqueta', [x + 36 * u, y + rh * 0.43 - 34 * u, x + 36 * u + wN, y + rh * 0.43 + 8 * u], `${capa.id ?? idBase.id}:n:${f.nombre}`);
  reg(env, 'etiqueta', [x + 36 * u, y + rh * 0.84 - 26 * u, x + 36 * u + wV, y + rh * 0.84 + 6 * u], `${capa.id ?? idBase.id}:v:${f.nombre}`);
  reg(env, 'etiqueta', [x + lw - wP, y + rh * 0.5 - 34 * u, x + lw, y + rh * 0.5 + 8 * u], `${capa.id ?? idBase.id}:p:${f.nombre}`);
  ctx.restore();
}

function donut(env, capa) {
  const {ctx, u, t, W, H} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.26, 0.64, 0.64] : [0.05, 0.24, 0.9, 0.64]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const items = (capa._it ??= [...tab.items].filter((x) => x.valor > 0).sort((a, b) => (capa.orden === 'archivo' ? 0 : b.valor - a.valor)));
  const total = items.reduce((a, x) => a + x.valor, 0), TAU = Math.PI * 2;
  const R = vert ? Math.min(B.w * 0.28, 190 * u) : Math.min(B.h * 0.46, B.w * 0.27), cx = vert ? B.x + B.w / 2 : B.x + R + 40 * u, cy = vert ? B.y + R + 10 * u : B.y + B.h / 2, grosor = R * 0.38;
  const p = prog(t, t0, t1, ease.io2) * TAU, paleta = [colorTipo('ingreso'), COLOR.teal, COLOR.purpura, COLOR.verde, COLOR.rojo, PALETA.piedra, COLOR.amarillo, COLOR.rosa];
  ctx.save(); ctx.globalAlpha *= ap;
  let a0 = -Math.PI / 2; const arr = [];
  items.forEach((it, i) => {
    const sw = (it.valor / total) * TAU, vis = clamp((p - (a0 + Math.PI / 2)), 0, sw), col = paleta[i % paleta.length];
    arr.push({it, i, a0, sw, vis, col});
    if (vis > 0.002) { ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + Math.max(0, vis - 0.012)); ctx.arc(cx, cy, R - grosor, a0 + Math.max(0, vis - 0.012), a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
    a0 += sw;
  });
  const g = clamp(p / TAU);
  // total al centro en tres líneas (cifra grande · unidad · «TOTAL»): así cabe siempre dentro del hueco y la unidad nunca falta
  const num = fmtNum(total * g, {...tab.fmt, prefijo: '', sufijo: ''}), un = `${tab.fmt.prefijo ?? ''}${tab.fmt.sufijo ?? ''}`.trim(), hueco = (R - grosor) * 1.75;
  let tam = Math.max(R * 0.34, 36 * u); ctx.font = fnt(800, tam, true);
  while (ctx.measureText(fmtNum(total, {...tab.fmt, prefijo: '', sufijo: ''})).width > hueco && tam > 30 * u) { tam -= 2 * u; ctx.font = fnt(800, tam, true); }
  const s2 = escalarFuente(20 * u);
  rotulo(ctx, num, cx, cy - s2 * 0.1, fnt(800, tam, true), PALETA.blanco, 'center', u);
  if (un) rotulo(ctx, un, cx, cy - s2 * 0.1 + s2 * 1.2, fnt(600, 20 * u, true), PALETA.piedraClara, 'center', u);
  rotulo(ctx, (capa.etiquetaTotal ?? 'Total').toUpperCase(), cx, cy - s2 * 0.1 + s2 * 2.4, fnt(600, 18 * u, true), PALETA.piedraOscura, 'center', u);
  // leyenda: una fila por parte, con su valor y su porcentaje calculados de los datos
  const lx = vert ? B.x : cx + R + 90 * u, ly0 = vert ? cy + R + 36 * u : B.y, area = vert ? B.y + B.h - ly0 : B.h, lw = vert ? B.w : B.x + B.w - lx;
  const paso = vert ? 92 * u : 70 * u, maxF = Math.max(3, Math.floor(area / paso)), filas = filasLeyenda(items, total, maxF, paleta), rh = Math.min(vert ? 100 * u : 78 * u, area / filas.length);
  const y0 = ly0 + (area - rh * filas.length) / 2;
  filas.forEach((f, i) => {
    const s0 = arr[f.idx[0]].a0, la = p >= TAU - 1e-6 ? 1 : clamp((p - (s0 + Math.PI / 2)) / 0.5); if (la <= 0) return;
    filaLeyenda(env, capa, f, lx, y0 + i * rh + (1 - ease.out3(la)) * 14 * u, rh, lw, la, {fmt: tab.fmt, id: 'donut'});
  });
  ctx.restore();
}

/** Cascada en vertical (reel): una fila por concepto — nombre y cifra arriba, barra debajo — dentro de la zona segura. */
function cascadaVertical(env, capa) {
  const {ctx, u, t, W, H} = env, tab = env.tablas[capa.datos];
  const B = caja(env, capa, H > W ? [0.0667, 0.26, 0.64, 0.62] : [0.05, 0.23, 0.9, 0.67]);
  const [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const barras = (capa._b ??= (() => { let run = 0; return tab.items.map((it) => { let ini, fin; if (it.tipo === 'inicio' || it.tipo === 'total') { ini = 0; fin = it.valor; run = it.valor; } else { ini = run; fin = run + it.valor; run = fin; } return {...it, ini, fin}; }); })());
  const n = barras.length, vmin = Math.min(0, ...barras.flatMap((b) => [b.ini, b.fin])), vmax = Math.max(0, ...barras.flatMap((b) => [b.ini, b.fin]));
  const fila = Math.min(110 * u, B.h / n), px = (v) => B.x + ((v - vmin) / ((vmax - vmin) || 1)) * B.w, p = prog(t, t0, t1, ease.io2) * n, y0 = B.y;
  const fN = fnt(700, 26 * u), fV = fnt(800, 26 * u, true), bh = Math.min(26 * u, fila * 0.26);
  ctx.save(); ctx.globalAlpha *= ap;
  ctx.strokeStyle = rgba(PALETA.piedra, 0.35); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(px(0), y0); ctx.lineTo(px(0), y0 + fila * n); ctx.stroke();
  barras.forEach((b, i) => {
    const a = clamp(p - i), e = ease.out3(a); if (a <= 0) return;
    const esTotal = b.tipo === 'inicio' || b.tipo === 'total', col = esTotal ? colorTipo('ingreso') : b.valor >= 0 ? COLOR.verde : COLOR.rojo, y = y0 + i * fila, yb = y + fila - bh - Math.max(0.06 * fila, 3 * u);
    const xa = px(b.ini), xb = lerp(xa, px(b.fin), e), xl = Math.min(xa, xb), ww = Math.max(Math.abs(xb - xa), 2 * u);
    ctx.fillStyle = col; ctx.fillRect(xl, yb, ww, bh);
    const la = clamp((a - 0.4) / 0.6); if (la <= 0) return;
    ctx.save(); ctx.globalAlpha *= la;
    const txt = esTotal ? fmtNum(b.valor, tab.fmt) : fmtSigno(b.valor, tab.fmt);
    ctx.font = fV; const wv = ctx.measureText(txt).width; ctx.font = fN;
    const nom = cortar(ctx, String(b.nombre), B.w - wv - 24 * u), wn = ctx.measureText(nom).width, yt = y + Math.max(fila * 0.4, escalarFuente(26 * u) + 2 * u);
    rotulo(ctx, nom, B.x, yt, fN, esTotal ? PALETA.blanco : PALETA.piedraClara, 'left', u);
    rotulo(ctx, txt, B.x + B.w, yt, fV, esTotal ? PALETA.blanco : col, 'right', u);
    reg(env, 'etiqueta', [B.x, yt - 34 * u, B.x + wn, yt + 8 * u], `${capa.id ?? 'cascada'}:n:${i}`);
    reg(env, 'etiqueta', [B.x + B.w - wv, yt - 34 * u, B.x + B.w, yt + 8 * u], `${capa.id ?? 'cascada'}:v:${i}`);
    ctx.restore();
  });
  ctx.restore();
}

function cascada(env, capa) {
  if (env.H > env.W || env.tablas[capa.datos].items.length > 8) return cascadaVertical(env, capa);   // muchos conceptos: filas con el nombre entero (también en horizontal)
  const {ctx, u, t, W, H} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.06, 0.27, 0.88, 0.56] : [0.05, 0.25, 0.9, 0.56]);
  const [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const barras = (capa._b ??= (() => { let run = 0; return tab.items.map((it) => { let ini, fin; if (it.tipo === 'inicio' || it.tipo === 'total') { ini = 0; fin = it.valor; run = it.valor; } else { ini = run; fin = run + it.valor; run = fin; } return {...it, ini, fin}; }); })());
  const n = barras.length, vmin = Math.min(0, ...barras.flatMap((b) => [b.ini, b.fin])), vmax = Math.max(0, ...barras.flatMap((b) => [b.ini, b.fin]));
  const zonaNombre = 96 * u, top = B.y + 40 * u, bajo = B.y + B.h - zonaNombre - 44 * u, pad = (vmax - vmin) * 0.04 || 1;
  const py = (v) => bajo - ((v - vmin) / (vmax - vmin + pad)) * (bajo - top), slot = B.w / n, bw = Math.min(slot * 0.62, 150 * u), k = clamp(slot / (170 * u), 0.55, 1);
  const p = prog(t, t0, t1, ease.io2) * n;
  // si las cifras con unidad no caben en su columna, se muestran solo los números y la unidad va una vez, arriba
  const compacto = (capa._cp ??= (() => { ctx.save(); ctx.font = fnt(800, 26 * u * k, true); const w = Math.max(...barras.map((b) => ctx.measureText(b.tipo === 'inicio' || b.tipo === 'total' ? fmtNum(b.valor, tab.fmt) : fmtSigno(b.valor, tab.fmt)).width)); ctx.restore(); return w > slot * 0.92; })());
  const fm = compacto ? {...tab.fmt, prefijo: '', sufijo: ''} : tab.fmt, unidadTxt = `${(tab.fmt.prefijo ?? '').trim()} ${(tab.fmt.sufijo ?? '').trim()}`.trim() || tab.fmt.unidad;
  ctx.save(); ctx.globalAlpha *= ap;
  if (compacto && unidadTxt) { rotulo(ctx, `CIFRAS EN ${unidadTxt}`.toUpperCase(), B.x, B.y + 6 * u, fnt(600, 18 * u, true), PALETA.piedraOscura, 'left', u); reg(env, 'etiqueta', [B.x, B.y - 14 * u, B.x + 420 * u, B.y + 12 * u], `${capa.id ?? 'cascada'}:unidad`); }
  ctx.strokeStyle = rgba(PALETA.piedra, 0.3); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(B.x, py(0)); ctx.lineTo(B.x + B.w, py(0)); ctx.stroke();
  barras.forEach((b, i) => {
    const a = clamp(p - i), cxb = B.x + slot * (i + 0.5), x = cxb - bw / 2, esTotal = b.tipo === 'inicio' || b.tipo === 'total';
    const col = esTotal ? colorTipo('ingreso') : b.valor >= 0 ? COLOR.verde : COLOR.rojo, e = ease.out3(a);
    const yIni = py(b.ini), yFin = lerp(yIni, py(b.fin), e), yA = Math.min(yIni, yFin), hA = Math.max(Math.abs(yFin - yIni), 1.5 * u);
    if (a > 0) {
      ctx.fillStyle = col; ctx.fillRect(x, yA, bw, hA);
      if (i < n - 1 && a >= 1) { ctx.strokeStyle = rgba(PALETA.piedra, 0.45); ctx.lineWidth = 1.5 * u; ctx.setLineDash([6 * u, 5 * u]); ctx.beginPath(); ctx.moveTo(x + bw, py(b.fin)); ctx.lineTo(x + slot, py(b.fin)); ctx.stroke(); ctx.setLineDash([]); }
    }
    const la = clamp((a - 0.55) / 0.45); if (la <= 0) return;
    ctx.save(); ctx.globalAlpha *= la;
    const txt = esTotal ? fmtNum(b.valor, fm) : fmtSigno(b.valor, fm), f = fnt(800, 26 * u * k, true), sube = esTotal || b.valor >= 0;
    ctx.font = f; const w = ctx.measureText(txt).width, yv = sube ? Math.min(yIni, py(b.fin)) - 12 * u : Math.max(yIni, py(b.fin)) + 32 * u * k;
    rotulo(ctx, txt, cxb, yv, f, esTotal ? PALETA.blanco : col, 'center', u);
    reg(env, 'etiqueta', [cxb - w / 2, yv - 26 * u * k, cxb + w / 2, yv + 6 * u], `${capa.id ?? 'cascada'}:v:${i}`);
    // nombre bajo la gráfica, en hasta 2 líneas
    const fn = fnt(600, 21 * u * k), maxW = slot * 0.94; ctx.font = fn;
    const pal = String(b.nombre).split(' '); let l1 = '', l2 = ''; for (const w_ of pal) { if (!l2 && ctx.measureText((l1 + ' ' + w_).trim()).width <= maxW) l1 = (l1 + ' ' + w_).trim(); else l2 = (l2 + ' ' + w_).trim(); }
    l2 = cortar(ctx, l2, maxW); l1 = cortar(ctx, l1 || String(b.nombre), maxW);
    const wn = Math.max(ctx.measureText(l1).width, l2 ? ctx.measureText(l2).width : 0), yn = bajo + 80 * u;
    rotulo(ctx, l1, cxb, yn, fn, PALETA.blanco, 'center', u); if (l2) rotulo(ctx, l2, cxb, yn + 26 * u * k, fn, PALETA.piedraClara, 'center', u);
    reg(env, 'etiqueta', [cxb - wn / 2, yn - 22 * u * k, cxb + wn / 2, yn + (l2 ? 30 * u * k : 6 * u)], `${capa.id ?? 'cascada'}:n:${i}`);
    ctx.restore();
  });
  ctx.restore();
}

// ── MODELOS NUEVOS (2026-11-04): pendiente, bump, treemap, waffle ────────────────────────────────────────────────
// Misma regla que el resto: cada número que se ve sale de una fila de los datos o es una cuenta exacta sobre ellas.
const paletaCat = () => [colorTipo('ingreso'), COLOR.teal, COLOR.purpura, COLOR.verde, COLOR.rojo, PALETA.piedra, COLOR.amarillo, COLOR.rosa];
const etiquetaX = (tab, i, modo = 'anio') => (tab.tipoX === 'fecha' ? fmtFecha(tab.x[i], modo) : String(tab.x[i]));
/** Separa verticalmente etiquetas que se pisarían: nadie queda a menos de `gap` del anterior ni fuera de [lo, hi]. */
function separar(ys, gap, lo, hi) {
  const o = ys.map((y, i) => ({y, i})).sort((a, b) => a.y - b.y);
  let cur = lo; o.forEach((e) => { e.y = Math.max(e.y, cur); cur = e.y + gap; });
  let lim = hi; for (let i = o.length - 1; i >= 0; i--) { o[i].y = Math.min(o[i].y, lim); lim = o[i].y - gap; }
  const out = new Array(ys.length); o.forEach((e) => { out[e.i] = e.y; }); return out;
}

/** Pendiente (slope chart): dos momentos, una línea por serie. Responde «¿quién subió y quién bajó entre A y B?». */
function pendiente(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.27, 0.64, 0.54] : [0.05, 0.25, 0.9, 0.62]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const n = tab.x.length, i0 = capa.de ?? 0, i1 = capa.a ?? n - 1;
  const xl = B.x + B.w * (vert ? 0.4 : 0.36), xr = B.x + B.w * (vert ? 0.62 : 0.64), fT = fnt(700, 26 * u), fL = fnt(500, 20 * u, true), fR = fnt(800, 26 * u, true), fD = fnt(700, 20 * u, true);
  const sT = escalarFuente(26 * u), sS = escalarFuente(20 * u);
  const L = (capa._pl ??= (() => {
    const idxs = (capa.series ?? tab.series.map((_, i) => i)).filter((si) => tab.series[si].y[i0] != null && tab.series[si].y[i1] != null);
    const vs = idxs.flatMap((si) => [tab.series[si].y[i0], tab.series[si].y[i1]]), lo = Math.min(...vs), hi = Math.max(...vs), top = B.y + 130 * u, bajo = B.y + B.h - 24 * u;
    const logE = lo > 0 && hi / lo > 8 && capa.escala !== 'lineal', f = logE ? Math.log10 : (v) => v;   // magnitudes muy distintas: escala logarítmica (se avisa en pantalla)
    const py = (v) => bajo - ((f(v) - f(lo)) / ((f(hi) - f(lo)) || 1)) * (bajo - top);
    ctx.font = fT;
    const nombres = idxs.map((si) => envolver(ctx, tab.series[si].nombre, xl - 22 * u - B.x, vert ? 2 : 1));
    const alto = Math.max(...nombres.map((l) => l.length)) * sT * 1.15 + sS * 1.3, gap = Math.min(alto + 14 * u, Math.max(sT * 2, (bajo - top) / Math.max(1, idxs.length)));
    const yl = separar(idxs.map((si) => py(tab.series[si].y[i0])), gap, top - 10 * u, bajo + 10 * u), yr = separar(idxs.map((si) => py(tab.series[si].y[i1])), gap, top - 10 * u, bajo + 10 * u);
    return {idxs, py, yl, yr, logE, nombres, omitidas: (capa.series ?? tab.series.map((_, i) => i)).length - idxs.length};
  })());
  const p = prog(t, t0, t1, ease.io2);
  ctx.save(); ctx.globalAlpha *= ap;
  [[xl, i0], [xr, i1]].forEach(([x, i]) => { rotulo(ctx, etiquetaX(tab, i), x, B.y + 40 * u, fnt(800, 30 * u, true), PALETA.piedraClara, 'center', u); ctx.font = fnt(800, 30 * u, true); const w = ctx.measureText(etiquetaX(tab, i)).width; reg(env, 'etiqueta', [x - w / 2, B.y - 4 * u, x + w / 2, B.y + 50 * u], `${capa.id ?? 'pendiente'}:x${i}`); });
  if (L.logE) {
    ctx.font = fnt(600, 16 * u); const lin = envolver(ctx, 'Escala logarítmica: la distancia entre los puntos es proporcional al cambio en %.', B.w, 3), s = escalarFuente(16 * u);
    lin.forEach((l, q) => rotulo(ctx, l, B.x, B.y + B.h + 30 * u + s + q * s * 1.25, fnt(600, 16 * u), PALETA.piedraOscura, 'left', u));
    reg(env, 'etiqueta', [B.x, B.y + B.h + 30 * u, B.x + B.w, B.y + B.h + 30 * u + s * (1.25 * lin.length + 0.5)], `${capa.id ?? 'pendiente'}:escala`);
  }
  L.idxs.forEach((si, j) => {
    const s = tab.series[si], v0 = s.y[i0], v1 = s.y[i1], color = capa.foco != null ? (si === capa.foco ? colorDe(s.color, si) : rgba(colorDe(s.color, si), 0.55)) : colorDe(s.color, si);
    const ya = L.py(v0), yb = L.py(v1), pr = clamp(p * 1.25 - j * 0.04), yEnd = lerp(ya, yb, pr), xEnd = lerp(xl, xr, pr);
    ctx.strokeStyle = color; ctx.lineWidth = (capa.foco === si ? 8 : 5.5) * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xl, ya); ctx.lineTo(xEnd, yEnd); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xl, ya, 9 * u, 0, 7); ctx.fill(); if (pr >= 1) { ctx.beginPath(); ctx.arc(xr, yb, 9 * u, 0, 7); ctx.fill(); }
    const la = clamp(p * 4 - 0.2);
    ctx.save(); ctx.globalAlpha *= la;
    const nl = L.nombres[j], bloque = nl.length * sT * 1.15 + sS * 1.3, y1 = L.yl[j] - bloque / 2 + sT * 0.9;
    ctx.font = fT; nl.forEach((l, q) => rotulo(ctx, l, xl - 22 * u, y1 + q * sT * 1.15, fT, PALETA.blanco, 'right', u));
    const vt = fmtNum(v0, s.fmt), yv = y1 + (nl.length - 1) * sT * 1.15 + sS * 1.3; rotulo(ctx, vt, xl - 22 * u, yv, fL, PALETA.piedraClara, 'right', u);
    ctx.font = fT; const wn = Math.max(...nl.map((l) => ctx.measureText(l).width)); ctx.font = fL; const wv = ctx.measureText(vt).width;
    reg(env, 'etiqueta', [xl - 22 * u - wn, y1 - sT, xl - 22 * u, y1 + (nl.length - 1) * sT * 1.15 + 8 * u], `${capa.id ?? 'pendiente'}:l:${si}`);
    reg(env, 'etiqueta', [xl - 22 * u - wv, yv - sS, xl - 22 * u, yv + 6 * u], `${capa.id ?? 'pendiente'}:lv:${si}`);
    ctx.restore();
    const ra = clamp((pr - 0.85) / 0.15); if (ra <= 0) return;
    ctx.save(); ctx.globalAlpha *= ra;
    const delta = v0 > 0 ? (v1 / v0 - 1) * 100 : null, dTxt = delta == null ? null : `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 1 : 0).replace('.', ',')} %`;
    const vTxt = fmtNum(v1, s.fmt), yr0 = L.yr[j] - (sT + sS * 1.3) / 2 + sT * 0.9; ctx.font = fR; const rw = Math.max(ctx.measureText(vTxt).width, dTxt ? (ctx.font = fD, ctx.measureText(dTxt).width) : 0);
    rotulo(ctx, vTxt, xr + 22 * u, yr0, fR, PALETA.blanco, 'left', u);
    if (dTxt) rotulo(ctx, dTxt, xr + 22 * u, yr0 + sS * 1.3, fD, delta >= 0 ? COLOR.verde : COLOR.rojo, 'left', u);
    reg(env, 'etiqueta', [xr + 22 * u, yr0 - sT, xr + 22 * u + rw, yr0 + sS * 1.3 + 8 * u], `${capa.id ?? 'pendiente'}:r:${si}`);
    ctx.restore();
  });
  ctx.restore();
}

/** Bump chart: la posición (1.º, 2.º…) de cada serie en varios momentos. Responde «¿quién superó a quién y cuándo?». */
function bump(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.27, 0.64, 0.58] : [0.04, 0.25, 0.92, 0.62]);
  const [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._bm ??= (() => {
    const n = tab.x.length, m = Math.min(capa.puntos ?? 8, n), pts = Array.from({length: m}, (_, q) => Math.round((q * (n - 1)) / Math.max(1, m - 1)));
    const idxs = (capa.series ?? tab.series.map((_, i) => i)).filter((si) => pts.every((i) => tab.series[si].y[i] != null) && (capa.orden === 'valor' || tab.series[si].y[pts[0]] > 0));
    const rank = idxs.map(() => []);
    const indice = capa.orden !== 'valor';   // por defecto se ordena por crecimiento acumulado desde el primer momento (comparable aunque las unidades difieran)
    pts.forEach((i) => { const o = idxs.map((si, j) => ({j, v: indice ? tab.series[si].y[i] / tab.series[si].y[pts[0]] : tab.series[si].y[i]})).sort((a, b) => b.v - a.v || a.j - b.j); o.forEach((e, r) => { rank[e.j].push(r); }); });
    return {pts, idxs, rank};
  })());
  const S = L.idxs.length; if (S < 2) return;
  const sN = escalarFuente(26 * u), fN = fnt(700, 26 * u);
  ctx.font = fN;
  const LW = vert ? B.w * 0.4 : Math.min(B.w * 0.26, Math.max(...L.idxs.map((si) => ctx.measureText(cortar(ctx, tab.series[si].nombre, B.w * 0.26)).width)) + 28 * u);
  const x0 = B.x + LW + 30 * u, x1 = vert ? B.x + B.w - 24 * u : B.x + B.w - LW - 10 * u, paso = (x1 - x0) / (L.pts.length - 1);
  const top = B.y + 80 * u, fila = Math.min(vert ? 112 * u : 86 * u, (B.h - 120 * u) / S), cyR = (r) => top + r * fila + fila / 2, cx = (q) => x0 + q * paso;
  const rx = lerp(x0 - 20 * u, x1 + 20 * u, prog(t, t0, t1, ease.io2)), rad = escalarFuente(20 * u) * 0.68;
  ctx.save(); ctx.globalAlpha *= ap;
  // años: solo los que caben (el primero y el último siempre)
  ctx.font = fnt(700, 21 * u, true); const wy = ctx.measureText(etiquetaX(tab, L.pts[0])).width, cada = Math.max(1, Math.ceil((wy * 1.5) / paso));
  L.pts.forEach((i, q) => { if ((q % cada === 0 && L.pts.length - 1 - q >= cada) || q === L.pts.length - 1) { const tx = etiquetaX(tab, i); rotulo(ctx, tx, cx(q), B.y + 44 * u, fnt(700, 21 * u, true), PALETA.piedraClara, 'center', u); const w = ctx.measureText(tx).width; reg(env, 'etiqueta', [cx(q) - w / 2, B.y + 8 * u, cx(q) + w / 2, B.y + 56 * u], `${capa.id ?? 'bump'}:p${q}`); } });
  const nota = capa.orden !== 'valor' ? `El 1.º es el que más creció desde ${etiquetaX(tab, L.pts[0])}.` : 'El 1.º es el de mayor valor.';
  ctx.font = fnt(600, 16 * u); const nl = envolver(ctx, nota, B.w, 2), sNota = escalarFuente(16 * u);
  nl.forEach((l, q) => rotulo(ctx, l, B.x, B.y + B.h + 30 * u + sNota + q * sNota * 1.25, fnt(600, 16 * u), PALETA.piedraOscura, 'left', u));
  reg(env, 'etiqueta', [B.x, B.y + B.h + 30 * u, B.x + B.w, B.y + B.h + 30 * u + sNota * (1.25 * nl.length + 0.4)], `${capa.id ?? 'bump'}:orden`);
  L.idxs.forEach((si, j) => {
    const s = tab.series[si], color = colorDe(s.color, si), mudo = capa.foco != null && si !== capa.foco, a = mudo ? 0.4 : 1;
    ctx.save(); ctx.beginPath(); ctx.rect(B.x - 4, B.y - 20 * u, rx - B.x + 4, B.h + 40 * u); ctx.clip(); ctx.globalAlpha *= a;
    ctx.strokeStyle = color; ctx.lineWidth = (capa.foco === si ? 11 : 8) * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx(0), cyR(L.rank[j][0]));
    for (let q = 1; q < L.pts.length; q++) { const m = (cx(q - 1) + cx(q)) / 2; ctx.bezierCurveTo(m, cyR(L.rank[j][q - 1]), m, cyR(L.rank[j][q]), cx(q), cyR(L.rank[j][q])); }
    ctx.stroke();
    L.pts.forEach((_, q) => { const px = cx(q), py = cyR(L.rank[j][q]); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, rad, 0, 7); ctx.fill(); texto(ctx, String(L.rank[j][q] + 1), px, py + mid(20 * u), fnt(800, 20 * u, true), contraste(color, PALETA.fondo) >= contraste(color, PALETA.blanco) ? PALETA.fondo : PALETA.blanco, 'center'); });
    ctx.restore();
    // nombre: en vertical, a la izquierda, hasta en 2 líneas; en horizontal, a ambos lados
    const lineas = envolver((ctx.font = fN, ctx), s.nombre, LW - 28 * u, vert ? 2 : 1), y0n = cyR(L.rank[j][0]) - ((lineas.length - 1) * sN * 1.1) / 2 + mid(26 * u);
    ctx.save(); ctx.globalAlpha *= a * clamp((rx - x0 + 40 * u) / (60 * u));
    lineas.forEach((l, q) => rotulo(ctx, l, B.x + LW - 6 * u, y0n + q * sN * 1.1, fN, PALETA.blanco, 'right', u));
    const wI = Math.max(...lineas.map((l) => ctx.measureText(l).width));
    reg(env, 'etiqueta', [B.x + LW - 6 * u - wI, y0n - sN, B.x + LW - 6 * u, y0n + (lineas.length - 1) * sN * 1.1 + 8 * u], `${capa.id ?? 'bump'}:i:${si}`);
    ctx.restore();
    if (!vert) {
      const nm = cortar(ctx, s.nombre, LW - 28 * u), yf = cyR(L.rank[j][L.pts.length - 1]);
      ctx.save(); ctx.globalAlpha *= a * clamp((rx - x1) / (50 * u));
      rotulo(ctx, nm, x1 + 30 * u, yf + mid(26 * u), fN, PALETA.blanco, 'left', u);
      reg(env, 'etiqueta', [x1 + 30 * u, yf - sN, x1 + 30 * u + ctx.measureText(nm).width, yf + 8 * u], `${capa.id ?? 'bump'}:f:${si}`);
      ctx.restore();
    }
  });
  ctx.restore();
}

/** Treemap (rectángulos "squarified"): el ÁREA de cada parte es proporcional a su valor. Lo que no cabe rotulado se lista abajo con su cifra. */
function treemap(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.26, 0.64, 0.6] : [0.05, 0.24, 0.9, 0.62]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const sT = escalarFuente(26 * u), sV = escalarFuente(20 * u);
  const L = (capa._tm ??= (() => {
    const items = [...tab.items].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor), total = items.reduce((a, x) => a + x.valor, 0), pie = (vert ? 200 : 96) * u, R = {x: B.x, y: B.y, w: B.w, h: B.h - pie};
    const esc = (R.w * R.h) / total, nodos = items.map((it) => ({it, a: it.valor * esc, rect: null}));
    const peor = (fila, lado) => { const s = fila.reduce((a, n) => a + n.a, 0), mx = Math.max(...fila.map((n) => n.a)), mn = Math.min(...fila.map((n) => n.a)); return Math.max((lado * lado * mx) / (s * s), (s * s) / (lado * lado * mn)); };
    let r = {...R}, fila = [], i = 0;
    const colocar = () => {
      const s = fila.reduce((a, n) => a + n.a, 0), horiz = r.w >= r.h, lado = horiz ? r.h : r.w, grosor = s / lado; let off = 0;
      fila.forEach((n) => { const l = n.a / grosor; n.rect = horiz ? [r.x, r.y + off, grosor, l] : [r.x + off, r.y, l, grosor]; off += l; });
      if (horiz) r = {x: r.x + grosor, y: r.y, w: r.w - grosor, h: r.h}; else r = {x: r.x, y: r.y + grosor, w: r.w, h: r.h - grosor};
      fila = [];
    };
    while (i < nodos.length) { const lado = Math.min(r.w, r.h), cand = [...fila, nodos[i]]; if (!fila.length || peor(cand, lado) <= peor(fila, lado)) { fila = cand; i++; } else colocar(); }
    if (fila.length) colocar();
    // ¿cabe el nombre? Solo se rotula el rectángulo donde el nombre (cortado como mucho a ~60 %) cabe y hay alto para dos líneas.
    ctx.font = fnt(800, 26 * u);
    nodos.forEach((nd) => { const [, , w, h] = nd.rect, nom = cortar(ctx, nd.it.nombre, w - 20 * u); nd.rotulo = h >= sT * 1.5 + 14 * u && w >= 120 * u && nom.length >= Math.min(nd.it.nombre.length, 8) && nom.length >= nd.it.nombre.length * 0.6; });
    return {nodos, total, pie};
  })());
  const n = L.nodos.length, p = prog(t, t0, t1, ease.io2) * n, pal = paletaCat(), G = 4 * u, sinRotulo = [];
  ctx.save(); ctx.globalAlpha *= ap;
  L.nodos.forEach((nd, i) => {
    const a = ease.out3(clamp(p - i)); if (a <= 0) return;
    const [rx, ry, rw, rh] = nd.rect, col = pal[i % pal.length], x = rx + G / 2, y = ry + G / 2, w = rw - G, h = rh - G, cxm = x + w / 2, cym = y + h / 2;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col;
    const sw = w * (0.6 + 0.4 * a), sh = h * (0.6 + 0.4 * a); ctx.fillRect(cxm - sw / 2, cym - sh / 2, sw, sh); ctx.restore();
    const la = clamp((a - 0.6) / 0.4); if (la <= 0) return;
    if (!nd.rotulo) { sinRotulo.push(nd); return; }
    const pct = (nd.it.valor / L.total) * 100, tinta = contraste(col, PALETA.fondo) >= contraste(col, PALETA.blanco) ? PALETA.fondo : PALETA.blanco;
    ctx.font = fnt(800, 26 * u); const nom = cortar(ctx, nd.it.nombre, w - 20 * u);
    ctx.save(); ctx.globalAlpha *= la;
    texto(ctx, nom, x + 10 * u, y + sT * 1.0 + 4 * u, fnt(800, 26 * u), tinta, 'left');
    let alto = sT * 1.0 + 14 * u;
    if (h > sT * 1.0 + sV * 1.25 + 22 * u) { const vt = `${fmtNum(nd.it.valor, tab.fmt)} · ${pctTxt(pct)}`; ctx.font = fnt(600, 20 * u, true); texto(ctx, cortar(ctx, vt, w - 20 * u), x + 10 * u, y + sT + sV * 1.3 + 8 * u, fnt(600, 20 * u, true), tinta, 'left'); alto = sT + sV * 1.3 + 18 * u; }
    ctx.restore();
    ctx.font = fnt(800, 26 * u); reg(env, 'etiqueta', [x + 8 * u, y + 4 * u, x + 12 * u + Math.min(w - 8 * u, ctx.measureText(nom).width), y + alto], `${capa.id ?? 'treemap'}:${nd.it.nombre}`);
  });
  if (sinRotulo.length && p >= n - 0.2) {
    const piezas = ['Partes pequeñas:', ...sinRotulo.map((nd) => `${nd.it.nombre} ${pctTxt((nd.it.valor / L.total) * 100)}`)], f = fnt(500, 18 * u); ctx.font = f;
    const lineas = ['']; piezas.forEach((pz) => { const l = lineas[lineas.length - 1], cand = l ? `${l} · ${pz}` : pz; if (ctx.measureText(cand).width <= B.w || !l) lineas[lineas.length - 1] = cand; else lineas.push(pz); });   // salto de línea, nunca «…»: no se pierde ninguna cifra
    const s = escalarFuente(18 * u), y0 = B.y + B.h - L.pie + 18 * u + s;
    lineas.forEach((l, q) => { rotulo(ctx, l, B.x, y0 + q * s * 1.3, f, PALETA.piedraClara, 'left', u); reg(env, 'etiqueta', [B.x, y0 + q * s * 1.3 - s, B.x + Math.min(B.w, ctx.measureText(l).width), y0 + q * s * 1.3 + 8 * u], `${capa.id ?? 'treemap'}:pequenos${q}`); });
  }
  ctx.restore();
}

/** Waffle: 100 cuadros, cada uno vale 1 %. Se reparten por «mayor resto», así suman exactamente 100 y se declara. */
function waffle(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.26, 0.64, 0.64] : [0.05, 0.24, 0.9, 0.64]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._wf ??= (() => {
    const items = [...tab.items].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor), total = items.reduce((a, x) => a + x.valor, 0);
    const base = items.map((it) => { const exacto = (it.valor / total) * 100; return {it, exacto, n: Math.floor(exacto), resto: exacto - Math.floor(exacto)}; });
    let faltan = 100 - base.reduce((a, b) => a + b.n, 0); [...base].sort((a, b) => b.resto - a.resto).forEach((b) => { if (faltan > 0) { b.n++; faltan--; } });
    const celdas = []; base.forEach((b, i) => { for (let q = 0; q < b.n; q++) celdas.push(i); });
    return {base, celdas, total};
  })());
  const lado = vert ? Math.min(B.w * 0.62, 420 * u) : Math.min(B.h * 0.9, B.w * 0.4), cel = lado / 10, gx = vert ? B.x + (B.w - lado) / 2 : B.x + 30 * u, gy = vert ? B.y + 10 * u : B.y + (B.h - lado) / 2, pal = paletaCat();
  const p = prog(t, t0, t1, ease.io2) * 100;
  ctx.save(); ctx.globalAlpha *= ap;
  L.celdas.forEach((it, c) => {
    const a = ease.out3(clamp(p - c)); const fila = 9 - Math.floor(c / 10), col = c % 10, x = gx + col * cel, y = gy + fila * cel, s = (cel - 5 * u) * (0.3 + 0.7 * a);
    ctx.globalAlpha = ap * a; ctx.fillStyle = pal[it % pal.length]; ctx.fillRect(x + (cel - s) / 2, y + (cel - s) / 2, s, s);
  });
  ctx.globalAlpha = ap;
  const sN = escalarFuente(18 * u); ctx.font = fnt(600, 18 * u);
  rotulo(ctx, 'Cada cuadro vale 1 % del total', gx, gy + lado + 14 * u + sN, fnt(600, 18 * u), PALETA.piedraOscura, 'left', u);
  reg(env, 'etiqueta', [gx, gy + lado + 10 * u, gx + ctx.measureText('Cada cuadro vale 1 % del total').width, gy + lado + 24 * u + sN], `${capa.id ?? 'waffle'}:nota`);
  const lx = vert ? B.x : gx + lado + 70 * u, ly0 = vert ? gy + lado + 24 * u + sN + 24 * u : B.y, area = vert ? B.y + B.h - ly0 : B.h, lw = vert ? B.w : B.x + B.w - lx;
  const itemsL = L.base.map((b) => b.it), paso = vert ? 92 * u : 70 * u, maxF = Math.max(3, Math.floor(area / paso));
  // las filas muestran el % EXACTO (no el redondeado a cuadros); si se agrupan, se suman los exactos
  const filas = filasLeyenda(itemsL, L.total, maxF, pal), rh = Math.min(vert ? 100 * u : 78 * u, area / filas.length), y0 = ly0 + (area - rh * filas.length) / 2;
  let acum = 0; const inicio = L.base.map((b) => { const a0 = acum; acum += b.n; return a0; });
  filas.forEach((f, i) => {
    const la = p >= 99.99 ? 1 : clamp((p - inicio[f.idx[0]] + 4) / 4); if (la <= 0) return;
    filaLeyenda(env, capa, f, lx, y0 + i * rh, rh, lw, la, {fmt: tab.fmt, id: 'waffle'});
  });
  ctx.restore();
}

/** Lollipop: ranking de partes con palo desde CERO (base honesta) y un círculo; cada fila lleva valor y porcentaje. Pensada para vertical (tipografía grande). */
function lollipop(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.26, 0.64, 0.6] : [0.05, 0.24, 0.9, 0.64]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const items = (capa._lp ??= [...tab.items].filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor)), total = items.reduce((a, x) => a + x.valor, 0), n = items.length;
  const fila = Math.min(vert ? 118 * u : 96 * u, B.h / n), k = clamp(fila / (100 * u), 0.6, 1), fN = fnt(700, 31 * u * k), fV = fnt(800, 29 * u * k, true), fP = fnt(700, 24 * u * k, true);
  const pal = paletaCat(), vmax = items[0].valor, p = prog(t, t0, t1, ease.io2) * n, y0 = B.y + (B.h - fila * n) / 2;
  ctx.font = fV; const wMax = Math.max(...items.map((it) => ctx.measureText(`${fmtNum(it.valor, tab.fmt)}  ·  ${pctTxt((it.valor / total) * 100)}`).width)), largo = Math.max(60 * u, B.w - 24 * u - wMax - 56 * u * k);
  ctx.save(); ctx.globalAlpha *= ap;
  items.forEach((it, i) => {
    const a = clamp(p - i), e = ease.out3(a); if (a <= 0) return;
    const y = y0 + i * fila, col = pal[i % pal.length], ancho = B.w - 24 * u, xe = B.x + 12 * u + (it.valor / vmax) * largo * e, yb = y + fila * 0.68;
    ctx.font = fN; const nom = cortar(ctx, it.nombre, B.w - 16 * u);
    rotulo(ctx, nom, B.x + 12 * u, y + fila * 0.34, fN, PALETA.blanco, 'left', u);
    reg(env, 'etiqueta', [B.x + 12 * u, y + fila * 0.34 - 28 * u * k, B.x + 12 * u + ctx.measureText(nom).width, y + fila * 0.34 + 8 * u], `${capa.id ?? 'lollipop'}:n:${it.nombre}`);
    ctx.strokeStyle = col; ctx.lineWidth = 7 * u * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B.x + 12 * u, yb); ctx.lineTo(xe, yb); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xe, yb, 15 * u * k * (0.5 + 0.5 * e), 0, 7); ctx.fill();
    const la = clamp((a - 0.5) / 0.5); if (la <= 0) return;
    const txt = `${fmtNum(it.valor, tab.fmt)}  ·  ${pctTxt((it.valor / total) * 100)}`; ctx.font = fV;
    const w = ctx.measureText(txt).width, xv = Math.min(xe + 26 * u * k, B.x + B.w - w);
    ctx.save(); ctx.globalAlpha *= la; rotulo(ctx, txt, xv, yb + 10 * u * k, fV, col, 'left', u); ctx.restore();
    reg(env, 'etiqueta', [xv, yb - 16 * u * k, xv + w, yb + 16 * u * k], `${capa.id ?? 'lollipop'}:v:${it.nombre}`);
  });
  ctx.restore();
}

/** Divergente: cambio porcentual de cada serie entre dos momentos, en UNA escala común (comparable aunque las unidades difieran). Ganadores a la derecha, perdedores a la izquierda. */
function divergente(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = caja(env, capa, vert ? [0.0667, 0.26, 0.64, 0.64] : [0.05, 0.25, 0.9, 0.62]);
  const [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const n = tab.x.length, i0 = capa.de ?? 0, i1 = capa.a ?? n - 1;
  const L = (capa._dv ??= (() => {
    const filas = (capa.series ?? tab.series.map((_, i) => i)).filter((si) => tab.series[si].y[i0] > 0 && tab.series[si].y[i1] != null).map((si) => ({si, v0: tab.series[si].y[i0], v1: tab.series[si].y[i1], pct: (tab.series[si].y[i1] / tab.series[si].y[i0] - 1) * 100})).sort((a, b) => b.pct - a.pct);
    return {filas, lo: Math.min(0, ...filas.map((f) => f.pct)), hi: Math.max(0, ...filas.map((f) => f.pct))};
  })());
  const S = L.filas.length; if (!S) return;
  const sN = escalarFuente(29 * u), sS = escalarFuente(20 * u), fN = fnt(700, 29 * u), fV = fnt(800, 30 * u, true), fS = fnt(500, 20 * u, true);
  const sV = escalarFuente(30 * u), yN = sN + 4 * u, yBar = yN + 8 * u + sV * 0.75, yS = yBar + sV * 0.35 + 8 * u + sS, fila = Math.min(vert ? 170 * u : 130 * u, B.h / S);   // nombre · barra · «de → a»
  const fmtP = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(Math.abs(x) < 10 ? 1 : 0).replace('.', ',')} %`;
  ctx.font = fV; const wP = Math.max(...L.filas.map((f) => ctx.measureText(fmtP(f.pct)).width)) + 16 * u;
  const xa = B.x + (L.lo < 0 ? wP : 0) + 8 * u, xb = B.x + B.w - (L.hi > 0 ? wP : 0) - 8 * u, px = (v) => xa + ((v - L.lo) / ((L.hi - L.lo) || 1)) * (xb - xa), y0 = B.y + (B.h - fila * S) / 2, p = prog(t, t0, t1, ease.io2) * S;
  ctx.save(); ctx.globalAlpha *= ap;
  ctx.strokeStyle = rgba(PALETA.piedra, 0.5); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(px(0), y0 - 6 * u); ctx.lineTo(px(0), y0 + fila * S); ctx.stroke();
  L.filas.forEach((f, i) => {
    const a = clamp(p - i), e = ease.out3(a); if (a <= 0) return;
    const s = tab.series[f.si], y = y0 + i * fila, col = f.pct >= 0 ? COLOR.verde : COLOR.rojo, bh = 22 * u, yb = y + yBar;
    ctx.font = fN; const nom = cortar(ctx, s.nombre, B.w), xn = B.x;
    rotulo(ctx, nom, xn, y + yN, fN, PALETA.blanco, 'left', u);
    const wn = ctx.measureText(nom).width; reg(env, 'etiqueta', [xn, y + yN - sN, xn + wn, y + yN + 8 * u], `${capa.id ?? 'divergente'}:n:${f.si}`);
    const xe = lerp(px(0), px(f.pct), e); ctx.fillStyle = col; ctx.fillRect(Math.min(px(0), xe), yb - bh / 2, Math.max(Math.abs(xe - px(0)), 1.5 * u), bh);
    const la = clamp((a - 0.55) / 0.45); if (la <= 0) return;
    const txt = fmtP(f.pct); ctx.font = fV; const w = ctx.measureText(txt).width, xv = f.pct >= 0 ? px(f.pct) + 10 * u : px(f.pct) - 10 * u - w;
    ctx.save(); ctx.globalAlpha *= la; rotulo(ctx, txt, xv, yb + escalarFuente(30 * u) * 0.35, fV, col, 'left', u);
    const sub = `${fmtNum(f.v0, s.fmt)} → ${fmtNum(f.v1, s.fmt)}`; ctx.font = fS; const ws = ctx.measureText(sub).width, xs = Math.max(B.x, Math.min(f.pct >= 0 ? px(0) + 10 * u : px(0) - 10 * u - ws, B.x + B.w - ws));
    rotulo(ctx, sub, xs, y + yS, fS, PALETA.piedraClara, 'left', u); ctx.restore();
    reg(env, 'etiqueta', [xv, yb - escalarFuente(30 * u) * 0.7, xv + w, yb + escalarFuente(30 * u) * 0.5], `${capa.id ?? 'divergente'}:v:${f.si}`);
    reg(env, 'etiqueta', [xs, y + yS - sS, xs + ws, y + yS + 6 * u], `${capa.id ?? 'divergente'}:s:${f.si}`);
  });
  ctx.restore();
}

import {CAPAS_EXTRA} from './capas_extra.js';   // visualizador universal (capas nuevas)
export const DIBUJO = {...CAPAS_EXTRA, linea, barras, carrera, dispersion, calor, zona, llamada, contador, titulo, cortina, imagen, sello, sankey, donut, cascada, pendiente, bump, treemap, waffle, lollipop, divergente};
