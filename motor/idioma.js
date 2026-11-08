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

// ── Glosario de datos (unidades, fuentes, conceptos contables) ───────────────────────────────────────────────────
// El catálogo y los reportes guardan sus rótulos en español. Para una pieza en inglés se traducen AL LEER con este glosario
// (coincidencia exacta; lo que no está se deja tal cual y la prueba de idioma lo señala). Si el catálogo trae su campo
// `*_en`, ese manda sobre el glosario (ver servidor/plantillas.mjs).
const GLOSARIO_EN = {
  // unidades
  '% del PIB': '% of GDP', '% anual': '% per year', 'US$ corrientes': 'current US$', 'US$ corrientes por habitante': 'current US$ per capita',
  '% de la población': '% of population', 'Por 1.000 nacidos vivos': 'Per 1,000 live births', '% bruto': '% gross', '% de la población de 15+': '% of population aged 15+',
  'Personas': 'People', 'personas': 'people', 't de CO₂ por habitante': 't of CO₂ per capita', 'Años': 'Years', 'Hijos por mujer': 'Births per woman', '% de la fuerza laboral': '% of labor force',
  'kg de petróleo equivalente por habitante': 'kg of oil equivalent per capita', '% del consumo final': '% of final consumption', 'Mt de CO₂': 'Mt of CO₂', '% de la población total': '% of total population',
  'kWh por habitante': 'kWh per capita', '% de la generación': '% of generation', 'Mt de CO₂ equivalente': 'Mt of CO₂ equivalent', 'Por 1.000 habitantes': 'Per 1,000 people',
  'Moneda local por US$': 'Local currency per US$', 'Moneda local por US$ internacional': 'Local currency per international US$', '% de la fuerza laboral de 15-24': '% of labor force aged 15-24',
  'Índice 0–100 (100 = máxima desigualdad)': 'Index 0–100 (100 = maximum inequality)', 'Índice (base en la fuente)': 'Index (base per source)', '% del INB': '% of GNI',
  '% de las exportaciones de bienes, servicios e ingreso primario': '% of exports of goods, services and primary income', 'Precio / nivel de cierre (moneda y unidad del instrumento)': 'Closing price / level (instrument currency and unit)',
  'Miles de personas': 'Thousands of people', '% de la población activa': '% of labor force', '% respecto del trimestre anterior': '% vs. previous quarter', 'Millones de US$': 'US$ millions',
  'millones de US$': 'US$ millions', 'miles de millones de US$': 'US$ billions', 'Miles de millones de US$': 'US$ billions', 'billones de US$': 'US$ trillions', 'millones de personas': 'millions of people',
  'US$ por barril': 'US$ per barrel', 'US$ por galón': 'US$ per gallon', 'Miles de unidades (tasa anualizada)': 'Thousands of units (annualized rate)', 'Miles de millones de US$ (tasa anualizada)': 'US$ billions (annualized rate)',
  '% de la electricidad': '% of electricity', '°C (anomalía respecto de 1951-1980)': '°C (anomaly vs. 1951-1980)', 'Puntos de índice': 'Index points', 'Toneladas': 'Tonnes', 'Índice': 'Index',
  'Índice (base en FRED)': 'Index (base per FRED)', 'Puntos porcentuales': 'Percentage points', 'Miles de unidades': 'Thousands of units', 'US$ por EUR': 'US$ per EUR', 'US$ por GBP': 'US$ per GBP',
  'JPY por US$': 'JPY per US$', 'CNY por US$': 'CNY per US$', 'MXN por US$': 'MXN per US$', 'Percentil entre países': 'Percentile among countries',
  // fuentes (primer tramo del pie «Banco Mundial · Pink Sheet · Gold»)
  'Banco Mundial': 'World Bank', 'FMI': 'IMF', 'Tesoro de EE. UU.': 'US Treasury', 'Banco Mundial — World Development Indicators': 'World Bank — World Development Indicators',
  // conceptos de los reportes de la SEC (etiquetas del puente/Sankey)
  // (las etiquetas de segmentos/gastos de servidor/xbrl.mjs se tradujeron al español; aquí se devuelven al nombre oficial en inglés de la SEC)
  'Tiendas online': 'Online stores', 'Tiendas físicas': 'Physical stores', 'Servicios a vendedores': 'Third-party seller services', 'Publicidad': 'Advertising services', 'Suscripciones': 'Subscription services',
  'AWS (nube)': 'AWS', 'Otros': 'Other', 'Otros servicios': 'Other services', 'Logística': 'Fulfillment', 'Tecnología y contenido': 'Technology and content', 
  'Ventas, generales y administración': 'Selling, general and administrative', 'Wearables y accesorios': 'Wearables, home and accessories', 
  'Búsqueda de Google': 'Google Search & other', 'Anuncios en YouTube': 'YouTube ads', 'Red de Google': 'Google Network', 'Suscripciones y dispositivos': 'Google subscriptions, platforms, and devices', 'Otras apuestas': 'Other Bets',
  'Productividad y procesos': 'Productivity and Business Processes', 'Nube inteligente': 'Intelligent Cloud', 'Computación personal': 'More Personal Computing', 'Familia de apps': 'Family of Apps',
  'Centros de datos': 'Data Center', 'Videojuegos': 'Gaming', 'Visualización profesional': 'Professional Visualization', 'OEM y otros': 'OEM and Other', 'Cómputo y redes': 'Compute & Networking', 
  'Venta de autos': 'Automotive sales', 'Servicios y otros': 'Services and other', 'Créditos regulatorios': 'Automotive regulatory credits',
  'mil M': 'bn', 'bill.': 'tn',
  'Ingresos': 'Revenue', 'Costo de ventas': 'Cost of revenue', 'Utilidad bruta': 'Gross profit', 'Gastos operativos': 'Operating expenses', 'Otros gastos operativos': 'Other operating expense, net',
  'Gastos operativos sin desglosar': 'Operating expenses (not itemized)', 'Marketing y ventas': 'Sales and marketing', 'Administración': 'General and administrative', 'Investigación y desarrollo': 'Research and development',
  'Utilidad operativa': 'Operating income', 'Otros ingresos': 'Other income', 'Otros (no operativos)': 'Other (non-operating)', 'Utilidad antes de impuestos': 'Income before taxes', 'Impuestos': 'Taxes',
  'Beneficio fiscal': 'Tax benefit', 'Utilidad neta': 'Net income', 'Depreciación y amortización': 'Depreciation and amortization', 'Tecnología e infraestructura': 'Technology and infrastructure', 'Cumplimiento': 'Fulfillment',
};
const FRASES_EN = [[/^Fuente:\s*/, 'Source: '], [/reporte (10-[KQ]) de ([^()·]+?) \(/, '$2 $1 report ('], [/\(fuentes primarias en la página del gráfico\)/g, '(primary sources on the chart page)'], [/\bBanco Mundial\b/g, 'World Bank'], [/\bFMI\b/g, 'IMF'], [/\bTesoro de EE\. UU\./g, 'US Treasury'], [/\(API de gráficos, no oficial\)/g, '(charts API, unofficial)']];
/** Traduce un rótulo de datos (unidad, fuente, concepto) al idioma de la pieza; lo desconocido se deja igual. En español no toca nada. */
export function traducir(s) {
  if (s == null || ACTUAL === 'es') return s;
  const x = String(s), k = x.trim();
  if (GLOSARIO_EN[k] != null) return x.replace(k, GLOSARIO_EN[k]);
  let o = x; for (const [re, r] of FRASES_EN) o = o.replace(re, r);
  return o;
}
/** Para plantillas de servidor que traducen en un idioma sin depender del estado global. */
export function traducirA(c, s) { const a = ACTUAL; ACTUAL = c; try { return traducir(s); } finally { ACTUAL = a; } }
/** Ejecuta fn con otro idioma y restaura el anterior (para funciones de servidor que reciben `idioma` opcional). */
export function conIdioma(c, fn) { if (!c || c === ACTUAL) return fn(); const a = ACTUAL; ACTUAL = IDIOMAS.includes(c) ? c : 'es'; try { return fn(); } finally { ACTUAL = a; } }
