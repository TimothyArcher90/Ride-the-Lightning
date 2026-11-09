// Capas extra del VISUALIZADOR UNIVERSAL (2026-11-04): radar, área apilada (absoluta y 100 %), velas, histograma, dumbbell,
// calendario de calor, barras agrupadas, bullet, serie con bandas, pictograma y ranking con código (ISO/ticker) sin banderas.
// Mismas reglas que capas.js: cada capa es una función pura (env, capa) del instante env.t; NINGUNA cifra se teclea: todo sale de
// las filas de los datos o es una cuenta exacta sobre ellas, y la escala de cada gráfica se DECLARA en pantalla (nota arriba).
// Tipografía: tamaños base de 1080 px de lado corto que pasan por el piso del sistema de diseño (motor/diseno.js).
import {colorDivergente} from './escalas.js';
import {PALETA, COLOR, TEMA, clamp, lerp, ease, prog, colorDe, mezcla, rgba, fmtNum, fmtSigno, fmtPct, fmtFecha, ticksNum, ticksFecha, etiquetaTick} from './nucleo.js';
import {escalarFuente, fuenteCss, margenes, ZONA, envolver, envolverPalabras, contraste, legible, CURVA, entrada as entradaDiseno} from './diseno.js';
import {envolverEntero, relajar1D} from './etiquetas.js';
import {t as tr, registrar, idioma, MESES_CORTO} from './idioma.js';
import {CAPAS_DISTRIB, TIPOS_DISTRIB, DISTRIB_CLASE, validarDistrib} from './capas_distribucion.js';   // ciclo de módulos a propósito: ese archivo solo se importa desde aquí   // «tr»: en las capas «t» es el tiempo

// Textos dibujados por los modelos del visualizador universal (es = original, en = versión inglesa). Se leen con tr('ce.clave', {vars}).
registrar('ce', {
  radar_tabla: {es: 'Todos los ejes usan la misma escala: de 0 a {esc}.{ant}', en: 'All axes share one scale: from 0 to {esc}.{ant}'},
  radar_ant: {es: ' Línea punteada: valor anterior.', en: ' Dotted line: previous value.'},
  radar_serie: {es: 'Cada eje va de 0 (mínimo histórico de esa serie) a 100 (su máximo). El punto es el último dato.', en: "Each axis runs from 0 (that series' historical low) to 100 (its high). The dot is the latest value."},
  uni: {es: ' Unidad: {u}.', en: ' Unit: {u}.'},
  apilada_pct: {es: 'Cada franja es su % del total en ese momento; siempre suman 100 %.', en: 'Each band is its % of the total at that moment; they always add up to 100%.'},
  apilada_abs: {es: 'Las franjas se apilan: la altura total es la suma de todas, desde 0.', en: 'Bands are stacked: total height is the sum of all, starting at 0.'},
  u_dia: {es: 'DÍA', en: 'DAY'}, u_semana: {es: 'SEMANA', en: 'WEEK'}, u_mes: {es: 'MES', en: 'MONTH'}, u_trimestre: {es: 'TRIMESTRE', en: 'QUARTER'}, u_anio: {es: 'AÑO', en: 'YEAR'},
  velas_real: {es: 'Cada vela = 1 {un}. Verde: cierra sobre su apertura; roja: bajo ella.{log}', en: 'Each candle = 1 {un}. Green: closes above its open; red: below.{log}'},
  velas_log_real: {es: ' Escala log: la altura mide el cambio %.', en: ' Log scale: height tracks % change.'},
  velas_cierres: {es: 'Cada vela = 1 {un} de cierres diarios; las mechas son el mayor y el menor cierre, no los extremos del día.{log}', en: 'Each candle = 1 {un} of daily closes; wicks are the highest and lowest close, not intraday extremes.{log}'},
  velas_log: {es: ' Escala logarítmica.', en: ' Logarithmic scale.'},
  velas_o: {es: 'ABRE', en: 'OPEN'}, velas_h: {es: 'MÁXIMO', en: 'HIGH'}, velas_l: {es: 'MÍNIMO', en: 'LOW'}, velas_c: {es: 'CIERRA', en: 'CLOSE'},
  velas_o2: {es: 'PRIMER CIERRE', en: 'FIRST CLOSE'}, velas_h2: {es: 'MAYOR CIERRE', en: 'HIGHEST CLOSE'}, velas_l2: {es: 'MENOR CIERRE', en: 'LOWEST CLOSE'}, velas_c2: {es: 'ÚLTIMO CIERRE', en: 'LAST CLOSE'},
  f_diarios: {es: 'diarios', en: 'daily'}, f_semanales: {es: 'semanales', en: 'weekly'}, f_mensuales: {es: 'mensuales', en: 'monthly'}, f_trimestrales: {es: 'trimestrales', en: 'quarterly'}, f_anuales: {es: 'anuales', en: 'yearly'},
  hist_ret: {es: 'Cada barra: % de los {n} retornos {per} que caen en ese rango.{col}', en: 'Each bar: % of the {n} {per} returns that fall in that range.{col}'},
  hist_col: {es: ' Las barras de los extremos agrupan las colas.', en: ' The end bars group the tails.'},
  hist_niv: {es: 'Cada barra: % de las {n} observaciones en ese rango. Eje Y: % del total.', en: 'Each bar: % of the {n} observations in that range. Y axis: % of total.'},
  mediana: {es: 'MEDIANA {v}', en: 'MEDIAN {v}'},
  ultimo_pct: {es: 'ÚLTIMO {v} · SUPERA AL {p} %', en: 'LATEST {v} · ABOVE {p}% OF VALUES'},
  antes: {es: 'ANTES', en: 'BEFORE'}, ahora: {es: 'AHORA', en: 'NOW'},
  dumbbell: {es: 'Cada fila une «{l0}» (gris) con «{l1}» (color), misma escala{cero}. Verde: subió; rojo: bajó.{u}', en: 'Each row joins "{l0}" (gray) with "{l1}" (color), same scale{cero}. Green: rose; red: fell.{u}'},
  dumbbell_cero: {es: ', desde 0', en: ', from 0'},
  cal_ultimos: {es: ' Últimos {a} de {b} años.', en: ' Last {a} of {b} years.'},
  cal_mes_vert: {es: 'Retorno de cada mes: cierre ÷ cierre del mes previo − 1. Color pleno desde ±{lim} %.{aviso}{parcial}', en: "Each month's return: close ÷ previous month's close − 1. Full color from ±{lim}%.{aviso}{parcial}"},
  cal_mes: {es: 'Cada casilla: retorno del mes (último cierre ÷ último cierre del mes anterior − 1). Color pleno desde ±{lim} %.{aviso}{parcial}', en: "Each cell: the month's return (last close ÷ previous month's last close − 1). Full color from ±{lim}%.{aviso}{parcial}"},
  cal_parcial: {es: ' Último mes incompleto.', en: ' Latest month incomplete.'},
  cal_dia: {es: 'Cada cuadro es un día; color = retorno frente al cierre anterior. Color pleno desde ±{lim} %. Columnas = semanas.', en: 'Each square is a day; color = return vs. the previous close. Full color from ±{lim}%. Columns = weeks.'},
  agrupadas: {es: 'Barras proporcionales al valor, todas en la misma escala desde 0. Cada color es un momento.', en: 'Bars proportional to the value, all on one scale from 0. Each color is a point in time.'},
  meta: {es: 'META', en: 'TARGET'}, promedio: {es: 'PROMEDIO', en: 'AVERAGE'}, max_hist: {es: 'MÁXIMO HISTÓRICO', en: 'HISTORICAL HIGH'}, min_hist: {es: 'MÍNIMO HISTÓRICO', en: 'HISTORICAL LOW'}, mediana_n: {es: 'MEDIANA', en: 'MEDIAN'},
  bullet: {es: 'Barra: último dato. Fondo: historia en tres tramos (mín–P25–P75–máx). Raya blanca: la meta. Escala desde 0.', en: 'Bar: latest value. Background: history in three ranges (low–P25–P75–high). White line: the target. Scale from 0.'},
  bandas: {es: 'Banda clara: mín–máx de cada mes ({desde}–{hasta}); oscura: percentiles 25–75; punteada: mediana. Color: {anio}, dato real.{u}', en: 'Light band: monthly low–high ({desde}–{hasta}); dark: 25th–75th percentile; dotted: median. Color: {anio}, actual data.{u}'},
  picto: {es: 'Cada cuadro = {un}; los incompletos son fracciones exactas. % = valor ÷ suma de las partes.{om}', en: 'Each square = {un}; partial ones are exact fractions. % = value ÷ sum of all parts.{om}'},
  picto_om: {es: ' Se muestran las {n} mayores de {m}.', en: ' Showing the {n} largest of {m}.'},
  ranking: {es: 'Orden de mayor a menor; la barra es proporcional al valor{cero}.{om}', en: 'Sorted largest to smallest; bar length is proportional to the value{cero}.{om}'},
  ranking_cero: {es: ' y arranca en 0', en: ' and starts at 0'},
  ranking_om: {es: ' Se muestran {n} de {m}.', en: ' Showing {n} of {m}.'},
});
// Textos del modelo «dos hitos» (dos_hitos). Todo lo que se dibuja pasa por tr('ch.clave', {vars}).
registrar('ch', {
  nota: {es: 'Cada hito rebasa la serie a 100 en su fecha y las dos se alinean por sesiones desde el hito.{log}', en: 'Each milestone rebases the series to 100 on its date; both are aligned by sessions since the milestone.{log}'},
  nota_log: {es: ' Escala log.', en: ' Log scale.'},
  panel_crec: {es: 'CRECIMIENTO, BASE 100', en: 'GROWTH, BASE 100'},
  panel_caida: {es: 'CAÍDA DESDE EL MÁXIMO', en: 'DRAWDOWN FROM PEAK'},
  sesion: {es: 'SESIÓN', en: 'SESSION'},
  eje_x: {es: 'SESIONES DESDE EL HITO', en: 'SESSIONS SINCE THE MILESTONE'},
  sin_proy: {es: '{nombre} TERMINA EN LA SESIÓN {n}. SIN PROYECCIÓN.', en: '{nombre} ENDS AT SESSION {n}. NO PROJECTION.'},
  sin_proy_corto: {es: 'SIN PROYECCIÓN', en: 'NO PROJECTION'},
  pico: {es: 'MÁXIMO {v}', en: 'PEAK {v}'},
  suelo: {es: 'SUELO {v}', en: 'TROUGH {v}'},
  retorno: {es: 'Retorno', en: 'Return'},
  caida_hoy: {es: 'Caída hoy', en: 'Drawdown now'},
  peor_caida: {es: 'Peor caída', en: 'Worst drawdown'},
  kpi_peor: {es: 'PEOR CAÍDA {v}', en: 'WORST DRAWDOWN {v}'},
  aviso: {es: 'Comparación histórica, no una proyección.', en: 'Historical comparison, not a forecast.'},
  hito_n: {es: 'Hito {n}', en: 'Milestone {n}'},
});
const mes3 = () => MESES_CORTO[idioma()];

export const TIPOS_EXTRA = ['radar', 'apilada', 'velas', 'histograma', 'dumbbell', 'calendario', 'agrupadas', 'bullet', 'bandas', 'pictograma', 'ranking', 'dos_hitos', ...TIPOS_DISTRIB];
/** Qué clase de dato consume cada capa: serie de tiempo, tabla de categorías, o ambas. */
export const EXTRA_CLASE = {radar: 'ambas', apilada: 'serie', velas: 'serie', histograma: 'serie', dumbbell: 'ambas', calendario: 'serie', agrupadas: 'serie', bullet: 'serie', bandas: 'serie', pictograma: 'categorias', ranking: 'categorias', dos_hitos: 'serie', ...DISTRIB_CLASE};

// ── utilidades ─────────────────────────────────────────────────────────────────────────────────────────────────
/** fmtNum que escribe el cero como «0» (con 'auto' daba «0,000000») y no deja que un valor casi nulo salga como «−0,0». */
export const fN = (v, f = {}) => { if (v === 0 || (typeof f.decimales === 'number' && Math.abs(v) < Math.pow(10, -f.decimales) / 2)) return fmtNum(0, {...f, decimales: 0}); return fmtNum(v, f); };
export const tam = (env, base) => escalarFuente(base) * env.u;                      // tamaño final en px de un rol (con piso de legibilidad)
const F = (env, peso, base, mono = false) => fuenteCss(peso, tam(env, base), mono);
export const aparece = (env, capa, t0) => prog(env.t, (capa.aparece ?? t0 - 0.5), (capa.aparece ?? t0 - 0.5) + 0.5, ease.out3);
export const paleta = () => [TEMA.nombre === 'harris' ? COLOR.amarillo : COLOR.oro, COLOR.teal, COLOR.purpura, COLOR.verde, COLOR.rojo, PALETA.piedra, COLOR.amarillo, COLOR.rosa];
export const pctl = (s, p) => { if (!s.length) return null; const i = (s.length - 1) * p, a = Math.floor(i), b = Math.ceil(i); return s[a] + (s[b] - s[a]) * (i - a); };
const pasoMediano = (x) => { const d = []; for (let k = 1; k < x.length; k++) d.push(x[k] - x[k - 1]); d.sort((a, b) => a - b); return d[Math.floor(d.length / 2)] || 1; };
export const DIA = 86400000;
export const cajaDef = (env, capa) => {
  if (capa.caja) { const c = capa.caja; return {x: c[0] * env.W, y: c[1] * env.H, w: c[2] * env.W, h: c[3] * env.H}; }
  const m = margenes(env); return {x: m.x0, y: m.y0, w: m.x1 - m.x0, h: m.y1 - m.y0};
};
export const decDe = (paso) => (paso >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(paso) - 1e-9)));
export const pTxt = (x, dec = 1) => fN(x, {decimales: dec, sufijo: ' %'});
const pSigno = (x, dec = 1) => fmtSigno(x, {decimales: dec, sufijo: ' %'});
/** Cuántos decimales para un porcentaje: 1 si es pequeño, 0 si es grande (nunca «0 %» para algo que no es cero). */
const decPct = (x) => (Math.abs(x) < 10 ? 1 : 0);
const frecuencia = (pasoMs) => tr(pasoMs <= 4 * DIA ? 'ce.f_diarios' : pasoMs <= 10 * DIA ? 'ce.f_semanales' : pasoMs <= 45 * DIA ? 'ce.f_mensuales' : pasoMs <= 120 * DIA ? 'ce.f_trimestrales' : 'ce.f_anuales');

/** Texto con halo del color del fondo y su caja REGISTRADA para la auditoría de choques. `base` = tamaño en la rejilla de 1080 px. */
export function rot(env, s, x, y, base, peso, color, align = 'left', id = null, o = {}) {
  const {ctx, u} = env, px = tam(env, base);
  ctx.save();
  ctx.font = fuenteCss(peso, px, !!o.mono); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const w = ctx.measureText(s).width;
  let x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  if (o.lim) { const dx = x0 < o.lim[0] ? o.lim[0] - x0 : x0 + w > o.lim[1] ? o.lim[1] - (x0 + w) : 0; x += dx; x0 += dx; }   // mantiene la caja dentro de [lim0, lim1] (marcas de eje en los bordes)
  const caja = [x0, y - px * 0.78, x0 + w, y + px * 0.2];
  // las marcas de eje nunca se pisan entre sí (el auditor las exime): la que llega después y estorba a una ya dibujada se omite
  if (o.tipo && o.tipo.startsWith('eje') && env.registro.some((r) => r.tipo === o.tipo && r.caja[0] < caja[2] + 6 * u && r.caja[2] + 6 * u > caja[0] && r.caja[1] < caja[3] && r.caja[3] > caja[1])) { ctx.restore(); return 0; }
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.halo !== false) { ctx.lineWidth = 5 * u; ctx.strokeStyle = rgba(PALETA.fondo, 0.9); ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
  if ((o.alpha ?? 1) > 0.05 && o.reg !== false) env.registro.push({tipo: o.tipo ?? 'etiqueta', caja, id});
  return w;
}
export const med = (env, s, base, peso = 600, mono = false) => { env.ctx.save(); env.ctx.font = F(env, peso, base, mono); const w = env.ctx.measureText(s).width; env.ctx.restore(); return w; };
/** Acorta un NOMBRE (nunca una cifra) con «…» para que quepa en `ancho`. */
export function cortarA(env, s, ancho, base, peso = 700, mono = false) {
  const {ctx} = env; ctx.save(); ctx.font = F(env, peso, base, mono);
  let r = String(s);
  if (ctx.measureText(r).width > ancho) { while (r.length > 3 && ctx.measureText(r + '…').width > ancho) r = r.slice(0, -1); r = r.trimEnd() + '…'; }
  ctx.restore(); return r;
}
/** Nombre en 1..maxL líneas que caben en `ancho` SIN «…» (por palabras); solo si ni así cabe, se corta como última salida. */
function nombreEnLineas(env, s, ancho, base, peso = 700, maxL = 2) {
  const {ctx} = env; ctx.save(); ctx.font = F(env, peso, base);
  const r = ctx.measureText(String(s)).width <= ancho ? [String(s)] : envolverEntero(ctx, String(s), ancho, maxL);
  ctx.restore(); return r ?? [cortarA(env, s, ancho, base, peso)];
}
function lineasDe(env, s, ancho, base, peso, maxL, extra = 0) { const {ctx} = env; ctx.save(); ctx.font = F(env, peso, base); const r = envolver(ctx, s, ancho, maxL, {extra}); ctx.restore(); return r; }

/** Nota de método/escala que se DECLARA en pantalla: va en la franja libre justo encima de la gráfica.
 *  Frase normal (no todo en mayúsculas). En vertical: máx. 2 líneas y, como queda por encima de la zona segura (y < 43,75 % del alto), usa todo el ancho útil.
 *  Si con la unidad al final pasa de 2 líneas, se omite la unidad (ya la dicen el eje o el subtítulo); la declaración de método nunca se recorta. */
