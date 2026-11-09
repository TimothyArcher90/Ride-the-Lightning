// Los 16 modelos de gráfica con DATOS REALES de la biblioteca, para revisarlos y para la prueba de calidad.
// Cada entrada: {id, nombre, spec (ya compilada), informe}. Uso: `await construirModelos('vertical')`.
// Los que no salen de una plantilla (barras, dispersión) se arman aquí con una spec a mano sobre series de la biblioteca.
import fs from 'node:fs';
import path from 'node:path';
import {generar, analizar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {leerIndice, itemTrimestre} from '../servidor/trimestres.mjs';

const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
const hay = (id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`));
const meta = (id) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv.meta.json`), 'utf8'));

export const MODELOS = ['historia', 'comparar', 'panel', 'barras', 'carrera', 'dispersion', 'correlacion', 'sankey', 'donut', 'cascada', 'pendiente', 'bump', 'treemap', 'waffle', 'lollipop', 'divergente'];

function tablaTrimestre(tk, uso) {
  const idx = leerIndice(tk), t = idx?.trimestres?.find((x) => x.archivo && x.puente);
  if (!t) throw new Error(`Sin datos de ${tk}: baja los trimestres antes de esta prueba.`);
  return itemTrimestre(tk, t.fin, uso);
}
/** Categorías «a dónde fue cada dólar» (cascada del reporte sin subtotales), igual que prueba-visualizador. */
function categorias(tk) {
  const it = tablaTrimestre(tk, 'puente'), filas = fs.readFileSync(path.join(RAIZ, it.ruta), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
  const partes = filas.filter((f) => f[2] !== 'total' && f[2] !== 'inicio'), utilidad = filas[filas.length - 1];
  const csv = 'concepto,valor\n' + [...partes.map((f) => [f[0], Math.abs(+f[1])]), [utilidad[0], +utilidad[1]]].filter((f) => f[1] > 0).map((f) => `${f[0]},${f[1]}`).join('\n');
  fs.mkdirSync(path.join(RAIZ, '.tmp'), {recursive: true});
  const ruta = `.tmp/viz-${tk}.csv`; fs.writeFileSync(path.join(RAIZ, ruta), csv);
  return {...it, ruta, tabla: 'categorias', uso: 'donut'};
}

function barras(formato, idioma = 'es') {
  const en = idioma === 'en', m = meta('bm_gold');
  const datos = {d: {archivo: 'datos/biblioteca/bm_gold.csv', x: 'fecha', tipoX: 'fecha', desde: '2026-03', columnas: [{col: 'Gold', nombre: en ? 'Gold' : 'Oro', color: 'oro', prefijo: 'US$ ', decimales: 0, unidad: en ? 'US$ per troy ounce' : 'US$ por onza troy'}]}};
  const tit = en ? 'Gold, month by month' : 'El oro, mes a mes';
  return {version: 1, titulo: tit, ...(en ? {idioma: 'en'} : {}), formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: tit, color: 'oro', sub: en ? 'Monthly price, US$ per troy ounce' : 'Precio mensual, US$ por onza troy', t: [0.2, 7.9]}, {tipo: 'barras', datos: 'd', formatoX: 'mes', t: [0.9, 4.5]}], _fuente: m.fuente.nombre};
}
function dispersion(formato, idioma = 'es') {
  const en = idioma === 'en';
  // oro vs. cobre (mensual, desde 2000): una fila por mes con los dos precios; la regresión y R² los calcula el compilador.
  const rd = (id) => new Map(fs.readFileSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')));
  const a = rd('bm_gold'), b = rd('bm_copper'), filas = [];
  for (const [f, v] of a) if (f >= '2000-01-01' && b.has(f) && v !== '' && b.get(f) !== '') filas.push(`${f},${v},${b.get(f)}`);
  fs.mkdirSync(path.join(RAIZ, '.tmp'), {recursive: true});
  const ruta = '.tmp/viz-oro-cobre.csv'; fs.writeFileSync(path.join(RAIZ, ruta), 'fecha,oro,cobre\n' + filas.join('\n'));
  const m = meta('bm_gold');
  const datos = {d: {archivo: ruta, x: 'oro', tipoX: 'num', fuente: {nombre: m.fuente.nombre, corto: en ? 'World Bank · Pink Sheet · Gold and copper' : 'Banco Mundial · Pink Sheet · Oro y cobre', url: m.fuente.url, obtenido: m.fuente.obtenido, licencia: m.fuente.licencia}, columnas: [{col: 'cobre', nombre: en ? 'Copper' : 'Cobre', color: 'teal', prefijo: 'US$ ', decimales: 0, unidad: en ? 'US$ per tonne' : 'US$ por tonelada'}]}};
  const tit = en ? 'Do gold and copper rise together?' : '¿Suben juntos el oro y el cobre?';
  return {version: 1, titulo: tit, ...(en ? {idioma: 'en'} : {}), formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: tit, color: 'oro', t: [0.2, 7.9]}, {tipo: 'dispersion', datos: 'd', etiquetaX: en ? 'Gold, US$ per ounce' : 'Oro, US$ por onza', etiquetaY: en ? 'Copper, US$ per tonne' : 'Cobre, US$ por tonelada', t: [0.9, 4.5]}]};
}

