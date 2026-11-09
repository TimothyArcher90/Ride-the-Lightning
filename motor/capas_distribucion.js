// Capas de DISTRIBUCIÓN (2026-11-09): enjambre (beeswarm de una tabla de países/empresas), cordillera (ridgeline: la distribución de una serie diaria año a año)
// y corriente (streamgraph: área apilada con línea base centrada). Código propio, escrito a partir de las descripciones abiertas de las técnicas
// (Byron & Wattenberg 2008 para la línea base «wiggle»; el histograma en polígono de frecuencias es clásico); no se copia código de terceros.
// Mismas reglas que capas_extra.js: funciones puras (env, capa) del instante env.t, ninguna cifra tecleada, escala SIEMPRE declarada en pantalla.
// Se importa solo desde capas_extra.js (que le exporta sus utilidades de dibujo); NO importar este archivo directamente (ciclo de módulos).
import {PALETA, clamp, lerp, ease, prog, rgba, fmtNum, fmtFecha, ticksNum, ticksFecha, etiquetaTick} from './nucleo.js';
import {CURVA} from './diseno.js';
import {colocar2D, hiloEtiqueta} from './etiquetas.js';
import {t as tr, registrar} from './idioma.js';
import {rot, tam, med, fN, nota, aparece, paleta, cajaDef, cortarA, pctl, marcasHasta, uni, acento_, separar, ent, acortarNombres} from './capas_extra.js';

registrar('cd', {
  enjambre: {es: 'UN PUNTO POR FILA; LA POSICIÓN HORIZONTAL ES EL VALOR{log}. LA ALTURA SOLO SEPARA PUNTOS Y NO SIGNIFICA NADA. PUNTEADA: MEDIANA DE {n} FILAS.{u}', en: 'ONE DOT PER ROW; HORIZONTAL POSITION IS THE VALUE{log}. HEIGHT ONLY SEPARATES DOTS AND MEANS NOTHING. DOTTED: MEDIAN OF {n} ROWS.{u}'},
  enj_log: {es: ' (ESCALA LOG: CADA MARCA ES ×10)', en: ' (LOG SCALE: EACH TICK IS ×10)'},
  mediana: {es: 'MEDIANA {v}', en: 'MEDIAN {v}'},
  cordillera: {es: 'CADA CRESTA: % DE LAS OBSERVACIONES DE ESE AÑO EN CADA UNO DE {nb} RANGOS DE VALORES (POLÍGONO DE FRECUENCIAS, SIN SUAVIZAR). MISMA ALTURA PARA TODAS LAS CRESTAS. MARCA BLANCA: MEDIANA DEL AÑO.{u}', en: 'EACH RIDGE: % OF THAT YEAR\'S OBSERVATIONS IN EACH OF {nb} VALUE RANGES (FREQUENCY POLYGON, NOT SMOOTHED). SAME HEIGHT SCALE FOR ALL RIDGES. WHITE MARK: THE YEAR\'S MEDIAN.{u}'},
  cord_om: {es: ' ÚLTIMOS {n} AÑOS.', en: ' LAST {n} YEARS.'},
  corriente: {es: 'EL GROSOR DE CADA FRANJA ES SU VALOR; LA LÍNEA BASE ESTÁ CENTRADA (NO PARTE DE 0), ASÍ QUE LA ALTURA SOBRE LA PANTALLA NO ES UN VALOR. LA BARRA DE ESCALA MIDE {v}.{u}', en: 'EACH BAND\'S THICKNESS IS ITS VALUE; THE BASELINE IS CENTERED (IT DOES NOT START AT 0), SO POSITION ON THE SCREEN IS NOT A VALUE. THE SCALE BAR MEASURES {v}.{u}'},
  escala: {es: 'ESCALA', en: 'SCALE'},
});
export const TIPOS_DISTRIB = ['enjambre', 'cordillera', 'corriente'];
export const DISTRIB_CLASE = {enjambre: 'categorias', cordillera: 'serie', corriente: 'serie'};