export function nota(env, B, texto, id, alpha = 1) {
  if (!texto) return;
  const {ctx, u, W, H} = env, vert = H > W, px = tam(env, 18), lh = px * 1.28, maxL = vert ? 2 : 3;
  const ancho = vert && B.y - 30 * u < ZONA.y * H ? Math.max(B.w, W - margenes(env).m - B.x) : B.w;
  const nLin = (s) => { ctx.save(); ctx.font = F(env, 500, 18); const n = envolverPalabras(ctx, s, ancho).length; ctx.restore(); return n; };
  let tx = String(texto);
  if (nLin(tx) > maxL) { const sin = tx.replace(/\s*(Unidad|Unit): [^]*$/, ""); if (sin !== tx && nLin(sin) <= maxL) tx = sin; }
  const L = lineasDe(env, tx, ancho, 18, 500, maxL, 1);   // como último recurso admite 1 línea más antes de acortar con «…»
  L.forEach((l, i) => rot(env, l, B.x, B.y - (vert ? 30 : 16) * env.u - (L.length - 1 - i) * lh, 18, 500, rgba(PALETA.piedraClara, 0.9), "left", `${id}:nota${i}`, {alpha, halo: false}));
}
/** Opacidad de entrada escalonada del elemento i de n que arranca en t0 (curva de desaceleración, nunca lineal). */
export const ent = (env, t0, i = 0, n = 1) => entradaDiseno(env.t, t0, i, n);

function ticksLog10(a, b) {
  const out = [], e0 = Math.floor(Math.log10(a)), e1 = Math.ceil(Math.log10(b));
  for (let e = e0; e <= e1; e++) for (const m of e1 - e0 <= 2 ? [1, 2, 5] : [1]) { const v = m * Math.pow(10, e); if (v >= a && v <= b) out.push(v); }
  return out;
}
/** Marcas «redondas» con la última ≥ máximo (para que el eje contenga todo el dato). */
export function marcasHasta(max, n = 5) {
  const tk = ticksNum(0, max, n), paso = tk.length > 1 ? tk[1] - tk[0] : max || 1; let top = tk[tk.length - 1] ?? 0;
  while (top < max - 1e-9) { top += paso; tk.push(Math.round(top / paso) * paso); }
  return {ticks: tk, top: tk[tk.length - 1]};
}
/** Quita lo que repiten TODOS los nombres de serie («Consumo mundial de … (sustitución energética)») para que los rótulos quepan sin perder lo que distingue a cada uno. */
export function acortarNombres(ns) {
  let r = ns.map(String);
  if (r.length > 1) {
    const w = r.map((q) => q.split(' ')); let k = 0; while (k < w[0].length - 1 && w.every((q) => q.length > k + 1 && q[k] === w[0][k])) k++;
    const sin = w.map((q) => q.slice(k).join(' ')); if (k > 0 && new Set(sin).size === sin.length) r = sin;
    const sp = r.map((q) => q.replace(/\s*\([^)]*\)\s*$/, '').trim()); if (new Set(sp).size === sp.length && sp.every(Boolean)) r = sp;
  }
  return r.map((q) => q.charAt(0).toUpperCase() + q.slice(1));
}
export const uni = (fmt) => (fmt?.unidad ? tr('ce.uni', {u: String(fmt.unidad).trim()}) : '');
export const fechaCorta = (ms, modo) => (modo === 'anio' ? fmtFecha(ms, 'anio') : fmtFecha(ms, 'mes'));

// ═══ 1. RADAR ═══════════════════════════════════════════════════════════════════════════════════════════════════
// Serie de tiempo: cada eje va de 0 (mínimo histórico de ESA serie) a 100 (su máximo histórico) y el punto es la última observación.
// Tabla de categorías: cada eje es una fila (concepto, valor [, anterior]) en una escala común 0 → máximo, que se declara.
function ejesRadar(capa, tab) {
  if (tab.series?.length) {
    const idx = capa.series ?? tab.series.map((_, i) => i);
    const ejes = idx.map((si) => {
      const s = tab.series[si], par = tab.x.map((x, i) => [x, s.y[i]]).filter((p) => p[1] != null), vs = par.map((p) => p[1]);
      const lo = Math.min(...vs), hi = Math.max(...vs), [xl, vl] = par[par.length - 1];
      return {nombre: s.nombre, v: vl, fecha: xl, fmt: s.fmt, frac: hi > lo ? (vl - lo) / (hi - lo) : 0, lo, hi};
    });
    return {ejes, tabla: false, modo: 'historia'};
  }
  const items = tab.items.slice(0, capa.max ?? 8), mx = Math.max(...items.map((i) => Math.max(i.valor, i.anterior ?? 0)));
  const esc = marcasHasta(mx, 4).top || 1;
  return {ejes: items.map((i) => ({nombre: i.nombre, v: i.valor, ant: i.anterior, fmt: tab.fmt, frac: clamp(i.valor / esc), fracAnt: i.anterior != null ? clamp(i.anterior / esc) : null})), tabla: true, esc, fmt: tab.fmt, modo: 'tabla', conAnt: items.some((i) => i.anterior != null)};
}
function radar(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._rd ??= ejesRadar(capa, tab)), N = L.ejes.length;
  const wLab = B.w * 0.21, lh = tam(env, 26) * 1.18, fila = tam(env, 26) * 1.5, rrL = tam(env, 18) * 0.62, LNr = vert ? (capa._rn ??= L.ejes.map((e) => nombreEnLineas(env, e.nombre, B.w - 2 * rrL - med(env, fN(e.v, e.fmt), 26, 800, true) - 40 * u, 26, 700, 2))) : [], offY = LNr.map((_, i) => LNr.slice(0, i).reduce((a, l) => a + (l.length - 1) * tam(env, 26) * 1.1, 0)), hLista = vert ? N * fila + (offY.length ? offY[N - 1] + (LNr[N - 1].length - 1) * tam(env, 26) * 1.1 : 0) + 18 * u : 0;   // vertical: los rótulos van en una lista numerada debajo (los laterales no caben en la zona segura)
  const R = vert ? Math.min(B.w / 2 - 44 * u, (B.h - hLista - 190 * u) / 2) : Math.min(B.w / 2 - wLab, B.h / 2 - lh * 3.3), cx = B.x + B.w / 2, cy = vert ? B.y + 54 * u + R : B.y + B.h / 2, p = prog(t, t0, t1, CURVA.trazo);
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  nota(env, B, capa.nota ?? (L.tabla ? tr('ce.radar_tabla', {esc: fN(L.esc, L.fmt), ant: L.conAnt ? tr('ce.radar_ant') : ''}) : tr('ce.radar_serie')), capa.id ?? 'radar', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  // anillos y ejes
  ctx.lineWidth = 1.5 * u;
  [0.25, 0.5, 0.75, 1].forEach((f) => {
    ctx.strokeStyle = rgba(PALETA.piedra, f === 1 ? 0.35 : 0.14); ctx.beginPath();
    for (let i = 0; i < N; i++) { const x = cx + R * f * Math.cos(ang(i)), y = cy + R * f * Math.sin(ang(i)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.stroke();
    const et = L.tabla ? fN(L.esc * f, L.fmt) : String(Math.round(f * 100));
    rot(env, et, cx + 8 * u, cy - R * f + tam(env, 18) * 0.95, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'left', `${capa.id ?? 'radar'}:anillo${f}`, {mono: true, tipo: 'eje-y', halo: true});
  });
  ctx.strokeStyle = rgba(PALETA.piedra, 0.18);
  for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))); ctx.stroke(); }
  // polígonos
  const poli = (fr, estilo) => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) { const r = R * clamp(fr(i)) * p, x = cx + r * Math.cos(ang(i)), y = cy + r * Math.sin(ang(i)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); estilo();
  };
  const acento = colorDe(capa.color ?? 'oro', 0);
  if (L.tabla && L.conAnt) poli((i) => L.ejes[i].fracAnt ?? 0, () => { ctx.setLineDash([10 * u, 8 * u]); ctx.strokeStyle = rgba(PALETA.piedraClara, 0.85); ctx.lineWidth = 3 * u; ctx.stroke(); ctx.setLineDash([]); });
  poli((i) => L.ejes[i].frac, () => { ctx.fillStyle = rgba(acento, 0.24); ctx.fill(); ctx.strokeStyle = acento; ctx.lineWidth = 4 * u; ctx.lineJoin = 'round'; ctx.stroke(); });
  L.ejes.forEach((e, i) => { const r = R * clamp(e.frac) * p; ctx.fillStyle = acento; ctx.beginPath(); ctx.arc(cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i)), 8 * u, 0, 7); ctx.fill(); });
  // rótulos: nombre (hasta 2 líneas) y valor, hacia afuera de cada eje (en vertical: número en la punta y lista debajo)
  if (vert) L.ejes.forEach((e, i) => {
    const a = ang(i), g = ent(env, t0 + 0.4, i, N), qx = cx + (R + 34 * u) * Math.cos(a), qy = cy + (R + 34 * u) * Math.sin(a), rr = tam(env, 18) * 0.62, y = cy + R + 118 * u + i * fila + offY[i];
    ctx.save(); ctx.globalAlpha *= g; ctx.fillStyle = acento;
    [[qx, qy], [B.x + rr, y - tam(env, 26) * 0.3]].forEach(([x, yy]) => { ctx.beginPath(); ctx.arc(x, yy, rr, 0, 7); ctx.fill(); }); ctx.restore();
    rot(env, String(i + 1), qx, qy + tam(env, 18) * 0.32, 18, 800, PALETA.fondo, 'center', `${capa.id ?? 'radar'}:p${i}`, {mono: true, alpha: g, halo: false});
    rot(env, String(i + 1), B.x + rr, y - tam(env, 26) * 0.3 + tam(env, 18) * 0.32, 18, 800, PALETA.fondo, 'center', `${capa.id ?? 'radar'}:q${i}`, {mono: true, alpha: g, halo: false, reg: false});
    const vt = fN(e.v, e.fmt), wv = med(env, vt, 26, 800, true);
    LNr[i].forEach((ln, q) => rot(env, ln, B.x + 2 * rr + 14 * u, y + q * tam(env, 26) * 1.1, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'radar'}:n${i}${q ? ':' + q : ''}`, {alpha: g}));
    rot(env, vt, B.x + B.w, y, 26, 800, acento, 'right', `${capa.id ?? 'radar'}:v${i}`, {mono: true, alpha: g});
  });
  else L.ejes.forEach((e, i) => {
    const a = ang(i), ux = Math.cos(a), uy = Math.sin(a), px = cx + (R + 16 * u) * ux, py = cy + (R + 14 * u) * uy, al = ux > 0.3 ? 'left' : ux < -0.3 ? 'right' : 'center';
    const ancho = al === 'center' ? Math.min(B.w * 0.5, wLab * 1.8) : Math.min(wLab - 6 * u, al === 'left' ? B.x + B.w - px : px - B.x);
    const nl = lineasDe(env, e.nombre, ancho, 26, 700, 2), alto = (nl.length + 1) * lh;
    const top = uy < -0.35 ? py - alto : uy > 0.35 ? py + 4 * u : py - alto / 2 + 4 * u, g = ent(env, t0 + 0.4, i, N);
    nl.forEach((l, k) => rot(env, l, px, top + lh * (k + 0.85), 26, 700, PALETA.blanco, al, `${capa.id ?? 'radar'}:n${i}:${k}`, {alpha: g}));
    rot(env, fN(e.v, e.fmt), px, top + lh * (nl.length + 0.85), 26, 800, acento, al, `${capa.id ?? 'radar'}:v${i}`, {mono: true, alpha: g});
  });
  ctx.restore();
}

// ═══ 2. ÁREA APILADA (absoluta y 100 %) ══════════════════════════════════════════════════════════════════════════
function pilaApilada(capa, tab, pct) {
  const idx = capa.series ?? tab.series.map((_, i) => i), filas = [];
  tab.x.forEach((x, i) => { if (idx.every((si) => tab.series[si].y[i] != null)) filas.push(i); });
  const media = idx.map((si) => filas.reduce((a, i) => a + tab.series[si].y[i], 0) / (filas.length || 1));
  const orden = idx.map((si, j) => j).sort((a, b) => media[b] - media[a]);   // de abajo hacia arriba: la de mayor peso medio abajo
  const tot = filas.map((i) => idx.reduce((a, si) => a + tab.series[si].y[i], 0)), mx = Math.max(...tot);
  return {idx, filas, orden, tot, nom: acortarNombres(idx.map((si) => tab.series[si].nombre)), ...(pct ? {top: 100, ticks: [0, 25, 50, 75, 100]} : marcasHasta(mx, 5))};
}
function apilada(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W, pct = capa.modo === 'pct';
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._ap ??= pilaApilada(capa, tab, pct)), F_ = L.filas.length, pal = paleta(), fmt = tab.series[L.idx[0]].fmt;
  const etY = (v) => (pct ? `${v} %` : fN(v, {...fmt, prefijo: '', sufijo: '', decimales: decDe(L.ticks[1] - L.ticks[0])})), wEje = Math.max(...L.ticks.map((v) => med(env, etY(v), 18, 500, true))) + 14 * u;
  const wLab = Math.min(B.w * 0.45, Math.max(...L.nom.map((q) => med(env, q, 26, 700)), ...L.idx.map((si) => med(env, fN(L.tot[F_ - 1], tab.series[si].fmt), 18, 800, true))) + 34 * u), lh = tam(env, 26) * 1.15 + tam(env, 18) * 1.15, hx = tam(env, 18) * 1.5 + 18 * u;
  const x0 = B.x + wEje, x1 = B.x + B.w - wLab - 16 * u, y0 = B.y + tam(env, 18) * 1.3, y1 = B.y + B.h - hx;
  const xa = tab.x[L.filas[0]], xb = tab.x[L.filas[F_ - 1]], px = (x) => x0 + ((x - xa) / (xb - xa)) * (x1 - x0), py = (v) => y1 - (v / L.top) * (y1 - y0);
  const reveal = prog(t, t0, t1, CURVA.trazo), xh = lerp(xa, xb, reveal);
  const frac = (r, j) => { let v = 0; for (let q = 0; q <= j; q++) v += tab.series[L.idx[L.orden[q]]].y[L.filas[r]]; return pct ? (v / L.tot[r]) * 100 : v; };
  nota(env, B, capa.nota ?? (pct ? tr('ce.apilada_pct') : tr('ce.apilada_abs') + uni(fmt)), capa.id ?? 'apilada', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  ctx.lineWidth = 1 * u;
  L.ticks.forEach((v) => { const y = py(v); ctx.strokeStyle = rgba(PALETA.piedra, v === 0 ? 0.3 : 0.07); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etY(v), x0 - 10 * u, y + tam(env, 18) * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${capa.id ?? 'apilada'}:y${v}`, {mono: true, tipo: 'eje-y'}); });
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 1, y0 - 4 * u, (x1 - x0) * reveal + 1, y1 - y0 + 6 * u); ctx.clip();
  for (let j = L.idx.length - 1; j >= 0; j--) {
    ctx.beginPath();
    for (let r = 0; r < F_; r++) { const x = px(tab.x[L.filas[r]]), y = py(frac(r, j)); r ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let r = F_ - 1; r >= 0; r--) ctx.lineTo(px(tab.x[L.filas[r]]), py(j ? frac(r, j - 1) : 0));
    ctx.closePath(); ctx.fillStyle = rgba(pal[L.orden[j] % pal.length], 0.9); ctx.fill(); ctx.strokeStyle = rgba(PALETA.fondo, 0.9); ctx.lineWidth = 1.5 * u; ctx.stroke();
  }
  ctx.restore();
  // eje X + etiqueta del momento en curso
  const fecha = tab.tipoX === 'fecha', tf = fecha ? ticksFecha(xa, xb, Math.max(3, Math.floor((x1 - x0) / (tam(env, 18) * 4.6)))) : {ticks: ticksNum(xa, xb, 5), unidad: 'y'};
  const enCurso = reveal > 0.001 && reveal < 0.999, hxp = px(xh);
  let rr = 0; for (let r = 0; r < F_; r++) if (tab.x[L.filas[r]] <= xh + 1e-9) rr = r;   // fila más reciente que la cabeza ya alcanzó
  const et = fecha ? fechaCorta(tab.x[L.filas[rr]], xb - xa > 3 * 365.25 * DIA ? 'anio' : 'mes') : fN(tab.x[L.filas[rr]], {decimales: 0}), wC = med(env, et, 18, 800, true) + 22 * u, hh = tam(env, 18) * 1.45, xx = clamp(hxp - wC / 2, x0, x1 - wC);
  tf.ticks.forEach((tk) => { const lb = fecha ? etiquetaTick(tk, tf.unidad) : fN(tk, {decimales: 0}), hw = med(env, lb, 18, 500, true) / 2, tx = clamp(px(tk), x0 + hw, x1 - hw); if (enCurso && Math.abs(tx - (xx + wC / 2)) < hw + wC / 2 + 10 * u) return; rot(env, lb, tx, y1 + tam(env, 18) * 1.25, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${capa.id ?? 'apilada'}:x${tk}`, {mono: true, tipo: 'eje-x'}); });
  if (enCurso) {
    ctx.strokeStyle = rgba(PALETA.blanco, 0.7); ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(hxp, y0); ctx.lineTo(hxp, y1 + 6 * u); ctx.stroke(); ctx.fillStyle = PALETA.blanco; ctx.fillRect(xx, y1 + 6 * u, wC, hh);
    rot(env, et, xx + wC / 2, y1 + 6 * u + hh * 0.76, 18, 800, PALETA.fondo, 'center', `${capa.id ?? 'apilada'}:cabeza`, {mono: true, halo: false}); }
  // rótulos directos a la derecha, junto a su franja (separados para que no se pisen)
  const ys = L.orden.map((si, j) => { const a = j ? frac(rr, j - 1) : 0, b = frac(rr, j); return py((a + b) / 2); }), pos = separar(ys, lh, y0 + lh * 0.5, y1 - lh * 0.5);
  L.orden.forEach((jj, j) => {
    const s = tab.series[L.idx[jj]], v = s.y[L.filas[rr]], col = pal[jj % pal.length], lx = x1 + 16 * u, g = ent(env, t0 + 0.5, j, L.idx.length);
    ctx.fillStyle = col; ctx.globalAlpha = ap * g; ctx.fillRect(lx, pos[j] - lh * 0.4, 8 * u, lh * 0.8); ctx.globalAlpha = ap;
    rot(env, cortarA(env, L.nom[jj], wLab - 26 * u, 26, 700), lx + 18 * u, pos[j] - tam(env, 26) * 0.05, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'apilada'}:n${jj}`, {alpha: g});
    rot(env, pct ? pTxt((v / L.tot[rr]) * 100, 1) : fN(v, s.fmt), lx + 18 * u, pos[j] + tam(env, 18) * 1.25, 18, 800, col, 'left', `${capa.id ?? 'apilada'}:v${jj}`, {mono: true, alpha: g});
  });
  ctx.restore();
}
/** Separa verticalmente rótulos que se pisarían: nadie queda a menos de `gap` del anterior ni fuera de [lo, hi]. */
export function separar(ys, gap, lo, hi) {
  const o = ys.map((y, i) => ({y, i})).sort((a, b) => a.y - b.y);
  let cur = lo; o.forEach((e) => { e.y = Math.max(e.y, cur); cur = e.y + gap; });
  let lim = hi; for (let i = o.length - 1; i >= 0; i--) { o[i].y = Math.min(o[i].y, lim); lim = o[i].y - gap; }
  const out = new Array(ys.length); o.forEach((e) => { out[e.i] = e.y; }); return out;
}

