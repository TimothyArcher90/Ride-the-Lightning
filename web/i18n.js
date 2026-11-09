// Interface language for the studio (and its server messages). Spanish ('es') and English ('en'); default English unless the browser is Spanish.
// The language switch (EN | ES, top right) also sets the language of the PIECE: every /api call carries `idioma`, and the spec gets `idioma`.
// No DOM at import time, so servidor/*.mjs can import this same file for its messages (keys starting with "srv_").
//   tr('clave', {n: 3})            -> text in the current language ({n} placeholders are filled from the vars)
//   tr('clave', vars, 'es')        -> text in a given language (used by the server)
//   tt('tpl', 'historia', 'n', x)  -> «tpl.historia.n», or x if that key does not exist (template / camera texts come from the server)
//   num(1234.5)                    -> 1,234.5 (en) | 1.234,5 (es)
// To add a language: add its column to every row of D(...) below. scripts/prueba-ui-idioma.mjs checks that es and en have the same keys.

export const IDIOMAS = ['es', 'en'];
const CLAVE_LS = 'rtl_lang';
const DICT = {es: {}, en: {}};
const D = (k, es, en) => { DICT.es[k] = es; DICT.en[k] = en; };
export {DICT};

// ── current language ────────────────────────────────────────────────────────────────────────────────────────────
const enNavegador = typeof document !== 'undefined';   // in Node (server) there is no localStorage: do not even touch it
const detectar = () => {
  if (!enNavegador) return 'en';
  try { const g = localStorage.getItem(CLAVE_LS); if (IDIOMAS.includes(g)) return g; } catch { /* no storage */ }
  try { if (typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language || '')) return 'es'; } catch { /* no navigator */ }
  return 'en';
};
let ACTUAL = detectar();
const oyentes = [];
export const L = () => ACTUAL;
export const LOCALE = {es: 'es-CO', en: 'en-US'};
export function setL(l) {
  if (!IDIOMAS.includes(l) || l === ACTUAL) return ACTUAL;
  ACTUAL = l;
  if (enNavegador) { try { localStorage.setItem(CLAVE_LS, l); } catch { /* no storage */ } }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  oyentes.forEach((f) => { try { f(l); } catch (e) { console.error(e); } });
  return ACTUAL;
}
export const onL = (f) => { oyentes.push(f); };
export const has = (k) => k in DICT.en;
export function tr(k, vars = null, lang = ACTUAL) {
  const e = DICT[lang]?.[k] ?? DICT.es[k];
  if (e === undefined) return k;   // a missing key shows itself, so it is easy to see in the test
  return vars ? e.replace(/\{(\w+)\}/g, (_, v) => (vars[v] ?? '')) : e;
}
export const tt = (prefijo, id, campo, respaldo = '') => { const k = `${prefijo}.${id}.${campo}`; return has(k) ? tr(k) : respaldo; };
export const num = (v, opts) => Number(v).toLocaleString(LOCALE[ACTUAL], opts);

