// Esquema por serie: unidad, frecuencia y rango plausible. Valida los datos NUEVOS al descargarlos (servidor/catalogo.mjs → descargar),
// antes de escribir nada en datos/biblioteca/. Un esquema en una entrada del catálogo es:
//   esquema: {unidad: '% anual', frecuencia: 'M'|'Q'|'A'|'D', min: -2, max: 100, saltoMax?: 25, irregular?: true}
// Las violaciones de forma (fechas, orden, frecuencia, no numérico, fuera de rango, unidad distinta a la del catálogo) son ERRORES y la descarga
// falla; los huecos de periodos y los saltos grandes son AVISOS (pueden ser reales: el CHF en enero de 2015) y se guardan en el .meta.json.
import {t as tx, registrar} from '../motor/idioma.js';

registrar('cat', {
  esq_esquema_malo: {es: '{id}: el esquema de la serie es inválido ({x}).', en: '{id}: the series schema is invalid ({x}).'},
  esq_fallo: {es: '{id}: la descarga no cumple su esquema ({n} problema(s)): {d}', en: '{id}: the download does not meet its schema ({n} problem(s)): {d}'},
  esq_unidad: {es: 'la unidad del esquema («{a}») no coincide con la del catálogo («{b}»)', en: 'the schema unit ("{a}") does not match the catalog unit ("{b}")'},
  esq_fecha: {es: 'fecha no válida en la fila {i}: «{v}»', en: 'invalid date in row {i}: "{v}"'},
  esq_orden: {es: 'fechas no crecientes en la fila {i}: {v} después de {p}', en: 'dates not increasing in row {i}: {v} after {p}'},
  esq_freq: {es: 'la fecha {v} no corresponde a una serie de frecuencia {f}', en: 'the date {v} does not fit a {f} series'},
  esq_nan: {es: 'valor no numérico en {fecha}: «{v}»', en: 'non-numeric value on {fecha}: "{v}"'},
  esq_rango: {es: 'valor fuera del rango plausible [{min}, {max}] en {fecha}: {v}', en: 'value outside the plausible range [{min}, {max}] on {fecha}: {v}'},
  esq_vacia: {es: 'la serie no tiene filas', en: 'the series has no rows'},
  esq_huecos: {es: '{n} periodo(s) sin dato entre {a} y {b} (no se rellenan)', en: '{n} period(s) with no data between {a} and {b} (not filled in)'},
  esq_salto: {es: 'salto de {d} entre {a} y {b} (mayor que el umbral {u}): revisar contra la fuente', en: 'jump of {d} between {a} and {b} (above the threshold {u}): check against the source'},
  esq_mas: {es: ' … (+{n} más)', en: ' … (+{n} more)'},
  f_D: {es: 'diaria', en: 'daily'}, f_M: {es: 'mensual', en: 'monthly'}, f_Q: {es: 'trimestral', en: 'quarterly'}, f_A: {es: 'anual', en: 'annual'},
});

export const FRECUENCIAS_ESQUEMA = ['D', 'M', 'Q', 'A'];
const MAX_ERRORES = 5;

/** ¿El esquema en sí está bien formado? Devuelve la lista de motivos (vacía si es válido). */
export function revisarEsquema(esq) {
  const m = [];
  if (!esq || typeof esq !== 'object') return ['not an object'];
  if (typeof esq.unidad !== 'string' || !esq.unidad.trim()) m.push('unidad');
  if (!FRECUENCIAS_ESQUEMA.includes(esq.frecuencia)) m.push('frecuencia');
  if (!Number.isFinite(esq.min) || !Number.isFinite(esq.max) || esq.min >= esq.max) m.push('min/max');
  if (esq.saltoMax !== undefined && !(Number.isFinite(esq.saltoMax) && esq.saltoMax > 0)) m.push('saltoMax');
  return m;
}