// ═══ ENJAMBRE (beeswarm) ═══════════════════════════════════════════════════════════════════════════════════════════
function armarEnjambre(capa, tab, env, B) {
  const {u} = env, items = tab.items.filter((i) => i.valor != null).map((i) => { const m = String(i.nombre).split(' · '); return {...i, codigo: m.length > 1 ? m[0].trim() : null, nombre: m.length > 1 ? m.slice(1).join(' · ').trim() : String(i.nombre)}; });
  const vals = items.map((i) => i.valor).sort((a, b) => a - b), mn = vals[0], mx = vals[vals.length - 1], log = capa.escala === 'log' || (capa.escala !== 'lin' && mn > 0 && mx / mn > 30);
  const f = (v) => (log ? Math.log10(v) : v), lo = log ? Math.floor(f(mn)) : Math.min(0, mn), hi = log ? Math.ceil(f(mx)) : mx * 1.04;
  const x0 = B.x + 14 * u, x1 = B.x + B.w - 14 * u, px = (v) => x0 + ((f(v) - lo) / (hi - lo || 1)) * (x1 - x0);
  const S = tam(env, 18), yAxis = B.y + B.h - S * 2.2, alto = (yAxis - B.y) * 0.8, yc = B.y + (yAxis - B.y) * 0.56;
  const orden = items.map((it, k) => ({it, x: px(it.valor), k})).sort((a, b) => a.x - b.x || a.k - b.k);
  let r = Math.min(tam(env, 26) * (env.H > env.W ? 0.5 : 0.8), alto / 4), pts = [];
  for (let intento = 0; intento < 16; intento++) {
    pts = []; let maxOff = 0;
    for (const o of orden) {
      let dy = 0;
      for (let q = 0; q < 400; q++) {
        dy = q === 0 ? 0 : (q % 2 ? 1 : -1) * Math.ceil(q / 2) * r * 0.3;
        if (pts.every((p) => Math.hypot(p.x - o.x, p.dy - dy) >= 2 * r + 1.5 * u)) break;
      }
      pts.push({...o, dy}); maxOff = Math.max(maxOff, Math.abs(dy));
    }
    if (maxOff + r <= alto / 2) break;
    r *= 0.88;
  }
  const s = [...vals], mediana = pctl(s, 0.5), ticks = log ? Array.from({length: hi - lo + 1}, (_, k) => Math.pow(10, lo + k)) : ticksNum(lo, hi, 5);
  const res = capa.resalta ? pts.find((p) => p.it.nombre === capa.resalta || p.it.codigo === capa.resalta) : null;
  const claves = new Set([pts[0], pts[pts.length - 1], ...(res ? [res] : [])]);   // etiquetados: el menor, el mayor y el resaltado (por valor, no por posición en pantalla)
  const porValor = [...pts].sort((a, b) => a.it.valor - b.it.valor); claves.clear(); [porValor[0], porValor[porValor.length - 1], ...(res ? [res] : [])].forEach((p) => claves.add(p));
  const etq = [...claves].map((p) => ({p, txt: `${p.it.codigo ?? p.it.nombre} ${fN(p.it.valor, tab.fmt)}`}));
  const its = etq.map((e) => ({x: e.p.x, y: yc + e.p.dy, w: med(env, e.txt, 20, 800) + 6 * u, h: tam(env, 20) * 1.3, r: r + 2 * u, pref: ['arr', 'arrDer', 'arrIzq', 'aba', 'abaDer', 'abaIzq']}));
  const sp = its.length ? colocar2D(its, {caja: [B.x, B.y, B.x + B.w, yAxis - 4 * u], puntos: pts.map((p) => [p.x, yc + p.dy, r + 3 * u]), gap: 6 * u}) : [];
  return {pts, r, yc, yAxis, px, ticks, log, mediana, res, etq, sp, n: pts.length, xm: px(mediana), lo, hi, x0, x1};
}
function enjambre(env, capa) {
  const {ctx, u, t} = env, tab = env.tablas[capa.datos], B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._ej ??= armarEnjambre(capa, tab, env, B)), id = capa.id ?? 'enjambre', acento = acento_(capa), S = tam(env, 18), p = prog(t, t0, t1, CURVA.trazo) * (L.n + 3);
  nota(env, B, capa.nota ?? tr('cd.enjambre', {log: L.log ? tr('cd.enj_log') : '', n: L.n, u: uni(tab.fmt)}), id, ap);
  ctx.save(); ctx.globalAlpha *= ap;
  ctx.strokeStyle = rgba(PALETA.piedra, 0.3); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(L.x0, L.yAxis); ctx.lineTo(L.x1, L.yAxis); ctx.stroke();
  L.ticks.forEach((v) => { const x = L.px(v); if (x < L.x0 - 1 || x > L.x1 + 1) return; ctx.strokeStyle = rgba(PALETA.piedra, 0.08); ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(x, B.y + 6 * u); ctx.lineTo(x, L.yAxis); ctx.stroke(); (() => { const lb = fN(v, {...tab.fmt, prefijo: tab.fmt?.prefijo ?? '', unidad: undefined, decimales: v >= 1 || v === 0 ? 0 : 2}), hw = med(env, lb, 18, 500, true) / 2; rot(env, lb, clamp(x, L.x0 + hw, L.x1 - hw), L.yAxis + S * 1.45, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${id}:x${v}`, {mono: true, tipo: 'eje-x'}); })(); });
  if (p > L.n * 0.4) { const a = clamp((p - L.n * 0.4) / 2); ctx.strokeStyle = rgba(PALETA.piedraClara, 0.7 * a); ctx.setLineDash([5 * u, 6 * u]); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(L.xm, B.y + S * 1.6); ctx.lineTo(L.xm, L.yAxis); ctx.stroke(); ctx.setLineDash([]); }
  L.pts.forEach((q, i) => { const e = ease.out3(clamp(p - i)); if (e <= 0) return; const esRes = q === L.res; ctx.globalAlpha = ap * e; ctx.fillStyle = esRes ? acento : rgba(PALETA.piedraClara, 0.82); ctx.beginPath(); ctx.arc(q.x, L.yc + q.dy, L.r * (0.4 + 0.6 * e), 0, 7); ctx.fill(); if (esRes) { ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 2.5 * u; ctx.stroke(); } });
  ctx.globalAlpha = ap;
  const fin = clamp(p - L.n);
  if (fin > 0) {
    L.etq.forEach((e, k) => { const s = L.sp[k], esRes = e.p === L.res; if (s.hilo) { const [h1, h2, h3, h4] = hiloEtiqueta({x: e.p.x, y: L.yc + e.p.dy, r: L.r}, s); ctx.strokeStyle = rgba(esRes ? acento : PALETA.piedraClara, 0.7 * fin); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(h1, h2); ctx.lineTo(h3, h4); ctx.stroke(); } rot(env, e.txt, s.x + 3 * u, s.y + tam(env, 20) * 0.95, 20, 800, esRes ? acento : PALETA.blanco, 'left', `${id}:l${k}`, {mono: false, alpha: fin}); });
    if (fin > 0.3) rot(env, tr('cd.mediana', {v: fN(L.mediana, tab.fmt)}), clamp(L.xm, L.x0 + 90 * u, L.x1 - 90 * u), B.y + S * 1.1, 18, 700, rgba(PALETA.piedraClara, 0.95), 'center', `${id}:med`, {alpha: clamp((fin - 0.3) / 0.7)});
  }
  ctx.restore();
}

// ═══ CORDILLERA (ridgeline) ════════════════════════════════════════════════════════════════════════════════════════
function armarCordillera(capa, tab) {
  const s = tab.series[capa.series?.[0] ?? 0], g = new Map();
  tab.x.forEach((x, i) => { if (s.y[i] == null) return; const k = fmtFecha(x, 'anio'); if (!g.has(k)) g.set(k, []); g.get(k).push(s.y[i]); });
  const todas = [...g.keys()].filter((k) => g.get(k).length >= (capa.minObs ?? 20)).sort(), maxF = capa.maxFilas ?? 12, keys = todas.slice(-maxF), omitidas = todas.length - keys.length;
  const todo = keys.flatMap((k) => g.get(k)), lo = Math.min(...todo), hi = Math.max(...todo), nb = capa.bins ?? 40, paso = (hi - lo) / nb || 1;
  const filas = keys.map((k) => { const v = g.get(k), cnt = Array(nb).fill(0); v.forEach((q) => { cnt[Math.min(nb - 1, Math.floor((q - lo) / paso))]++; }); return {k, n: v.length, share: cnt.map((c) => (c / v.length) * 100), mediana: pctl([...v].sort((a, b) => a - b), 0.5)}; });
  return {filas, lo, hi, nb, paso, dmax: Math.max(...filas.flatMap((f) => f.share)), omitidas, fmt: s.fmt};
}
function cordillera(env, capa) {
  const {ctx, u, t} = env, tab = env.tablas[capa.datos], B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._cr ??= armarCordillera(capa, tab)), id = capa.id ?? 'cordillera', n = L.filas.length, S = tam(env, 18), N = tam(env, 24), acento = acento_(capa), fmt = tab.series[capa.series?.[0] ?? 0].fmt;
  const wL = Math.max(...L.filas.map((f) => med(env, f.k, 24, 800, true))) + 16 * u, x0 = B.x + wL, x1 = B.x + B.w - 10 * u, px = (v) => x0 + ((v - L.lo) / (L.hi - L.lo || 1)) * (x1 - x0);
  const yAx = B.y + B.h - S * 1.6, ySup = B.y + N * 1.2, fila = (yAx - ySup) / n, alto = Math.min(fila * 2.8, (yAx - ySup) * 0.4 + fila * 0.6), p = prog(t, t0, t1, CURVA.trazo) * n;
  nota(env, B, capa.nota ?? tr('cd.cordillera', {nb: L.nb, u: uni(fmt)}) + (L.omitidas > 0 ? tr('cd.cord_om', {n}) : ''), id, ap);
  ctx.save(); ctx.globalAlpha *= ap;
  ticksNum(L.lo, L.hi, 5).forEach((v) => { const x = px(v); if (x < x0 - 1 || x > x1 + 1) return; ctx.strokeStyle = rgba(PALETA.piedra, 0.08); ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(x, ySup - N * 0.4); ctx.lineTo(x, yAx); ctx.stroke(); (() => { const lb = fN(v, {...fmt, unidad: undefined}), hw = med(env, lb, 18, 500, true) / 2; rot(env, lb, clamp(x, x0 + hw, x1 - hw), yAx + S * 1.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${id}:x${v}`, {mono: true, tipo: 'eje-x'}); })(); });
  L.filas.forEach((f, i) => {
    const a = clamp(p - i), e = ease.out3(a); if (a <= 0) return; const yb = ySup + (i + 1) * fila, ultima = i === n - 1;
    ctx.globalAlpha = ap * e; ctx.beginPath(); ctx.moveTo(px(L.lo), yb);
    f.share.forEach((sh, k) => ctx.lineTo(px(L.lo + (k + 0.5) * L.paso), yb - (sh / L.dmax) * alto * e)); ctx.lineTo(px(L.hi), yb); ctx.closePath();
    ctx.fillStyle = rgba(acento, ultima ? 0.92 : 0.55); ctx.fill(); ctx.strokeStyle = ultima ? PALETA.blanco : rgba(acento, 1); ctx.lineWidth = (ultima ? 2.4 : 1.6) * u; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = rgba(PALETA.piedra, 0.3); ctx.lineWidth = u; ctx.beginPath(); ctx.moveTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(px(f.mediana), yb); ctx.lineTo(px(f.mediana), yb - Math.min(alto * 0.5, fila * 0.55)); ctx.stroke();
    ctx.globalAlpha = ap;
    rot(env, f.k, x0 - 10 * u, yb - 2 * u, 24, 800, ultima ? PALETA.blanco : PALETA.piedraClara, 'right', `${id}:y${i}`, {mono: true, alpha: e});
  });
  ctx.restore();
}