/** Nombres en inglés de las series de la biblioteca que usan las pruebas (el catálogo está en español; sus campos *_en llegan por otro frente). */
const NOMBRES_EN = {
  bm_gold: 'Gold', bm_copper: 'Copper', bm_crude_oil_wti: 'WTI crude oil', bm_wheat_us_hrw: 'US HRW wheat', fred_dgs10: '10-year Treasury yield',
  fred_unrate: 'US unemployment rate', fred_fedfunds: 'Federal funds rate', fred_vixcls: 'VIX volatility index', fred_umcsent: 'Consumer sentiment', fred_mortgage30us: '30-year mortgage rate',
  yf_gspc: 'Stock market index', fred_dtwexbgs: 'Broad dollar index', pais_COL_urbanizacion: 'Colombia: urban population',
  ow_global_energy_substitution_coal_twh: 'Coal', ow_global_energy_substitution_oil_twh: 'Oil', ow_global_energy_substitution_gas_twh: 'Gas', ow_global_energy_substitution_hydro_twh: 'Hydro', ow_global_energy_substitution_nuclear_twh: 'Nuclear',
};
/** Items de la biblioteca; en inglés llevan su nombre en inglés (pisa el del catálogo). */
const bibI = (idioma, ...ids) => ids.map((id) => ({origen: 'biblioteca', id, ...(idioma === 'en' && NOMBRES_EN[id] ? {nombre: NOMBRES_EN[id]} : {})}));
const TITULOS_EN = {
  historia: 'Gold, the full story', comparar: 'Gold against the rest', panel: 'Several markets side by side', carrera: 'Who leads', correlacion: 'Do they move together?',
  sankey: 'Where it comes from and where it goes', donut: 'How much each part weighs', cascada: 'What added and what subtracted', pendiente: 'Who rose and who fell?', bump: 'Who overtook whom?',
  treemap: 'Map of areas', waffle: 'A hundred squares', lollipop: 'Ranking of the parts', divergente: 'How much each one gained or lost',
};

