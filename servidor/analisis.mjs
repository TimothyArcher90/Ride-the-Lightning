// Análisis de datos para quien no es analista: momentos clave detectados A PARTIR DE LOS DATOS (nunca inventados) y
// "salud" de cada serie (¿está al día? ¿cuánto histórico tiene?). Todo se calcula aquí, una sola vez, y la interfaz solo lo muestra.
import {fmtNum, fmtFecha, fmtPct} from '../motor/nucleo.js';
import {t, registrar, conIdioma} from '../motor/idioma.js';

registrar('analisis', {
  sin_descargar: {es: 'Aún no descargada: se descarga completa al elegirla.', en: 'Not downloaded yet: it downloads in full when you pick it.'},
  al_dia: {es: 'Al día · último dato: {fin}', en: 'Up to date · latest data: {fin}'},
  atrasada: {es: 'Último dato: {fin} ({atraso} días de atraso para una serie {frec}). La fuente puede haber dejado de actualizarla.', en: 'Latest data: {fin} ({atraso} days behind for a {frec} series). The source may have stopped updating it.'},
  lic_restringida: {es: 'Uso restringido: puede no servir para contenido monetizado', en: 'Restricted use: may not be allowed for monetized content'},
  lic_libre: {es: 'Uso abierto (cita la fuente)', en: 'Open use (cite the source)'},
  m_primero: {es: 'Primer dato', en: 'First data point'}, m_subida: {es: 'Mayor subida', en: 'Biggest rise'}, m_caida: {es: 'Mayor caída', en: 'Biggest drop'},
  m_max: {es: 'Máximo', en: 'Peak'}, m_min: {es: 'Mínimo', en: 'Low'}, m_ultimo: {es: 'Último dato', en: 'Latest data point'},
  e_primero: {es: 'Donde empieza la serie: {v} en {a}.', en: 'Where the series starts: {v} in {a}.'},
  e_subida: {es: 'La subida más fuerte en un tramo de {W} periodos: {d} (de {v0} en {a0} a {v1} en {a1}).', en: 'The strongest rise over a stretch of {W} periods: {d} (from {v0} in {a0} to {v1} in {a1}).'},
  e_caida: {es: 'La caída más fuerte en un tramo de {W} periodos: {d} (de {v0} en {a0} a {v1} en {a1}).', en: 'The sharpest drop over a stretch of {W} periods: {d} (from {v0} in {a0} to {v1} in {a1}).'},
  e_max: {es: 'El valor más alto de toda la serie: {v} en {a}.', en: 'The highest value in the whole series: {v} in {a}.'},
  e_min: {es: 'El valor más bajo de toda la serie: {v} en {a}.', en: 'The lowest value in the whole series: {v} in {a}.'},
  e_ultimo: {es: 'El dato más reciente: {v} en {a}.', en: 'The most recent data point: {v} in {a}.'},
});

const DIA = 86400000;
// Días de retraso aceptables según la frecuencia de la serie antes de avisar de que está "atrasada".
// Las series mensuales se fechan el día 1 del mes y se publican con 3–6 semanas de retraso: 80 días es lo normal, no una alarma.
const TOLERANCIA_DIAS = {diaria: 6, semanal: 14, mensual: 80, trimestral: 150, anual: 540};
const frecuenciaClave = (f = '') => { const s = f.toLowerCase(); return s.includes('diaria') ? 'diaria' : s.includes('seman') ? 'semanal' : s.includes('mensual') ? 'mensual' : s.includes('trimest') ? 'trimestral' : s.includes('anual') ? 'anual' : 'mensual'; };

/** Estado de actualización de una serie descargada: {estado:'al_dia'|'atrasada'|'sin_descargar', texto, diasDeAtraso}. */
export function salud(entrada, meta, hoy = Date.now(), idioma = null) { return conIdioma(idioma, () => saludEn(entrada, meta, hoy)); }
function saludEn(entrada, meta, hoy) {
  if (!meta) return {estado: 'sin_descargar', texto: t('analisis.sin_descargar')};
  const fin = Date.parse(/^-?\d{4,}/.test(meta.fin) ? meta.fin : `${meta.fin}-01-01`);
  const atraso = Math.max(0, Math.round((hoy - fin) / DIA)), tol = TOLERANCIA_DIAS[frecuenciaClave(entrada.frecuencia)];
  if (atraso <= tol) return {estado: 'al_dia', texto: t('analisis.al_dia', {fin: meta.fin}), diasDeAtraso: atraso};
  return {estado: 'atrasada', texto: t('analisis.atrasada', {fin: meta.fin, atraso, frec: frecuenciaClave(entrada.frecuencia)}), diasDeAtraso: atraso};
}

/** Tipo de licencia en lenguaje simple. */
export function licencia(entrada, idioma = null) { return conIdioma(idioma, () => licenciaEn(entrada)); }
function licenciaEn(entrada) {
  const l = String(entrada.licencia ?? '');
  if (/\bNC\b|personal|no redistribuir|investigaci/i.test(l)) return {nivel: 'restringida', texto: t('analisis.lic_restringida')};
  return {nivel: 'libre', texto: t('analisis.lic_libre')};
}

const idxValidos = (y) => y.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0);

/**
 * Momentos que vale la pena contar, calculados sobre la serie: primer dato, mayor subida, mayor caída, máximo, mínimo y último.
 * Cada uno trae su explicación en lenguaje llano y un ancla estable (los semánticos se reajustan solos si los datos se actualizan).
 */