// ═══ CORRIENTE (streamgraph) ═══════════════════════════════════════════════════════════════════════════════════════
/** Orden «de dentro afuera»: las series con el pico más tardío van al exterior y las de pico central al centro; cada una se añade al lado (arriba/abajo) de menor suma. */
function ordenCorriente(vals) {
  const pico = vals.map((v) => v.indexOf(Math.max(...v))), tot = vals.map((v) => v.reduce((a, b) => a + b, 0)), idx = vals.map((_, i) => i).sort((a, b) => pico[a] - pico[b] || a - b);
  const arriba = [], abajo = []; let sa = 0, sb = 0;
  idx.forEach((i) => { if (sa < sb) { sa += tot[i]; arriba.push(i); } else { sb += tot[i]; abajo.push(i); } });
  return [...abajo.reverse(), ...arriba];
}
function armarCorriente(capa, tab) {
  const idx = capa.series ?? tab.series.map((_, i) => i), filas = [];
  tab.x.forEach((x, i) => { if (idx.every((si) => tab.series[si].y[i] != null)) filas.push(i); });
  const vals = idx.map((si) => filas.map((i) => tab.series[si].y[i])), orden = ordenCorriente(vals), n = orden.length, m = filas.length;
  // línea base «wiggle» (Byron & Wattenberg): su pendiente es −Σ_i (f_i'/2 + Σ_{k<i} f_k')·f_i / Σ f_i, con las series apiladas en `orden` de abajo a arriba
  const g0 = new Array(m).fill(0), tot = filas.map((_, r) => orden.reduce((a, j) => a + vals[j][r], 0));
  for (let r = 1; r < m; r++) {
    let s1 = 0, s2 = 0;
    orden.forEach((j, q) => { const f = vals[j][r], d = vals[j][r] - vals[j][r - 1]; let s3 = d / 2; for (let k = 0; k < q; k++) s3 += vals[orden[k]][r] - vals[orden[k]][r - 1]; s1 += f; s2 += s3 * f; });
    g0[r] = g0[r - 1] - (s1 ? s2 / s1 : 0);
  }
  const bajo = g0.map((g) => g), arriba = g0.map((g, r) => g + tot[r]), cen = (Math.min(...bajo) + Math.max(...arriba)) / 2;
  const b = g0.map((g) => g - cen), amp = Math.max(...b.map((g, r) => Math.max(Math.abs(g), Math.abs(g + tot[r]))));
  return {idx, filas, orden, vals, tot, base: b, amp, nom: acortarNombres(idx.map((si) => tab.series[si].nombre)), n, m};
}
function corriente(env, capa) {
  const {ctx, u, t} = env, tab = env.tablas[capa.datos], B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._co ??= armarCorriente(capa, tab)), id = capa.id ?? 'corriente', pal = paleta(), fmt = tab.series[L.idx[0]].fmt, S = tam(env, 18), lh = tam(env, 26) * 1.15 + S * 1.15;
  const mx = Math.max(...L.tot), sb = marcasHasta(mx / 2, 4).ticks[1] ?? mx / 4, txtSb = fN(sb, {...fmt, prefijo: fmt?.prefijo ?? '', unidad: undefined});
  const wLab = Math.min(B.w * 0.45, Math.max(...L.nom.map((q) => med(env, q, 26, 700))) + 34 * u), wSb = med(env, txtSb, 18, 800, true) + 34 * u;
  const x0 = B.x + wSb, x1 = B.x + B.w - wLab - 16 * u, y0 = B.y + S * 1.3, y1 = B.y + B.h - S * 2.6, yc = (y0 + y1) / 2, k = ((y1 - y0) / 2) / L.amp;
  const xa = tab.x[L.filas[0]], xb = tab.x[L.filas[L.m - 1]], px = (x) => x0 + ((x - xa) / (xb - xa)) * (x1 - x0), py = (v) => yc - v * k, reveal = prog(t, t0, t1, CURVA.trazo), xh = lerp(xa, xb, reveal);
  nota(env, B, capa.nota ?? tr('cd.corriente', {v: `${txtSb}${fmt?.unidad ? ' ' + String(fmt.unidad).toUpperCase() : ''}`, u: ''}), id, ap);
  ctx.save(); ctx.globalAlpha *= ap;
  const cum = (r, q) => { let v = L.base[r]; for (let z = 0; z < q; z++) v += L.vals[L.orden[z]][r]; return v; };
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 1, y0 - 4 * u, (x1 - x0) * reveal + 1, y1 - y0 + 8 * u); ctx.clip();
  for (let q = 0; q < L.n; q++) {
    ctx.beginPath();
    for (let r = 0; r < L.m; r++) { const x = px(tab.x[L.filas[r]]), y = py(cum(r, q + 1)); r ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let r = L.m - 1; r >= 0; r--) ctx.lineTo(px(tab.x[L.filas[r]]), py(cum(r, q)));
    ctx.closePath(); ctx.fillStyle = rgba(pal[L.orden[q] % pal.length], 0.9); ctx.fill(); ctx.strokeStyle = rgba(PALETA.fondo, 0.9); ctx.lineWidth = 1.2 * u; ctx.stroke();
  }
  ctx.restore();
  // barra de escala: una longitud vertical que vale `sb` (la única lectura de magnitud, porque la línea base no es 0)
  const hSb = sb * k, xs = B.x + 12 * u; ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(xs, yc - hSb / 2); ctx.lineTo(xs, yc + hSb / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xs - 5 * u, yc - hSb / 2); ctx.lineTo(xs + 5 * u, yc - hSb / 2); ctx.moveTo(xs - 5 * u, yc + hSb / 2); ctx.lineTo(xs + 5 * u, yc + hSb / 2); ctx.stroke();
  rot(env, txtSb, xs + 12 * u, yc + S * 0.35, 18, 800, PALETA.blanco, 'left', `${id}:escala`, {mono: true});
  const fecha = tab.tipoX === 'fecha', tf = fecha ? ticksFecha(xa, xb, Math.max(2, Math.floor((x1 - x0) / (S * 4.6)))) : {ticks: ticksNum(xa, xb, Math.max(2, Math.min(5, Math.floor((x1 - x0) / (S * 4.6)))) ), unidad: 'y'};
  tf.ticks.forEach((tk) => { const lb = fecha ? etiquetaTick(tk, tf.unidad) : fN(tk, {decimales: 0}), hw = med(env, lb, 18, 500, true) / 2; rot(env, lb, clamp(px(tk), x0 + hw, x1 - hw), y1 + S * 1.6, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${id}:x${tk}`, {mono: true, tipo: 'eje-x'}); });
  let rr = 0; for (let r = 0; r < L.m; r++) if (tab.x[L.filas[r]] <= xh + 1e-9) rr = r;
  const ys = L.orden.map((j, q) => py((cum(rr, q) + cum(rr, q + 1)) / 2)), pos = separar(ys, lh, y0 + lh * 0.5, y1 - lh * 0.5);
  L.orden.forEach((j, q) => { const col = pal[j % pal.length], lx = x1 + 16 * u, g = ent(env, t0 + 0.5, q, L.n), s = tab.series[L.idx[j]];
    ctx.fillStyle = col; ctx.globalAlpha = ap * g; ctx.fillRect(lx, pos[q] - lh * 0.4, 8 * u, lh * 0.8); ctx.globalAlpha = ap;
    rot(env, cortarA(env, L.nom[j], wLab - 26 * u, 26, 700), lx + 18 * u, pos[q] - tam(env, 26) * 0.05, 26, 700, PALETA.blanco, 'left', `${id}:n${j}`, {alpha: g});
    rot(env, fN(L.vals[j][rr], s.fmt), lx + 18 * u, pos[q] + S * 1.25, 18, 800, col, 'left', `${id}:v${j}`, {mono: true, alpha: g}); });
  ctx.restore();
}
export const CAPAS_DISTRIB = {enjambre, cordillera, corriente};

// ═══ VALIDACIÓN (la llama validarExtra) ════════════════════════════════════════════════════════════════════════════
export function validarDistrib(capa, tab, donde) {
  const e = [], a = [], m = [], c = [], idx = capa.series ?? tab.series?.map((_, i) => i) ?? [];
  switch (capa.tipo) {
    case 'enjambre': {
      if (tab.items.length < 8) e.push(`${donde}: el enjambre necesita al menos 8 filas para ser una distribución (hay ${tab.items.length}).`);
      if (capa.escala === 'log' && tab.items.some((i) => !(i.valor > 0))) e.push(`${donde}: la escala logarítmica no admite valores ≤ 0.`);
      if (capa.resalta && !tab.items.some((i) => i.nombre === capa.resalta || String(i.nombre).startsWith(capa.resalta + ' · '))) a.push(`${donde}: «${capa.resalta}» no está en los datos; no se resalta nada.`);
      m.push(`${donde}: un punto por fila; posición horizontal = valor (logarítmica si el mayor supera 30 veces el menor, y se declara). La posición vertical solo separa puntos y no significa nada; se declara. Se etiquetan el menor, el mayor y el resaltado.`);
      break;
    }
    case 'cordillera': {
      const L = armarCordillera(capa, tab);
      if (tab.tipoX !== 'fecha') e.push(`${donde}: la cordillera agrupa por año y necesita datos con fecha.`);
      else if (L.filas.length < 3) e.push(`${donde}: hacen falta al menos 3 años con ${capa.minObs ?? 20} o más observaciones (hay ${L.filas.length}).`);
      else m.push(`${donde}: para cada uno de los últimos ${L.filas.length} años, polígono de frecuencias de ${L.nb} rangos iguales entre el mínimo y el máximo de lo mostrado; altura = % de las observaciones de ese año, con la misma escala para todos (sin suavizado). Marca blanca = mediana exacta del año.`);
      if (L.omitidas > 0) a.push(`${donde}: se muestran los últimos ${L.filas.length} años de ${L.filas.length + L.omitidas}.`);
      if (idx.length > 1) a.push(`${donde}: la cordillera usa una sola serie; se usa la primera.`);
      break;
    }
    case 'corriente': {
      if (idx.length < 3 || idx.length > 8) e.push(`${donde}: la corriente necesita de 3 a 8 series (hay ${idx.length}).`);
      const un = new Set(idx.map((si) => tab.series[si]?.fmt?.unidad ?? '')); if (un.size > 1) e.push(`${donde}: las series tienen unidades distintas (${[...un].join(' / ')}): solo se pueden apilar magnitudes de la misma unidad.`);
      let filas = 0, neg = false; tab.x.forEach((x, i) => { if (idx.every((si) => tab.series[si]?.y[i] != null)) { filas++; if (idx.some((si) => tab.series[si].y[i] < 0)) neg = true; } });
      if (neg) e.push(`${donde}: hay valores negativos; una corriente solo representa partes positivas de un total.`);
      if (filas < 6) e.push(`${donde}: solo ${filas} momentos tienen todas las series con dato.`); else if (filas < tab.x.length) a.push(`${donde}: se usan ${filas} de ${tab.x.length} momentos (solo aquellos en que TODAS las series tienen dato).`);
      m.push(`${donde}: área apilada con línea base «wiggle» (centrada, Byron & Wattenberg 2008): el grosor de cada franja es su valor exacto, pero la posición vertical no es un valor; una barra de escala lo declara. Orden de dentro afuera según el momento del pico de cada serie.`);
      break;
    }
    default: break;
  }
  return {errores: e, avisos: a, metodos: m, cifras: c};
}