// ═══ 3. VELAS (OHLC) con volumen opcional ════════════════════════════════════════════════════════════════════════
// Con columnas apertura/máx/mín/cierre las velas son reales. Si solo hay CIERRES, cada vela agrupa un periodo: abre = primer cierre,
// cierra = último cierre, mechas = mayor y menor CIERRE (no hay extremos intradía). Esa limitación se declara en pantalla.
function clavePeriodo(ms, u) {
  const d = new Date(ms), y = d.getUTCFullYear(), m = d.getUTCMonth();
  return u === 'semana' ? Math.floor((ms / DIA + 3) / 7) : u === 'mes' ? y * 12 + m : u === 'trimestre' ? y * 4 + Math.floor(m / 3) : u === 'anio' ? y : ms;
}
function armarVelas(capa, tab) {
  const ohlc = capa.ohlc, base = [];
  tab.x.forEach((x, i) => {
    if (ohlc) { const [o, h, l, c] = ohlc.map((k) => tab.series[k].y[i]); if ([o, h, l, c].every((v) => v != null)) base.push({x, o, h, l, c, v: capa.volumen != null ? tab.series[capa.volumen].y[i] : null}); }
    else { const c = tab.series[capa.series?.[0] ?? 0].y[i]; if (c != null) base.push({x, o: c, h: c, l: c, c, v: null}); }
  });
  const tope = capa.maxVelas ?? 90, unidades = ohlc ? ['dia', 'semana', 'mes', 'trimestre', 'anio'] : ['semana', 'mes', 'trimestre', 'anio'];
  let unidad = unidades.find((un) => new Set(base.map((b) => clavePeriodo(b.x, un))).size <= tope) ?? 'anio';
  if (capa.agrupar && unidades.includes(capa.agrupar)) unidad = capa.agrupar;
  const g = new Map();
  base.forEach((b) => { const k = clavePeriodo(b.x, unidad), a = g.get(k); if (!a) g.set(k, {...b, n: 1, xi: b.x}); else { a.h = Math.max(a.h, b.h); a.l = Math.min(a.l, b.l); a.c = b.c; a.x = b.x; a.n++; if (b.v != null) a.v = (a.v ?? 0) + b.v; } });
  return {velas: [...g.values()], unidad, real: !!ohlc, filasBase: base.length};
}
function velas(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 6], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._vl ??= armarVelas({...capa, maxVelas: capa.maxVelas ?? (vert ? 60 : 90)}, tab)), n = L.velas.length, fmt = tab.series[capa.ohlc?.[3] ?? capa.series?.[0] ?? 0].fmt;
  const hi = Math.max(...L.velas.map((v) => v.h)), lo = Math.min(...L.velas.map((v) => v.l)), logE = lo > 0 && hi / lo > 8 && capa.escala !== 'lineal';
  const f = logE ? Math.log10 : (v) => v, pad = (f(hi) - f(lo)) * 0.06 || 1, a = f(lo) - pad, b = f(hi) + pad;
  const ticks = logE ? ticksLog10(Math.pow(10, a), Math.pow(10, b)) : ticksNum(lo - pad, hi + pad, 5), dec = logE ? 0 : decDe(ticks.length > 1 ? ticks[1] - ticks[0] : 1);
  const etY = (v) => fN(v, {...fmt, prefijo: '', sufijo: '', decimales: logE ? (v < 1 ? 2 : 0) : dec});
  const wEje = Math.max(...ticks.map((v) => med(env, etY(v), 18, 500, true))) + 14 * u, S = tam(env, 18), cab = vert ? S * 6.2 : S * 4.1;
  const conVol = capa.volumen != null && L.velas.some((v) => v.v != null), hVol = conVol ? (B.h - cab) * 0.2 : 0;
  const x0 = B.x + wEje, x1 = B.x + B.w, y0 = B.y + cab, y1 = B.y + B.h - S * 1.7 - hVol, yv0 = y1 + S * 0.4, yv1 = B.y + B.h - S * 1.7;
  const py = (v) => y1 - ((f(v) - a) / (b - a)) * (y1 - y0), paso = (x1 - x0) / n, px = (i) => x0 + paso * (i + 0.5), cw = Math.max(2 * u, Math.min(paso * 0.7, 30 * u)), reveal = prog(t, t0, t1, CURVA.trazo), vis = Math.min(n, Math.floor(reveal * n) + 1);
  const un = tr('ce.u_' + L.unidad);
  nota(env, B, capa.nota ?? (L.real ? tr('ce.velas_real', {un, log: logE ? tr('ce.velas_log_real') : ''}) : tr('ce.velas_cierres', {un, log: logE ? tr('ce.velas_log') : ''})), capa.id ?? 'velas', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  ticks.forEach((v) => { const y = py(v); ctx.strokeStyle = rgba(PALETA.piedra, 0.07); ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etY(v), x0 - 10 * u, y + S * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${capa.id ?? 'velas'}:y${v}`, {mono: true, tipo: 'eje-y'}); });
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0 - 4 * u, x1 - x0 + 1, yv1 - y0 + 8 * u); ctx.clip();
  for (let i = 0; i < vis; i++) {
    const v = L.velas[i], sube = v.c >= v.o, col = sube ? COLOR.verde : COLOR.rojo, yo = py(v.o), yc = py(v.c), x = px(i), k = i === vis - 1 ? clamp(reveal * n - (vis - 1) + 0.0001) : 1;
    ctx.globalAlpha = ap * Math.max(0.35, k); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5 * u, Math.min(3 * u, cw * 0.18));
    ctx.beginPath(); ctx.moveTo(x, py(v.h)); ctx.lineTo(x, py(v.l)); ctx.stroke(); ctx.fillRect(x - cw / 2, Math.min(yo, yc), cw, Math.max(Math.abs(yc - yo), 2 * u));
    if (conVol && v.v != null) ctx.fillRect(x - cw / 2, yv1 - (v.v / Math.max(...L.velas.map((q) => q.v ?? 0))) * (yv1 - yv0), cw, (v.v / Math.max(...L.velas.map((q) => q.v ?? 0))) * (yv1 - yv0));
  }
  ctx.restore();
  if (conVol) rot(env, `VOLUMEN · MÁX ${fN(Math.max(...L.velas.map((q) => q.v ?? 0)), {decimales: 0})}`, x0, yv0 + S * 0.9, 18, 600, PALETA.piedraOscura, 'left', `${capa.id ?? 'velas'}:vol`, {mono: true});
  // marcas del eje X: el periodo de la vela (índice, no tiempo continuo: los huecos sin mercado no se dibujan)
  const nm = Math.max(2, Math.floor((x1 - x0) / (med(env, 'sep 2026', 18, 500, true) * 1.5))), largo = L.unidad === 'trimestre' || L.unidad === 'anio' || tab.x[tab.x.length - 1] - tab.x[0] > 8 * 365.25 * DIA;
  for (let k = 0; k < nm; k++) { const i = Math.round((k * (n - 1)) / Math.max(1, nm - 1)); const lb = fechaCorta(L.velas[i].xi, largo ? 'anio' : 'mes'), hw = med(env, lb, 18, 500, true) / 2; rot(env, lb, clamp(px(i), x0 + hw, x1 - hw), B.y + B.h - S * 0.2, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${capa.id ?? 'velas'}:x${k}`, {mono: true, tipo: 'eje-x'}); }
  // lectura de la vela en curso: abre / máx / mín / cierra con el periodo
  const v = L.velas[vis - 1], et = L.real ? [tr('ce.velas_o'), tr('ce.velas_h'), tr('ce.velas_l'), tr('ce.velas_c')] : [tr('ce.velas_o2'), tr('ce.velas_h2'), tr('ce.velas_l2'), tr('ce.velas_c2')], vals = [v.o, v.h, v.l, v.c];
  const colW = vert ? (x1 - B.x) / 2 : (x1 - B.x) / 4;
  rot(env, fechaCorta(v.x, L.unidad === 'anio' || L.unidad === 'trimestre' ? 'anio' : 'mes').toUpperCase() + (L.unidad === 'dia' ? ' · ' + fmtFecha(v.x, 'dia') : ''), B.x, B.y + S * 1.0, 18, 700, PALETA.piedraClara, 'left', `${capa.id ?? 'velas'}:per`, {mono: true});
  et.forEach((e, k) => { const cx_ = B.x + (vert ? (k % 2) * colW : k * colW), cy_ = B.y + S * 2.25 + (vert ? Math.floor(k / 2) * S * 1.9 : 0); rot(env, e, cx_, cy_, 18, 500, PALETA.piedraOscura, 'left', `${capa.id ?? 'velas'}:e${k}`); rot(env, fN(vals[k], fmt), cx_, cy_ + S * 1.0, 18, 800, k === 3 ? (v.c >= v.o ? COLOR.verde : COLOR.rojo) : PALETA.blanco, 'left', `${capa.id ?? 'velas'}:l${k}`, {mono: true}); });
  ctx.restore();
}

// ═══ 4. HISTOGRAMA / DISTRIBUCIÓN ═══════════════════════════════════════════════════════════════════════════════
function valoresHist(capa, tab) {
  const y = tab.series[capa.series?.[0] ?? 0].y, ret = capa.sobre === 'retornos', v = [];
  if (ret) for (let k = 1; k < y.length; k++) { if (y[k] != null && y[k - 1] != null && y[k - 1] > 0) v.push((y[k] / y[k - 1] - 1) * 100); }
  else y.forEach((q) => { if (q != null) v.push(q); });
  return v;
}
function armarHist(capa, tab, vert) {
  const ret = capa.sobre === 'retornos', v = valoresHist(capa, tab), s = [...v].sort((a, b) => a - b), n = s.length;
  const lo = ret ? pctl(s, 0.005) : s[0], hi = ret ? pctl(s, 0.995) : s[n - 1], nb0 = capa.bins ?? (vert ? 30 : 40), raw = (hi - lo) / nb0 || 1, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const paso = [1, 2, 5, 10].map((m) => m * mag).find((q) => q >= raw) ?? 10 * mag, e0 = Math.floor(lo / paso + 1e-9) * paso, nb = Math.max(2, Math.ceil((hi - e0) / paso - 1e-9)), cnt = Array(nb).fill(0);
  let fuera0 = 0, fuera1 = 0;
  v.forEach((q) => { const k = Math.floor((q - e0) / paso + 1e-9); if (k < 0) { cnt[0]++; fuera0++; } else if (k >= nb) { cnt[nb - 1]++; fuera1++; } else cnt[k]++; });
  const ultimo = ret ? v[v.length - 1] : tab.series[capa.series?.[0] ?? 0].y.filter((q) => q != null).pop(), mediana = pctl(s, 0.5), rango = s.filter((q) => q <= ultimo).length / n * 100;
  return {n, e0, paso, nb, cnt, share: cnt.map((c) => (c / n) * 100), ultimo, mediana, percentil: rango, fuera0, fuera1, ret, paso2: pasoMediano(tab.x)};
}
function histograma(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._hs ??= armarHist(capa, tab, vert)), S = tam(env, 18), fmt = L.ret ? {decimales: decDe(L.paso), sufijo: ' %'} : {...tab.series[capa.series?.[0] ?? 0].fmt};
  const mxS = Math.max(...L.share), yt = marcasHasta(mxS * 1.05, 4), etY = (v) => `${fN(v, {decimales: decDe(yt.ticks[1] - yt.ticks[0])})} %`, wEje = Math.max(...yt.ticks.map((v) => med(env, etY(v), 18, 500, true))) + 14 * u;
  const cab = S * 4.4, x0 = B.x + wEje, x1 = B.x + B.w, y0 = B.y + cab, y1 = B.y + B.h - S * 1.9, px = (v) => x0 + ((v - L.e0) / (L.paso * L.nb)) * (x1 - x0), py = (v) => y1 - (v / yt.top) * (y1 - y0), p = prog(t, t0, t1, CURVA.trazo);
  const per = frecuencia(L.paso2), xt = ticksNum(L.e0, L.e0 + L.paso * L.nb, Math.max(3, Math.floor((x1 - x0) / (med(env, '−4,5 %', 18, 500, true) * 1.9)))), etX = (v) => fN(v, {...fmt, prefijo: fmt.prefijo ?? '', decimales: L.ret ? decDe(L.paso) : (fmt.decimales ?? 'auto')});
  nota(env, B, capa.nota ?? (L.ret ? tr('ce.hist_ret', {n: fN(L.n, {decimales: 0}), per, col: L.fuera0 + L.fuera1 ? tr('ce.hist_col') : ''}) : tr('ce.hist_niv', {n: fN(L.n, {decimales: 0})}) + uni(fmt)), capa.id ?? 'histograma', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  yt.ticks.forEach((v) => { const y = py(v); ctx.strokeStyle = rgba(PALETA.piedra, v === 0 ? 0.3 : 0.07); ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etY(v), x0 - 10 * u, y + S * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${capa.id ?? 'histograma'}:y${v}`, {mono: true, tipo: 'eje-y'}); });
  const bw = (x1 - x0) / L.nb;
  L.share.forEach((s, k) => { const g = clamp(p * (L.nb + 3) - k * 0.9) , c = L.e0 + (k + 0.5) * L.paso, col = L.ret ? (c < 0 ? COLOR.rojo : COLOR.verde) : COLOR.teal, h = (y1 - py(s)) * ease.out3(g); ctx.fillStyle = col; ctx.fillRect(x0 + k * bw + 1.5 * u, y1 - h, Math.max(1, bw - 3 * u), h); });
  xt.forEach((v) => rot(env, etX(v), px(v), y1 + S * 1.3, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${capa.id ?? 'histograma'}:x${v}`, {mono: true, tipo: 'eje-x', lim: [x0, x1]}));
  // marcas: mediana y último valor (en filas distintas de la franja superior para que sus rótulos nunca se pisen)
  const marca = (v, fila, color, txt, id) => { const x = clamp(px(v), x0, x1), w = med(env, txt, 18, 700, true), xx = clamp(x, x0 + w / 2, x1 - w / 2), g = ent(env, t0 + 1.2, fila);
    ctx.globalAlpha = ap * g; ctx.strokeStyle = color; ctx.lineWidth = 2.5 * u; ctx.setLineDash(fila ? [] : [8 * u, 6 * u]); ctx.beginPath(); ctx.moveTo(x, B.y + S * (fila ? 3.2 : 1.9)); ctx.lineTo(x, y1); ctx.stroke(); ctx.setLineDash([]);
    if (fila) { ctx.save(); ctx.globalAlpha = ap * g; ctx.fillStyle = rgba(PALETA.fondo, 0.96); ctx.fillRect(xx - w / 2 - 8 * u, B.y + S * 2.95 - S * 0.95, w + 16 * u, S * 1.3); ctx.restore(); }   // placa del fondo: la línea punteada de la mediana no atraviesa el rótulo de la fila de abajo
    rot(env, txt, xx, B.y + S * (fila ? 2.95 : 1.65), 18, 800, color, 'center', `${capa.id ?? 'histograma'}:${id}`, {mono: true, alpha: g}); ctx.globalAlpha = ap; };
  const etM = (v) => (L.ret ? fmtSigno(v, {decimales: 2, sufijo: ' %'}) : etX(v));   // las marcas llevan más decimales que el eje: «0 %» no puede esconder un −0,24 %
  marca(L.mediana, 0, PALETA.piedraClara, tr('ce.mediana', {v: etM(L.mediana)}), 'mediana');
  marca(L.ultimo, 1, colorDe(capa.color ?? 'oro', 0), tr('ce.ultimo_pct', {v: etM(L.ultimo), p: fN(L.percentil, {decimales: 0})}), 'ultimo');
  ctx.restore();
}