/** Fills the static HTML: [data-i] text, [data-i-aria] aria-label, [data-i-title] title, [data-i-ph] placeholder; also the EN | ES buttons. */
export function aplicarDOM(raiz = document) {
  document.documentElement.lang = ACTUAL;
  raiz.querySelectorAll('[data-i]').forEach((e) => { e.textContent = tr(e.dataset.i); });
  raiz.querySelectorAll('[data-i-aria]').forEach((e) => e.setAttribute('aria-label', tr(e.dataset.iAria)));
  raiz.querySelectorAll('[data-i-title]').forEach((e) => e.setAttribute('title', tr(e.dataset.iTitle)));
  raiz.querySelectorAll('[data-i-ph]').forEach((e) => e.setAttribute('placeholder', tr(e.dataset.iPh)));
  document.title = tr('doc_titulo');
  raiz.querySelectorAll('#lang button[data-l]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.l === ACTUAL)); b.onclick = () => setL(b.dataset.l); });
}

// ── header, static HTML ─────────────────────────────────────────────────────────────────────────────────────────
D('doc_titulo', 'Ride the Lightning · estudio', 'Ride the Lightning · Studio');
D('hdr_ejemplos', 'Ver un ejemplo', 'See an example');
D('hdr_experto', 'Modo experto', 'Expert mode');
D('idioma_aria', 'Idioma de la interfaz y de la pieza', 'Language of the interface and of the piece');
D('idioma_titulo', 'Cambia el idioma de la interfaz y del texto de la animación', 'Switches the language of the interface and of the animation text');
D('pasos_aria', 'Pasos para crear tu animación', 'Steps to create your animation');
D('vista_aria', 'Vista previa', 'Preview');
D('lienzo_aria', 'Vista previa de la animación', 'Animation preview');
D('vacio_t', 'Aquí verás tu animación', 'Your animation will appear here');
D('vacio_s', 'Elige un dato a la izquierda y aparece sola.', 'Choose some data on the left and it builds itself.');
D('carga', 'Preparando tu animación…', 'Preparing your animation…');
D('posicion', 'Posición en la animación', 'Position in the animation');
D('spec_h', 'Spec (para expertos)', 'Spec (for experts)');
D('spec_aplicar', 'Aplicar cambios', 'Apply changes');
D('spec_nota', 'Se compila y valida igual que lo demás.', 'It is compiled and validated like everything else.');
D('chat_btn', 'Pedir cambios hablando', 'Ask for changes in chat');
D('chat_aria', 'Chat para editar la animación', 'Chat to edit the animation');
D('chat_h', 'Edita hablando', 'Edit by chat');
D('chat_nuevo', 'Nuevo', 'New');
D('chat_nuevo_t', 'Empezar una conversación nueva', 'Start a new conversation');
D('chat_cerrar', 'Cerrar el chat', 'Close chat');
D('chat_msg', 'Tu mensaje', 'Your message');
D('chat_ph', 'Ej.: pásalo a vertical, pon el trimestre anterior, quita los impuestos…', 'E.g.: make it vertical, show the previous quarter, remove the taxes…');
D('chat_enviar', 'Enviar', 'Send');

// ── navigation and shared bits ──────────────────────────────────────────────────────────────────────────────────
D('paso_n1', 'Tus datos', 'Your data');
D('paso_n2', 'Cómo verlo', 'How it looks');
D('paso_n3', 'Cámara y ritmo', 'Camera and pace');
D('paso_n4', 'Revisar y exportar', 'Review and export');
D('atras', 'Atrás', 'Back');
D('cargando', 'Cargando…', 'Loading…');
D('otros', 'Otros', 'Other');
D('segundos', 'segundos', 'seconds');
D('pieza', 'pieza', 'piece');
D('instantes', 'instantes', 'moments');
D('n_min', '{n} min', '{n} min');
D('res_1', '{n} resultado', '{n} result');
D('res_n', '{n} resultados', '{n} results');
D('max10', 'Puedes combinar hasta 10 datos. Quita alguno para añadir otro.', 'You can combine up to 10 series. Remove one to add another.');
D('max10_corto', 'Puedes combinar hasta 10 datos.', 'You can combine up to 10 series.');
D('max8', 'Puedes comparar hasta 8 países.', 'You can compare up to 8 countries.');
D('suelta', 'Suelta aquí tu archivo o', 'Drop your file here or');
D('elegirlo', 'elígelo', 'choose it');
D('fuente_l', 'Fuente:', 'Source:');
D('segundos_s', 's', 's');

// ── step 1 ──────────────────────────────────────────────────────────────────────────────────────────────────────
D('guia_para_que', 'Para qué sirve:', 'What it is for:');
D('guia_texto', 'convierte datos reales (oro, bitcoin, inflación, resultados de empresas…) en una animación lista para tus videos. Sin programar y sin riesgo de cifras mal puestas.', 'turns real data (gold, bitcoin, inflation, company results…) into an animation ready for your videos. No coding, and no risk of wrong figures.');
D('guia_1', '<b>Elige el dato</b> aquí', '<b>Choose the data</b> here');
D('guia_2', '<b>Elige cómo se ve</b>', '<b>Choose how it looks</b>');
D('guia_3', '<b>Descarga el video</b>', '<b>Download the video</b>');
D('p1_h', 'Paso 1 · ¿Qué quieres mostrar?', 'Step 1 · What do you want to show?');
D('p1_aria', 'Qué quieres mostrar', 'What do you want to show');
D('int_g_mercados', 'Mercados y economía', 'Markets and economy');
D('int_g_paises', 'Países', 'Countries');
D('int_g_empresas', 'Empresas', 'Companies');
D('int_g_mis', 'Mis datos', 'My data');
D('int_serie_t', 'Un dato en el tiempo', 'One figure over time');
D('int_serie_s', 'Bitcoin, oro, inflación, tasas… datos reales completos, siempre al día.', 'Bitcoin, gold, inflation, interest rates… complete real data, always up to date.');
D('int_pais_t', 'Un país: sus datos clave', 'One country: its key figures');
D('int_pais_s', 'PIB, deuda, inflación, desempleo, población… con fuente oficial.', 'GDP, debt, inflation, unemployment, population… from official sources.');
D('int_paises_t', 'Comparar países', 'Compare countries');
D('int_paises_s', 'El mismo indicador (deuda, PIB, inflación…) en varios países a la vez.', 'The same indicator (debt, GDP, inflation…) for several countries at once.');
D('int_flujos_t', 'Cómo gana y gasta una empresa', 'How a company earns and spends');
D('int_flujos_s', 'Diagrama de flujo trimestral con datos oficiales de la SEC.', 'A quarterly flow diagram with official SEC data.');
D('int_puente_t', 'Qué sumó y qué restó', 'What added and what subtracted');
D('int_puente_s', 'Una cascada desde un total hasta el resultado. También para pérdidas.', 'A waterfall from a total down to the result. Works for losses too.');
D('int_comp_t', 'Cuánto pesa cada parte', 'How much each part weighs');
D('int_comp_s', 'Las partes de un total y su porcentaje, desde tu tabla.', 'The parts of a total and their percentage, from your table.');
D('serie_ayuda', 'Busca un dato real o toca uno de la lista. Toca varios para compararlos (máx. 10). Se descargan completos y se mantienen al día solos.', 'Search for real data or tap one from the list. Tap several to compare them (max. 10). They are downloaded in full and kept up to date automatically.');
D('serie_buscar_aria', 'Buscar un dato', 'Search for a series');
D('serie_buscar_ph', 'Busca: oro, bitcoin, petróleo, inflación, dólar…', 'Search: gold, bitcoin, oil, inflation, dollar…');
D('categorias', 'Categorías', 'Categories');
D('populares', 'Populares', 'Popular');
D('mas_usados', 'Los más usados', 'Most used');
D('datos_disp', 'Datos disponibles', 'Available data');
D('cargando_datos', 'Cargando datos…', 'Loading data…');
D('lista_error', 'No se pudo cargar la lista: {e}. Reintenta en unos segundos.', 'The list could not be loaded: {e}. Try again in a few seconds.');
D('sin_resultados_datos', 'No encontré datos con esa búsqueda. Prueba con una palabra más simple: «oro», «bitcoin», «petróleo», «inflación»…', "I couldn't find data for that search. Try a simpler word: “gold”, “bitcoin”, “oil”, “inflation”…");
D('atrasada', 'Atrasada', 'Out of date');
D('uso_restringido', 'Uso restringido', 'Restricted use');
D('ver_mas', 'Ver más ({n} restantes)', 'Show more ({n} left)');
D('no_ves_tuyo', '¿No ves el tuyo? Escríbelo arriba o elige una categoría: hay {n} datos reales.', "Can't see yours? Type it above or pick a category: there are {n} real series.");
D('hist_completa', 'historia completa', 'full history');
D('elegidos', 'Elegidos ({n}):', 'Selected ({n}):');
D('quitar', 'Quitar {x}', 'Remove {x}');
D('sig_como_se_ve', 'Siguiente: elegir cómo se ve', 'Next: choose how it looks');
D('elige_uno', 'Elige al menos un dato de la lista para continuar.', 'Choose at least one series from the list to continue.');
D('otras_formas', 'Otras formas de empezar: resultados de una empresa o tu propio archivo', 'Other ways to start: a company’s results or your own file');
D('emp_serie_h', 'Resultados de una empresa en el tiempo', 'A company’s results over time');
D('emp_serie_a', 'Ingresos, utilidad y margen trimestre a trimestre, con datos oficiales de la SEC.', 'Revenue, profit and margin quarter by quarter, with official SEC data.');
D('emp_buscar_l', 'Busca una empresa de la bolsa de EE. UU.', 'Search for a US-listed company');
D('emp_ph', 'Amazon, Apple, NVIDIA…', 'Amazon, Apple, NVIDIA…');
D('propios_h', '¿Tienes tus propios datos?', 'Do you have your own data?');
D('propios_a', 'Suelta un Excel, CSV, TSV o JSON. Te preguntamos solo lo necesario.', 'Drop an Excel, CSV, TSV or JSON file. We only ask what is needed.');
D('sec_trayendo_res', 'Trayendo los resultados de la SEC (10–20 s la primera vez)…', 'Fetching the results from the SEC (10–20 s the first time)…');
D('emp_sin_res', '{n} no presenta resultados como empresa industrial o de servicios (bancos, aseguradoras y empresas nuevas suelen quedar fuera).', '{n} does not report results like an industrial or services company (banks, insurers and new companies are usually left out).');
D('emp_rango', '{n} · de {d} a {h}. Marca lo que quieras graficar:', '{n} · from {d} to {h}. Tick what you want to chart:');

// countries
D('pais_ayuda', 'Elige un país y verás sus cifras clave, cada una con su año y su fuente. Toca las que quieras animar (la historia completa de cada una).', 'Pick a country to see its key figures, each with its year and source. Tap the ones you want to animate (the full history of each).');
D('pais_buscar_aria', 'Buscar un país', 'Search for a country');
D('pais_buscar_ph', 'Busca un país: Colombia, Japón, Alemania…', 'Search a country: Colombia, Japan, Germany…');
D('cargando_paises', 'Cargando países…', 'Loading countries…');
D('paises_error', 'No se pudo cargar la lista de países', 'The country list could not be loaded');
D('pais_no_hay', 'No encontré ese país. Prueba con otro nombre.', "I couldn't find that country. Try another name.");
D('pais_trayendo', 'Trayendo los datos más recientes (la primera vez de un país tarda unos segundos)…', 'Fetching the latest data (the first time for a country takes a few seconds)…');
D('pais_datos_clave', '{p} · datos clave', '{p} · key figures');
D('pais_titulo_clave', '{p}: datos clave', '{p}: key figures');
D('sin_dato', 'Sin dato', 'No data');
D('no_publicado', 'No publicado por la fuente', 'Not published by the source');
D('pais_nota', 'Cada cifra es el último dato publicado por la fuente oficial; nada se estima ni se interpola.', 'Each figure is the latest value published by the official source; nothing is estimated or interpolated.');
D('paises_ayuda', 'Elige <strong>un indicador</strong> y los países que quieres comparar (hasta 8). La gráfica pone a todos en la misma escala y con la misma fuente.', 'Pick <strong>one indicator</strong> and the countries you want to compare (up to 8). The chart puts them all on the same scale and from the same source.');
D('paises_h1', '1. Indicador', '1. Indicator');
D('paises_h2', '2. Países', '2. Countries');
D('grupos_aria', 'Grupos de países', 'Country groups');
D('grp_g7', 'G7', 'G7');
D('grp_latam', 'América Latina', 'Latin America');
D('grp_brics', 'BRICS', 'BRICS');
D('grp_mayores', 'Mayores economías', 'Largest economies');
D('quitar_todos', 'Quitar todos', 'Remove all');
D('indicador', 'Indicador', 'Indicator');

// tables / companies
D('tabla_flujos', 'Tres columnas: <strong>origen</strong>, <strong>destino</strong> y <strong>valor</strong> (y, si quieres, <strong>tipo</strong>: ingreso, beneficio o costo).', 'Three columns: <strong>source</strong> (origen), <strong>target</strong> (destino) and <strong>value</strong> (valor), plus an optional <strong>type</strong> (tipo): revenue, profit or cost.');
D('tabla_comp', 'Dos columnas: <strong>concepto</strong> y <strong>valor</strong>.', 'Two columns: <strong>item</strong> (concepto) and <strong>value</strong> (valor).');
D('tabla_puente', 'Dos columnas: <strong>concepto</strong> y <strong>valor</strong> (las restas con signo menos). En <strong>tipo</strong> marca «inicio» la primera fila y «total» los subtotales: se comprueba que cuadren.', 'Two columns: <strong>item</strong> (concepto) and <strong>value</strong> (valor), with subtractions as negative numbers. In <strong>type</strong> (tipo) mark the first row “inicio” (start) and subtotals “total”: they are checked to add up.');
D('trim_h', 'Una empresa, un trimestre', 'One company, one quarter');
D('trim_a', 'Los números salen del <strong>reporte oficial</strong> que la empresa entrega a la SEC (10-Q / 10-K). Cuando publique el siguiente, aparece aquí solo.', 'The numbers come from the <strong>official report</strong> the company files with the SEC (10-Q / 10-K). When it files the next one, it shows up here by itself.');
D('trim_buscar_l', 'Busca entre las más de 7.000 empresas de la bolsa de EE. UU. (nombre o ticker)', 'Search among the 7,000+ US-listed companies (name or ticker)');
D('trim_ph', 'Amazon, Apple, NVIDIA, SoFi, Uber…', 'Amazon, Apple, NVIDIA, SoFi, Uber…');
D('o_tabla', 'O usa tu propia tabla', 'Or use your own table');
D('tu_tabla', 'Tu tabla', 'Your table');
D('excel_o_csv', 'Excel (xlsx, xls, ods) o CSV.', 'Excel (xlsx, xls, ods) or CSV.');
D('probar_ej', 'Probar con un ejemplo', 'Try an example');
D('bajar_plantilla', 'Descargar la plantilla', 'Download the template');
D('ej_cargado', 'Ejemplo cargado: mira la vista previa. Las cifras son de demostración.', 'Example loaded: see the preview. The figures are for demonstration.');
D('emp_no_hay', 'No encuentro esa empresa en la bolsa de EE. UU. Prueba con otro nombre o con su ticker, o sube tu propia tabla abajo.', "I can't find that company on the US exchanges. Try another name or its ticker, or upload your own table below.");
D('emp_destacadas', 'Empresas destacadas (con toda su historia desde 2009)', 'Featured companies (full history since 2009)');
D('emp_demas', '. Las demás se traen de la SEC al elegirlas (unos segundos).', '. The others are fetched from the SEC when you pick them (a few seconds).');
D('empresas', 'Empresas', 'Companies');
D('emp_tip', '{n} trimestres · último {u}', '{n} quarters · latest {u}');
D('se_descarga', 'Se descarga al elegirla', 'Downloaded when you pick it');
D('sec_trayendo_trim', 'Trayendo los trimestres de la SEC (la primera vez de una empresa tarda 10–20 s)…', 'Fetching the quarters from the SEC (the first time for a company takes 10–20 s)…');
D('mm_b', 'US$ {v} mil M', 'US$ {v}B');
D('mm_m', 'US$ {v} M', 'US$ {v}M');
D('trim_perdida', 'Trimestre con pérdida: el flujo no puede dibujarlo. Usa «Qué sumó y qué restó».', 'Quarter with a loss: the flow cannot draw it. Use “What added and what subtracted”.');
D('trim_tip', 'Reporte {f} del {p} · ingresos {i}', 'Report {f} of {p} · revenue {i}');
D('trim_q4', ' · Q4 calculado: año − 9 meses', ' · Q4 computed: full year − 9 months');
D('trim_seg', ' · con ingresos por producto', ' · with revenue by product');
D('trim_seg_tip', 'Incluye ingresos por producto o segmento', 'Includes revenue by product or segment');
D('trim_elige', '{n} · elige un trimestre', '{n} · pick a quarter');
D('trim_recientes', 'Trimestres recientes', 'Recent quarters');
D('trim_anteriores', 'Ver los {n} trimestres anteriores (desde {d})', 'Show the {n} earlier quarters (since {d})');
D('trim_fuente', 'Fuente: SEC EDGAR · dominio público. Última revisión {d}. Los trimestres nuevos se suman solos.', 'Source: SEC EDGAR · public domain. Last checked {d}. New quarters are added automatically.');
D('trim_listo', '{n}: listo. Mira la vista previa.', '{n}: ready. See the preview.');
D('tabla_no_sirve', 'Esta tabla no sirve para esta historia.', "This table doesn't fit this story.");
D('tabla_tiene_cols', 'Tiene las columnas: {c}.', 'It has the columns: {c}.');
D('tabla_filas', '{n} filas · detecté una tabla de {t}', '{n} rows · I detected a {t} table');
D('tipo_flujos', 'flujos', 'flows');
D('tipo_cats', 'categorías', 'categories');
D('fuente_oblig', '¿De dónde vienen estos datos? (obligatorio)', 'Where does this data come from? (required)');
D('fuente_ph_tabla', 'Ej.: Informe trimestral de la empresa, 2026', 'E.g.: The company’s quarterly report, 2026');
D('fuente_nota_tabla', 'Sale escrito al pie del video. Sin fuente no podemos garantizar la exactitud.', 'It is written at the bottom of the video. Without a source we cannot guarantee accuracy.');
D('simbolo_antes', 'Símbolo antes de la cifra', 'Symbol before the number');
D('texto_despues', 'Texto después de la cifra', 'Text after the number');
D('suf_ph', ' mil M', ' B');
D('usar_tabla', 'Usar esta tabla', 'Use this table');
D('falta_fuente', 'Falta decir de dónde vienen los datos.', 'Please say where the data comes from.');
D('tabla_lista', 'Listo: tu tabla está elegida. Mira la vista previa.', 'Done: your table is selected. See the preview.');
D('leyendo', 'Leyendo tu archivo…', 'Reading your file…');
D('img_guardada', 'Imagen guardada: {r}. Las imágenes se usan como fondo o encuadre en el Modo experto.', 'Image saved: {r}. Images are used as a background or frame in Expert mode.');
D('no_lei', 'No pude leer ese archivo: {e}', "I couldn't read that file: {e}");
D('n_filas', '{n} filas', '{n} rows');
D('hoja_x', ' · hoja «{h}»', ' · sheet “{h}”');
D('hoja_libro', 'Hoja del libro', 'Workbook sheet');
D('col_fechas', '¿Qué columna tiene las fechas o los años?', 'Which column has the dates or years?');
D('que_graficar', '¿Qué quieres graficar?', 'What do you want to chart?');
D('ej_l', 'ej.:', 'e.g.:');
D('sin_numericas', 'No encontré columnas numéricas. Revisa que los números no tengan texto.', "I didn't find numeric columns. Check that the numbers don't contain text.");
D('fuente_ph_serie', 'Ej.: Banco Central de Chile, serie IPC (descargado en 2026)', 'E.g.: Central Bank of Chile, CPI series (downloaded in 2026)');
D('fuente_nota_serie', 'Esto sale escrito al pie del video. Sin una fuente no podemos garantizar la exactitud.', 'This is written at the bottom of the video. Without a source we cannot guarantee accuracy.');
D('avanzadas', 'Opciones avanzadas', 'Advanced options');
D('sep_decimal', 'Separador decimal de los números', 'Decimal separator of the numbers');
D('dec_auto', 'Automático (punto)', 'Automatic (dot)');
D('dec_coma', 'Coma (1.234,56)', 'Comma (1.234,56)');
D('orden_fecha', 'Si las fechas son 03/04/2020, ¿qué orden usan?', 'If dates look like 03/04/2020, which order do they use?');
D('fec_iso', 'No aplica / ISO', 'Not applicable / ISO');
D('fec_dmy', 'Día/Mes/Año', 'Day/Month/Year');
D('fec_mdy', 'Mes/Día/Año', 'Month/Day/Year');
D('fec_serial', 'Las fechas son números de serie de Excel (43831, 43862…)', 'The dates are Excel serial numbers (43831, 43862…)');
D('usar_datos', 'Usar estos datos', 'Use this data');
D('marca_una', 'Marca al menos una columna para graficar.', 'Tick at least one column to chart.');
D('datos_listos', 'Listo: tus datos están elegidos. Mira la vista previa y pulsa «Siguiente».', 'Done: your data is selected. See the preview and press “Next”.');

// ── step 2 ──────────────────────────────────────────────────────────────────────────────────────────────────────
D('p2_h', 'Paso 2 · ¿Cómo lo quieres ver?', 'Step 2 · How do you want to see it?');
D('p2_a', 'Te mostramos solo los estilos que <strong>cuentan bien tus datos</strong> (la marca <strong>★ Recomendada</strong> es la mejor). La vista previa de la derecha cambia al instante.', 'We only show the styles that <strong>tell your data well</strong> (the <strong>★ Recommended</strong> mark is the best). The preview on the right changes instantly.');
D('recomendada', '★ Recomendada', '★ Recommended');
D('recomendada_c', '★ Recomendada: ', '★ Recommended: ');
D('encaja_c', '✓ Encaja: ', '✓ Fits: ');
D('elegiste', 'Elegiste {n}.', 'You chose {n}.');
D('estilos_aria', 'Estilos de animación', 'Animation styles');
D('otros_no_rec', 'Otros estilos que NO recomendamos para este dato ({n})', 'Other styles we do NOT recommend for this data ({n})');
D('otros_no_rec_a', 'Se pueden usar, pero no cuentan bien este dato: por ejemplo, velas necesitan precios diarios y el calendario de calor necesita retornos diarios o mensuales.', 'They can be used, but they do not tell this data well: for example, candlesticks need daily prices and the heat calendar needs daily or monthly returns.');
D('otros_cantidad', 'Estilos que necesitan otra cantidad de datos', 'Styles that need a different number of series');
D('titulo_h', 'Título', 'Title');
D('titulo_l', 'Lo que se lee arriba del video (corto funciona mejor)', 'What is read at the top of the video (short works best)');
D('titulo_ph', 'Mi título', 'My title');
D('formato_h', 'Formato', 'Format');
D('formato_aria', 'Formato del video', 'Video format');
D('fmt_h', 'Horizontal 16:9 · YouTube', 'Horizontal 16:9 · YouTube');
D('fmt_v', 'Vertical 9:16 · Reels y Shorts', 'Vertical 9:16 · Reels and Shorts');
D('protagonista_h', '¿Cuál es la protagonista?', 'Which one is the star?');
D('protagonista_a', 'La línea resaltada. Las demás quedan atenuadas como contexto.', 'The highlighted line. The others are dimmed as context.');
D('protagonista_aria', 'Serie protagonista', 'Highlighted series');
D('sig_camara', 'Siguiente: cámara y ritmo', 'Next: camera and pace');
D('ideas_h', 'Ideas para contar mejor este dato', 'Ideas to tell this figure better');
D('idea_comp_t', 'Compara a {p} con otros países', 'Compare {p} with other countries');
D('idea_comp_s', '{i} de varios países en la misma gráfica.', '{i} for several countries in the same chart.');
D('mismo_ind', 'El mismo indicador', 'The same indicator');
D('idea_rank_t', '¿En qué puesto está {p}?', 'Where does {p} rank?');
D('idea_rank_s', 'Ranking de todos los países, con {p} resaltado.', 'Ranking of all countries, with {p} highlighted.');
D('armando_ranking', 'Armando el ranking…', 'Building the ranking…');
D('vista_de', 'Vista de {n}', 'Preview of {n}');
D('mom_h', 'Momentos que vale la pena contar', 'Moments worth telling');
D('mom_a', 'Los buscamos nosotros <strong>en los datos</strong>: nada es inventado. Marca los que quieras mostrar y ponles un nombre corto.', 'We find them <strong>in the data</strong>: nothing is made up. Tick the ones you want to show and give them a short name.');
D('analizando', 'Analizando tus datos…', 'Analyzing your data…');
D('mom_resumen', 'Tu dato va de {d} a {h} ({n} registros).', 'Your data runs from {d} to {h} ({n} records).');
D('mom_nombre', 'Nombre corto para {x}', 'Short name for {x}');

// ── step 3 ──────────────────────────────────────────────────────────────────────────────────────────────────────
D('p3t_h', 'Paso 3 · Aspecto', 'Step 3 · Look');
D('p3t_a', 'Esta animación se construye sola, de izquierda a derecha, sin zooms que elegir. Solo falta escoger cómo se ve.', 'This animation builds itself from left to right, with no zooms to choose. You only need to pick how it looks.');
D('p3_h', 'Paso 3 · Cámara y ritmo', 'Step 3 · Camera and pace');
D('p3_a', 'Cómo se mueve la cámara y qué tan rápido se cuenta. Si dudas, deja la que está marcada: ya funciona bien.', 'How the camera moves and how fast the story goes. If in doubt, keep the marked one: it already works well.');
D('camaras_aria', 'Estilos de cámara', 'Camera styles');
D('se_dibuja', 'Se dibuja en {s} s', 'Drawn in {s} s');
D('con_zoom', ' · con zoom', ' · with zoom');
D('sin_zoom', ' · sin zoom', ' · no zoom');
D('cam_propia', 'Este estilo ({e}) usa su propia cámara fija; el ritmo cambia solo en «La historia de una cifra».', 'This style ({e}) uses its own fixed camera; the pace only changes in “The story of a figure”.');
D('mom_estilo_h', 'Cómo se marcan los momentos', 'How moments are marked');
D('mom_estilo_aria', 'Estilo de los momentos', 'Moment style');
D('em_tarjeta', 'Tarjeta: año · qué pasó · dato', 'Card: year · what happened · figure');
D('em_barra', 'Solo barra con el año (la voz cuenta el resto)', 'Bar with the year only (the voice tells the rest)');
D('em_pildora', 'Píldora amarilla con la frase', 'Yellow pill with the phrase');
D('em_circulo', 'Círculo sobre el dato', 'Circle around the figure');
D('aspecto_h', 'Aspecto', 'Look');
D('aspecto_aria', 'Aspecto de color', 'Colour look');
D('tema_oscuro', 'MacroWise (oscuro cálido)', 'MacroWise (warm dark)');
D('tema_harris', 'Negro y rosa-rojo', 'Black and pink-red');
D('tema_carbon', 'Gris carbón y teal', 'Charcoal grey and teal');
D('vivo_sum', 'Opción avanzada: rehacer el video solo cuando salgan datos nuevos', 'Advanced option: remake the video only when new data comes out');
D('vivo_t', 'Crear una versión nueva (v2, v3…) cuando la fuente publique datos', 'Create a new version (v2, v3…) when the source publishes data');
D('vivo_a', 'Máximo una cada 6 horas. Requiere el actualizador encendido. Si no sabes qué es, déjalo apagado.', 'At most one every 6 hours. Needs the updater running. If you do not know what that is, leave it off.');
D('duracion_p', 'Duración: {s}.', 'Duration: {s}.');
D('duracion_v', 'Duración de esta versión: {s}.', 'Duration of this version: {s}.');
D('sig_revisar', 'Siguiente: revisar y exportar', 'Next: review and export');

// ── step 4 ──────────────────────────────────────────────────────────────────────────────────────────────────────
D('p4_h', 'Paso 4 · Revisar y descargar', 'Step 4 · Review and download');
D('p4_a', 'Mira la animación a la derecha. Si te gusta, descárgala. El sistema ya comprueba que <strong>ningún texto se pise</strong> y que <strong>cada cifra salga de los datos</strong>.', 'Watch the animation on the right. If you like it, download it. The system already checks that <strong>no text overlaps</strong> and that <strong>every figure comes from the data</strong>.');
D('p4_corregir', 'Hay algo por corregir:', 'Something needs fixing:');
D('res_dato', 'Dato', 'Data');
D('res_estilo', 'Estilo', 'Style');
D('res_formato', 'Formato', 'Format');
D('res_vertical', 'Vertical 9:16', 'Vertical 9:16');
D('res_horizontal', 'Horizontal 16:9', 'Horizontal 16:9');
D('res_duracion', 'Duración', 'Duration');
D('descargar_h', 'Elige qué descargar', 'Choose what to download');
D('borrador_t', 'Borrador rápido · ~30 segundos', 'Quick draft · ~30 seconds');
D('borrador_s', 'Un MP4 para revisar cómo quedó. Úsalo antes de la versión final.', 'An MP4 to check how it turned out. Use it before the final version.');
D('final_t', 'Versión final · 3 a 6 minutos', 'Final version · 3 to 6 minutes');
D('final_s', 'MP4 para compartir + archivo ProRes con transparencia para Premiere + informe de dónde sale cada cifra.', 'MP4 to share + ProRes file with transparency for Premiere + a report of where every figure comes from.');
D('r_enviando', 'Comprobando y enviando…', 'Checking and sending…');
D('r_alfa', 'Creando la versión con transparencia', 'Creating the version with transparency');
D('r_video', 'Creando el video', 'Creating the video');
D('r_preparando', 'Preparando', 'Preparing');
D('r_error', 'No se pudo exportar.', 'The export failed.');
D('r_error_pista', 'Si dice que hay textos que se pisan, quita un momento o acorta su nombre en el paso 2.', 'If it says some texts overlap, remove a moment or shorten its name in step 2.');
D('r_listo', '¡Listo! Tardó {s} s. Pulsa «Abrir la carpeta» para ver tus archivos.', 'Done! It took {s} s. Press “Open the folder” to see your files.');
D('r_k_video', 'Video', 'Video');
D('r_k_alfa', 'Con transparencia (Premiere)', 'With transparency (Premiere)');
D('r_k_informe', 'Informe', 'Report');
D('abrir_carpeta', 'Abrir la carpeta', 'Open the folder');
D('cantidad_no_encaja', 'Esta cantidad de datos no encaja con ningún estilo.', 'This number of series does not fit any style.');

// ── preview, summary, status ────────────────────────────────────────────────────────────────────────────────────
D('vacio_error', 'No se pudo armar la animación', 'The animation could not be built');
D('ver_ejemplo_hecho', 'Ver un ejemplo ya hecho', 'See a finished example');
D('reproducir', 'Reproducir', 'Play');
D('pausar', 'Pausar', 'Pause');
D('s_h', 'Tu animación, en simple', 'Your animation, in short');
D('s_todas', 'Todas las cifras salen de los datos.', 'Every figure comes from the data.');
D('s_cifras_1', '{n} cifra en pantalla, calculada por el sistema (ninguna escrita a mano).', '{n} figure on screen, computed by the system (none typed by hand).');
D('s_cifras_n', '{n} cifras en pantalla, calculadas por el sistema (ninguna escrita a mano).', '{n} figures on screen, computed by the system (none typed by hand).');
D('s_varias', 'Varias series', 'Several series');
D('s_datos_reales', 'Datos reales:', 'Real data:');
D('s_elementos', '{e} elementos · {f} filas · cada cifra sale de su fila', '{e} items · {f} rows · each figure comes from its row');
D('s_registros', '{n} registros', '{n} records');
D('s_recortada', ' · RECORTADA', ' · TRIMMED');
D('s_completa', ' · serie completa', ' · full series');
D('s_ver_fuente', 'Ver la fuente', 'View the source');
D('s_ver_cifras', 'Ver cada cifra y de qué fila sale', 'See each figure and which row it comes from');
D('s_fila', ' · fila {n}', ' · row {n}');
D('s_filas', ' · filas {n}', ' · rows {n}');
D('s_sin_cifras', 'Esta pieza no muestra cifras sueltas.', 'This piece shows no standalone figures.');
D('datos_al_elegir', 'Datos: se actualizan al elegirlos', 'Data: refreshed when you pick it');
D('datos_vivos', 'Datos vivos · última actualización hace {t}', 'Live data · last updated {t} ago');
D('ev_trimestre', '{n} publicó su {e}: ya está en la biblioteca y tienes un borrador listo.', '{n} filed its {e}: it is already in the library and you have a draft ready.');
D('ev_serie', 'Datos nuevos: {n}', 'New data: {n}');
D('x_errores', 'ERRORES:', 'ERRORS:');
D('x_compila', '✓ compila', '✓ compiles');
D('x_json_mal', 'JSON no válido: {e}', 'Invalid JSON: {e}');
D('ejemplos_h', 'Ejemplos listos', 'Ready examples');

// ── chat ────────────────────────────────────────────────────────────────────────────────────────────────────────
D('chat_hola', 'Hola. Dime qué quieres **cambiar** en la animación (colores, formato, otro trimestre, otra empresa…) y lo hago aquí mismo. Si tocas los pasos de la izquierda, la pieza se rehace desde cero.', 'Hi. Tell me what you want to **change** in the animation (colours, format, another quarter, another company…) and I will do it right here. If you touch the steps on the left, the piece is rebuilt from scratch.');
D('chat_pensando', 'Pensando…', 'Thinking…');
D('chat_actualizada', 'Vista previa actualizada', 'Preview updated');
D('sug_t1', 'Pásalo a vertical', 'Make it vertical');
D('sug_t2', 'Ponlo en negro y rosa-rojo', 'Use black and pink-red');
D('sug_t3', 'Muéstrame el trimestre anterior', 'Show me the previous quarter');
D('sug_t4', 'Ahora en cascada', 'Now as a waterfall');
D('sug_t5', 'Hazlo más corto', 'Make it shorter');
D('sug_p1', 'Pásalo a vertical', 'Make it vertical');
D('sug_p2', 'Cambia los colores', 'Change the colours');
D('sug_p3', 'Hazlo más corto', 'Make it shorter');
D('sug_p4', 'Pon un título más claro', 'Use a clearer title');
D('sug_v1', 'Muéstrame Amazon, último trimestre', 'Show me Amazon, latest quarter');
D('sug_v2', 'Cómo gana dinero NVIDIA', 'How NVIDIA makes money');
D('sug_v3', 'Compara el balance de la Fed con el oro', 'Compare the Fed balance sheet with gold');

// ── template and camera texts, by id (the server sends Spanish; the studio shows these) ─────────────────────────────
const TPL = (id, nes, nen, des, den, aes, aen) => { D(`tpl.${id}.n`, nes, nen); D(`tpl.${id}.d`, des, den); D(`tpl.${id}.a`, aes, aen); };
TPL('historia', 'La historia de una cifra', 'The story of a figure', 'Una línea que se dibuja y la cámara se acerca a los momentos que importan. La más usada.', 'A line draws itself and the camera moves in on the moments that matter. The most used.', 'Elige 1 dato.', 'Choose 1 series.');
TPL('comparar', 'Una contra las demás', 'One against the rest', 'Varias líneas en la misma gráfica, una protagonista resaltada y las otras de contexto. Se expresan como índice (100 = el inicio común) para que sean comparables.', 'Several lines in one chart, one highlighted and the others as context. They are shown as an index (100 = the common start) so they can be compared.', 'Elige de 2 a 6 datos.', 'Choose 2 to 6 series.');
TPL('panel', 'Comparar varias a la vez', 'Compare several at once', 'De 2 a 4 gráficas en pantalla, cada una con su cifra al lado y un año común arriba.', '2 to 4 charts on screen, each with its figure beside it and a shared year on top.', 'Elige de 2 a 4 datos.', 'Choose 2 to 4 series.');
TPL('carrera', 'Ranking en carrera', 'Bar chart race', 'Barras que compiten y se reordenan con el tiempo: quién va primero en cada año.', 'Bars that compete and reorder over time: who is first in each year.', 'Elige de 3 a 10 datos del mismo tipo.', 'Choose 3 to 10 series of the same kind.');
TPL('correlacion', '¿Se mueven juntas?', 'Do they move together?', 'Un mapa de colores que muestra qué series suben y bajan a la vez, y cuáles al revés.', 'A colour map showing which series rise and fall together, and which do the opposite.', 'Elige de 3 a 8 datos.', 'Choose 3 to 8 series.');
TPL('pendiente', '¿Quién subió y quién bajó?', 'Who went up and who went down?', 'Una línea por cada dato entre dos momentos (el primero y el último): se ve de un vistazo quién ganó, quién perdió y cuánto, con el cambio calculado.', 'One line per series between two moments (the first and the last): at a glance you see who gained, who lost and by how much, with the change computed.', 'Elige de 2 a 8 datos.', 'Choose 2 to 8 series.');
TPL('divergente', '¿Cuánto ganó o perdió cada una?', 'How much did each gain or lose?', 'El cambio en % de cada dato entre el primer y el último momento, en una sola escala: ganadores a la derecha, perdedores a la izquierda. Sirve aunque los datos tengan unidades distintas.', 'The % change of each series between the first and the last moment, on one scale: winners to the right, losers to the left. Works even when the series have different units.', 'Elige de 2 a 8 datos.', 'Choose 2 to 8 series.');
TPL('bump', '¿Quién superó a quién?', 'Who overtook whom?', 'La posición (1.º, 2.º, 3.º…) de cada dato en varios momentos, unidas por curvas: los cruces son los adelantamientos.', 'The position (1st, 2nd, 3rd…) of each series at several moments, joined by curves: the crossings are the overtakes.', 'Elige de 3 a 8 datos del mismo tipo.', 'Choose 3 to 8 series of the same kind.');
D('idea_rel_t', 'Compárala con series parecidas', 'Compare it with similar series');
D('idea_rel_s', 'Dos series de la misma categoría ({c}) en la misma gráfica, como índice base 100.', 'Two series from the same category ({c}) in one chart, as a base-100 index.');
D('idea_rel_busca', 'Buscando series parecidas…', 'Looking for similar series…');
D('idea_rel_no', 'No hay series parecidas ya descargadas con licencia abierta.', 'There are no similar downloaded series with an open licence.');
D('idea_mov_t', 'Mira sus mayores movimientos', 'See its biggest moves');
D('idea_mov_s', 'La línea se detiene en las mayores subidas y caídas, con su fecha y su cifra.', 'The line stops at its biggest rises and falls, with their date and figure.');
D('sorpresa_b', 'Sorpréndeme', 'Surprise me');
D('sorpresa_a', 'Elige un dato real del catálogo y el estilo que mejor lo cuenta.', 'Picks a real series from the catalog and the style that tells it best.');
D('sorpresa_busca', 'Buscando una buena combinación…', 'Looking for a good combination…');
D('sorpresa_fallo', 'No encontré una combinación ahora; prueba otra vez.', 'I could not find a combination right now; try again.');
TPL('dos_hitos', 'Dos hitos, la misma serie', 'Two milestones, one series', 'Una serie diaria vista desde dos fechas-hito: cada hito rebasa la serie a base 100 en su cierre y las dos curvas se alinean por sesiones desde el hito.', 'A daily series seen from two milestone dates: each milestone rebases the series to 100 at its close and the two curves are aligned by sessions since the milestone.', 'Elige 1 serie diaria y rellena las 2 fechas-hito, cada una con su fuente.', 'Pick 1 daily series and fill in the 2 milestone dates, each with its source.');
D('hitos_h', 'Los dos hitos', 'The two milestones');
D('hitos_a', 'Cada hito es una afirmación: escribe la fecha, el nombre que saldrá en pantalla y la fuente (un enlace o una cita). Sin fuente la pieza no se dibuja.', 'Each milestone is a claim: enter the date, the name that will appear on screen and the source (a link or a citation). Without a source the piece is not drawn.');
D('hito_n', 'Hito {n}', 'Milestone {n}');
D('hito_fecha', 'Fecha', 'Date');
D('hito_nombre', 'Nombre en pantalla', 'Name on screen');
D('hito_nombre_ph', 'p. ej. Quiebra de Lehman', 'e.g. Lehman bankruptcy');
D('hito_fuente', 'Fuente (enlace o cita)', 'Source (link or citation)');
D('hito_fuente_ph', 'p. ej. sec.gov/…, comunicado de la Reserva Federal', 'e.g. sec.gov/…, Federal Reserve press release');
D('hitos_faltan', 'Faltan datos de los hitos: sin fecha, nombre y fuente en los dos no se dibuja nada (una cifra sin fuente es una afirmación sin verificar).', 'Milestone details are missing: nothing is drawn until both have a date, a name and a source (a figure without a source is an unverified claim).');
D('hitos_rango', 'La serie va de {a} a {b}.', 'The series runs from {a} to {b}.');
TPL('resultados', '¿De dónde viene y adónde va?', 'Where does it come from and where does it go?', 'Un diagrama de flujo (Sankey): de dónde entra el dinero, en qué se reparte y qué queda. Los porcentajes se calculan solos.', 'A flow diagram (Sankey): where the money comes in, how it is split and what is left. Percentages are computed automatically.', 'Necesita una tabla de flujos (origen, destino, valor).', 'Needs a flows table (source, target, value).');
TPL('composicion', 'Qué parte pesa cuánto', 'How much each part weighs', 'Un anillo que se llena parte por parte, con su valor y su porcentaje al lado.', 'A ring that fills part by part, with its value and percentage beside it.', 'Necesita una tabla de categorías (concepto, valor).', 'Needs a categories table (item, value).');
TPL('treemap', 'Mapa de áreas', 'Area map (treemap)', 'Rectángulos cuya área es proporcional al valor: ideal con muchas partes (más de 6). Lo que no cabe rotulado se lista con su cifra.', 'Rectangles whose area is proportional to the value: ideal with many parts (more than 6). What does not fit a label is listed with its figure.', 'Necesita una tabla de categorías (concepto, valor).', 'Needs a categories table (item, value).');
TPL('lollipop', 'Ranking de partes', 'Ranking of parts', 'Un palo con círculo por cada parte, ordenadas de mayor a menor, con su valor y porcentaje. Letra grande: pensada para el celular.', 'A lollipop for each part, sorted from largest to smallest, with its value and percentage. Large type: made for phones.', 'Necesita una tabla de categorías (concepto, valor).', 'Needs a categories table (item, value).');
TPL('waffle', '100 cuadros', '100 squares', 'Cien cuadros, cada uno vale 1 %: la forma más fácil de entender «de cada 100, cuántos son…». Suma exacta a 100.', 'One hundred squares, each worth 1%: the easiest way to understand “out of every 100, how many are…”. Adds up to exactly 100.', 'Necesita una tabla de categorías (concepto, valor).', 'Needs a categories table (item, value).');
TPL('puente', 'Qué sumó y qué restó', 'What added and what subtracted', 'Una cascada: parte de un total, muestra cada suma y cada resta y llega al resultado. Los subtotales se comprueban.', 'A waterfall: starts from a total, shows each addition and subtraction and reaches the result. Subtotals are checked.', 'Necesita una tabla de categorías (concepto, valor, y «total» en los subtotales).', 'Needs a categories table (item, value, and “total” on the subtotals).');
TPL('radar', 'Perfil en un radar', 'Profile on a radar', 'Varios indicadores en un solo polígono: cada eje va de su mínimo histórico (0) a su máximo histórico (100) y el punto es el último dato. Muestra dónde está fuerte o débil un país o una empresa respecto a su propia historia.', 'Several indicators in one polygon: each axis runs from its historical low (0) to its historical high (100) and the point is the latest value. Shows where a country or company is strong or weak against its own history.', 'Elige de 3 a 8 datos distintos de la misma entidad.', 'Choose 3 to 8 different series of the same entity.');
TPL('radar_tabla', 'Radar de una tabla', 'Radar from a table', 'Un radar con las filas de una tabla (concepto, valor y, si quieres, anterior) en una escala común que se declara en pantalla.', 'A radar with the rows of a table (item, value and, optionally, previous) on a common scale that is stated on screen.', 'Necesita una tabla de categorías (concepto, valor, y opcional «anterior»).', 'Needs a categories table (item, value, and optional “anterior” = previous).');
TPL('apilada', 'Composición en el tiempo (área apilada)', 'Composition over time (stacked area)', 'Franjas apiladas: cuánto aporta cada parte al total y cómo cambia con los años. La altura es la suma exacta.', 'Stacked bands: how much each part contributes to the total and how it changes over the years. The height is the exact sum.', 'Elige de 2 a 8 datos de la misma unidad (partes de un total).', 'Choose 2 to 8 series with the same unit (parts of a total).');
TPL('apilada100', 'Peso de cada parte en el tiempo (100 %)', 'Weight of each part over time (100%)', 'Área apilada al 100 %: qué porcentaje del total representa cada parte en cada momento.', '100% stacked area: what percentage of the total each part represents at each moment.', 'Elige de 2 a 8 datos de la misma unidad (partes de un total).', 'Choose 2 to 8 series with the same unit (parts of a total).');
TPL('velas', 'Velas (precio)', 'Candlesticks (price)', 'Velas japonesas verdes y rojas. Con columnas de apertura, máximo, mínimo y cierre son exactas (y con volumen, se dibuja abajo); con solo cierres diarios, cada vela agrupa un periodo y se declara.', 'Green and red Japanese candlesticks. With open, high, low and close columns they are exact (and volume is drawn below); with daily closes only, each candle groups a period and this is stated.', 'Elige 1 serie diaria de precios (solo cierres) o 4–5 columnas: apertura, máximo, mínimo, cierre y volumen.', 'Choose 1 daily price series (closes only) or 4–5 columns: open, high, low, close and volume.');
TPL('histograma', '¿Cómo se distribuye? (valores)', 'How is it distributed? (values)', 'Un histograma de los valores de la serie: en qué rango pasó más tiempo, con la mediana y el último valor marcados.', 'A histogram of the series values: which range it spent the most time in, with the median and the latest value marked.', 'Elige 1 serie con al menos 30 datos.', 'Choose 1 series with at least 30 data points.');
TPL('retornos', '¿Cómo se distribuyen los retornos?', 'How are the returns distributed?', 'Un histograma de los cambios porcentuales entre un dato y el siguiente: qué tan comunes son las subidas y caídas grandes, con la mediana y el último retorno marcados.', 'A histogram of the percentage changes from one data point to the next: how common big rises and falls are, with the median and the latest return marked.', 'Elige 1 serie de precios o niveles con al menos 30 datos.', 'Choose 1 series of prices or levels with at least 30 data points.');
TPL('dumbbell', 'Antes y después por categoría', 'Before and after by category', 'Dos puntos unidos por una línea en cada fila: el valor anterior y el actual, con el cambio calculado.', 'Two points joined by a line on each row: the previous and the current value, with the change computed.', 'Necesita una tabla de categorías con columnas concepto, valor y anterior.', 'Needs a categories table with columns item (concepto), value (valor) and previous (anterior).');
TPL('dumbbell_series', 'Antes y después de cada dato', 'Before and after for each series', 'Una fila por dato, con un punto en el primer momento y otro en el último, en una escala común. Verde si subió, rojo si bajó.', 'One row per series, with a point at the first moment and another at the last, on a common scale. Green if it rose, red if it fell.', 'Elige de 2 a 8 datos de la misma unidad.', 'Choose 2 to 8 series with the same unit.');
TPL('calendario', 'Calendario de calor', 'Heat calendar', 'Una casilla por mes (o por día) y año, coloreada por el retorno: verde sube, rojo baja. Se ve la estacionalidad y los años malos de un vistazo.', 'One cell per month (or day) and year, coloured by return: green up, red down. Seasonality and bad years show at a glance.', 'Elige 1 serie diaria de precios.', 'Choose 1 daily price series.');
TPL('agrupadas', 'Barras agrupadas por año', 'Grouped bars by year', 'Un grupo por dato con una barra por momento (por ejemplo 1990, 2005, 2020), todas en la misma escala desde 0.', 'One group per series with one bar per moment (for example 1990, 2005, 2020), all on the same scale from 0.', 'Elige de 2 a 8 datos de la misma unidad.', 'Choose 2 to 8 series with the same unit.');
TPL('barras_decada', 'Una barra por década', 'One bar per decade', 'Serie anual como barras desde cero: una por década (1960, 1970, 1980…) más el último dato. Solo se usan filas reales de la fuente; no se interpola nada.', 'An annual series as bars from zero: one per decade (1960, 1970, 1980…) plus the latest value. Only real rows from the source are used; nothing is interpolated.', 'Elige 1 serie anual (población, urbanización…) con al menos 15 años.', 'Choose 1 annual series (population, urbanization…) with at least 15 years.');
TPL('bullet', 'Medidor contra la historia', 'Gauge against history', 'El último dato sobre su rango histórico (mínimo, percentiles 25 y 75, máximo) y una raya con la meta (la mediana por defecto). Una fila por dato.', 'The latest value over its historical range (low, 25th and 75th percentiles, high) and a line for the target (the median by default). One row per series.', 'Elige de 1 a 5 datos.', 'Choose 1 to 5 series.');
TPL('bandas', 'Este año contra el rango histórico', 'This year against the historical range', 'Para cada mes, una banda con el mínimo–máximo y los percentiles 25–75 de los años anteriores, y encima la línea del año. Sin proyecciones.', 'For each month, a band with the low–high and the 25th–75th percentiles of earlier years, with this year’s line on top. No projections.', 'Elige 1 serie mensual (o diaria) con al menos 5 años.', 'Choose 1 monthly (or daily) series with at least 5 years.');
TPL('pictograma', 'Cada cuadro = una cantidad', 'Each square = a quantity', 'Filas de cuadros donde cada cuadro vale una cantidad declarada; los incompletos son fracciones exactas. Para «cuánto es esto» de forma concreta.', 'Rows of squares where each square is worth a stated quantity; partial ones are exact fractions. For “how much is this” in concrete terms.', 'Necesita una tabla de categorías (concepto, valor).', 'Needs a categories table (item, value).');
TPL('ranking_pais', 'Ranking con códigos (países o empresas)', 'Ranking with codes (countries or companies)', 'Barras ordenadas de mayor a menor con el código ISO o ticker en una ficha (sin banderas). Si resaltas uno que no está en los primeros, aparece abajo con su puesto real.', 'Bars sorted from largest to smallest with the ISO code or ticker on a tag (no flags). If you highlight one that is not near the top, it appears below with its real rank.', 'Necesita una tabla de categorías; escribe el concepto como «COL · Colombia» para mostrar el código.', 'Needs a categories table; write the item as “COL · Colombia” to show the code.');
TPL('enjambre_pais', '¿Cómo se reparte entre países? (enjambre)', 'How is it spread across countries? (beeswarm)', 'Un punto por país (o empresa) sobre una sola escala: se ve de golpe dónde está el montón, los extremos y un país resaltado. Con la mediana marcada.', 'One dot per country (or company) on a single scale: you see at a glance where the bulk is, the extremes and a highlighted country. With the median marked.', 'Necesita una tabla de categorías con al menos 8 filas; escribe el concepto como «COL · Colombia» para mostrar el código.', 'Needs a categories table with at least 8 rows; write the concept as "COL · Colombia" to show the code.');
TPL('cordillera', 'La distribución año a año (cordillera)', 'The distribution year by year (ridgeline)', 'Una cresta por año con la distribución de los valores diarios: se ve cómo cambia la forma (no solo el promedio) con el tiempo. Sin suavizar; con la mediana de cada año.', 'One ridge per year with the distribution of the daily values: you see how the shape (not just the average) changes over time. Not smoothed; with the median of each year.', 'Elige 1 serie diaria con al menos 3 años de datos.', 'Pick 1 daily series with at least 3 years of data.');
TPL('corriente', 'Composición como corriente (streamgraph)', 'Composition as a stream (streamgraph)', 'Área apilada con la línea base centrada: las franjas fluyen como un río y se ve cuándo gana o pierde peso cada parte. El grosor es el valor; una barra de escala lo mide.', 'Stacked area with a centered baseline: the bands flow like a river and you see when each part gains or loses weight. Thickness is the value; a scale bar measures it.', 'Elige de 3 a 8 datos de la misma unidad (partes de un total).', 'Pick 3 to 8 data series in the same unit (parts of a total).');
const CAM = (id, nes, nen, des, den) => { D(`cam.${id}.n`, nes, nen); D(`cam.${id}.d`, des, den); };
CAM('cinematico', 'Cinemático', 'Cinematic', 'Trazo lento y zooms suaves a cada momento. Para videos largos y documentales.', 'Slow stroke and gentle zooms at each moment. For long videos and documentaries.');
CAM('documental', 'Documental', 'Documentary', 'Ritmo de editorial: trazo medio, un zoom claro por idea. El punto medio para casi todo.', 'Editorial pace: medium stroke, one clear zoom per idea. The middle ground for almost everything.');
CAM('dinamico', 'Dinámico (Reels y Shorts)', 'Dynamic (Reels and Shorts)', 'Rápido y directo: trazo corto, zooms enérgicos. Pensado para vertical.', 'Fast and direct: short stroke, energetic zooms. Made for vertical.');
CAM('seguir', 'Sigue la línea (estilo Johnny Harris)', 'Follow the line (Johnny Harris style)', 'La cámara acompaña la punta de la línea mientras se dibuja, reescala el eje y al final se abre al plano completo. Luego marca los momentos.', 'The camera follows the tip of the line as it draws, rescales the axis and finally opens to the full shot. Then it marks the moments.');
CAM('estatico', 'Sin movimiento de cámara', 'No camera movement', 'La gráfica se dibuja completa y los momentos aparecen sobre ella. Sencillo y sobrio.', 'The chart draws in full and the moments appear on top of it. Simple and sober.');

// ── SERVER MESSAGES (servidor/*.mjs import this file; keys start with srv_) ──────────────────────────────────────────
D('srv_muy_grande', 'Archivo demasiado grande', 'File too large');
D('srv_no_catalogo', 'No está en el catálogo', 'It is not in the catalog');
D('srv_formato', 'Formato no admitido: {ext}. Datos: {datos} · Imágenes: {imgs}', 'Unsupported format: {ext}. Data: {datos} · Images: {imgs}');
D('srv_no_ejemplo', 'Ese ejemplo no existe', 'That example does not exist');
D('srv_ex_flujos', 'Estado de resultados (ejemplo)', 'Income statement (example)');
D('srv_ex_composicion', 'Ingresos por línea (ejemplo)', 'Revenue by line (example)');
D('srv_ex_puente', 'De ingresos a utilidad neta (ejemplo)', 'From revenue to net income (example)');
D('srv_ex_fuente', 'EJEMPLO de demostración · cifras tomadas de una imagen pública de App Economy Insights, sin verificar contra el reporte oficial', 'DEMONSTRATION EXAMPLE · figures taken from a public App Economy Insights image, not verified against the official report');
D('srv_ex_sufijo', ' mil M', ' B');
D('srv_sin_datos_emp', 'Esta empresa no presenta ingresos, costos y utilidad operativa como una empresa industrial o de servicios (bancos, aseguradoras, fondos y empresas nuevas suelen quedar fuera). No se inventa nada.', 'This company does not report revenue, costs and operating income like an industrial or services company (banks, insurers, funds and new companies are usually left out). Nothing is made up.');
D('srv_no_compila', 'La spec no compila', 'The spec does not compile');
D('srv_solo_salidas', 'Solo se pueden abrir carpetas de salidas.', 'Only output folders can be opened.');
D('srv_ruta', 'Ruta desconocida', 'Unknown route');
D('srv_cerrando', '  Cerrando la sesión anterior de Ride the Lightning...', '  Closing the previous Ride the Lightning session...');
D('srv_puerto', '  El puerto {p} está ocupado por otro programa: cierra ese programa o usa RTL_PUERTO.', '  Port {p} is in use by another program: close that program or set RTL_PUERTO.');
D('srv_listo', 'Ride the Lightning · estudio en {url}  (Ctrl+C para cerrar)', 'Ride the Lightning · studio at {url}  (Ctrl+C to close)');
// chat (servidor/chat.mjs)
D('srv_chat_ocupado', 'Todavía estoy con el mensaje anterior. Espera un momento o pulsa «Parar».', 'I am still working on the previous message. Wait a moment or press “Stop”.');
D('srv_chat_no_guardo', 'No pude guardar la pieza abierta: {e}', 'I could not save the open piece: {e}');
D('srv_chat_tiempo', 'Llevaba más de {m} min y lo paré. Lo ya cambiado se queda.', 'It had been running for more than {m} min, so I stopped it. What has already changed stays.');
D('srv_chat_no_claude', 'No encuentro Claude Code en este equipo. Instálalo y entra con tu cuenta (claude), y vuelve a intentarlo.', 'I cannot find Claude Code on this machine. Install it, sign in (claude), and try again.');
D('srv_chat_codigo', 'Claude terminó con código {c}. Prueba de nuevo.', 'Claude finished with code {c}. Try again.');
D('srv_chat_error_cl', 'Claude terminó con un error.', 'Claude finished with an error.');
D('srv_h_pieza_actual', 'Miré la pieza abierta', 'I looked at the open piece');
D('srv_h_editar_pieza', 'Edité la pieza', 'I edited the piece');
D('srv_h_generar_trimestre', 'Armé el trimestre', 'I built the quarter');
D('srv_h_generar_pieza', 'Armé la pieza', 'I built the piece');
D('srv_h_listar_trimestres', 'Busqué en la biblioteca de empresas', 'I searched the company library');
D('srv_h_buscar_series', 'Busqué datos', 'I searched for data');
D('srv_h_descargar_serie', 'Traje el dato', 'I fetched the series');
D('srv_h_analizar_serie', 'Analicé la serie', 'I analyzed the series');
D('srv_h_vista_previa', 'Revisé fotogramas', 'I checked frames');
D('srv_h_compilar_spec', 'Compilé la pieza', 'I compiled the piece');
// command line (servidor/cli.mjs)
D('srv_cli_error', '✗ ERROR  ', '✗ ERROR  ');
D('srv_cli_aviso', '! aviso  ', '! warning');
D('srv_cli_dato', '• {id}: {filas} filas · {inicio} → {fin} · {fuente} · sha256 {sha}…', '• {id}: {filas} rows · {inicio} → {fin} · {fuente} · sha256 {sha}…');
D('srv_cli_cifra', '  cifra «{m}» ← {s} @ {f} (fila {r})', '  figure “{m}” ← {s} @ {f} (row {r})');
D('srv_cli_compila', '✓ compila sin errores', '✓ compiles without errors');
D('srv_cli_no_compila', '✗ NO compila', '✗ does NOT compile');
D('srv_cli_problema', '✗ {t}: {ab} entre {d} y {h} s', '✗ {t}: {ab} between {d} and {h} s');
D('srv_cli_nada_pisa', '✓ ningún texto se pisa ({n} instantes revisados)', '✓ no text overlaps ({n} moments checked)');
D('srv_cli_n_problemas', '✗ {n} problema(s)', '✗ {n} problem(s)');
D('srv_cli_no_catalogo', '✗ no está en el catálogo:', '✗ not in the catalog:');
D('srv_cli_bajado', '✓ {id}: {filas} filas · {inicio} → {fin}', '✓ {id}: {filas} rows · {inicio} → {fin}');
D('srv_cli_vivo', 'Actualizador vivo en marcha (Ctrl+C para salir)…', 'Live updater running (Ctrl+C to quit)…');
D('srv_cli_uso', 'Uso: cli.mjs compilar|vista|auditar|render <spec.json> [tiempos] [--borrador] [--sin-alfa] [--lang=es|en] | buscar <texto> | bajar <id…|todo> | actualizar [ids|todo] | vivo | inspeccionar <archivo> [hoja]', 'Usage: cli.mjs compilar|vista|auditar|render <spec.json> [times] [--borrador] [--sin-alfa] [--lang=es|en] | buscar <text> | bajar <id…|todo> | actualizar [ids|todo] | vivo | inspeccionar <file> [sheet]');
// MCP (servidor/mcp.mjs)
D('srv_mcp_instr', 'Ride the Lightning anima gráficas de datos con cifras 100 % trazables. Antes de dirigir una pieza llama a guia_de_direccion. Flujo: buscar_series → descargar_serie → compilar_spec → vista_previa (mira las imágenes) → exportar_video. Nunca escribas cifras a mano en los textos: usa marcadores.', 'Ride the Lightning animates data charts with 100% traceable figures. Before directing a piece call guia_de_direccion. Flow: buscar_series → descargar_serie → compilar_spec → vista_previa (look at the images) → exportar_video. Never type figures by hand into texts: use placeholders. Pieces have an `idioma` field (es|en) that sets the language of everything drawn.');
D('srv_mcp_pasa_spec', 'Pasa "spec" (objeto) o "ruta" (archivo .json dentro del proyecto).', 'Pass "spec" (object) or "ruta" (a .json file inside the project).');
D('srv_mcp_no_existe', 'No existe "{id}" en el catálogo. Usa buscar_series.', '"{id}" does not exist in the catalog. Use buscar_series.');
D('srv_mcp_nota_render', 'Consulta estado_render con este id.', 'Poll estado_render with this id.');
D('srv_mcp_no_trimestre', 'No hay ese trimestre. Usa listar_trimestres con ticker {t}.', 'There is no such quarter. Use listar_trimestres with ticker {t}.');
D('srv_mcp_sin_pieza', 'No hay una pieza abierta en el estudio. Pídele al usuario que elija un dato primero, o genera una con generar_trimestre/generar_pieza (como_actual: true).', 'There is no piece open in the studio. Ask the user to pick some data first, or generate one with generar_trimestre/generar_pieza (como_actual: true).');
D('srv_mcp_ruta_no', 'La ruta «{ruta}» no existe (falla en «{paso}»).', 'The path “{ruta}” does not exist (it fails at “{paso}”).');
D('srv_mcp_no_lista', '«{ruta}» no es una lista.', '“{ruta}” is not a list.');
D('srv_mcp_no_compila', 'La pieza editada no compila: no se guardó.', 'The edited piece does not compile: it was not saved.');
D('srv_mcp_vistas', 'Vistas en:', 'Views in:');
// SERVER-KEYS
