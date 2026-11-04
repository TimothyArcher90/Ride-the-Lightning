// Idioma de la PIEZA (texto que se dibuja en el video) — 'es' (por defecto) o 'en'. Sin DOM, determinista.
// Estado de módulo, igual que aplicarTema/fijarFormato: Escena lo fija al empezar y todo el motor lee de aquí.
//   import {t, idioma, fijarIdioma, MESES_CORTO, MESES_LARGO} from './idioma.js';
//   t('fuente')            -> 'Fuente' | 'Source'
//   t('max_en', {v, f})    -> 'Máximo: {v} en {f}' | 'Peak: {v} in {f}'   (los {marcadores} se rellenan con vars)
// Regla: ninguna capa escribe texto fijo en español; todo texto fijo vive en DICT con su par es/en.
// Para añadir un idioma: agregar su columna en DICT, MESES_* y LOCALE_NUM.

let ACTUAL = 'es';
export const IDIOMAS = ['es', 'en'];
export const idioma = () => ACTUAL;
export function fijarIdioma(c = 'es') { ACTUAL = IDIOMAS.includes(c) ? c : 'es'; return ACTUAL; }

export const MESES_CORTO = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
export const MESES_LARGO = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
/** Locale numérico: es-CO = coma decimal y punto de miles; en-US = punto decimal y coma de miles. */
export const LOCALE_NUM = {es: 'es-CO', en: 'en-US'};
/** «12,5 %» (es, con espacio) vs «12.5%» (en). */
export const SUFIJO_PCT = {es: ' %', en: '%'};
/** Antes de Cristo: «500 a. C.» vs «500 BC». */
export const ANTES_CRISTO = {es: ' a. C.', en: ' BC'};
/** Orden de día/mes en fechas largas: es «12 mar 2020», en «Mar 12, 2020». */
export const FECHA_DIA = {es: (d, m, y) => `${d} ${m} ${y}`, en: (d, m, y) => `${m} ${d}, ${y}`};

export const DICT = {
  fuente: {es: 'Fuente', en: 'Source'},
  otros: {es: 'Otros', en: 'Other'},
  otras: {es: 'Otras', en: 'Other'},
  mediana: {es: 'MEDIANA', en: 'MEDIAN'},
  maximo: {es: 'Máximo', en: 'Peak'},
  minimo: {es: 'Mínimo', en: 'Low'},
};

/** Texto fijo en el idioma actual. Si falta la clave devuelve la clave (se ve en la prueba de idioma) y no rompe el render. */
export function t(clave, vars = null) {
  const e = DICT[clave];
  let s = e ? (e[ACTUAL] ?? e.es ?? clave) : clave;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return s;
}
/** Registro de textos propios de un módulo: registrar('capas', {clave: {es, en}}). Evita un diccionario gigante en un solo archivo. */
export function registrar(prefijo, textos) { for (const [k, v] of Object.entries(textos)) DICT[`${prefijo}.${k}`] = v; }