// ═══ 5. DUMBBELL (antes / después por categoría) ═════════════════════════════════════════════════════════════════
function filasAD(capa, tab) {
  if (tab.items) return {filas: tab.items.filter((i) => i.anterior != null).map((i) => ({nombre: i.nombre, v0: i.anterior, v1: i.valor, fmt: tab.fmt})), l0: capa.etiquetaAntes ?? tr('ce.antes'), l1: capa.etiquetaDespues ?? tr('ce.ahora')};
  const n = tab.x.length, i0 = capa.de ?? 0, i1 = capa.a ?? n - 1, idx = capa.series ?? tab.series.map((_, i) => i);
  const et = (i) => (tab.tipoX === 'fecha' ? fmtFecha(tab.x[i], 'anio') : String(tab.x[i]));
  return {filas: idx.filter((si) => tab.series[si].y[i0] != null && tab.series[si].y[i1] != null).map((si) => ({nombre: tab.series[si].nombre, v0: tab.series[si].y[i0], v1: tab.series[si].y[i1], fmt: tab.series[si].fmt})), l0: et(i0), l1: et(i1)};
}
function dumbbell(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._db ??= (() => { const r = filasAD(capa, tab); if (!tab.items) { const nn = acortarNombres(r.filas.map((f) => f.nombre)); r.filas.forEach((f, i) => { f.nombre = nn[i]; }); } r.filas.sort((a, b) => b.v1 - a.v1); return r; })()), n = L.filas.length, S = tam(env, 18), N = tam(env, 26);
  const todos = L.filas.flatMap((f) => [f.v0, f.v1]), pos = todos.every((v) => v >= 0), mx = Math.max(...todos), mn = Math.min(...todos);
  const eje = pos ? marcasHasta(mx * 1.02, 4) : (() => { const tk = ticksNum(mn - (mx - mn) * 0.05, mx + (mx - mn) * 0.05, 4); return {ticks: tk, top: tk[tk.length - 1]}; })(), lo = pos ? 0 : eje.ticks[0], hi = eje.top;
  const dTxt = (f) => { const d = f.v0 > 0 ? (f.v1 / f.v0 - 1) * 100 : null; return d == null ? '' : pSigno(d, decPct(d)); }, vTxt = (f) => `${fN(f.v0, f.fmt)} → ${fN(f.v1, f.fmt)}`;
  const wUna = Math.max(...L.filas.map((f) => med(env, `${vTxt(f)}  ${dTxt(f)}`, 26, 800, true))), wNom = Math.max(...L.filas.map((f) => med(env, f.nombre, 26, 700))), dos = wUna + Math.min(wNom, B.w * 0.4) + 24 * u > B.w;   // ¿caben nombre y valores en una línea?
  const cab = S * 1.0, holg = n <= 6 ? (vert ? 2.3 : 1.55) : 1, fila = Math.min((B.h - cab - S * 2.4) / n, (dos ? N * 2.5 + S * 2.2 : N * 2.5) * holg), x0 = B.x + 8 * u, x1 = B.x + B.w - 8 * u, px = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0), p = prog(t, t0, t1, CURVA.trazo) * n, yy = B.y + cab, fmt = L.filas[0].fmt;
  nota(env, B, capa.nota ?? tr('ce.dumbbell', {l0: L.l0, l1: L.l1, cero: pos ? tr('ce.dumbbell_cero') : '', u: uni(L.filas[0].fmt)}), capa.id ?? 'dumbbell', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  eje.ticks.forEach((v) => { const x = px(v); if (x < x0 - 1 || x > x1 + 1) return; ctx.strokeStyle = rgba(PALETA.piedra, v === lo ? 0.3 : 0.08); ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + fila * n); ctx.stroke(); rot(env, fN(v, {...fmt, decimales: decDe(eje.ticks[1] - eje.ticks[0])}), x, yy + fila * n + S * 1.3, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${capa.id ?? 'dumbbell'}:x${v}`, {mono: true, tipo: 'eje-x', lim: [x0, x1]}); });
  L.filas.forEach((f, i) => {
    const a = clamp(p - i), e = ease.out3(a); if (a <= 0) return;
    const y = yy + i * fila, yb = y + N * 1.75, sube = f.v1 >= f.v0, col = sube ? COLOR.verde : COLOR.rojo, la = clamp((a - 0.4) / 0.6);
    const der = dos ? dTxt(f) : `${vTxt(f)}  ${dTxt(f)}`, wDer = med(env, der, 26, 800, true);
    rot(env, cortarA(env, f.nombre, B.w - wDer - 24 * u, 26, 700), x0, y + N * 0.95, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'dumbbell'}:n${i}`, {alpha: e});
    ctx.globalAlpha = ap * e; ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 7 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px(f.v0), yb); ctx.lineTo(lerp(px(f.v0), px(f.v1), e), yb); ctx.stroke();
    ctx.fillStyle = PALETA.piedraClara; ctx.beginPath(); ctx.arc(px(f.v0), yb, 12 * u, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lerp(px(f.v0), px(f.v1), e), yb, 14 * u, 0, 7); ctx.fill(); ctx.globalAlpha = ap;
    rot(env, der, x1, y + N * 0.95, 26, 800, col, 'right', `${capa.id ?? 'dumbbell'}:v${i}`, {mono: true, alpha: la});
    if (dos) rot(env, vTxt(f), x1, yb + 12 * u + tam(env, 18) * 1.25, 18, 700, PALETA.piedraClara, 'right', `${capa.id ?? 'dumbbell'}:w${i}`, {mono: true, alpha: la});
  });
  ctx.restore();
}

// ═══ 6. CALENDARIO DE CALOR ═════════════════════════════════════════════════════════════════════════════════════
// modo 'mensual': fila = año, columna = mes; color = retorno del mes (último cierre del mes ÷ último cierre del mes anterior − 1).
// modo 'diario': una tira por año, semanas en columnas y días hábiles en filas; color = retorno de cada día. Se declara el tope de color.
function armarCalendario(capa, tab, vert) {
  const y = tab.series[capa.series?.[0] ?? 0].y, mes = new Map(), dias = [];
  tab.x.forEach((x, i) => { if (y[i] == null) return; const d = new Date(x), k = d.getUTCFullYear() * 12 + d.getUTCMonth(); mes.set(k, {c: y[i], x, dia: d.getUTCDate()}); if (i && y[i - 1] != null && y[i - 1] > 0 && x - tab.x[i - 1] <= 5 * DIA) dias.push({x, r: (y[i] / y[i - 1] - 1) * 100}); });
  const rets = new Map(); [...mes.keys()].forEach((k) => { const a = mes.get(k - 1), b = mes.get(k); if (a && b) rets.set(k, {r: (b.c / a.c - 1) * 100, parcial: false}); });
  const ult = [...mes.keys()].pop(), u_ = mes.get(ult); if (rets.has(ult) && u_.dia < 25) rets.get(ult).parcial = true;
  const anios = [...new Set([...rets.keys()].map((k) => Math.floor(k / 12)))].sort((a, b) => a - b);
  const todos = capa.modo === 'diario' ? dias.map((d) => Math.abs(d.r)) : [...rets.values()].map((q) => Math.abs(q.r)), s = todos.sort((a, b) => a - b), lim0 = pctl(s, 0.95), lim = ticksNum(0, lim0 * 1.0001, 4).pop() ?? lim0;
  return {mes, rets, dias, anios, lim: lim >= lim0 * 0.7 ? lim : lim0, ult};
}
// Escala divergente de motor/escalas.js (BrBG vendorizado): centro gris claro, polos ocre / verde azulado. Antes el centro era casi el color del fondo y el rojo/verde no lo distinguía un daltónico.
function colorRet(r, lim) { return colorDivergente(clamp(r / lim, -1, 1)); }
const TINTA_OSCURA = '#0A0A0A', tintaSobre = (bg) => (contraste(bg, TINTA_OSCURA) >= contraste(bg, PALETA.blanco) ? TINTA_OSCURA : PALETA.blanco);   // la cifra usa la tinta que más contrasta con su casilla
function calendario(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._cal ??= armarCalendario(capa, tab, vert)), S = tam(env, 18), diario = capa.modo === 'diario', lim = L.lim, p = prog(t, t0, t1, CURVA.trazo);
  const leyH = S * 3.4, wA = med(env, '2000', 18, 700, true) + 14 * u;
  ctx.save(); ctx.globalAlpha *= ap;
  let aviso = '';
  if (!diario && vert) {   // VERTICAL: meses en filas y años en columnas, con la cifra en cada casilla (cuántos años caben lo decide el ancho de «−12,3»)
    const wM = med(env, 'sep', 18, 700, true) + 18 * u, numW = med(env, '−12,3', 18, 700, true) + 10 * u, nAn = Math.max(3, Math.min(12, Math.floor((B.w - wM) / numW))), anios = L.anios.slice(-nAn);
    if (anios.length < L.anios.length) aviso = tr('ce.cal_ultimos', {a: anios.length, b: L.anios.length});
    const x0 = B.x + wM, cw = (B.w - wM) / anios.length, y0 = B.y + S * 1.6, filaH = Math.min(S * 2.8, (B.h - leyH - S * 2) / 12);
    nota(env, B, capa.nota ?? tr('ce.cal_mes_vert', {lim: fN(lim, {decimales: lim < 10 ? 1 : 0}), aviso, parcial: L.rets.get(L.ult)?.parcial ? tr('ce.cal_parcial') : ''}), capa.id ?? 'calendario', ap);
    anios.forEach((an, c) => rot(env, String(an), x0 + cw * (c + 0.5), B.y + S * 1.1, 18, 700, PALETA.piedraClara, 'center', `${capa.id ?? 'calendario'}:a${an}`, {mono: true, tipo: 'eje-x'}));
    for (let m = 0; m < 12; m++) {
      const y = y0 + m * filaH, g = ent(env, t0 + 0.2, m, 12); rot(env, mes3()[m], B.x + wM - 12 * u, y + filaH * 0.64, 18, 600, PALETA.piedraOscura, 'right', `${capa.id ?? 'calendario'}:m${m}`, {mono: true, tipo: 'eje-y', alpha: g});
      anios.forEach((an, c) => {
        const q = L.rets.get(an * 12 + m), g2 = clamp(p * 1.6 - (c * 12 + m) / (anios.length * 12) * 0.6); if (g2 <= 0) return;
        ctx.globalAlpha = ap * g2; ctx.fillStyle = q ? colorRet(q.r, lim) : rgba(PALETA.tarjeta, 0.5); ctx.fillRect(x0 + c * cw + 1.5 * u, y + 1.5 * u, cw - 3 * u, filaH - 3 * u);
        if (q && q.parcial) { ctx.strokeStyle = PALETA.blanco; ctx.setLineDash([5 * u, 4 * u]); ctx.lineWidth = 2 * u; ctx.strokeRect(x0 + c * cw + 2 * u, y + 2 * u, cw - 4 * u, filaH - 4 * u); ctx.setLineDash([]); }
        ctx.globalAlpha = ap;
        if (q) rot(env, fN(q.r, {decimales: 1}).replace('-', '−'), x0 + (c + 0.5) * cw, y + filaH * 0.66, 18, 700, tintaSobre(colorRet(q.r, lim)), 'center', `${capa.id ?? 'calendario'}:c${an}-${m}`, {mono: true, alpha: g2, halo: false});
      });
    }
    leyenda(env, B, capa, lim, B.y + B.h - leyH * 0.6, ap);
  } else if (!diario) {
    const filaH = Math.max(S * 1.5, Math.min(S * 2.2, (B.h - leyH - S * 2) / Math.max(1, L.anios.length))), cap = Math.max(3, Math.floor((B.h - leyH - S * 2) / filaH)), anios = L.anios.slice(-cap);
    if (anios.length < L.anios.length) aviso = tr('ce.cal_ultimos', {a: anios.length, b: L.anios.length});
    const x0 = B.x + wA, cw = (B.w - wA) / 12, y0 = B.y + S * 1.6, mostrarNum = med(env, '−12,3', 18, 700, true) < cw - 6 * u;
    nota(env, B, capa.nota ?? tr('ce.cal_mes', {lim: fN(lim, {decimales: lim < 10 ? 1 : 0}), aviso, parcial: L.rets.get(L.ult)?.parcial ? tr('ce.cal_parcial') : ''}), capa.id ?? 'calendario', ap);
    for (let m = 0; m < 12; m++) rot(env, mes3()[m], x0 + cw * (m + 0.5), B.y + S * 1.1, 18, 600, PALETA.piedraOscura, 'center', `${capa.id ?? 'calendario'}:m${m}`, {mono: true, tipo: 'eje-x'});
    anios.forEach((an, r) => {
      const y = y0 + r * filaH, g = ent(env, t0 + 0.2, r, anios.length); rot(env, String(an), B.x + wA - 10 * u, y + filaH * 0.64, 18, 700, PALETA.piedraClara, 'right', `${capa.id ?? 'calendario'}:a${an}`, {mono: true, tipo: 'eje-y', alpha: g});
      for (let m = 0; m < 12; m++) {
        const q = L.rets.get(an * 12 + m), g2 = clamp(p * 1.6 - (r * 12 + m) / (anios.length * 12) * 0.6); if (g2 <= 0) continue;
        ctx.globalAlpha = ap * g2; ctx.fillStyle = q ? colorRet(q.r, lim) : rgba(PALETA.tarjeta, 0.5); ctx.fillRect(x0 + m * cw + 1.5 * u, y + 1.5 * u, cw - 3 * u, filaH - 3 * u);
        if (q && q.parcial) { ctx.strokeStyle = PALETA.blanco; ctx.setLineDash([5 * u, 4 * u]); ctx.lineWidth = 2 * u; ctx.strokeRect(x0 + m * cw + 2 * u, y + 2 * u, cw - 4 * u, filaH - 4 * u); ctx.setLineDash([]); }
        ctx.globalAlpha = ap;
        if (q && mostrarNum) rot(env, fN(q.r, {decimales: 1}).replace('-', '−'), x0 + (m + 0.5) * cw, y + filaH * 0.66, 18, 700, tintaSobre(colorRet(q.r, lim)), 'center', `${capa.id ?? 'calendario'}:c${an}-${m}`, {mono: true, alpha: g2, halo: false});
      }
    });
    leyenda(env, B, capa, lim, B.y + B.h - leyH * 0.6, ap);
  } else {
    const rows = L.dias.some((d) => { const w = new Date(d.x).getUTCDay(); return w === 0 || w === 6; }) ? 7 : 5, cw = Math.min((B.w - wA) / 54, 26 * u), bloque = rows * cw + S * 2.1, cap = Math.max(1, Math.floor((B.h - leyH) / bloque)), anios = [...new Set(L.dias.map((d) => new Date(d.x).getUTCFullYear()))].slice(-cap);
    nota(env, B, capa.nota ?? tr('ce.cal_dia', {lim: fN(lim, {decimales: lim < 10 ? 1 : 0})}), capa.id ?? 'calendario', ap);
    const x0 = B.x + wA;
    anios.forEach((an, r) => {
      const yb = B.y + S * 1.3 + r * bloque, j1 = new Date(Date.UTC(an, 0, 1)), off = (j1.getUTCDay() + 6) % 7;
      rot(env, String(an), B.x + wA - 10 * u, yb + S * 1.0, 18, 700, PALETA.piedraClara, 'right', `${capa.id ?? 'calendario'}:a${an}`, {mono: true, tipo: 'eje-y'});
      for (let m = 0; m < 12; m++) { const dm = Math.floor((Date.UTC(an, m, 1) - Date.UTC(an, 0, 1)) / DIA), wk = Math.floor((dm + off) / 7); rot(env, mes3()[m], x0 + wk * cw, yb - S * 0.35, 18, 500, PALETA.piedraOscura, 'left', `${capa.id ?? 'calendario'}:m${an}-${m}`, {mono: true, tipo: 'eje-x', halo: false}); }
      L.dias.forEach((d) => { const dt = new Date(d.x); if (dt.getUTCFullYear() !== an) return; const dd = Math.floor((d.x - Date.UTC(an, 0, 1)) / DIA), wk = Math.floor((dd + off) / 7), wd = (dt.getUTCDay() + 6) % 7; if (wd >= rows) return; const g = clamp(p * 1.5 - wk / 54 * 0.5); ctx.globalAlpha = ap * g; ctx.fillStyle = colorRet(d.r, lim); ctx.fillRect(x0 + wk * cw + 1 * u, yb + S * 0.3 + wd * cw + 1 * u, cw - 2 * u, cw - 2 * u); });
      ctx.globalAlpha = ap;
    });
    leyenda(env, B, capa, lim, B.y + B.h - leyH * 0.6, ap);
  }
  ctx.restore();
}
function leyenda(env, B, capa, lim, y, ap) {
  const {ctx, u} = env, S = tam(env, 18), w = Math.min(B.w * 0.8, 520 * u), x = B.x + (B.w - w) / 2, h = 18 * u, g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, colorRet(-lim, lim)); g.addColorStop(0.5, colorRet(0, lim)); g.addColorStop(1, colorRet(lim, lim));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  [[-lim, 'left', x], [0, 'center', x + w / 2], [lim, 'right', x + w]].forEach(([v, al, xx], i) => rot(env, v === 0 ? '0 %' : pSigno(v, lim < 10 ? 1 : 0), xx, y + h + S * 1.2, 18, 600, PALETA.piedraClara, al, `${capa.id ?? 'calendario'}:ley${i}`, {mono: true}));
}