/** Devuelve [{id, nombre, spec, informe, duracion}] de los 16 modelos para el formato pedido. En 'en' todo el texto dibujado debe salir en inglés. */
export async function construirModelos(formato = 'vertical', {camara = 'dinamico', idioma = 'es'} = {}) {
  const out = [], en = idioma === 'en', bib = (...ids) => bibI(idioma, ...ids);
  const G = (id, nombre, entrada) => { const r = generar({formato, camara, ...(en ? {idioma, titulo: TITULOS_EN[id]} : {}), ...entrada}); out.push({id, nombre, spec: compilar(r.spec).spec, informe: r.informe, duracion: r.spec.duracion, notas: r.notas}); };
  const ids = ['bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw', 'fred_dgs10'].filter(hay);
  G('historia', 'La historia de una cifra', {plantilla: 'historia', series: bib('bm_gold'), momentos: en ? analizar(bib('bm_gold'), idioma).momentos.filter((m) => m.seleccionado).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: m.etiqueta})) : []});
  G('comparar', 'Una contra las demás', {plantilla: 'comparar', series: bib(...ids.slice(0, 3)), foco: 0});
  G('panel', 'Comparar varias a la vez', {plantilla: 'panel', series: bib(...ids.slice(0, 3))});
  for (const [id, nombre, fn] of [['barras', 'Barras', barras], ['dispersion', 'Dispersión', dispersion]]) {
    const spec = fn(formato, idioma), c = compilar(spec); out.push({id, nombre, spec: c.spec, informe: c.informe, duracion: spec.duracion, notas: []});
  }
  G('carrera', 'Ranking en carrera', {plantilla: 'carrera', series: bib(...ids.slice(0, 4))});
  G('correlacion', '¿Se mueven juntas?', {plantilla: 'correlacion', series: bib(...ids.slice(0, 4))});
  G('sankey', '¿De dónde viene y adónde va?', {plantilla: 'resultados', series: [tablaTrimestre('AMZN', 'sankey')]});
  G('donut', 'Qué parte pesa cuánto', {plantilla: 'composicion', series: [categorias('AMZN')]});
  G('cascada', 'Qué sumó y qué restó', {plantilla: 'puente', series: [tablaTrimestre('AMZN', 'puente')]});
  G('pendiente', '¿Quién subió y quién bajó?', {plantilla: 'pendiente', series: bib(...ids.slice(0, 4))});
  G('bump', '¿Quién superó a quién?', {plantilla: 'bump', series: bib(...ids.slice(0, 5))});
  G('treemap', 'Mapa de áreas', {plantilla: 'treemap', series: [categorias('AMZN')]});
  G('waffle', '100 cuadros', {plantilla: 'waffle', series: [categorias('AMZN')]});
  G('lollipop', 'Ranking de partes', {plantilla: 'lollipop', series: [categorias('AMZN')]});
  G('divergente', '¿Cuánto ganó o perdió cada una?', {plantilla: 'divergente', series: bib(...ids.slice(0, 5))});
  return out;
}

