// Capas dibujables. Cada capa es una función pura (env, capa) -> pinta en env.ctx para el instante env.t.
// Las gráficas publican en env.vistas[id] su proyección datos->píxel y en env.cabezas[id] el valor bajo la
// "cabeza" de la animación; las capas de anotación (llamada, zona, contador) las leen: así NADA se coloca a
// mano en píxeles, todo se ancla a un dato.
import {
  PALETA, clamp, lerp, ease, prog, colorDe, mezcla, rgba, fmtNum, fmtFecha, ticksNum, ticksFecha, etiquetaTick,
  lowerBound, valorEn, mezclaRango,
} from './nucleo.js';

const SANS = '"Geist", system-ui, sans-serif';
const MONO = '"Geist Mono", ui-monospace, monospace';
const fnt = (peso, px, mono = false) => `${peso} ${Math.round(px)}px ${mono ? MONO : SANS}`;

export const Z = {imagen: 5, zona: 8, linea: 10, barras: 10, carrera: 10, dispersion: 10, calor: 10, llamada: 20, contador: 25, titulo: 30, cortina: 40, sello: 50};

function caja(env, capa, def) {
  const c = capa.caja ?? def;
  return {x: c[0] * env.W, y: c[1] * env.H, w: c[2] * env.W, h: c[3] * env.H};
}
const CAJA_DEF = (env) => (env.H > env.W ? [0.08, 0.27, 0.82, 0.5] : [0.065, 0.24, 0.87, 0.6]);
const aparece = (env, capa, t0) => prog(env.t, (capa.aparece ?? t0 - 0.5), (capa.aparece ?? t0 - 0.5) + 0.5, ease.out3);