// ═══ 7. BARRAS AGRUPADAS por categoría y año ════════════════════════════════════════════════════════════════════
function armarAgrupadas(capa, tab) {
  const idx = capa.series ?? tab.series.map((_, i) => i);
  let mom = capa.momentos;
  if (!mom) { const ok = []; tab.x.forEach((x, i) => { if (idx.every((si) => tab.series[si].y[i] != null)) ok.push(i); }); const k = Math.min(capa.nMomentos ?? 3, ok.length); mom = Array.from({length: k}, (_, q) => ok[Math.round((q * (ok.length - 1)) / Math.max(1, k - 1))]); }
  return {idx, mom, nom: acortarNombres(idx.map((si) => tab.series[si].nombre)), et: mom.map((i) => (tab.tipoX === 'fecha' ? fmtFecha(tab.x[i], 'anio') : String(tab.x[i])))};
}
function agrupadas(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._ag ??= armarAgrupadas(capa, tab)), n = L.idx.length, k = L.mom.length, S = tam(env, 18), N = tam(env, 26), acento = colorDe(capa.color ?? 'oro', 0);
  const cols = L.mom.map((_, j) => mezcla(PALETA.piedraOscura, acento, k > 1 ? j / (k - 1) : 1)), fmt = tab.series[L.idx[0]].fmt;
  const mx = Math.max(...L.idx.flatMap((si) => L.mom.map((i) => tab.series[si].y[i]))), wV = med(env, fN(mx, fmt), 18, 800, true), largo = B.w - wV - 20 * u;
  // leyenda de momentos (colores) — sale en una o varias líneas según el ancho
  let lx = B.x, ly = B.y + S * 1.0; const sw = 18 * u;
  L.et.forEach((e, j) => { const w = med(env, e, 18, 700, true) + sw + 26 * u; if (lx + w > B.x + B.w) { lx = B.x; ly += S * 1.4; } ctx.save(); ctx.globalAlpha *= ap; ctx.fillStyle = cols[j]; ctx.fillRect(lx, ly - sw * 0.8, sw, sw); ctx.restore(); rot(env, e, lx + sw + 8 * u, ly, 18, 700, PALETA.piedraClara, 'left', `${capa.id ?? 'agrupadas'}:l${j}`, {mono: true, alpha: ap}); lx += w; });
  const cab = ly - B.y + S * 0.9, grupoH = (B.h - cab) / n, bh = Math.max(10 * u, Math.min(N * 1.1, (grupoH - N * 1.45) / k - 3 * u)), p = prog(t, t0, t1, CURVA.trazo) * n;
  nota(env, B, capa.nota ?? tr('ce.agrupadas') + uni(fmt), capa.id ?? 'agrupadas', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  L.idx.forEach((si, g) => {
    const a = clamp(p - g), e = ease.out3(a); if (a <= 0) return;
    const y = B.y + cab + g * grupoH, s = tab.series[si];
    rot(env, cortarA(env, L.nom[g], B.w, 26, 700), B.x, y + N * 0.95, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'agrupadas'}:n${g}`, {alpha: e});
    L.mom.forEach((i, j) => {
      const v = s.y[i], yb = y + N * 1.35 + j * (bh + 3 * u), w = (v / mx) * largo * e;
      ctx.fillStyle = cols[j]; ctx.fillRect(B.x, yb, Math.max(w, 1.5 * u), bh);
      if (a > 0.5) rot(env, fN(v, s.fmt), B.x + w + 10 * u, yb + bh * 0.5 + S * 0.35, 18, 800, PALETA.blanco, 'left', `${capa.id ?? 'agrupadas'}:v${g}-${j}`, {mono: true, alpha: clamp((a - 0.5) / 0.5)});
    });
  });
  ctx.restore();
}

// ═══ 8. BULLET / MEDIDOR contra meta y rango histórico ═════════════════════════════════════════════════════════
// Cada fila: la última observación (barra) sobre las bandas «mín–P25 · P25–P75 · P75–máx» de la historia de esa serie, y una meta
// calculada de los datos (mediana, media, máximo, mínimo) o declarada con fuente. Escala desde 0 (o desde el mínimo si hay negativos).
function armarBullet(capa, tab) {
  const idx = capa.series ?? tab.series.map((_, i) => i);
  return idx.map((si) => {
    const s = tab.series[si], par = tab.x.map((x, i) => [x, s.y[i]]).filter((q) => q[1] != null), vs = par.map((q) => q[1]).sort((a, b) => a - b), [xl, v] = par[par.length - 1];
    const mt = capa.meta ?? {tipo: 'mediana'}, media = vs.reduce((a, q) => a + q, 0) / vs.length;
    const meta = mt.valor != null ? mt.valor : mt.tipo === 'media' ? media : mt.tipo === 'max' ? vs[vs.length - 1] : mt.tipo === 'min' ? vs[0] : pctl(vs, 0.5);
    const nomMeta = mt.valor != null ? (mt.etiqueta ?? tr('ce.meta')) : tr({media: 'ce.promedio', max: 'ce.max_hist', min: 'ce.min_hist'}[mt.tipo] ?? 'ce.mediana_n');
    return {nombre: s.nombre, v, fecha: xl, fmt: s.fmt, min: vs[0], max: vs[vs.length - 1], p25: pctl(vs, 0.25), p75: pctl(vs, 0.75), meta, nomMeta, n: vs.length};
  });
}
function bullet(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._bl ??= armarBullet(capa, tab)), n = L.length, S = tam(env, 18), N = tam(env, 26), p = prog(t, t0, t1, CURVA.trazo);
  const lhB = tam(env, 26) * 1.12, LNB = (capa._bn ??= L.map((r) => nombreEnLineas(env, r.nombre, B.w - med(env, fN(r.v, r.fmt), 28, 800, true) - 20 * u, 26, 700, 2))), extB = Math.max(...LNB.map((l) => l.length)) - 1, fila = Math.min((B.h - S * 0.5) / n, N * 7 + extB * lhB), oy = vert ? Math.max(0, (B.h - S * 0.5 - fila * n) / 2) : 0, bh = Math.max(26 * u, N * 1.0);   // vertical: el bloque de medidores se centra en su caja en vez de pegarse arriba
  nota(env, B, capa.nota ?? tr('ce.bullet'), capa.id ?? 'bullet', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  L.forEach((r, i) => {
    const y = B.y + oy + i * fila, g = clamp(p * (n + 1) - i * 0.7), e = ease.out3(g); if (g <= 0) return;
    const lo = Math.min(0, r.min), hi = Math.max(r.max, r.v, r.meta), px = (v) => B.x + ((v - lo) / (hi - lo)) * B.w, yb = y + N * 1.5 + (LNB[i].length - 1) * lhB, c = acento_(capa);
    const vTxt = fN(r.v, r.fmt), wv = med(env, vTxt, 28, 800, true);
    LNB[i].forEach((ln, k) => rot(env, ln, B.x, y + N * 0.95 + k * lhB, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'bullet'}:n${i}:${k}`, {alpha: g}));
    rot(env, vTxt, B.x + B.w, y + N * 0.95, 28, 800, c, 'right', `${capa.id ?? 'bullet'}:v${i}`, {mono: true, alpha: g});
    [[lo, r.p25, 0.34], [r.p25, r.p75, 0.2], [r.p75, hi, 0.1]].forEach(([a, b, k]) => { ctx.fillStyle = rgba(PALETA.piedra, k); ctx.fillRect(px(a), yb, Math.max(0, px(b) - px(a)), bh); });
    ctx.fillStyle = c; ctx.fillRect(Math.min(px(0), px(r.v)), yb + bh * 0.3, Math.abs(px(r.v) - px(0)) * e, bh * 0.4);
    ctx.fillStyle = PALETA.blanco; ctx.fillRect(px(r.meta) - 2.5 * u, yb - 5 * u, 5 * u, bh + 10 * u);
    const ym = yb + bh + S * 1.25, tm_ = `${r.nomMeta} ${fN(r.meta, r.fmt)}`, wm = med(env, tm_, 18, 700, true), xm = clamp(px(r.meta), B.x + wm / 2, B.x + B.w - wm / 2);
    const a0 = fN(lo, {...r.fmt}), a1 = fN(r.max, r.fmt), anch0 = med(env, a0, 18, 500, true), anch1 = med(env, a1, 18, 500, true);
    rot(env, tm_, xm, ym, 18, 700, PALETA.blanco, 'center', `${capa.id ?? 'bullet'}:m${i}`, {mono: true, alpha: g});
    // mínimo y máximo de la historia: solo si no chocan con el rótulo de la meta
    if (xm - wm / 2 > B.x + anch0 + 14 * u) rot(env, a0, B.x, ym, 18, 500, PALETA.piedraOscura, 'left', `${capa.id ?? 'bullet'}:lo${i}`, {mono: true, alpha: g});
    if (xm + wm / 2 < px(hi) - anch1 - 14 * u) rot(env, a1, px(hi), ym, 18, 500, PALETA.piedraOscura, 'right', `${capa.id ?? 'bullet'}:hi${i}`, {mono: true, alpha: g});
  });
  ctx.restore();
}
export const acento_ = (capa) => colorDe(capa.color ?? 'oro', 0);