// ── los 12 modelos del visualizador universal (radar, apilada, velas, histograma, dumbbell, calendario, agrupadas, bullet, bandas, pictograma, ranking, dos_hitos) ──
export const MODELOS_EXTRA = ['radar', 'apilada', 'velas', 'histograma', 'dumbbell', 'calendario', 'agrupadas', 'bullet', 'bandas', 'pictograma', 'ranking', 'dos_hitos', 'enjambre', 'cordillera', 'corriente'];
const ENERGIA = ['coal', 'oil', 'gas', 'hydro', 'nuclear'].map((k) => `ow_global_energy_substitution_${k}_twh`);
const sec = (tk) => { const f = path.join(RAIZ, 'datos', 'trimestres', tk, 'serie.csv'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')) : null; };

/**
 * Los 12 modelos extra con datos reales de la biblioteca (misma receta que scripts/prueba-universal.mjs). Devuelve la misma forma que construirModelos.
 * Los que no tienen datos descargados en este equipo se omiten (y se listan en `omitidos`).
 */
export async function construirExtras(formato = 'vertical', {idioma = 'es'} = {}) {
  const out = [], omitidos = [], en = idioma === 'en', bib = (...ids) => bibI(idioma, ...ids), hoy = new Date().toISOString().slice(0, 10);
  const camara = formato === 'vertical' ? 'dinamico' : 'documental';
  fs.mkdirSync(path.join(RAIZ, '.tmp', 'universal'), {recursive: true});
  const G = (id, nombre, entrada, ajuste) => {
    const r = generar({formato, camara, ...(en ? {idioma} : {}), ...entrada});
    let spec = r.spec;
    if (ajuste) { spec = JSON.parse(JSON.stringify(spec)); ajuste(spec); }
    const c = compilar(spec); out.push({id, nombre, spec: c.spec, informe: c.informe, duracion: spec.duracion, notas: r.notas});
  };
  const T = (es, ing) => (en ? ing : es);
  const itemCsv = (nombre, csv, fuente, extra = {}) => { const ruta = `.tmp/universal/${nombre}${en ? '_en' : ''}.csv`; fs.writeFileSync(path.join(RAIZ, ruta), csv); return {origen: 'archivo', ruta, tabla: 'categorias', uso: 'donut', nombre, fuente, ...extra}; };
  // 1. radar (tabla): puesto de un país entre 45 países
  try {
    const U = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8')).ultimos;
    const nom = {pib_pc: T('PIB per cápita', 'GDP per capita'), crec_pib: T('Crecimiento del PIB', 'GDP growth'), inflacion: T('Inflación', 'Inflation'), desempleo: T('Desempleo', 'Unemployment'), esperanza_vida: T('Esperanza de vida', 'Life expectancy'), exportaciones: T('Exportaciones / PIB', 'Exports / GDP'), deuda_pib: T('Deuda pública / PIB', 'Public debt / GDP')};
    const claves = Object.keys(nom).filter((k) => U[k]?.COL);
    const filas = claves.map((k) => { const v = Object.values(U[k]).map((q) => q.valor), c = U[k].COL.valor; return [nom[k], +(((v.filter((q) => q < c).length) / (v.length - 1)) * 100).toFixed(1)]; });
    const it = itemCsv('radar_colombia_percentil', 'concepto,valor\n' + filas.map((f) => f.join(',')).join('\n'), {nombre: T('Banco Mundial (WDI) y FMI (WEO), último dato de cada país; percentil calculado entre los países de la lista', 'World Bank (WDI) and IMF (WEO), latest data for each country; percentile calculated among the countries in the list'), url: 'https://data.worldbank.org/', obtenido: hoy}, {decimales: 0, unidad: T('Percentil entre países', 'Percentile among countries')});
    G('radar', 'Radar', {plantilla: 'radar_tabla', series: [it], titulo: T('Dónde está Colombia', 'Where Colombia stands'), nota: T('Cada eje: puesto de Colombia entre los países con dato (0 = menor, 100 = mayor).', 'Each axis: rank of Colombia among countries with data (0 = lowest, 100 = highest).')});
  } catch (e) { omitidos.push('radar: ' + e.message); }
  // 2. área apilada
  if (ENERGIA.every(hay)) G('apilada', 'Área apilada', {plantilla: 'apilada', series: bib(...ENERGIA), titulo: T('De dónde sale la energía', 'Where the energy comes from')}); else omitidos.push('apilada: faltan series de energía');
  // 3. velas (solo cierres, desde 2023)
  if (hay('yf_gspc')) G('velas', 'Velas', {plantilla: 'velas', series: bib('yf_gspc'), titulo: T('El mercado de EE. UU.', 'The US stock market')}, (s) => { s.datos.d.desde = '2023-01-01'; }); else omitidos.push('velas: falta yf_gspc');
  // 4. histograma
  if (hay('fred_unrate')) G('histograma', 'Histograma', {plantilla: 'histograma', series: bib('fred_unrate'), titulo: T('Desempleo de EE. UU.', 'US unemployment')}); else omitidos.push('histograma: falta fred_unrate');
  // 5. dumbbell (tabla de ingresos trimestrales)
  {
    const fil = []; for (const tk of ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META', 'TSLA', 'NFLX']) { const s = sec(tk); if (s && s.length > 5) fil.push([tk, +s[s.length - 1][1], +s[s.length - 5][1]]); }
    if (fil.length >= 4) {
      const it = itemCsv('dumbbell_ingresos', 'concepto,valor,anterior\n' + fil.map((f) => `${f[0]},${f[1]},${f[2]}`).join('\n'), {nombre: T('SEC EDGAR (companyfacts), ingresos trimestrales; último trimestre frente al mismo trimestre del año anterior', 'SEC EDGAR (companyfacts), quarterly revenue; latest quarter versus the same quarter a year earlier'), url: 'https://www.sec.gov/edgar', obtenido: hoy}, {prefijo: 'US$ ', divisor: 1e9, sufijo: T(' mil M', ' bn'), decimales: 1, unidad: T('miles de millones de US$', 'US$ billions')});
      G('dumbbell', 'Dumbbell', {plantilla: 'dumbbell', series: [it], titulo: T('Ingresos: ahora y hace un año', 'Revenue: now and a year ago'), etiquetaAntes: T('HACE UN AÑO', 'A YEAR AGO'), etiquetaDespues: T('ÚLTIMO TRIMESTRE', 'LATEST QUARTER')});
    } else omitidos.push('dumbbell: faltan trimestres SEC');
  }
  // 6. calendario
  if (hay('yf_gspc')) G('calendario', 'Calendario', {plantilla: 'calendario', series: bib('yf_gspc'), titulo: T('Los meses del mercado', 'The market, month by month')}); else omitidos.push('calendario: falta yf_gspc');
  // 7. barras agrupadas
  if (ENERGIA.every(hay)) G('agrupadas', 'Barras agrupadas', {plantilla: 'agrupadas', series: bib(...ENERGIA), titulo: T('La energía, fuente por fuente', 'Energy, source by source')}); else omitidos.push('agrupadas: faltan series de energía');
  // 8. bullet
  {
    const ids = ['fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_mortgage30us'].filter(hay);
    if (ids.length >= 2) G('bullet', 'Bullet', {plantilla: 'bullet', series: bib(...ids), titulo: T('Dónde estamos hoy', 'Where we stand today')}); else omitidos.push('bullet: faltan series FRED');
  }
  // 9. bandas
  if (hay('fred_unrate')) G('bandas', 'Bandas', {plantilla: 'bandas', series: bib('fred_unrate'), titulo: T('Desempleo: este año y la historia', 'Unemployment: this year and history')}); else omitidos.push('bandas: falta fred_unrate');
  // 10. pictograma
  {
    const idx = leerIndice('AAPL'), t = idx?.trimestres?.find((x) => x.puente);
    if (t) {
      const filas = fs.readFileSync(path.join(RAIZ, t.puente), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')), partes = filas.filter((f) => f[2] !== 'total' && f[2] !== 'inicio'), neta = filas[filas.length - 1];
      const csv = 'concepto,valor\n' + [...partes.map((f) => [f[0].replace(/"/g, ''), Math.abs(+f[1])]), [neta[0], +neta[1]]].filter((f) => f[1] > 0).map((f) => `"${f[0]}",${f[1]}`).join('\n');
      const m = JSON.parse(fs.readFileSync(path.join(RAIZ, t.puente + '.meta.json'), 'utf8')), p = m.presentacion;
      const it = itemCsv('picto_aapl', csv, {nombre: m.fuente.nombre, url: m.fuente.url, obtenido: m.fuente.obtenido, licencia: m.fuente.licencia}, {divisor: p.divisor, prefijo: p.prefijo, sufijo: p.sufijo, decimales: p.decimales, unidad: p.unidad});
      G('pictograma', 'Pictograma', {plantilla: 'pictograma', series: [it], titulo: T('A dónde fue el dinero', 'Where the money went')});
    } else omitidos.push('pictograma: sin trimestres de AAPL');
  }
  // 11. ranking por país
  try {
    const P = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8')), NOMBRE = {};
    try { (await import('../servidor/paises.mjs')).PAISES.forEach((q) => { if (!en) NOMBRE[q.iso3] = q.nombre; else if (q.nombre_en) NOMBRE[q.iso3] = q.nombre_en; }); } catch { /* sin nombres: se muestra solo el código */ }
    const fuente = {nombre: T('Banco Mundial — World Development Indicators (último dato de cada país)', 'World Bank — World Development Indicators (latest data for each country)'), url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', obtenido: hoy, licencia: 'CC BY 4.0'};
    const filas = Object.entries(P.ultimos.pib_pc).sort((a, b) => b[1].valor - a[1].valor).map(([iso, d]) => `${NOMBRE[iso] ? `${iso} · ${NOMBRE[iso]}` : iso},${d.valor}`);
    const it = itemCsv('ranking_pib_pc', 'concepto,valor\n' + filas.join('\n'), fuente, {prefijo: 'US$ ', decimales: 0, unidad: T('US$ corrientes por habitante', 'current US$ per capita')});
    G('ranking', 'Ranking', {plantilla: 'ranking_pais', series: [it], resalta: 'COL', titulo: T('PIB por habitante', 'GDP per capita')});
    G('enjambre', 'Enjambre', {plantilla: 'enjambre_pais', series: [it], resalta: 'COL', titulo: T('PIB por habitante: dónde está Colombia', 'GDP per capita: where Colombia stands')});
  } catch (e) { omitidos.push('ranking: ' + e.message); }
  // 12. dos hitos: el índice amplio del dólar (Fed, dominio público) visto desde dos fechas-hito. Las fechas son afirmaciones: confirmarlas con una fuente primaria antes de publicar.
  if (hay('fred_dtwexbgs')) G('dos_hitos', 'Dos hitos', {plantilla: 'dos_hitos', series: bib('fred_dtwexbgs'), titulo: T('El dólar tras dos choques', 'The broad dollar after two shocks'), hitos: HITOS_DOLAR(en)}); else omitidos.push('dos_hitos: falta fred_dtwexbgs');
  // 13-14. cordillera (bono a 10 años, diario, desde 2010) y corriente (energía mundial por fuente)
  if (hay('fred_dgs10')) G('cordillera', 'Cordillera', {plantilla: 'cordillera', series: bib('fred_dgs10'), titulo: T('El bono del Tesoro, año a año', 'The Treasury yield, year by year')}, (sp) => { sp.datos.d.desde = '2010-01-01'; }); else omitidos.push('cordillera: falta fred_dgs10');
  if (ENERGIA.every(hay)) G('corriente', 'Corriente', {plantilla: 'corriente', series: bib(...ENERGIA), titulo: T('La energía como un río', 'Energy as a river')}, (sp) => { sp.datos.d.desde = '1900-01-01'; }); else omitidos.push('corriente: faltan series de energía');
  return {modelos: out, omitidos};
}
/** Hitos del ejemplo del dólar (15-sep-2008 y 11-mar-2020). Fechas VERIFICADAS el 2026-11-08 contra fuente oficial (campo `fuente` de cada hito); los nombres son rótulos, no cifras. */
export const HITOS_DOLAR = (en) => [
  {fecha: '2008-09-15', nombre: en ? 'Lehman filing' : 'Quiebra de Lehman', fuente: 'FDIC: «On September 15, 2008, Lehman Brothers Holdings Inc. filed for bankruptcy» · https://www.fdic.gov/analysis/2011-01/orderly-liquidation-lehman-brothers-holdings-inc-under-dodd-frank-act'},
  {fecha: '2020-03-11', nombre: en ? 'COVID pandemic' : 'Pandemia de COVID', fuente: 'WHO Director-General, media briefing of 11 March 2020: COVID-19 «can be characterized as a pandemic» · https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020'},
];