function texto(ctx, s, x, y, font, color, align = 'left', base = 'alphabetic', alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(s, x, y);
  ctx.restore();
}
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
function camaraEn(capa, tab, idxs, t) {
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
    texto(ctx, log ? fmtLog(v) : fmtNum(v, {decimales: dec}), B.x - 16 * u, y + 7 * u, fnt(400, 20 * u, true), rgba(PALETA.piedraOscura, 0.8), 'right');
  }
  if (capa.ejeUnidad && fmtL?.unidad) texto(ctx, fmtL.unidad.toUpperCase(), B.x, B.y - 22 * u, fnt(500, 17 * u, true), PALETA.piedraOscura, 'left');
  if (yR) {
    const tr = ticksNum(yR[0], yR[1], 4), pr = tr.length > 1 ? tr[1] - tr[0] : 1;
    const c = colorDe(tab.series[[...der][0]].color, [...der][0]);
    for (const v of tr) texto(ctx, fmtNum(v, {decimales: decTicks(pr)}), B.x + B.w + 16 * u, pyR(v) + 7 * u, fnt(400, 20 * u, true), c, 'left');
    const fu = tab.series[[...der][0]].fmt?.unidad; if (fu) texto(ctx, fu.toUpperCase(), B.x + B.w, B.y - 22 * u, fnt(500, 17 * u, true), c, 'right');
  }
  // eje X + marca del año en curso (la cabeza siempre dice en qué año estamos: no se pierde el hilo)
  if (tab.tipoX === 'fecha') {
    const tf = ticksFecha(cam.x[0], cam.x[1], Math.max(3, Math.floor(B.w / (200 * u))));
    const enCurso = reveal > 0.001 && reveal < 0.999 && capa.marcaAnio !== false && hx >= B.x && hx <= B.x + B.w;
    for (const tk of tf.ticks) {
      const x = px(tk);
      if (x < B.x - 2 || x > B.x + B.w + 2) continue;
      if (enCurso && Math.abs(x - hx) < 80 * u) continue;
      texto(ctx, etiquetaTick(tk, tf.unidad), x, B.y + B.h + 34 * u, fnt(400, 20 * u, true), rgba(PALETA.piedraOscura, 0.8), 'center');
    }
    if (enCurso) {
      const largo = cam.x[1] - cam.x[0] > 3 * 365.25 * 86400000, et = fmtFecha(xh, largo ? 'anio' : 'mes');
      ctx.font = fnt(800, 26 * u, true);
      const w = ctx.measureText(et).width + 30 * u, h = 40 * u, xx = clamp(hx - w / 2, B.x, B.x + B.w - w), yy = B.y + B.h + 10 * u;
      ctx.strokeStyle = colorMarca; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(hx, B.y + B.h); ctx.lineTo(hx, yy); ctx.stroke();
      ctx.fillStyle = colorMarca; ctx.fillRect(xx, yy, w, h);
      texto(ctx, et, xx + w / 2, yy + h - 11 * u, fnt(800, 26 * u, true), PALETA.fondo, 'center');
    }
  } else {
    for (const tk of ticksNum(cam.x[0], cam.x[1], 6)) texto(ctx, fmtNum(tk, {decimales: 0}), px(tk), B.y + B.h + 34 * u, fnt(400, 20 * u, true), rgba(PALETA.piedraOscura, 0.8), 'center');
  }
  reg(env, 'eje-y', [B.x - 120 * u, B.y - 8 * u, B.x - 4 * u, B.y + B.h + 8 * u], capa.id);
  reg(env, 'eje-x', [B.x, B.y + B.h + 6 * u, B.x + B.w, B.y + B.h + 56 * u], capa.id);
  // eje base
  ctx.strokeStyle = rgba(PALETA.piedra, 0.3); ctx.lineWidth = 1.5 * u;
  ctx.beginPath(); ctx.moveTo(B.x, B.y + B.h); ctx.lineTo(B.x + B.w, B.y + B.h); ctx.stroke();

  // series
  ctx.save();
  ctx.beginPath(); ctx.rect(B.x - 2, B.y - 12 * u, B.w + 4, B.h + 24 * u); ctx.clip();
  const cabezas = [];
  idxs.forEach((si, k) => {
    const s = tab.series[si], color = colorDe(s.color, si), py = der.has(si) ? pyR : pyL;
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
    if (capa.area) {
      const A = new Path2D(P);
      A.lineTo(px(xh), B.y + B.h); A.lineTo(x0p, B.y + B.h); A.closePath();
      const g = ctx.createLinearGradient(0, B.y, 0, B.y + B.h);
      g.addColorStop(0, rgba(color, 0.3)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.fill(A);
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 22 * u; ctx.strokeStyle = rgba(color, 0.55); ctx.lineWidth = 7 * u; ctx.stroke(P); ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = 3.4 * u; ctx.stroke(P);
    cabezas.push({si, color, x: px(xh), y: py(yh), valor: yo, nombre: s.nombre, fmt: s.fmt, s});
  });
  ctx.restore();

  // cabezas: punto + ondas + etiqueta
  for (const h of cabezas) {
    if (reveal <= 0 || h.x < B.x - 4 || h.x > B.x + B.w + 4) continue;
    const ciclo = (t * 0.9) % 1;
    ctx.strokeStyle = rgba(h.color, (1 - ciclo) * 0.55 * (reveal < 1 ? 1 : 0.6)); ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.arc(h.x, h.y, (9 + 30 * ciclo) * u, 0, 7); ctx.stroke();
    ctx.fillStyle = PALETA.blanco; ctx.beginPath(); ctx.arc(h.x, h.y, 6.5 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = h.color; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(h.x, h.y, 9.5 * u, 0, 7); ctx.stroke();
    if (capa.etiquetas !== false && idxs.length > 1) {
      const ex = Math.min(h.x + 18 * u, env.W - 40 * u);
      texto(ctx, h.nombre, ex, h.y - 18 * u, fnt(600, 24 * u), h.color, ex > h.x + 200 * u ? 'left' : 'right');
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
  const {ctx, u, t} = env;
  const tab = env.tablas[capa.datos], n = tab.x.length;
  const B = caja(env, capa, CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 3];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const idxs = capa.series ?? tab.series.map((_, i) => i);
  const horiz = capa.orientacion === 'h';
  let orden = [...Array(n).keys()];
  if (capa.orden === 'desc') orden.sort((a, b) => (tab.series[idxs[0]].y[b] ?? -Infinity) - (tab.series[idxs[0]].y[a] ?? -Infinity));
  if (capa.maxBarras) orden = orden.slice(0, capa.maxBarras);
  let lo = 0, hi = -Infinity;
  for (const i of idxs) for (const k of orden) { const v = tab.series[i].y[k]; if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
  const span = hi - lo || 1; hi += span * 0.12; if (lo < 0) lo -= span * 0.08;
  const L = horiz ? B.w : B.h;
  const val = (v) => ((v - lo) / (hi - lo)) * L;
  const m = orden.length, ng = idxs.length;
  const banda = (horiz ? B.h : B.w) / m, gap = banda * 0.22, bw = (banda - gap) / ng;
  const fmt = tab.series[idxs[0]].fmt;
  ctx.save(); ctx.globalAlpha = ap;
  const ty = ticksNum(lo, hi, 5), pasoT = ty.length > 1 ? ty[1] - ty[0] : 1;
  for (const v of ty) {
    ctx.strokeStyle = rgba(PALETA.piedra, 0.1); ctx.lineWidth = u; ctx.beginPath();
    if (horiz) { const x = B.x + val(v); ctx.moveTo(x, B.y); ctx.lineTo(x, B.y + B.h); } else { const y = B.y + B.h - val(v); ctx.moveTo(B.x, y); ctx.lineTo(B.x + B.w, y); }
    ctx.stroke();
    if (horiz) texto(ctx, fmtNum(v, {decimales: decTicks(pasoT)}), B.x + val(v), B.y + B.h + 32 * u, fnt(400, 20 * u, true), PALETA.piedraOscura, 'center');
    else texto(ctx, fmtNum(v, {decimales: decTicks(pasoT)}), B.x - 14 * u, B.y + B.h - val(v) + 7 * u, fnt(400, 20 * u, true), PALETA.piedraOscura, 'right');
  }
  if (fmt?.unidad) texto(ctx, fmt.unidad.toUpperCase(), B.x, B.y - 26 * u, fnt(500, 19 * u, true), PALETA.piedraOscura, 'left');
  const z = horiz ? B.x + val(0) : B.y + B.h - val(0);
  ctx.strokeStyle = rgba(PALETA.piedra, 0.45); ctx.lineWidth = 1.5 * u; ctx.beginPath();
  if (horiz) { ctx.moveTo(z, B.y); ctx.lineTo(z, B.y + B.h); } else { ctx.moveTo(B.x, z); ctx.lineTo(B.x + B.w, z); }
  ctx.stroke();
  orden.forEach((k, j) => {
    const ini = t0 + (j / m) * (t1 - t0) * 0.6, dur = Math.max(0.5, (t1 - t0) * 0.4);
    const g = prog(t, ini, ini + dur, ease.outExpo);
    idxs.forEach((si, q) => {
      const v = tab.series[si].y[k]; if (v == null) return;
      const color = capa.colorSigno ? (v >= 0 ? PALETA.teal : '#A24FB0') : colorDe(tab.series[si].color, si);
      const pos0 = (horiz ? B.y : B.x) + j * banda + gap / 2 + q * bw;
      const len = (val(v) - val(0)) * g;
      const x = horiz ? z : pos0, y = horiz ? pos0 : z - Math.max(0, len), w = horiz ? len : bw, h = horiz ? bw : Math.abs(len);
      const gr = horiz ? ctx.createLinearGradient(z, 0, z + Math.abs(w) + 1, 0) : ctx.createLinearGradient(0, z, 0, z - Math.max(1, len));
      gr.addColorStop(0, rgba(color, 0.55)); gr.addColorStop(1, color);
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 14 * u; ctx.fillStyle = gr;
      if (horiz) ctx.fillRect(Math.min(x, x + w), y, Math.abs(w), h); else ctx.fillRect(x, len >= 0 ? z - len : z, w, Math.abs(len));
      ctx.restore();
      if (capa.etiquetas !== false && m <= 24 && g > 0.6) {
        const lbl = fmtNum(v * g, {...tab.series[si].fmt, prefijo: '', sufijo: ''});
        if (horiz) texto(ctx, lbl, z + len + 10 * u, pos0 + bw / 2 + 7 * u, fnt(500, 21 * u, true), PALETA.piedraClara, 'left', 'alphabetic', g);
        else texto(ctx, lbl, pos0 + bw / 2, (len >= 0 ? z - len - 12 * u : z - len + 28 * u), fnt(500, 20 * u, true), PALETA.piedraClara, 'center', 'alphabetic', g);
      }
    });
    const et = tab.tipoX === 'fecha' ? fmtFecha(tab.x[k], capa.formatoX ?? 'anio') : String(tab.x[k]);
    if (horiz) texto(ctx, et, B.x - 14 * u, (B.y + j * banda + banda / 2) + 7 * u, fnt(500, 22 * u), PALETA.piedraClara, 'right');
    else texto(ctx, et, B.x + j * banda + banda / 2, B.y + B.h + 34 * u, fnt(400, m > 14 ? 17 * u : 21 * u, true), PALETA.piedraOscura, 'center');
  });
  ctx.restore();
}

// ── CARRERA (bar chart race con rangos que se deslizan) ─────────────────────────────────────────────────────
function carrera(env, capa) {
  const {ctx, u, t} = env;
  const tab = env.tablas[capa.datos], n = tab.x.length;
  const B = caja(env, capa, CAJA_DEF(env));
  const [t0, t1] = capa.t ?? [0.5, 10];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const f = prog(t, t0, t1, ease.lin) * (n - 1), i0 = Math.min(n - 2, Math.floor(f)), k = f - i0, ke = ease.io2(k);
  const top = capa.top ?? 8, S = tab.series.length;
  const rango = (i) => {
    const o = tab.series.map((s, q) => ({q, v: s.y[i] ?? -Infinity})).sort((a, b) => b.v - a.v || a.q - b.q);
    const r = new Array(S); o.forEach((e, p) => (r[e.q] = p)); return r;
  };
  const r0 = rango(i0), r1 = rango(i0 + 1);
  const vals = tab.series.map((s) => { const a = s.y[i0], b = s.y[i0 + 1]; return a == null && b == null ? null : lerp(a ?? b, b ?? a, k); });
  const vmax = Math.max(...vals.filter((v) => v != null)) * 1.04 || 1;
  const banda = B.h / top, bh = banda * 0.74;
  ctx.save(); ctx.globalAlpha = ap;
  const orden = tab.series.map((_, q) => q).filter((q) => vals[q] != null).sort((a, b) => lerp(r0[b], r1[b], ke) - lerp(r0[a], r1[a], ke));
  for (const q of orden) {
    const pos = lerp(r0[q], r1[q], ke); if (pos > top + 0.5) continue;
    const y = B.y + pos * banda + (banda - bh) / 2, w = Math.max(2, (vals[q] / vmax) * (B.w - 220 * u));
    const color = colorDe(tab.series[q].color, q);
    const alfa = clamp(top + 0.5 - pos, 0, 1);
    ctx.save(); ctx.globalAlpha *= alfa; ctx.shadowColor = color; ctx.shadowBlur = 14 * u;
    const g = ctx.createLinearGradient(B.x, 0, B.x + w, 0); g.addColorStop(0, rgba(color, 0.55)); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(B.x, y, w, bh); ctx.restore();
    texto(ctx, tab.series[q].nombre, B.x + 16 * u, y + bh / 2 + 8 * u, fnt(600, 26 * u), PALETA.fondo, 'left', 'alphabetic', alfa);
    texto(ctx, fmtNum(vals[q], tab.series[q].fmt), B.x + w + 14 * u, y + bh / 2 + 8 * u, fnt(500, 24 * u, true), PALETA.piedraClara, 'left', 'alphabetic', alfa);
  }
  const fecha = tab.tipoX === 'fecha' ? fmtFecha(lerp(tab.x[i0], tab.x[i0 + 1], k), capa.formatoX ?? 'mes') : String(tab.x[Math.round(f)]);
  texto(ctx, fecha, B.x + B.w, B.y + B.h - 6 * u, fnt(700, 96 * u), rgba(PALETA.piedra, 0.22), 'right');
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
  for (const v of ty) { ctx.strokeStyle = rgba(PALETA.piedra, 0.1); ctx.beginPath(); ctx.moveTo(B.x, Y(v)); ctx.lineTo(B.x + B.w, Y(v)); ctx.stroke(); texto(ctx, fmtNum(v, {decimales: decTicks(py_)}), B.x - 14 * u, Y(v) + 7 * u, fnt(400, 20 * u, true), PALETA.piedraOscura, 'right'); }
  const tx = ticksNum(xl, xh, 7), px_ = tx.length > 1 ? tx[1] - tx[0] : 1;
  for (const v of tx) { ctx.strokeStyle = rgba(PALETA.piedra, 0.07); ctx.beginPath(); ctx.moveTo(X(v), B.y); ctx.lineTo(X(v), B.y + B.h); ctx.stroke(); texto(ctx, fmtNum(v, {decimales: decTicks(px_)}), X(v), B.y + B.h + 34 * u, fnt(400, 20 * u, true), PALETA.piedraOscura, 'center'); }
  if (capa.etiquetaX) texto(ctx, capa.etiquetaX, B.x + B.w, B.y + B.h + 70 * u, fnt(500, 20 * u, true), PALETA.piedraOscura, 'right');
  if (capa.etiquetaY) texto(ctx, capa.etiquetaY.toUpperCase(), B.x, B.y - 26 * u, fnt(500, 20 * u, true), PALETA.piedraOscura, 'left');
  for (let i = 0; i < n; i++) {
    if (s.y[i] == null) continue;
    const ini = t0 + (i / n) * (t1 - t0) * 0.8, g = prog(t, ini, ini + 0.35, ease.outBack);
    if (g <= 0) continue;
    ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10 * u; ctx.fillStyle = rgba(color, 0.78);
    ctx.beginPath(); ctx.arc(X(tab.x[i]), Y(s.y[i]), 7 * u * g, 0, 7); ctx.fill(); ctx.restore();
  }
  const R = capa.regresion;
  if (R) {
    const w = prog(t, t1, t1 + 0.9, ease.io3);
    if (w > 0) {
      const xa = Math.max(xl, tab.x[0]), xb = lerp(xa, Math.min(xh, tab.x[n - 1]), w);
      ctx.save(); ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 3 * u; ctx.setLineDash([14 * u, 9 * u]);
      ctx.beginPath(); ctx.moveTo(X(xa), Y(R.m * xa + R.b)); ctx.lineTo(X(xb), Y(R.m * xb + R.b)); ctx.stroke(); ctx.restore();
      texto(ctx, `R² = ${fmtNum(R.r2, {decimales: 2})}  ·  n = ${R.n}`, B.x + B.w, B.y + 30 * u, fnt(600, 26 * u, true), PALETA.blanco, 'right', 'alphabetic', w);
    }
  }
  ctx.restore();
}

// ── MAPA DE CALOR / MATRIZ DE CORRELACIÓN (la matriz se calcula en la compilación) ────────────────────────────
function calor(env, capa) {
  const {ctx, u, t} = env;
  const M = capa.matriz; if (!M) return;
  const B = caja(env, capa, [0.2, 0.2, 0.6, 0.66]);
  const [t0, t1] = capa.t ?? [0.5, 3];
  const ap = aparece(env, capa, t0); if (ap <= 0) return;
  const m = M.etiquetas.length, side = Math.min(B.w, B.h) * 0.86, c = side / m;
  const ox = B.x + (B.w - side) / 2 + 40 * u, oy = B.y + (B.h - side) / 2 + 40 * u;
  const col = (v) => (v >= 0 ? mezcla(PALETA.tarjeta, PALETA.teal, v) : mezcla(PALETA.tarjeta, '#A24FB0', -v));
  ctx.save(); ctx.globalAlpha = ap;
  for (let i = 0; i < m; i++) {
    texto(ctx, M.etiquetas[i], ox - 14 * u, oy + i * c + c / 2 + 8 * u, fnt(600, 22 * u), PALETA.piedraClara, 'right');
    ctx.save(); ctx.translate(ox + i * c + c / 2, oy - 14 * u); ctx.rotate(-Math.PI / 5);
    texto(ctx, M.etiquetas[i], 0, 0, fnt(600, 22 * u), PALETA.piedraClara, 'left'); ctx.restore();
    for (let j = 0; j < m; j++) {
      const ini = t0 + ((Math.abs(i - j) + (i + j) * 0.15) / (m * 1.3)) * (t1 - t0), g = prog(t, ini, ini + 0.45, ease.outBack);
      if (g <= 0) continue;
      const v = M.valores[i][j];
      ctx.save(); ctx.translate(ox + j * c + c / 2, oy + i * c + c / 2); ctx.scale(g, g);
      ctx.fillStyle = col(v == null ? 0 : v); ctx.fillRect(-c / 2 + 2 * u, -c / 2 + 2 * u, c - 4 * u, c - 4 * u);
      texto(ctx, v == null ? '—' : fmtNum(v, {decimales: 2}), 0, 8 * u, fnt(600, Math.min(26 * u, c * 0.28), true), PALETA.blanco, 'center');
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
  const g = prog(t, t0, t0 + 0.6, ease.io3) * (1 - prog(t, t1, t1 + 0.3, ease.lin)); if (g <= 0) return;
  const color = colorDe(capa.color, 1);
  const xa = clamp(V.px(capa.x0), B.x, B.x + B.w), xb = clamp(V.px(capa.x1), B.x, B.x + B.w);
  if (xb - xa < 2) return;
  const w = (xb - xa);
  ctx.save(); ctx.globalAlpha *= V.ap;
  ctx.fillStyle = rgba(color, 0.13 * g); ctx.fillRect(xa, B.y, w * Math.min(1, g * 1.2), B.h);
  ctx.strokeStyle = rgba(color, 0.7 * g); ctx.lineWidth = 2 * u; ctx.setLineDash([10 * u, 8 * u]);
  ctx.beginPath(); ctx.moveTo(xa, B.y); ctx.lineTo(xa, B.y + B.h); ctx.moveTo(xb, B.y); ctx.lineTo(xb, B.y + B.h); ctx.stroke();
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
  const {ctx, u, W, H} = env, tam = (capa.tam ?? 60) * u, pos = capa.pos ?? (H > W ? [0.08, 0.085] : [0.065, 0.115]);
  ctx.font = fnt(800, tam);
  const w = ctx.measureText(capa.texto).width, x = pos[0] * W, y = pos[1] * H;
  return {x, y, w, tam, caja: [x - 6 * u, y - tam, x + w + 6 * u, y + 24 * u + (capa.sub ? 46 * u : 0)]};
}
function cajaContador(env, capa) {
  const {u, W, H} = env, vert = H > W;
  const pos = capa.pos ?? (vert ? [0.08, 0.215] : [0.935, 0.16]), al = capa.alinea ?? (vert ? 'left' : 'right');
  const x = pos[0] * W, y = pos[1] * H, compacto = capa.modo === 'compacto', ancho = (compacto ? 360 : 440) * u;
  const arriba = y - (compacto ? 30 : 96) * u, abajo = y + (compacto ? 84 : (capa.modo === 'fecha' ? 20 : 150)) * u;
  return {x, y, al, caja: al === 'right' ? [x - ancho, arriba, x, abajo] : [x, arriba, x + ancho, abajo]};
}
function cajaSello(env, capa) {
  const {ctx, u, W, H} = env;
  let txt = 'FUENTE · ' + capa.texto, px = 15 * u;
  ctx.font = fnt(500, px, true);
  while (ctx.measureText(txt).width > W * 0.87 && px > 11 * u) { px -= 0.5 * u; ctx.font = fnt(500, px, true); }
  while (ctx.measureText(txt).width > W * 0.87 && txt.length > 8) txt = txt.slice(0, -2);
  if (txt.length < ('FUENTE · ' + capa.texto).length) txt = txt.slice(0, -1) + '…';
  const w = ctx.measureText(txt).width, x = 0.065 * W;
  return {txt, px, x, y: H - 34 * u, caja: [x - 4 * u, H - 34 * u - px - 4 * u, x + w + 4 * u, H - 34 * u + 8 * u]};
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
  const lim = k < 1 ? {x0: B.x, x1: B.x + B.w, y0: B.y, y1: B.y + B.h + 4 * u} : {x0: 28 * u, x1: W - 28 * u, y0: 28 * u, y1: H - 70 * u};
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
  const fin = 1 - prog(t, t1, t1 + 0.3, ease.lin); if (fin <= 0) return;
  const P = [V.px(capa.x), V.py(capa.y, capa.serie ?? 0)];
  if (P[0] < B.x - 10 * u || P[0] > B.x + B.w + 10 * u || P[1] < B.y - 40 * u || P[1] > B.y + B.h + 40 * u) return;
  const color = colorDe(capa.color, capa.serie ?? 0), k = clamp(B.w / (0.62 * W), 0.62, 1);
  // contenido de la tarjeta: año grande · qué pasó (corto) · el dato. Nada más.
  const L = [];
  if (capa.anioTxt) L.push({s: capa.anioTxt, f: fnt(800, 60 * u * k, true), c: color, h: 64 * u * k});
  if (capa.texto) L.push({s: capa.texto, f: fnt(700, 34 * u * k), c: PALETA.blanco, h: 44 * u * k});
  if (capa.valorTxt && !capa.sinValor) L.push({s: capa.valorTxt, f: fnt(600, 28 * u * k, true), c: PALETA.piedraClara, h: 38 * u * k});
  if (capa.detalle) L.push({s: capa.detalle, f: fnt(500, 22 * u * k, true), c: PALETA.piedraOscura, h: 32 * u * k});
  const pad = 26 * u * k;
  let cw = 0; for (const l of L) { ctx.font = l.f; cw = Math.max(cw, ctx.measureText(l.s).width); }
  cw += pad * 2 + 8 * u * k;
  const ch = L.reduce((a, l) => a + l.h, 0) + pad * 1.5;
  const off = (capa._off ??= colocar(env, capa, cw, ch, k));
  let cx = P[0] + off[0], cy = P[1] + off[1];
  const lim = k < 1 ? {x0: B.x, x1: B.x + B.w, y0: B.y, y1: B.y + B.h + 4 * u} : {x0: 28 * u, x1: W - 28 * u, y0: 28 * u, y1: H - 70 * u};
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
  const {ctx, u, t} = env, V = env.vistas[capa.capa];
  const [, t1] = capa.t ?? [0, 99];
  // mientras una tarjeta está activa, la tarjeta lleva el año y el dato: el contador se aparta (una idea a la vez)
  let activa = 0;
  for (const l of env.capasTodas) if (l.tipo === 'llamada' && l.capa === capa.capa) activa = Math.max(activa, prog(t, l.t[0], l.t[0] + 0.2, ease.lin) * (1 - prog(t, l.t[1] + 0.3, l.t[1] + 0.55, ease.lin)));   // el contador vuelve cuando la tarjeta ya se ha ido del todo
  const g = H.ap * (1 - prog(t, t1, t1 + 0.3, ease.lin)) * (1 - activa); if (g <= 0.01) { reg(env, 'contador-oculto', [0, 0, 0, 0], capa.id); return; }
  const C = cajaContador(env, capa), {x, y, al} = C;
  ctx.save(); ctx.globalAlpha *= g;
  const fecha = V?.tab.tipoX === 'fecha';
  if (capa.modo === 'compacto') {
    texto(ctx, (capa.etiqueta ?? s.nombre).toUpperCase(), x, y, fnt(700, 22 * u, true), s.color, al);
    texto(ctx, fmtNum(s.valor, s.fmt), x, y + 44 * u, fnt(700, 36 * u, true), PALETA.blanco, al);
    const un = String(s.fmt?.unidad ?? '').match(/(([^)]+))/)?.[1] ?? s.fmt?.unidad;   // la unidad siempre acompaña al dato
    if (un) texto(ctx, String(un).toUpperCase(), x, y + 72 * u, fnt(500, 15 * u, true), PALETA.piedraOscura, al);
  } else {
    // el año manda: grande y en el color de la serie; debajo el dato y su unidad, en pequeño
    texto(ctx, fecha ? fmtFecha(H.xh, 'anio') : fmtNum(H.xh, {decimales: 0}), x, y, fnt(800, 96 * u, true), s.color, al);
    if (capa.modo !== 'fecha') {
      texto(ctx, fmtNum(s.valor, s.fmt), x, y + 74 * u, fnt(700, 46 * u, true), PALETA.blanco, al);
      if (s.fmt?.unidad) texto(ctx, String(s.fmt.unidad).toUpperCase(), x, y + 112 * u, fnt(500, 17 * u, true), PALETA.piedraOscura, al);
    }
  }
  ctx.restore();
  if (g > 0.3) reg(env, 'contador', C.caja, capa.id);
}

function titulo(env, capa) {
  const {ctx, u, t} = env;
  const [t0, t1] = capa.t ?? [0, 4];
  const sal = 1 - prog(t, t1, t1 + 0.4, ease.in2); if (t < t0 || sal <= 0) return;
  const T = cajaTitulo(env, capa), {x, y, w, tam} = T, color = colorDe(capa.color, 0);
  ctx.save(); ctx.globalAlpha *= sal;
  const p = prog(t, t0, t0 + 0.55, ease.io3);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 4 * u, y - tam, (w + 8 * u) * p, tam * 1.5); ctx.clip();
  texto(ctx, capa.texto, x, y, fnt(800, tam), PALETA.blanco); ctx.restore();
  if (p < 1) { ctx.fillStyle = color; ctx.fillRect(x + w * p, y - tam * 0.9, 12 * u, tam * 1.05); }
  const r = prog(t, t0 + 0.2, t0 + 0.9, ease.out3);
  ctx.fillStyle = color; ctx.fillRect(x, y + 16 * u, Math.min(w, 200 * u) * r, 4 * u);
  if (capa.sub) texto(ctx, capa.sub, x, y + 62 * u, fnt(500, (capa.tamSub ?? 24) * u), PALETA.piedraOscura, 'left', 'alphabetic', prog(t, t0 + 0.5, t0 + 1.0, ease.out3));
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
  const g = prog(t, t0, t0 + 0.5, ease.out3) * (1 - prog(t, t1, t1 + 0.4, ease.lin)); if (g <= 0) return;
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
  texto(ctx, S.txt, S.x, S.y, fnt(500, S.px, true), rgba(PALETA.piedraOscura, 0.6), 'left');
  ctx.restore();
  reg(env, 'sello', S.caja, null);
}

export const DIBUJO = {linea, barras, carrera, dispersion, calor, zona, llamada, contador, titulo, cortina, imagen, sello};