// ═══ 9. SERIE CON BANDAS (rango histórico por mes del año) ═════════════════════════════════════════════════════
// Para cada mes del calendario: mín–máx y P25–P75 de los años ANTERIORES; encima, la línea del año elegido. Nada se proyecta.
function armarBandas(capa, tab) {
  const y = tab.series[capa.series?.[0] ?? 0].y, mapa = new Map();
  tab.x.forEach((x, i) => { if (y[i] == null) return; const d = new Date(x); mapa.set(d.getUTCFullYear() * 12 + d.getUTCMonth(), y[i]); });   // el último dato de cada mes
  const anios = [...new Set([...mapa.keys()].map((k) => Math.floor(k / 12)))], anio = capa.anio ?? Math.max(...anios), previos = anios.filter((a) => a < anio);
  const bandas = Array.from({length: 12}, (_, m) => { const v = previos.map((a) => mapa.get(a * 12 + m)).filter((q) => q != null).sort((a, b) => a - b); return v.length >= 3 ? {min: v[0], p25: pctl(v, 0.25), med: pctl(v, 0.5), p75: pctl(v, 0.75), max: v[v.length - 1], n: v.length} : null; });
  const actual = Array.from({length: 12}, (_, m) => mapa.get(anio * 12 + m) ?? null);
  return {bandas, actual, anio, desde: Math.min(...previos), hasta: Math.max(...previos), nPrevios: previos.length};
}
function bandas(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._bd ??= armarBandas(capa, tab)), S = tam(env, 18), fmt = tab.series[capa.series?.[0] ?? 0].fmt, acento = acento_(capa);
  const vs = [...L.bandas.filter(Boolean).flatMap((b) => [b.min, b.max]), ...L.actual.filter((q) => q != null)], ticks = ticksNum(Math.min(...vs) - (Math.max(...vs) - Math.min(...vs)) * 0.04, Math.max(...vs) + (Math.max(...vs) - Math.min(...vs)) * 0.04, 5);
  const lo = Math.min(...vs), hi = Math.max(...vs), a = Math.min(ticks[0], lo), b = Math.max(ticks[ticks.length - 1], hi), etY = (v) => fN(v, {...fmt, prefijo: '', sufijo: '', decimales: decDe(ticks[1] - ticks[0])}), wEje = Math.max(...ticks.map((v) => med(env, etY(v), 18, 500, true))) + 14 * u;
  const cab = S * 2.8, x0 = B.x + wEje, x1 = B.x + B.w - 10 * u, y0 = B.y + cab, y1 = B.y + B.h - S * 1.9, px = (m) => x0 + ((m + 0.5) / 12) * (x1 - x0), py = (v) => y1 - ((v - a) / (b - a)) * (y1 - y0), reveal = prog(t, t0, t1, CURVA.trazo);
  nota(env, B, capa.nota ?? tr('ce.bandas', {desde: L.desde, hasta: L.hasta, anio: L.anio, u: uni(fmt)}), capa.id ?? 'bandas', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  ticks.forEach((v) => { const y = py(v); ctx.strokeStyle = rgba(PALETA.piedra, 0.07); ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etY(v), x0 - 10 * u, y + S * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${capa.id ?? 'bandas'}:y${v}`, {mono: true, tipo: 'eje-y'}); });
  const idx = L.bandas.map((q, m) => (q ? m : -1)).filter((m) => m >= 0), poligono = (k1, k2) => { ctx.beginPath(); idx.forEach((m, i) => { const x = px(m), y = py(L.bandas[m][k1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); [...idx].reverse().forEach((m) => ctx.lineTo(px(m), py(L.bandas[m][k2]))); ctx.closePath(); };
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0 - 6 * u, (x1 - x0) * clamp(reveal * 1.2), y1 - y0 + 12 * u); ctx.clip();
  poligono('max', 'min'); ctx.fillStyle = rgba(PALETA.piedra, 0.17); ctx.fill(); poligono('p75', 'p25'); ctx.fillStyle = rgba(PALETA.piedra, 0.3); ctx.fill();
  ctx.strokeStyle = rgba(PALETA.piedraClara, 0.8); ctx.lineWidth = 2 * u; ctx.setLineDash([8 * u, 7 * u]); ctx.beginPath(); idx.forEach((m, i) => { const x = px(m), y = py(L.bandas[m].med); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  mes3().forEach((mm, m) => rot(env, mm, px(m), y1 + S * 1.3, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${capa.id ?? 'bandas'}:x${m}`, {mono: true, tipo: 'eje-x'}));
  // línea del año
  const pts = L.actual.map((v, m) => (v == null ? null : [px(m), py(v), m, v])).filter(Boolean), vis = Math.min(pts.length - 1, reveal * (pts.length - 1) * 1.0 + 0.0001);
  ctx.strokeStyle = acento; ctx.lineWidth = 5 * u; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
  pts.forEach((q, i) => { if (i > Math.floor(vis) + 1) return; const f = i > vis ? vis - Math.floor(vis) : 1, pr = pts[i - 1] ?? q, x = i > vis ? lerp(pr[0], q[0], f) : q[0], y = i > vis ? lerp(pr[1], q[1], f) : q[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  pts.forEach((q, i) => { if (i <= vis) { ctx.fillStyle = acento; ctx.beginPath(); ctx.arc(q[0], q[1], 6 * u, 0, 7); ctx.fill(); } });
  const last = pts[pts.length - 1];
  if (last && reveal > 0.97) { const txt = `${mes3()[last[2]].toUpperCase()} ${L.anio}: ${fN(last[3], fmt)}`, w = med(env, txt, 18, 800, true), xx = clamp(last[0], x0 + w / 2, x1 - w / 2), arriba = last[1] - y0 > S * 2.4; rot(env, txt, xx, arriba ? last[1] - 16 * u : last[1] + S * 1.9, 18, 800, acento, 'center', `${capa.id ?? 'bandas'}:ultimo`, {mono: true, alpha: ent(env, t1, 0)}); }
  ctx.restore();
}

// ═══ 10. PICTOGRAMA («cada cuadro = x») ═════════════════════════════════════════════════════════════════════════
function armarPicto(capa, tab, B, env) {
  const items = tab.items.filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, capa.max ?? 8), mx = items[0].valor, sq = Math.min(34 * env.u * (env.H > env.W ? 1.0 : 1.15), B.w / 14), capSq = Math.max(6, Math.min(30, Math.floor(B.w / (sq * 1.28))));
  const raw = mx / capSq, mag = Math.pow(10, Math.floor(Math.log10(raw))), unidad = [1, 2, 5, 10].map((m) => m * mag).find((q) => q >= raw - 1e-12) ?? 10 * mag;
  return {items, unidad, sq, total: tab.items.reduce((a, i) => a + Math.max(0, i.valor), 0), omitidas: tab.items.filter((i) => i.valor > 0).length - items.length};
}
function pictograma(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._pc ??= armarPicto(capa, tab, B, env)), n = L.items.length, S = tam(env, 18), N = tam(env, 26), pal = paleta(), p = prog(t, t0, t1, CURVA.trazo) * n, lhP = tam(env, 26) * 1.12, LN = (capa._pn ??= L.items.map((it) => { const pct = (it.valor / L.total) * 100; return nombreEnLineas(env, it.nombre, B.w - med(env, `${fN(it.valor, tab.fmt)}  ·  ${pTxt(pct, decPct(pct))}`, 26, 800, true) - 24 * u, 26, 700, 3); })), ext = Math.max(...LN.map((l) => l.length)) - 1, fila = Math.min((B.h - S * 2) / n, (vert ? N * 4.1 : N * 3.2) + L.sq * (vert ? 1.9 : 1.4) + ext * lhP), cab = S * 1.9;
  nota(env, B, capa.nota ?? tr('ce.picto', {un: fN(L.unidad, tab.fmt), om: L.omitidas ? tr('ce.picto_om', {n, m: n + L.omitidas}) : ''}), capa.id ?? 'pictograma', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  L.items.forEach((it, i) => {
    const a = clamp(p - i), y = B.y + (i * fila), col = pal[i % pal.length]; if (a <= 0) return;
    const pct = (it.valor / L.total) * 100, tx = `${fN(it.valor, tab.fmt)}  ·  ${pTxt(pct, decPct(pct))}`, wT = med(env, tx, 26, 800, true);
    LN[i].forEach((ln, k) => rot(env, ln, B.x, y + N * 0.95 + k * lhP, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'pictograma'}:n${i}:${k}`, {alpha: ease.out3(a)}));
    rot(env, tx, B.x + B.w, y + N * 0.95, 26, 800, col, 'right', `${capa.id ?? 'pictograma'}:v${i}`, {mono: true, alpha: clamp((a - 0.3) / 0.7)});
    const cuadros = it.valor / L.unidad, completos = Math.floor(cuadros + 1e-9), paso = L.sq * 1.28, yq = y + N * 1.35 + (LN[i].length - 1) * lhP;
    for (let q = 0; q <= completos; q++) {
      const fr = q < completos ? 1 : cuadros - completos; if (fr <= 1e-9) continue;
      const g = clamp(a * (cuadros + 1) - q); if (g <= 0) continue;
      ctx.fillStyle = rgba(PALETA.tarjeta, 1); ctx.fillRect(B.x + q * paso, yq, L.sq, L.sq);
      ctx.fillStyle = col; ctx.fillRect(B.x + q * paso, yq + L.sq * (1 - fr), L.sq * Math.min(1, g * 1.0), L.sq * fr);
    }
  });
  ctx.restore();
}

// ═══ 11. RANKING POR PAÍS (o entidad) con código ISO / ticker en vez de bandera ═══════════════════════════════════
// El nombre puede venir como «COL · Colombia»: lo anterior a « · » es el código (ISO-3, ISO-2, ticker) y se dibuja en una ficha de texto.
function armarRanking(capa, tab, vert, maxDef) {
  const todos = tab.items.filter((i) => i.valor != null).sort((a, b) => b.valor - a.valor).map((it, r) => { const m = String(it.nombre).split(' · '); return {...it, rank: r + 1, codigo: m.length > 1 ? m[0].trim() : null, nombre: m.length > 1 ? m.slice(1).join(' · ').trim() : it.nombre}; });
  const max = capa.max ?? maxDef ?? (vert ? 7 : 9), top = todos.slice(0, max), res = capa.resalta ? todos.find((i) => i.nombre === capa.resalta || i.codigo === capa.resalta) : null;
  return {todos, filas: res && !top.includes(res) ? [...top.slice(0, max - 1), {salto: true}, res] : top, res, omitidas: todos.length - top.length};
}
function ranking(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.5, 5], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const N = tam(env, 26), L = (capa._rk ??= armarRanking(capa, tab, vert, Math.max(6, Math.min(14, Math.floor(B.h / (N * 2.45)))))), n = L.filas.length, S = tam(env, 18), pal = paleta(), p = prog(t, t0, t1, CURVA.trazo) * n, fila = Math.min(B.h / n, N * 3.1), acento = acento_(capa);
  const vmax = L.todos[0].valor, anyNeg = L.todos.some((i) => i.valor < 0), wC = Math.max(...L.filas.filter((f) => f.codigo).map((f) => med(env, f.codigo, 18, 800, true) + 22 * u), 0), wR = med(env, '10', 18, 800, true) + 12 * u;
  const wV = Math.max(...L.filas.filter((f) => !f.salto).map((f) => med(env, fN(f.valor, tab.fmt), 26, 800, true))), x0 = B.x, xb = x0 + wR + wC + 8 * u, largo = B.x + B.w - xb - wV - 18 * u;
  nota(env, B, capa.nota ?? tr('ce.ranking', {cero: anyNeg ? '' : tr('ce.ranking_cero'), om: L.omitidas > 0 ? tr('ce.ranking_om', {n: n - (L.filas.some((f) => f.salto) ? 1 : 0), m: L.todos.length}) : ''}), capa.id ?? 'ranking', ap);
  ctx.save(); ctx.globalAlpha *= ap;
  L.filas.forEach((f, i) => {
    const a = clamp(p - i), e = ease.out3(a), y = B.y + i * fila; if (a <= 0) return;
    if (f.salto) { rot(env, '⋮', x0 + wR / 2, y + fila * 0.6, 26, 700, PALETA.piedraOscura, 'center', `${capa.id ?? 'ranking'}:salto`, {alpha: e}); return; }
    const col = L.res && f === L.res ? acento : f.rank === 1 ? acento : PALETA.piedraClara, yb = y + N * 1.4, bh = Math.max(12 * u, N * 0.5);
    rot(env, String(f.rank), x0 + wR, y + N * 0.95, 18, 800, PALETA.piedraOscura, 'right', `${capa.id ?? 'ranking'}:r${i}`, {mono: true, alpha: e});
    let xn = xb;
    if (f.codigo) { const w = wC - 8 * u; ctx.fillStyle = rgba(col, 0.22); ctx.globalAlpha = ap * e; ctx.beginPath(); ctx.roundRect(x0 + wR + 6 * u, y + N * 0.1, w, N * 1.1, 8 * u); ctx.fill(); ctx.globalAlpha = ap; rot(env, f.codigo, x0 + wR + 6 * u + w / 2, y + N * 0.93, 18, 800, col, 'center', `${capa.id ?? 'ranking'}:c${i}`, {mono: true, alpha: e}); }
    rot(env, cortarA(env, f.nombre, B.x + B.w - xn - 10 * u, 26, 700), xn, y + N * 0.95, 26, 700, PALETA.blanco, 'left', `${capa.id ?? 'ranking'}:n${i}`, {alpha: e});
    const wBar = Math.max(1.5 * u, (Math.max(0, f.valor) / vmax) * largo * e);
    ctx.globalAlpha = ap * e; ctx.fillStyle = col; ctx.fillRect(xn, yb, wBar, bh); ctx.globalAlpha = ap;
    if (a > 0.4) rot(env, fN(f.valor, tab.fmt), xn + wBar + 12 * u, yb + bh * 0.5 + tam(env, 26) * 0.32, 26, 800, PALETA.blanco, 'left', `${capa.id ?? 'ranking'}:v${i}`, {mono: true, alpha: clamp((a - 0.4) / 0.6)});
  });
  ctx.restore();
}

// ═══ 12. DOS HITOS (una serie diaria, dos fechas-hito) ═══════════════════════════════════════════════════════════
// Cada hito rebasa la MISMA serie a base 100 en el cierre de su fecha; las dos curvas se alinean por SESIONES desde el hito (no por fecha).
// Panel superior: crecimiento base 100 (eje logarítmico por defecto si máx/mín > 5). Panel inferior: caída desde el máximo acumulado.
// Etiquetas en la punta (nombre + fecha), contador de sesión, anotaciones de máximo y suelo, sombreado «sin proyección» donde una serie termina,
// tabla viva (retorno, caída hoy, peor caída) que al final se cambia por dos KPI. NINGUNA cifra se teclea: todo sale de la serie (calcularDosHitos).
const msIso = (f) => { if (typeof f === 'number') return f; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(f ?? '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
const isoDe = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Cálculo puro (sin dibujar) del modelo: devuelve {errores, avisos, hitos:[{nombre, fecha, base, n, v[], dd[], ddMin[], pico, suelo, ret, ddFin, peor}], nMax, lo, hi, escala, corto}.
 * v = valor rebasado (valor ÷ valor del hito × 100); dd = % de caída respecto al máximo acumulado (≤ 0); sesiones = filas con dato desde el hito.
 */
export function calcularDosHitos(capa, tab) {
  const r = {errores: [], avisos: [], hitos: [], nMax: 0, lo: null, hi: null, escala: 'lineal', corto: null};
  const si = capa.series?.[0] ?? 0, S = tab.series?.[si];
  if (!S) { r.errores.push(`serie ${si} no existe (hay ${tab.series?.length ?? 0}).`); return r; }
  const hs = capa.hitos;
  if (!Array.isArray(hs) || hs.length !== 2) { r.errores.push(`dos_hitos necesita exactamente 2 hitos en "hitos":[{"fecha":"AAAA-MM-DD","nombre":"…"},…] (hay ${Array.isArray(hs) ? hs.length : 0}).`); return r; }
  const X = [], Y = [];
  tab.x.forEach((x, i) => { if (S.y[i] != null) { X.push(x); Y.push(S.y[i]); } });
  if (X.length < 60) { r.errores.push(`dos_hitos necesita una serie diaria con muchos datos (hay ${X.length}).`); return r; }
  if (pasoMediano(X) > 5 * DIA) { r.errores.push(`dos_hitos necesita una serie diaria (hay un dato cada ${Math.round(pasoMediano(X) / DIA)} días): las sesiones se cuentan por fila con dato.`); return r; }
  hs.forEach((h, k) => {
    const nombre = String(h?.nombre ?? '').trim() || tr('ch.hito_n', {n: k + 1}), ms = msIso(h?.fecha);
    if (!Number.isFinite(ms)) { r.errores.push(`el hito ${k + 1} no tiene una fecha AAAA-MM-DD válida.`); return; }
    if (ms < X[0]) { r.errores.push(`el hito «${nombre}» (${isoDe(ms)}) cae antes del primer dato (${isoDe(X[0])}).`); return; }
    let j = -1; for (let q = 0; q < X.length && X[q] <= ms; q++) j = q;
    if (ms - X[j] > 5 * DIA) { r.errores.push(`el hito «${nombre}» (${isoDe(ms)}) no tiene una sesión a menos de 5 días (la anterior es ${isoDe(X[j])}).`); return; }
    if (X[j] !== ms) r.avisos.push(`la fecha del hito «${nombre}» (${isoDe(ms)}) no es una sesión con dato; se usa la sesión anterior (${isoDe(X[j])}).`);
    const n = X.length - j, base = Y[j];
    if (!(base > 0)) { r.errores.push(`en el hito «${nombre}» el valor base no es positivo.`); return; }
    if (n < 30) { r.errores.push(`desde el hito «${nombre}» quedan solo ${n} sesiones; hacen falta al menos 30.`); return; }
    const v = new Array(n), dd = new Array(n), ddMin = new Array(n);
    let mx = -Infinity, pk = 0, peor = 0, sPeor = 0;
    for (let s = 0; s < n; s++) {
      v[s] = (Y[j + s] / base) * 100;
      if (v[s] > mx) mx = v[s];
      if (v[s] > v[pk]) pk = s;
      dd[s] = (v[s] / mx - 1) * 100;
      if (dd[s] < peor) { peor = dd[s]; sPeor = s; }
      ddMin[s] = peor;
    }
    r.hitos.push({nombre, fuente: String(h?.fuente ?? "").trim(), pedida: ms, fila: j, fecha: X[j], exacta: X[j] === ms, base, n, v, dd, ddMin, x: X.slice(j), pico: {s: pk, v: v[pk], x: X[j + pk]}, suelo: peor < 0 ? {s: sPeor, dd: peor, x: X[j + sPeor]} : null, ret: v[n - 1] - 100, ddFin: dd[n - 1], peor});
  });
  if (r.errores.length) return r;
  if (r.hitos[0].fila === r.hitos[1].fila) { r.errores.push(`los dos hitos caen en la misma sesión (${isoDe(r.hitos[0].fecha)}); no hay nada que comparar.`); return r; }
  const todos = r.hitos.flatMap((h) => [h.pico.v, Math.min(...h.v)]);
  r.lo = Math.min(...todos, 100); r.hi = Math.max(...todos, 100);
  r.nMax = Math.max(...r.hitos.map((h) => h.n)) - 1;
  const quiere = capa.escala ?? 'auto';
  if (quiere === 'log') { if (r.lo > 0) r.escala = 'log'; else r.errores.push('la escala logarítmica necesita valores positivos.'); }
  else if (quiere === 'auto' && r.lo > 0 && r.hi / r.lo > 5) r.escala = 'log';
  else if (quiere !== 'auto' && quiere !== 'lineal') r.errores.push(`escala debe ser auto, lineal o log (no «${quiere}»).`);
  const [a, b] = r.hitos;
  if (a.n !== b.n) r.corto = a.n < b.n ? 0 : 1;
  return r;
}

/** Marcas del eje de crecimiento (base 100). En log: 100·2ᵏ; si no salen 3–7, décadas o 1-2-5; si tampoco, marcas lineales sobre el eje log. */
function ticksHitos(lo, hi, log) {
  if (!log) return ticksNum(lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.05, 5);
  const dentro = (v) => v >= lo / 1.0001 && v <= hi * 1.0001, pot2 = [], dec = [];
  for (let k = -14; k <= 14; k++) { const v = 100 * Math.pow(2, k); if (dentro(v)) pot2.push(v); const w = 100 * Math.pow(10, k); if (dentro(w)) dec.push(w); }
  if (pot2.length >= 3 && pot2.length <= 7) return pot2;
  if (dec.length >= 3) return dec;
  const c125 = ticksLog10(lo, hi).filter(dentro);
  if (c125.length >= 3) return c125;
  return ticksNum(lo, hi, 5).filter((v) => v > 0);
}

function dosHitos(env, capa) {
  const {ctx, u, t, H, W} = env, tab = env.tablas[capa.datos], vert = H > W;
  const B = cajaDef(env, capa), [t0, t1] = capa.t ?? [0.9, 8.9], ap = aparece(env, capa, t0); if (ap <= 0) return;
  const L = (capa._dh ??= calcularDosHitos(capa, tab)); if (L.errores.length) return;
  const id = capa.id ?? 'dos_hitos', S = tam(env, 18), N = tam(env, 26), lhS = S * 1.3, lhN = N * 1.15, lhA = S * 1.25;
  const col = [0, 1].map((k) => colorDe(capa.colores?.[k], k)), colT = col.map((c) => legible(c, PALETA.fondo)), nM = L.nMax, hs = L.hitos;
  const sCur = prog(t, t0, t1, CURVA.trazo) * nM, tSwap = t1 + (capa.espera ?? 3.4);
  const log = L.escala === 'log', fx = log ? Math.log : (v) => v;
  const rojo = legible(COLOR.rojo, PALETA.fondo), verde = legible(COLOR.verde, PALETA.fondo);
  const colSigno = (v) => (v > 0.0005 ? verde : v < -0.0005 ? rojo : PALETA.blanco);
  // ── textos que hacen falta ya para repartir el espacio
  const nombres = hs.map((h) => h.nombre), fechas = hs.map((h) => fmtFecha(h.fecha, 'dia'));
  const capNom = vert ? B.w - Math.max(...fechas.map((s) => med(env, s, 18, 700, true))) - 40 * u : 0.2 * (B.w - Math.min(B.w * 0.3, 540 * u) - 36 * u);
  const lnom = nombres.map((s) => nombreEnLineas(env, s, capNom, 26, 800, vert ? 1 : 2));
  const wG = vert ? 12 * u : Math.max(...lnom.flatMap((ls) => ls.map((s) => med(env, s, 26, 800))), ...fechas.map((s) => med(env, s, 18, 700, true))) + 22 * u, hLeyenda = vert ? 2 * lhN + 10 * u : 0;   // vertical: nombres en una leyenda sobre la gráfica (el piso de 40 px no deja cuneta)
  // ── regiones: gráfica (izquierda o arriba) y tabla/KPI (derecha o abajo)
  const gapB = 36 * u, wTab = vert ? B.w : Math.min(B.w * 0.3, 540 * u), rowH = S * 1.75, bw = vert ? (B.w - 24 * u) / 2 : wTab;
  const txtPeor = hs.map((h) => tr('ch.kpi_peor', {v: fmtPct(h.peor, 1)})), lnPeor = txtPeor.map((s) => (med(env, s, 18, 700, true) <= bw - 24 * u ? [s] : [])), lnAviso = lineasDe(env, capa.aviso ?? tr('ch.aviso'), vert ? B.w : wTab, 18, 600, 2);
  const lnomK = nombres.map((s) => nombreEnLineas(env, s, bw - 24 * u, 26, 800, 2)), hBloque = Math.max(...lnomK.map((ls) => ls.length * lhN)) + lhS * 2 + tam(env, 64) * 1.15 + Math.max(...lnPeor.map((ls) => ls.length * lhS)) + 12 * u;
  const hAviso = lnAviso.length * lhS + 8 * u, hTabV = Math.max(hBloque + hAviso + 12 * u, rowH * 4 + 8 * u);
  const area = vert ? {x: B.x, y: B.y, w: B.w, h: B.h - hTabV - gapB} : {x: B.x, y: B.y, w: B.w - wTab - gapB, h: B.h};
  const tabB = vert ? {x: B.x, y: B.y + B.h - hTabV, w: B.w, h: hTabV} : {x: B.x + B.w - wTab, y: B.y, w: wTab, h: B.h};
  // ── ejes
  const tkG = ticksHitos(L.lo, L.hi, log), a = Math.min(L.lo, tkG[0]) / (log ? 1.03 : 1), b = Math.max(L.hi, tkG[tkG.length - 1]) * (log ? 1.03 : 1);
  const decG = tkG.every((v) => Math.abs(v - Math.round(v)) < 1e-9) ? 0 : 1, etG = (v) => fN(v, {decimales: decG});
  const peorTodos = Math.min(...hs.map((h) => h.peor)), aD = Math.min(peorTodos, -1), tkD = ticksNum(aD, 0, vert ? 3 : 4), aDd = Math.min(aD, tkD[0]);
  const etD = (v) => fmtPct(v, 0), wEje = Math.max(...tkG.map((v) => med(env, etG(v), 18, 500, true)), ...tkD.map((v) => med(env, etD(v), 18, 500, true))) + 14 * u;
  const x0 = area.x + wEje, x1 = area.x + area.w - wG, px = (s) => x0 + (s / nM) * (x1 - x0);
  // ── alto de los dos paneles
  const rowT = S * 1.6, gapV = 14 * u, axisH = lhS * 2.35, flex = Math.max(120 * u, area.h - 2 * rowT - hLeyenda - gapV - axisH), hG = flex * 0.6, hD = flex - hG;
  const yG0 = area.y + rowT + hLeyenda, yG1 = yG0 + hG, yD0 = yG1 + gapV + rowT, yD1 = yD0 + hD;
  // anotaciones: una línea si cabe, si no dos (valor / fecha); el panel reserva ese alto
  const wOne = (s) => med(env, s, 18, 800, true), ancho = (x1 - x0) * 0.9;
  const txP = hs.map((h) => tr('ch.pico', {v: fN(h.pico.v, {decimales: 1})})), fP = hs.map((h) => fmtFecha(h.pico.x, 'dia'));
  const txS = hs.map((h) => (h.suelo ? tr('ch.suelo', {v: fmtPct(h.suelo.dd, 1)}) : '')), fS = hs.map((h) => (h.suelo ? fmtFecha(h.suelo.x, 'dia') : ''));
  const unaP = hs.map((_, k) => wOne(`${txP[k]} · ${fP[k]}`) <= ancho), unaS = hs.map((_, k) => !hs[k].suelo || wOne(`${txS[k]} · ${fS[k]}`) <= ancho);
  const padTop = Math.max(...unaP.map((o) => (o ? 1 : 2) * lhA)) + 16 * u, padBot = Math.max(...unaS.map((o) => (o ? 1 : 2) * lhA)) + 16 * u;
  const py = (v) => yG1 - 3 * u - ((fx(v) - fx(a)) / (fx(b) - fx(a))) * (yG1 - 3 * u - (yG0 + padTop));
  const pyD = (v) => yD0 + 3 * u + (v / aDd) * (yD1 - padBot - (yD0 + 3 * u));
  const cab = (k) => Math.min(sCur, hs[k].n - 1), fila = (k) => Math.floor(cab(k) + 1e-9);

  nota(env, B, capa.nota ?? tr('ch.nota', {log: log ? tr('ch.nota_log') : ''}), id, ap);
  ctx.save(); ctx.globalAlpha *= ap;
  // ── títulos de panel y contador de sesión
  rot(env, tr('ch.panel_crec'), area.x, area.y + S * 1.05, 18, 700, PALETA.piedraClara, 'left', `${id}:tg`, {mono: true});
  const nTxt = fN(Math.floor(sCur + 1e-9), {decimales: 0}), wNum = med(env, fN(nM, {decimales: 0}), 18, 800, true);   // el rótulo «SESIÓN» queda quieto y solo corre el número
  rot(env, nTxt, area.x + area.w, area.y + S * 1.05, 18, 800, PALETA.blanco, 'right', `${id}:sesion`, {mono: true});
  rot(env, tr('ch.sesion'), area.x + area.w - wNum - 12 * u, area.y + S * 1.05, 18, 700, PALETA.piedraClara, 'right', `${id}:sesion_l`, {mono: true});
  rot(env, tr('ch.panel_caida'), area.x, yG1 + gapV + S * 1.05, 18, 700, PALETA.piedraClara, 'left', `${id}:td`, {mono: true});
  // ── rejillas y marcas de los dos ejes Y
  ctx.lineWidth = 1 * u;
  tkG.forEach((v) => { const y = py(v); ctx.strokeStyle = rgba(PALETA.piedra, 0.08); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etG(v), x0 - 10 * u, y + S * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${id}:g${v}`, {mono: true, tipo: 'eje-y'}); });
  tkD.forEach((v) => { const y = pyD(v); ctx.strokeStyle = rgba(PALETA.piedra, v === 0 ? 0.3 : 0.08); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); rot(env, etD(v), x0 - 10 * u, y + S * 0.35, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'right', `${id}:d${v}`, {mono: true, tipo: 'eje-y'}); });
  ctx.strokeStyle = rgba(PALETA.piedraClara, 0.45); ctx.lineWidth = 1.5 * u; ctx.setLineDash([6 * u, 6 * u]); ctx.beginPath(); ctx.moveTo(x0, py(100)); ctx.lineTo(x1, py(100)); ctx.stroke(); ctx.setLineDash([]);
  // ── sesiones (eje X compartido)
  const tkX = ticksNum(0, nM, vert ? 4 : 6).filter((v) => Number.isInteger(v)), yAx = yD1 + lhS * 0.95;
  tkX.forEach((v) => rot(env, fN(v, {decimales: 0}), px(v), yAx, 18, 500, rgba(PALETA.piedraOscura, 0.95), 'center', `${id}:x${v}`, {mono: true, tipo: 'eje-x', lim: [area.x, area.x + area.w]}));
  rot(env, tr('ch.eje_x'), (x0 + x1) / 2, yAx + lhS * 1.2, 18, 600, PALETA.piedraClara, 'center', `${id}:ejex`, {mono: true});
  // ── geometría estática (de la serie completa): obstáculos para colocar los rótulos sin que pisen las curvas ni otros rótulos
  const vG = (k, s) => py(hs[k].v[s]), vD = (k, s) => pyD(hs[k].dd[s]);
  const muestra = (k, val) => { const h = hs[k], paso = Math.max(1, Math.floor(h.n / 240)), o = []; for (let s = 0; s < h.n; s += paso) o.push([px(s), val(k, s)]); o.push([px(h.n - 1), val(k, h.n - 1)]); return o; };
  const ptsG = [0, 1].flatMap((k) => muestra(k, vG)), ptsD = [0, 1].flatMap((k) => muestra(k, vD));
  const dentro = (pts, c, m = 3 * u) => { let q = 0; for (const [x, y] of pts) if (x > c[0] - m && x < c[2] + m && y > c[1] - m && y < c[3] + m) q++; return q; };
  const cruza = (c, o, m = 5 * u) => c[0] < o[2] + m && c[2] > o[0] - m && c[1] < o[3] + m && c[3] > o[1] - m;
  const cajaPunto = (X, Y) => [X - 11 * u, Y - 11 * u, X + 11 * u, Y + 11 * u];
  // máximo (panel de crecimiento) y suelo (panel de caída): punto + rótulo de 1 o 2 líneas, en el sitio con menos choques
  const anots = [];
  hs.forEach((h, k) => anots.push({k, tipo: 'pico', s: h.pico.s, X: px(h.pico.s), Y: py(h.pico.v), lin: unaP[k] ? [`${txP[k]} · ${fP[k]}`] : [txP[k], fP[k]], panel: 'G'}));
  hs.forEach((h, k) => { if (h.suelo) anots.push({k, tipo: 'suelo', s: h.suelo.s, X: px(h.suelo.s), Y: pyD(h.suelo.dd), lin: unaS[k] ? [`${txS[k]} · ${fS[k]}`] : [txS[k], fS[k]], panel: 'D'}); });
  const ocupadas = {G: [], D: []};
  anots.forEach((q) => { q.punto = cajaPunto(q.X, q.Y); ocupadas[q.panel].push(q.punto); });
  const ORD = {pico: ['arriba', 'arribaI', 'arribaD', 'abajo', 'abajoI', 'abajoD', 'izq', 'der'], suelo: ['abajo', 'abajoI', 'abajoD', 'arriba', 'arribaI', 'arribaD', 'izq', 'der']};
  anots.forEach((q) => {
    const wB = Math.max(...q.lin.map(wOne)), hB2 = q.lin.length * lhA, g = 14 * u, cl = (xl) => clamp(xl, x0 + 2 * u, x1 - wB - 2 * u);
    const C = {arriba: [cl(q.X - wB / 2), q.Y - g - hB2], abajo: [cl(q.X - wB / 2), q.Y + g], arribaD: [cl(q.X - 12 * u), q.Y - g - hB2], arribaI: [cl(q.X + 12 * u - wB), q.Y - g - hB2], abajoD: [cl(q.X - 12 * u), q.Y + g], abajoI: [cl(q.X + 12 * u - wB), q.Y + g], izq: [cl(q.X - 16 * u - wB), q.Y - hB2 / 2], der: [cl(q.X + 16 * u), q.Y - hB2 / 2]};
    const [y0p, y1p] = q.panel === 'G' ? [yG0, yG1] : [yD0, yD1], pts = q.panel === 'G' ? ptsG : ptsD; let mejor = null;
    ORD[q.tipo].forEach((nm, i) => {
      const [xl, yt] = C[nm], c = [xl, yt, xl + wB, yt + hB2];
      const sc = dentro(pts, c) + ocupadas[q.panel].reduce((r, o) => r + (o !== q.punto && cruza(c, o) ? 400 : 0), 0) + (cruza(c, q.punto, 0) ? 4000 : 0) + (yt < y0p + 2 * u || yt + hB2 > y1p - 2 * u ? 4000 : 0) + i * 0.5;
      if (!mejor || sc < mejor.sc) mejor = {sc, c};
    });
    q.caja = mejor.c; ocupadas[q.panel].push(mejor.c);
  });
  // rótulos de la punta (nombre + fecha): van en la cuneta de la derecha, a la altura de la cabeza de su curva (separados entre sí) y unidos a ella por un hilo punteado
  const hB = lnom.map((ls) => ls.length * lhN + lhS), wL = [0, 1].map((k) => Math.max(...lnom[k].map((s) => med(env, s, 26, 800)), med(env, fechas[k], 18, 700, true)));
  // sombreado «sin proyección» donde una serie ya terminó, con su rótulo en el hueco más libre (texto completo; si no cabe sin tocar una curva, el corto)
  let cajaProy = null, xeCorto = null;
  if (L.corto != null) {
    const kc = L.corto, sEnd = hs[kc].n - 1, xe = px(sEnd), wr = x1 - xe - 20 * u;
    xeCorto = xe;
    const variantes = [tr('ch.sin_proy', {nombre: nombres[kc].toUpperCase(), n: fN(sEnd, {decimales: 0})}), tr('ch.sin_proy_corto')];
    if (wr > 100 * u) for (const txt of variantes) {
      ctx.save(); ctx.font = F(env, 600, 18, true);
      const ls = envolverEntero(ctx, txt, wr, 4); ctx.restore();
      if (!ls) continue;
      const hCaja = ls.length * lhA + 6 * u, wCaja = Math.max(...ls.map((s2) => med(env, s2, 18, 600, true))); let mejor = null;
      for (const xl of [xe + 10 * u, x1 - 8 * u - wCaja]) for (let q = 0; q < 10; q++) {
        const yt = yG0 + 3 * u + ((yG1 - 3 * u - hCaja) - (yG0 + 3 * u)) * (q / 9), c = [xl, yt, xl + wCaja, yt + hCaja];
        const sc = dentro(ptsG, c) + ocupadas.G.reduce((r, o) => r + (cruza(c, o) ? 400 : 0), 0) + q * 0.01;
        if (!mejor || sc < mejor.sc) mejor = {sc, y: yt, x: xl};
      }
      if (!cajaProy || mejor.sc < cajaProy.sc - 1e-9) cajaProy = {sc: mejor.sc, y: mejor.y, ls, x: mejor.x};
      if (mejor.sc < 2) break;
    }
  }
  const fa = L.corto != null ? prog(sCur, hs[L.corto].n - 1, hs[L.corto].n - 1 + nM * 0.03, ease.out3) : 0;
  if (fa > 0.02) {
    ctx.save(); ctx.globalAlpha *= fa;
    ctx.fillStyle = rgba(PALETA.piedra, 0.1); ctx.fillRect(xeCorto, yG0, x1 - xeCorto, hG); ctx.fillRect(xeCorto, yD0, x1 - xeCorto, hD);
    ctx.strokeStyle = rgba(PALETA.piedraClara, 0.6); ctx.lineWidth = 1.5 * u; ctx.setLineDash([4 * u, 5 * u]);
    ctx.beginPath(); ctx.moveTo(xeCorto, yG0); ctx.lineTo(xeCorto, yG1); ctx.moveTo(xeCorto, yD0); ctx.lineTo(xeCorto, yD1); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  if (cajaProy) cajaProy.ls.forEach((s, i) => rot(env, s, cajaProy.x, cajaProy.y + (i + 0.85) * lhA, 18, 600, rgba(PALETA.piedraClara, 0.95), 'left', `${id}:proy${i}`, {mono: true, alpha: fa}));
  // ── las curvas
  const traza = (k, y0c, y1c, val) => {
    const h = hs[k], hd = cab(k), n0 = Math.floor(hd + 1e-9);
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 2 * u, y0c, x1 - x0 + 4 * u, y1c - y0c); ctx.clip();
    ctx.strokeStyle = col[k]; ctx.lineWidth = 4 * u; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    for (let s = 0; s <= n0; s++) { const X = px(s), Y = val(k, s); s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    if (n0 < h.n - 1 && hd > n0) { const f = hd - n0; ctx.lineTo(lerp(px(n0), px(n0 + 1), f), lerp(val(k, n0), val(k, n0 + 1), f)); }
    ctx.stroke(); ctx.restore();
  };
  [1, 0].forEach((k) => { traza(k, yG0 - 4 * u, yG1 + 4 * u, vG); traza(k, yD0 - 4 * u, yD1 + 4 * u, vD); });
  // cabezas de las curvas (punto con aro del color del fondo)
  const cabeza = (k, val) => { const hd = cab(k), n0 = Math.floor(hd + 1e-9), f = hd - n0, Xh = n0 < hs[k].n - 1 ? lerp(px(n0), px(n0 + 1), f) : px(n0), Yh = n0 < hs[k].n - 1 ? lerp(val(k, n0), val(k, n0 + 1), f) : val(k, n0); ctx.fillStyle = PALETA.fondo; ctx.beginPath(); ctx.arc(Xh, Yh, 8 * u, 0, 7); ctx.fill(); ctx.fillStyle = col[k]; ctx.beginPath(); ctx.arc(Xh, Yh, 5.5 * u, 0, 7); ctx.fill(); return [Xh, Yh]; };
  const puntas = [0, 1].map((k) => { cabeza(k, vD); return cabeza(k, vG); });
  // ── rótulos de la punta: nombre + fecha, en la cuneta, a la altura de cada cabeza; si dos se pisan se separan en vertical
  const gE = ent(env, t0 + 0.3), lx = x1 + 16 * u, cyL = relajar1D(puntas.map((p, k) => ({x: p[1], w: hB[k]})), {min: yG0, max: yG1 + 2 * u, gap: 8 * u});
  if (vert) [0, 1].forEach((k) => {   // vertical: leyenda sobre la gráfica (trazo del color + nombre + fecha); el piso de 40 px no deja cuneta a la derecha
    const yy = area.y + rowT + k * lhN, wn = med(env, lnom[k][0], 26, 800);
    ctx.fillStyle = col[k]; ctx.fillRect(area.x, yy + lhN * 0.5 - 2.5 * u, 30 * u, 5 * u);
    rot(env, lnom[k][0], area.x + 44 * u, yy + lhN * 0.78, 26, 800, colT[k], 'left', `${id}:n${k}.0`, {alpha: gE});
    rot(env, fechas[k], area.x + 44 * u + wn + 18 * u, yy + lhN * 0.78, 18, 700, PALETA.piedraClara, 'left', `${id}:f${k}`, {mono: true, alpha: gE});
  });
  else [0, 1].forEach((k) => {
    const top = cyL[k] - hB[k] / 2, xh = puntas[k][0], yh = puntas[k][1];
    ctx.save(); ctx.globalAlpha *= gE * 0.75; ctx.strokeStyle = col[k]; ctx.lineWidth = 1.5 * u; ctx.setLineDash([3 * u, 4 * u]); ctx.beginPath();
    ctx.moveTo(xh + 9 * u, yh); ctx.lineTo(x1 + 4 * u, yh); if (Math.abs(cyL[k] - yh) > 2 * u) ctx.lineTo(lx - 5 * u, cyL[k]); else ctx.lineTo(lx - 5 * u, yh);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    lnom[k].forEach((s, i) => rot(env, s, lx, top + (i + 0.8) * lhN, 26, 800, colT[k], 'left', `${id}:n${k}.${i}`, {alpha: gE}));
    rot(env, fechas[k], lx, top + lnom[k].length * lhN + lhS * 0.75, 18, 700, PALETA.piedraClara, 'left', `${id}:f${k}`, {mono: true, alpha: gE});
  });
  // ── máximo y suelo: punto + rótulo, cuando la curva llega a él
  anots.forEach((q) => {
    const al = prog(sCur, q.s, q.s + nM * 0.02, ease.out3); if (al <= 0.02) return;
    ctx.save(); ctx.globalAlpha *= al;
    ctx.fillStyle = PALETA.fondo; ctx.beginPath(); ctx.arc(q.X, q.Y, 9 * u, 0, 7); ctx.fill(); ctx.fillStyle = col[q.k]; ctx.beginPath(); ctx.arc(q.X, q.Y, 6.5 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = PALETA.blanco; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(q.X, q.Y, 9 * u, 0, 7); ctx.stroke();
    ctx.restore();
    const xc = (q.caja[0] + q.caja[2]) / 2;
    q.lin.forEach((s2, i) => rot(env, s2, xc, q.caja[1] + (i + 0.82) * lhA, 18, 800, i ? PALETA.piedraClara : colT[q.k], 'center', `${id}:${q.tipo}${q.k}.${i}`, {mono: true, alpha: al}));
  });
  // ── tabla viva (retorno, caída hoy, peor caída) → al final, dos KPI grandes
  const aTab = ent(env, t0 + 0.4) * (1 - prog(t, tSwap, tSwap + 0.35, ease.out3)), aKpi = prog(t, tSwap + 0.45, tSwap + 0.95, ease.out3);
  const act = hs.map((h, k) => { const i = fila(k); return {ret: h.v[i] - 100, dd: h.dd[i], peor: h.ddMin[i]}; });
  if (aTab > 0.03) {
    const lab = [tr('ch.retorno'), tr('ch.caida_hoy'), tr('ch.peor_caida')], wl = Math.max(...lab.map((s) => med(env, s, 18, 600))) + 14 * u, wv = (tabB.w - wl) / 2;
    const largo = Math.max(...fechas.map((s) => med(env, s, 18, 700, true))) < wv - 6 * u, cabT = hs.map((h) => fmtFecha(h.fecha, largo ? 'dia' : 'mes'));
    const yT = tabB.y + Math.max(0, (tabB.h - rowH * 4) / 2);
    ctx.save(); ctx.globalAlpha *= aTab;
    [0, 1].forEach((k) => rot(env, cabT[k], tabB.x + wl + wv * (k + 1), yT + rowH * 0.7, 18, 800, colT[k], 'right', `${id}:th${k}`, {mono: true}));
    for (let r = 0; r < 3; r++) {
      const yb = yT + rowH * (r + 1); ctx.strokeStyle = rgba(PALETA.piedra, 0.18); ctx.lineWidth = 1 * u; ctx.beginPath(); ctx.moveTo(tabB.x, yb + 2 * u); ctx.lineTo(tabB.x + tabB.w, yb + 2 * u); ctx.stroke();
      rot(env, lab[r], tabB.x, yb + rowH * 0.74, 18, 600, PALETA.piedraClara, 'left', `${id}:tl${r}`);
      [0, 1].forEach((k) => { const v = r === 0 ? act[k].ret : r === 1 ? act[k].dd : act[k].peor; rot(env, fmtPct(v, 1), tabB.x + wl + wv * (k + 1), yb + rowH * 0.74, 18, 800, colSigno(v), 'right', `${id}:tv${r}.${k}`, {mono: true}); });
    }
    ctx.restore();
  }
  if (aKpi > 0.03) {
    ctx.save(); ctx.globalAlpha *= aKpi;
    const hb = vert ? hBloque : (tabB.h - hAviso - 24 * u) / 2;
    [0, 1].forEach((k) => {
      const bx = vert ? tabB.x + k * (bw + 24 * u) : tabB.x, by = vert ? tabB.y : tabB.y + k * (hb + 12 * u);
      ctx.fillStyle = col[k]; ctx.fillRect(bx, by, 4 * u, hb - 6 * u);
      let yy = by; const xx = bx + 16 * u;
      lnomK[k].forEach((s, i) => rot(env, s, xx, yy + (i + 0.8) * lhN, 26, 800, colT[k], 'left', `${id}:kn${k}.${i}`)); yy += lnomK[k].length * lhN;
      rot(env, fechas[k], xx, yy + lhS * 0.75, 18, 700, PALETA.piedraClara, 'left', `${id}:kf${k}`, {mono: true}); yy += lhS;
      rot(env, tr('ch.retorno').toUpperCase(), xx, yy + lhS * 0.75, 18, 600, PALETA.piedraClara, 'left', `${id}:kl${k}`); yy += lhS;
      rot(env, fmtPct(hs[k].ret, 1), xx, yy + tam(env, 64) * 0.9, 64, 800, colSigno(hs[k].ret), 'left', `${id}:kv${k}`, {mono: true}); yy += tam(env, 64) * 1.15;
      lnPeor[k].forEach((s, i) => rot(env, s, xx, yy + (i + 0.8) * lhS, 18, 700, colSigno(hs[k].peor), 'left', `${id}:kp${k}.${i}`, {mono: true}));
    });
    lnAviso.forEach((s, i) => rot(env, s, tabB.x, tabB.y + tabB.h - hAviso + (i + 0.85) * lhS, 18, 600, rgba(PALETA.piedraClara, 0.95), 'left', `${id}:aviso${i}`, {halo: false}));
    ctx.restore();
  }
  ctx.restore();
}

export const CAPAS_EXTRA = {radar, apilada, velas, histograma, dumbbell, calendario, agrupadas, bullet, bandas, pictograma, ranking, dos_hitos: dosHitos, ...CAPAS_DISTRIB};

// ═══ VALIDACIÓN (la usa compilar.mjs): errores = no se dibuja; avisos y métodos = salen en el informe ═════════════
/** Devuelve {errores[], avisos[], metodos[], cifras[]}. Se evalúa sobre la tabla ya cargada; nunca inventa nada. */
export function validarExtra(capa, tab, donde) {
  const e = [], a = [], m = [], c = [], clase = EXTRA_CLASE[capa.tipo], esCat = tab.tipoX === 'categorias', esSerie = !esCat && tab.tipoX !== 'flujos';
  if (tab.tipoX === 'flujos') return {errores: [`${donde}: ${capa.tipo} no usa tablas de flujos.`], avisos: a, metodos: m, cifras: c};
  if (clase === 'serie' && !esSerie) return {errores: [`${donde}: ${capa.tipo} necesita una serie de tiempo, y estos datos son una tabla de categorías.`], avisos: a, metodos: m, cifras: c};
  if (clase === 'categorias' && !esCat) return {errores: [`${donde}: ${capa.tipo} necesita datos de tipo "categorias" (concepto, valor).`], avisos: a, metodos: m, cifras: c};
  const idx = capa.series ?? (esSerie ? tab.series.map((_, i) => i) : []);
  (capa.series ?? []).forEach((s) => { if (esSerie && !tab.series[s]) e.push(`${donde}: serie ${s} no existe (hay ${tab.series.length}).`); });
  const cifra = (o) => c.push({capa: donde, ...o});
  switch (capa.tipo) {
    case 'radar': {
      if (esSerie) {
        if (idx.length < 3 || idx.length > 8) e.push(`${donde}: el radar necesita de 3 a 8 series (hay ${idx.length}).`);
        idx.forEach((si) => { const v = tab.series[si].y.filter((q) => q != null); if (v.length < 5 || Math.max(...v) === Math.min(...v)) e.push(`${donde}: la serie «${tab.series[si].nombre}» no varía o tiene muy pocos datos: no se puede normalizar su eje.`); else { const last = tab.x.length - 1 - [...tab.series[si].y].reverse().findIndex((q) => q != null); cifra({tipo: 'eje de radar', serie: tab.series[si].nombre, minimo: Math.min(...v), maximo: Math.max(...v), ultimo: tab.series[si].y[last], fecha: fmtFecha(tab.x[last], 'dia'), normalizado: +(((tab.series[si].y[last] - Math.min(...v)) / (Math.max(...v) - Math.min(...v))) * 100).toFixed(2)}); } });
        m.push(`${donde}: cada eje se normaliza como (último − mínimo histórico) ÷ (máximo − mínimo) × 100 sobre la historia completa de ESA serie; las series no se comparan entre sí en nivel, solo en su posición dentro de su propio rango.`);
        const fin = idx.map((si) => { const k = tab.x.length - 1 - [...tab.series[si].y].reverse().findIndex((q) => q != null); return tab.x[k]; }); if (Math.max(...fin) - Math.min(...fin) > 400 * DIA) a.push(`${donde}: las series terminan en fechas distintas (${fmtFecha(Math.min(...fin), 'mes')} a ${fmtFecha(Math.max(...fin), 'mes')}); cada eje usa SU último dato.`);
      } else {
        if (tab.items.length < 3) e.push(`${donde}: el radar necesita al menos 3 filas (hay ${tab.items.length}).`);
        if (tab.items.length > (capa.max ?? 8)) a.push(`${donde}: se dibujan solo las primeras ${capa.max ?? 8} de ${tab.items.length} filas.`);
        if (tab.items.some((i) => i.valor < 0)) e.push(`${donde}: el radar no admite valores negativos.`);
        m.push(`${donde}: los ejes comparten una escala común de 0 a un máximo redondo sobre el mayor valor; los valores deben venir ya en la misma unidad o normalizados (decláralo en la fuente).`);
      }
      break;
    }
    case 'apilada': {
      if (idx.length < 2 || idx.length > 8) e.push(`${donde}: la apilada necesita de 2 a 8 series (hay ${idx.length}).`);
      const un = new Set(idx.map((si) => tab.series[si].fmt?.unidad ?? '')); if (un.size > 1) e.push(`${donde}: las series tienen unidades distintas (${[...un].join(' / ')}): solo se pueden apilar magnitudes de la misma unidad.`);
      let neg = false, filas = 0; tab.x.forEach((x, i) => { if (idx.every((si) => tab.series[si].y[i] != null)) { filas++; if (idx.some((si) => tab.series[si].y[i] < 0)) neg = true; } });
      if (neg) e.push(`${donde}: hay valores negativos; un área apilada solo representa partes positivas de un total.`);
      if (filas < 3) e.push(`${donde}: solo ${filas} momentos tienen todas las series con dato.`); else if (filas < tab.x.length) a.push(`${donde}: se usan ${filas} de ${tab.x.length} momentos: solo aquellos en que TODAS las series tienen dato (no se rellena nada).`);
      m.push(`${donde}: ${capa.modo === 'pct' ? 'cada franja es su valor ÷ la suma de todas las series en ese momento × 100 (suma 100 %)' : 'las series se apilan sumando sus valores; el total de cada momento es la suma exacta de las franjas'}. Orden vertical: mayor peso medio abajo.`);
      break;
    }
    case 'velas': {
      if (capa.ohlc) { if (capa.ohlc.length !== 4 || capa.ohlc.some((k) => !tab.series[k])) e.push(`${donde}: «ohlc» debe nombrar 4 series existentes [apertura, máximo, mínimo, cierre].`); else { let mal = 0; tab.x.forEach((_, i) => { const [o, h, l, cc] = capa.ohlc.map((k) => tab.series[k].y[i]); if ([o, h, l, cc].every((v) => v != null) && (h < Math.max(o, cc) - 1e-9 || l > Math.min(o, cc) + 1e-9)) mal++; }); if (mal) a.push(`${donde}: ${mal} fila(s) tienen el máximo por debajo de apertura/cierre o el mínimo por encima (dato inconsistente de la fuente).`); } m.push(`${donde}: velas con apertura, máximo, mínimo y cierre reales de la fuente.`); }
      else {
        if (pasoMediano(tab.x) > 5 * DIA) e.push(`${donde}: las velas necesitan datos diarios (o columnas de apertura, máximo, mínimo y cierre). Estos datos tienen un dato cada ${Math.round(pasoMediano(tab.x) / DIA)} días.`);
        if (idx.length !== 1) a.push(`${donde}: sin columnas OHLC solo se usa la primera serie (cierres).`);
        m.push(`${donde}: SOLO HAY CIERRES: cada vela agrupa un periodo (semana, mes, trimestre o año) y usa primer cierre = apertura, último cierre = cierre, mayor y menor cierre = mechas. No son los extremos del día; se declara en pantalla.`);
        a.push(`${donde}: velas armadas solo con cierres (la fuente no trae apertura, máximo ni mínimo). Con columnas OHLC reales serían exactas.`);
      }
      break;
    }
    case 'histograma': {
      const v = valoresHist(capa, tab); if (v.length < 30) e.push(`${donde}: hay solo ${v.length} observaciones; un histograma necesita al menos 30.`);
      if (capa.sobre === 'retornos' && tab.series[idx[0] ?? 0].y.some((q) => q != null && q <= 0)) a.push(`${donde}: la serie tiene valores ≤ 0; los retornos solo se calculan donde el valor anterior es positivo.`);
      m.push(`${donde}: histograma de ${capa.sobre === 'retornos' ? 'retornos entre filas consecutivas (v[t]/v[t−1] − 1)' : 'los valores de la serie'} con ancho de barra redondo; cada barra = % de las ${v.length} observaciones.${capa.sobre === 'retornos' ? ' El rango mostrado va del percentil 0,5 al 99,5; las colas se agrupan en las barras de los extremos.' : ''}`);
      break;
    }
    case 'dumbbell': {
      if (esCat) { const k = tab.items.filter((i) => i.anterior != null); if (k.length < 2) e.push(`${donde}: el dumbbell necesita al menos 2 filas con valor y valor anterior (columna «anterior»).`); if (k.length < tab.items.length) a.push(`${donde}: ${tab.items.length - k.length} fila(s) sin valor anterior no se dibujan.`); }
      else { if (idx.length < 2 || idx.length > 8) e.push(`${donde}: el dumbbell necesita de 2 a 8 series (hay ${idx.length}).`); const un = new Set(idx.map((si) => tab.series[si].fmt?.unidad ?? '')); if (un.size > 1) e.push(`${donde}: las series tienen unidades distintas (${[...un].join(' / ')}): el dumbbell usa una sola escala.`); const n = tab.x.length, de = capa.de ?? 0, aa = capa.a ?? n - 1; if (!Number.isInteger(de) || !Number.isInteger(aa) || de < 0 || aa >= n || de >= aa) e.push(`${donde}: «de» y «a» deben ser posiciones enteras con de < a.`); }
      m.push(`${donde}: dos puntos por fila en una escala común (${esCat ? 'valor anterior y valor actual de la tabla' : 'primer y último momento de la tabla'}); el % de cambio es actual ÷ anterior − 1.`);
      break;
    }
    case 'calendario': {
      if (pasoMediano(tab.x) > 5 * DIA) e.push(`${donde}: el calendario necesita datos diarios (hay un dato cada ${Math.round(pasoMediano(tab.x) / DIA)} días).`);
      const L = armarCalendario(capa, tab, false); if (!L.anios.length) e.push(`${donde}: no hay dos meses consecutivos con dato para calcular un retorno mensual.`);
      m.push(`${donde}: ${capa.modo === 'diario' ? 'retorno de cada día = cierre ÷ cierre anterior − 1 (solo entre filas separadas ≤ 5 días)' : 'retorno de cada mes = último cierre del mes ÷ último cierre del mes anterior − 1; el primer mes de la serie no tiene mes previo y queda vacío'}. El color se satura en ±${fN(L.lim, {decimales: 1})} % (percentil 95 de los retornos absolutos, redondeado).`);
      break;
    }
    case 'agrupadas': {
      if (idx.length < 2 || idx.length > 8) e.push(`${donde}: las barras agrupadas necesitan de 2 a 8 series (hay ${idx.length}).`);
      const un = new Set(idx.map((si) => tab.series[si].fmt?.unidad ?? '')); if (un.size > 1) e.push(`${donde}: las series tienen unidades distintas (${[...un].join(' / ')}): comparten una sola escala.`);
      if (idx.some((si) => tab.series[si].y.some((q) => q != null && q < 0))) e.push(`${donde}: las barras agrupadas parten de 0 y no admiten valores negativos.`);
      const mm = capa.momentos ?? armarAgrupadas(capa, tab).mom; if (mm.length < 2) e.push(`${donde}: hacen falta al menos 2 momentos con dato en todas las series.`);
      (capa.momentos ?? []).forEach((i) => { if (!Number.isInteger(i) || i < 0 || i >= tab.x.length) e.push(`${donde}: el momento ${i} no existe en la tabla.`); else if (idx.some((si) => tab.series[si].y[i] == null)) e.push(`${donde}: en el momento ${i} falta el dato de alguna serie.`); });
      m.push(`${donde}: grupos = series; barras de cada grupo = ${mm.length} momentos repartidos de forma uniforme entre los que tienen dato en todas las series (incluye el primero y el último).`);
      break;
    }
    case 'bullet': {
      if (idx.length < 1 || idx.length > 5) e.push(`${donde}: el bullet admite de 1 a 5 series (hay ${idx.length}).`);
      idx.forEach((si) => { if (tab.series[si].y.filter((q) => q != null).length < 8) e.push(`${donde}: la serie «${tab.series[si].nombre}» tiene muy pocos datos para dar un rango histórico.`); });
      if (capa.meta?.valor != null && !capa.meta.verificada?.fuente) e.push(`${donde}: una meta escrita a mano debe declarar "meta":{"valor","verificada":{"fuente","url"}}. Si no, usa "meta":{"tipo":"mediana|media|max|min"}, que se calcula de los datos.`);
      else if (capa.meta?.valor != null) a.push(`${donde}: meta ${capa.meta.valor} escrita a mano, declarada verificada en ${capa.meta.verificada.fuente}${capa.meta.verificada.url ? ' · ' + capa.meta.verificada.url : ''}.`);
      if (capa.meta?.tipo && !['mediana', 'media', 'max', 'min'].includes(capa.meta.tipo)) e.push(`${donde}: meta.tipo debe ser mediana, media, max o min.`);
      if (idx.some((si) => tab.series[si].y.some((q) => q != null && q < 0))) a.push(`${donde}: hay valores negativos; la escala arranca en el mínimo histórico.`);
      armarBullet(capa, tab).forEach((r) => cifra({tipo: 'bullet', serie: r.nombre, ultimo: r.v, fecha: fmtFecha(r.fecha, 'dia'), minimo: r.min, p25: r.p25, p75: r.p75, maximo: r.max, meta: r.meta, tipoMeta: r.nomMeta}));
      m.push(`${donde}: bandas = mínimo, percentil 25, percentil 75 y máximo de la historia completa de cada serie (interpolación lineal entre filas); meta calculada de esos mismos datos salvo que se declare verificada.`);
      break;
    }
    case 'bandas': {
      if (pasoMediano(tab.x) > 45 * DIA) e.push(`${donde}: la serie con bandas por mes necesita datos al menos mensuales.`);
      else { const L = armarBandas(capa, tab); if (L.nPrevios < 4) e.push(`${donde}: hacen falta al menos 4 años anteriores a ${L.anio} (hay ${L.nPrevios}).`); else m.push(`${donde}: para cada mes, mínimo, P25, mediana, P75 y máximo de ${L.nPrevios} años (${L.desde}–${L.hasta}), usando el último dato de cada mes; encima, ${L.anio} con sus datos reales. No se proyecta nada.`); }
      break;
    }
    case 'pictograma': {
      if (tab.items.some((i) => i.valor < 0)) e.push(`${donde}: el pictograma no admite valores negativos.`);
      if (tab.items.filter((i) => i.valor > 0).length < 2) e.push(`${donde}: necesito al menos 2 partes con valor positivo.`);
      m.push(`${donde}: cada cuadro vale una unidad redonda (1, 2 o 5 × 10ⁿ) elegida para que la mayor parte quepa en una fila; los cuadros incompletos son fracciones exactas. Se declara en pantalla.`);
      break;
    }
    case 'ranking': {
      if (tab.items.length < 3) e.push(`${donde}: un ranking necesita al menos 3 filas.`);
      if (tab.items.some((i) => i.valor < 0)) e.push(`${donde}: el ranking de barras no admite valores negativos (usa «divergente» o «dumbbell»).`);
      if (capa.resalta && !tab.items.some((i) => i.nombre === capa.resalta || String(i.nombre).startsWith(capa.resalta + ' · '))) a.push(`${donde}: «${capa.resalta}» no está en los datos; no se resalta nada.`);
      m.push(`${donde}: ordenado de mayor a menor; barras proporcionales al valor. El código (ISO o ticker) sale del texto anterior a « · » en el concepto; no se dibujan banderas.`);
      break;
    }
    case 'dos_hitos': {
      if (idx.length !== 1) a.push(`${donde}: dos_hitos usa una sola serie; se usa la primera.`);
      const R = calcularDosHitos(capa, tab); R.errores.forEach((x) => e.push(`${donde}: ${x}`)); R.avisos.forEach((x) => a.push(`${donde}: ${x}`));
      if (R.errores.length) break;
      R.hitos.forEach((h) => { if (!h.fuente) a.push(`${donde}: el hito «${h.nombre}» no declara fuente: la fecha y el nombre son una afirmación sin verificar.`); cifra({tipo: 'hito', hito: h.nombre, fuente: h.fuente || null, fecha: fmtFecha(h.fecha, 'dia'), base: h.base, sesiones: h.n - 1, retorno_pct: +h.ret.toFixed(4), caida_actual_pct: +h.ddFin.toFixed(4), peor_caida_pct: +h.peor.toFixed(4), fecha_peor_caida: h.suelo ? fmtFecha(h.suelo.x, 'dia') : null, maximo_base100: +h.pico.v.toFixed(4), fecha_maximo: fmtFecha(h.pico.x, 'dia')}); });
      if (R.corto != null) a.push(`${donde}: «${R.hitos[R.corto].nombre}» termina en la sesión ${R.hitos[R.corto].n - 1} y «${R.hitos[1 - R.corto].nombre}» sigue hasta la ${R.hitos[1 - R.corto].n - 1}; la parte sin la serie corta se sombrea «sin proyección» y no se proyecta nada.`);
      m.push(`${donde}: cada hito rebasa la serie a base 100 en el cierre de su fecha (valor ÷ valor del hito × 100) y las dos curvas se alinean por sesiones (filas con dato) desde el hito, no por fecha. Caída = valor ÷ máximo acumulado desde el hito − 1; retorno = valor ÷ valor del hito − 1. Eje de crecimiento ${R.escala === 'log' ? 'LOGARÍTMICO (máximo/mínimo > 5)' : 'lineal'}. Se calcula todo de la serie; no se proyecta nada.`);
      break;
    }
    default: { if (TIPOS_DISTRIB.includes(capa.tipo)) { const r = validarDistrib(capa, tab, donde); e.push(...r.errores); a.push(...r.avisos); m.push(...r.metodos); c.push(...r.cifras); } break; }
  }
  return {errores: e, avisos: a, metodos: m, cifras: c};
}