const diasDelMes = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function fechaValida(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return !!m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= diasDelMes(+m[1], +m[2]);
}
/** Índice absoluto de periodo (meses desde el año 0) para M/Q/A; null para D. */
function indicePeriodo(s, f) {
  const y = +s.slice(0, 4), mo = +s.slice(5, 7);
  return f === 'M' ? y * 12 + mo - 1 : f === 'Q' ? y * 4 + Math.floor((mo - 1) / 3) : f === 'A' ? y : null;
}
function encajaFrecuencia(s, f) {
  const mo = +s.slice(5, 7), d = +s.slice(8, 10);
  if (f === 'D') return true;
  if (f === 'M') return d === 1;
  if (f === 'Q') return d === 1 && [1, 4, 7, 10].includes(mo);
  return d === 1 && mo === 1;
}

/**
 * Valida filas [fecha, valor] contra un esquema. Devuelve {ok, errores:[…], avisos:[…]} (textos en el idioma activo).
 * `unidadCatalogo`: la `unidad` de la entrada del catálogo; debe coincidir con la del esquema (así nadie cambia una sin la otra).
 */
export function validarSerie(filas, esq, {id = '?', unidadCatalogo} = {}) {
  const errores = [], avisos = [];
  const malo = revisarEsquema(esq);
  if (malo.length) return {ok: false, errores: [tx('cat.esq_esquema_malo', {id, x: malo.join(', ')})], avisos};
  if (unidadCatalogo !== undefined && unidadCatalogo !== esq.unidad) errores.push(tx('cat.esq_unidad', {a: esq.unidad, b: unidadCatalogo}));
  if (!filas.length) { errores.push(tx('cat.esq_vacia')); return {ok: false, errores, avisos}; }
  const tope = (arr, msg) => { if (arr.length < MAX_ERRORES) arr.push(msg); else if (arr.length === MAX_ERRORES) arr.push('…'); };
  let prev = null, prevV = null, huecos = 0, primeroHueco = null, ultimoHueco = null;
  const saltos = [];
  filas.forEach(([fecha, bruto], i) => {
    if (!fechaValida(fecha)) { tope(errores, tx('cat.esq_fecha', {i: i + 1, v: fecha})); return; }
    if (prev !== null && fecha <= prev) tope(errores, tx('cat.esq_orden', {i: i + 1, v: fecha, p: prev}));
    if (!encajaFrecuencia(fecha, esq.frecuencia)) tope(errores, tx('cat.esq_freq', {v: fecha, f: tx(`cat.f_${esq.frecuencia}`)}));
    else if (prev !== null && !esq.irregular && esq.frecuencia !== 'D') {
      const salto = indicePeriodo(fecha, esq.frecuencia) - indicePeriodo(prev, esq.frecuencia);
      if (salto > 1) { huecos += salto - 1; primeroHueco ??= prev; ultimoHueco = fecha; }
    }
    const v = typeof bruto === 'number' ? bruto : (typeof bruto === 'string' && bruto.trim() !== '' ? Number(bruto) : NaN);
    if (!Number.isFinite(v)) tope(errores, tx('cat.esq_nan', {fecha, v: String(bruto)}));
    else {
      if (v < esq.min || v > esq.max) tope(errores, tx('cat.esq_rango', {min: esq.min, max: esq.max, fecha, v}));
      if (esq.saltoMax && prevV !== null && Math.abs(v - prevV) > esq.saltoMax) saltos.push(tx('cat.esq_salto', {d: Math.round(Math.abs(v - prevV) * 1e6) / 1e6, a: prev, b: fecha, u: esq.saltoMax}));
      prevV = v;
    }
    prev = fecha;
  });
  if (huecos) avisos.push(tx('cat.esq_huecos', {n: huecos, a: primeroHueco, b: ultimoHueco}));
  avisos.push(...saltos.slice(0, MAX_ERRORES));
  if (saltos.length > MAX_ERRORES) avisos.push(tx('cat.esq_mas', {n: saltos.length - MAX_ERRORES}).trim());
  return {ok: errores.length === 0, errores, avisos};
}

/** Como validarSerie, pero lanza un Error (con todos los motivos) si no cumple. Devuelve los avisos si cumple. */
export function exigirEsquema(filas, esq, opts = {}) {
  const r = validarSerie(filas, esq, opts);
  if (!r.ok) throw new Error(tx('cat.esq_fallo', {id: opts.id ?? '?', n: r.errores.length, d: r.errores.join(' | ')}));
  return r.avisos;
}