export function momentos(tab, si = 0, idioma = null) { return conIdioma(idioma, () => momentosEn(tab, si)); }
function momentosEn(tab, si) {
  const s = tab.series[si], y = s.y, x = tab.x, fmt = s.fmt, ok = idxValidos(y);
  if (ok.length < 3) return [];
  const esFecha = tab.tipoX === 'fecha';
  const par = esFecha ? (i) => fmtFecha(x[i], 'anio') : (i) => String(x[i]);
  const v = (i) => fmtNum(y[i], fmt);
  const W = Math.max(3, Math.round(ok.length / 25));
  const positivos = ok.every((i) => y[i] > 0);
  let mejorSubida = null, peorCaida = null;
  for (let k = W; k < ok.length; k++) {
    const i = ok[k], j = ok[k - W], cambio = positivos ? y[i] / y[j] - 1 : y[i] - y[j];
    if (mejorSubida === null || cambio > mejorSubida.cambio) mejorSubida = {i, j, cambio};
    if (peorCaida === null || cambio < peorCaida.cambio) peorCaida = {i, j, cambio};
  }
  let imax = ok[0], imin = ok[0];
  for (const i of ok) { if (y[i] > y[imax]) imax = i; if (y[i] < y[imin]) imin = i; }
  const primero = ok[0], ultimo = ok[ok.length - 1];
  const desc = (c) => (positivos ? fmtPct(c * 100, 0) : (c >= 0 ? '+' : '−') + fmtNum(Math.abs(c), fmt));
  const M = [
    {tipo: 'primero', etiqueta: t('analisis.m_primero'), i: primero, ancla: {primero: true}, explicacion: t('analisis.e_primero', {v: v(primero), a: par(primero)})},
    mejorSubida && mejorSubida.cambio > 0 && {tipo: 'subida', etiqueta: t('analisis.m_subida'), i: mejorSubida.i, ancla: esFecha ? {fecha: new Date(x[mejorSubida.i]).toISOString().slice(0, 10)} : {indice: mejorSubida.i},
      explicacion: t('analisis.e_subida', {W, d: desc(mejorSubida.cambio), v0: v(mejorSubida.j), a0: par(mejorSubida.j), v1: v(mejorSubida.i), a1: par(mejorSubida.i)})},
    peorCaida && peorCaida.cambio < 0 && {tipo: 'caida', etiqueta: t('analisis.m_caida'), i: peorCaida.i, ancla: esFecha ? {fecha: new Date(x[peorCaida.i]).toISOString().slice(0, 10)} : {indice: peorCaida.i},
      explicacion: t('analisis.e_caida', {W, d: desc(peorCaida.cambio), v0: v(peorCaida.j), a0: par(peorCaida.j), v1: v(peorCaida.i), a1: par(peorCaida.i)})},
    {tipo: 'max', etiqueta: t('analisis.m_max'), i: imax, ancla: {max: true}, explicacion: t('analisis.e_max', {v: v(imax), a: par(imax)})},
    {tipo: 'min', etiqueta: t('analisis.m_min'), i: imin, ancla: {min: true}, explicacion: t('analisis.e_min', {v: v(imin), a: par(imin)})},
    {tipo: 'ultimo', etiqueta: t('analisis.m_ultimo'), i: ultimo, ancla: {ultimo: true}, explicacion: t('analisis.e_ultimo', {v: v(ultimo), a: par(ultimo)})},
  ].filter(Boolean);
  // sin duplicados: dos momentos casi en el mismo punto dejan solo el más informativo
  const prioridad = {max: 0, min: 0, caida: 1, subida: 1, primero: 2, ultimo: 2}, tol = Math.max(2, Math.round(x.length / 40)), out = [];
  for (const m of [...M].sort((a, b) => prioridad[a.tipo] - prioridad[b.tipo])) if (!out.some((o) => Math.abs(o.i - m.i) <= tol)) out.push(m);
  const defecto = new Set(['max', 'caida', 'subida']);
  return out.sort((a, b) => a.i - b.i).map((m) => ({id: `${m.tipo}-${m.i}`, tipo: m.tipo, etiqueta: m.etiqueta, ancla: m.ancla, anio: par(m.i), valor: v(m.i), explicacion: m.explicacion, seleccionado: defecto.has(m.tipo)}));
}

/** Resumen de una tabla compilada, para mostrar "qué hay en este dato" sin jerga. */
export function resumenSerie(tab, si = 0) {
  const s = tab.series[si], ok = idxValidos(s.y), esFecha = tab.tipoX === 'fecha';
  const a = ok[0], b = ok[ok.length - 1];
  const vals = ok.map((i) => s.y[i]);
  return {
    filas: ok.length, desde: esFecha ? fmtFecha(tab.x[a], 'anio') : tab.x[a], hasta: esFecha ? fmtFecha(tab.x[b], 'anio') : tab.x[b],
    desdeISO: esFecha ? new Date(tab.x[a]).toISOString().slice(0, 10) : null, hastaISO: esFecha ? new Date(tab.x[b]).toISOString().slice(0, 10) : null,
    min: Math.min(...vals), max: Math.max(...vals), positivos: vals.every((v) => v > 0), razonMaxMin: Math.max(...vals) / Math.max(1e-12, Math.min(...vals)),
    pasoDias: esFecha && ok.length > 1 ? Math.round((tab.x[b] - tab.x[a]) / (ok.length - 1) / DIA) : null,
  };
}
