// Prueba el VISUALIZADOR UNIVERSAL: los 11 modelos nuevos (radar, área apilada, velas, histograma, dumbbell, calendario, barras agrupadas,
// bullet, serie con bandas, pictograma, ranking) con DATOS REALES de la biblioteca, en horizontal y vertical.
// Cada pieza debe compilar sin errores, pasar la auditoría de textos pisados Y la zona segura de reels (vertical).
// Uso: node scripts/prueba-universal.mjs [--ver] [--solo=radar,velas]   (--ver guarda fotogramas PNG en .tmp/universal/ para mirarlos)
import fs from 'node:fs';
import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {auditarColisiones, vistaPrevia} from '../servidor/render.mjs';
import {proponer, recomendar} from '../servidor/visualizador.mjs';
import {leerIndice} from '../servidor/trimestres.mjs';

const VER = process.argv.includes('--ver'), SOLO = (process.argv.find((a) => a.startsWith('--solo=')) ?? '').slice(7).split(',').filter(Boolean);
const TMP = path.join(RAIZ, '.tmp', 'universal'); fs.mkdirSync(TMP, {recursive: true});
let fallos = 0; const defectos = [];
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
const hay = (id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`));
const quiere = (id) => !SOLO.length || SOLO.includes(id);
const hoy = new Date().toISOString().slice(0, 10);

/** Genera, compila, audita y (con --ver) dibuja la pieza en los dos formatos. `ajuste(spec)` permite recortar `desde` como lo haría un experto. */
async function pieza(nombre, entrada, {ajuste, esperar = null} = {}) {
  for (const formato of ['horizontal', 'vertical']) {
    let r;
    try { r = generar({...entrada, formato, camara: formato === 'vertical' ? 'dinamico' : 'documental'}); } catch (e) { ok(false, `${nombre} · ${formato}: ${e.message}`); continue; }
    let spec = r.spec, informe = r.informe;
    if (ajuste) { spec = JSON.parse(JSON.stringify(spec)); ajuste(spec); const c = compilar(spec); informe = c.informe; r = {...r, plano: c.spec}; }
    const bien = informe.errores.length === 0;
    if (!bien) { ok(esperar === 'error', `${nombre} · ${formato} · ${informe.errores[0]}`); continue; }
    const plano = r.plano ?? compilar(spec).spec, aud = await auditarColisiones(plano, {paso: 0.4});
    const zona = formato === 'vertical' ? aud.zonaSegura : [];
    ok(aud.ok && !zona.length, `${nombre} · ${formato}${aud.ok ? '' : ' · ' + JSON.stringify(aud.problemas.slice(0, 2))}${zona.length ? ' · ZONA SEGURA: ' + JSON.stringify(zona.slice(0, 3)) : ''}`);
    if (informe.avisos.length) console.log('      avisos: ' + informe.avisos.slice(0, 2).map((a) => a.slice(0, 150)).join(' | '));
    if (VER) { const d = plano.duracion; await vistaPrevia(plano, [+(d * 0.45).toFixed(2), +(d - 0.3).toFixed(2)], {dir: TMP, nombre: `${nombre.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 30)}_${formato}`, escala: 0.5}); }
  }
}

// ── datos reales construidos a partir de archivos ya descargados ─────────────────────────────────────────────────
const sec = (tk) => { const f = path.join(RAIZ, 'datos', 'trimestres', tk, 'serie.csv'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')) : null; };
function itemCsv(nombre, csv, fuente, extra = {}) {
  const ruta = `.tmp/universal/${nombre}.csv`; fs.writeFileSync(path.join(RAIZ, ruta), csv);
  return {origen: 'archivo', ruta, tabla: 'categorias', uso: 'donut', nombre, fuente, ...extra};
}
const paisesUltimos = () => JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'paises-ultimos.json'), 'utf8'));
const NOMBRE_PAIS = {};
try { const m = await import('../servidor/paises.mjs'); m.PAISES.forEach((p) => { NOMBRE_PAIS[p.iso3] = p.nombre; }); } catch { /* sin nombres: se muestra solo el código */ }

// ── 1. RADAR ────────────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('radar')) {
  console.log('\n1) Radar');
  const ids = ['fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_vixcls', 'fred_umcsent', 'fred_mortgage30us'].filter(hay);
  if (ids.length >= 4) await pieza('radar · macro EE. UU. (series)', {plantilla: 'radar', series: bib(...ids), titulo: 'Dónde está EE. UU. frente a su historia'}); else console.log('  (faltan series FRED)');
  // país: puesto de Colombia entre 45 países en 7 indicadores (percentil de los últimos datos del Banco Mundial y el FMI)
  const U = paisesUltimos().ultimos, claves = ['pib_pc', 'crec_pib', 'inflacion', 'desempleo', 'esperanza_vida', 'exportaciones', 'deuda_pib'].filter((k) => U[k]?.COL);
  const nom = {pib_pc: 'PIB per cápita', crec_pib: 'Crecimiento del PIB', inflacion: 'Inflación', desempleo: 'Desempleo', esperanza_vida: 'Esperanza de vida', exportaciones: 'Exportaciones / PIB', deuda_pib: 'Deuda pública / PIB'};
  const filas = claves.map((k) => { const v = Object.values(U[k]).map((q) => q.valor), c = U[k].COL.valor; return [nom[k], +(((v.filter((q) => q < c).length) / (v.length - 1)) * 100).toFixed(1)]; });
  const it = itemCsv('radar_colombia_percentil', 'concepto,valor\n' + filas.map((f) => f.join(',')).join('\n'), {nombre: 'Banco Mundial (WDI) y FMI (WEO), último dato de cada país; percentil calculado entre los países de la lista', url: 'https://data.worldbank.org/', obtenido: hoy}, {decimales: 0, unidad: 'Percentil entre países'});
  await pieza('radar · Colombia entre 45 países (tabla)', {plantilla: 'radar_tabla', series: [it], titulo: 'Dónde está Colombia', nota: 'Cada eje: puesto de Colombia entre los países con dato (0 = menor, 100 = mayor); no dice si es bueno o malo.'});
}

// ── 2. ÁREA APILADA ─────────────────────────────────────────────────────────────────────────────────────────────
const ENERGIA = ['coal', 'oil', 'gas', 'hydro', 'nuclear'].map((k) => `ow_global_energy_substitution_${k}_twh`);
if (quiere('apilada')) {
  console.log('\n2) Área apilada y 100 %');
  if (ENERGIA.every(hay)) { await pieza('apilada · energía mundial por fuente', {plantilla: 'apilada', series: bib(...ENERGIA), titulo: 'De dónde sale la energía'}); await pieza('apilada100 · energía mundial por fuente', {plantilla: 'apilada100', series: bib(...ENERGIA), titulo: 'Qué peso tiene cada fuente'}); } else console.log('  (faltan series de energía)');
}

// ── 3. VELAS ────────────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('velas')) {
  console.log('\n3) Velas');
  if (hay('yf_gspc')) await pieza('velas · S&P 500, solo cierres (desde 2023)', {plantilla: 'velas', series: bib('yf_gspc'), titulo: 'El mercado de EE. UU.'}, {ajuste: (s) => { s.datos.d.desde = '2023-01-01'; }});
  // OHLC REAL: se pide a Yahoo (gratis) las 5 columnas de 3 años de un índice; si no hay red se dice y se omite
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=2y&interval=1d', {headers: {'User-Agent': 'RideTheLightning/0.1 (investigacion local)'}, signal: AbortSignal.timeout(30000)});
    const j = await r.json(), x = j.chart.result[0], q = x.indicators.quote[0], off = x.meta?.gmtoffset ?? 0;
    const filas = x.timestamp.map((t, i) => [new Date((t + off) * 1000).toISOString().slice(0, 10), q.open[i], q.high[i], q.low[i], q.close[i], q.volume[i]]).filter((f) => f.slice(1).every((v) => v != null));
    const ruta = '.tmp/universal/gspc_ohlc.csv'; fs.writeFileSync(path.join(RAIZ, ruta), 'fecha,abre,maximo,minimo,cierre,volumen\n' + filas.map((f) => f.join(',')).join('\n'));
    const fuente = {nombre: 'Yahoo Finance (API de gráficos, no oficial) · S&P 500 (^GSPC)', url: 'https://finance.yahoo.com/quote/%5EGSPC/history/', obtenido: hoy, licencia: 'Uso personal (Yahoo)'};
    const col = (c, n, extra = {}) => ({origen: 'archivo', ruta, x: 'fecha', tipoX: 'fecha', col: c, nombre: n, fuente, decimales: 2, ...extra});
    await pieza('velas · S&P 500 OHLC real con volumen', {plantilla: 'velas', ohlc: true, series: [col('abre', 'Apertura'), col('maximo', 'Máximo'), col('minimo', 'Mínimo'), col('cierre', 'Cierre'), col('volumen', 'Volumen', {decimales: 0})], titulo: 'El mercado de EE. UU., día a día'});
  } catch (e) { console.log(`  (sin red para OHLC real: ${e.message}; solo se probó con cierres)`); }
}

// ── 4. HISTOGRAMA ───────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('histograma')) {
  console.log('\n4) Histograma');
  if (hay('yf_gspc')) await pieza('histograma · retornos diarios del S&P 500', {plantilla: 'retornos', series: bib('yf_gspc'), titulo: 'Cómo se mueve el mercado'});
  if (hay('fred_unrate')) await pieza('histograma · desempleo de EE. UU. (niveles)', {plantilla: 'histograma', series: bib('fred_unrate'), titulo: 'Desempleo de EE. UU.'});
}

// ── 5. DUMBBELL ─────────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('dumbbell')) {
  console.log('\n5) Dumbbell');
  if (ENERGIA.every(hay)) await pieza('dumbbell · energía mundial, primer y último año (series)', {plantilla: 'dumbbell_series', series: bib(...ENERGIA), titulo: 'Antes y después por fuente'});
  const tks = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'NVDA', 'META', 'TSLA', 'NFLX'], fil = [];
  for (const tk of tks) { const s = sec(tk); if (s && s.length > 5) fil.push([tk, +s[s.length - 1][1], +s[s.length - 5][1]]); }
  if (fil.length >= 4) {
    const it = itemCsv('dumbbell_ingresos', 'concepto,valor,anterior\n' + fil.map((f) => `${f[0]},${f[1]},${f[2]}`).join('\n'), {nombre: 'SEC EDGAR (companyfacts), ingresos trimestrales; último trimestre frente al mismo trimestre del año anterior', url: 'https://www.sec.gov/edgar', obtenido: hoy}, {prefijo: 'US$ ', divisor: 1e9, sufijo: ' mil M', decimales: 1, unidad: 'miles de millones de US$'});
    await pieza('dumbbell · ingresos trimestrales vs año anterior (tabla)', {plantilla: 'dumbbell', series: [it], titulo: 'Ingresos: ahora y hace un año', etiquetaAntes: 'HACE UN AÑO', etiquetaDespues: 'ÚLTIMO TRIMESTRE'});
  } else console.log('  (faltan trimestres SEC)');
}

// ── 6. CALENDARIO ───────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('calendario')) {
  console.log('\n6) Calendario de calor');
  if (hay('yf_gspc')) { await pieza('calendario · retornos mensuales del S&P 500', {plantilla: 'calendario', series: bib('yf_gspc'), titulo: 'Los meses del mercado'}); await pieza('calendario · retornos diarios del S&P 500', {plantilla: 'calendario', modo: 'diario', series: bib('yf_gspc'), titulo: 'Los días del mercado'}, {ajuste: (s) => { s.datos.d.desde = '2019-01-01'; }}); }
}

// ── 7. BARRAS AGRUPADAS ─────────────────────────────────────────────────────────────────────────────────────────
if (quiere('agrupadas')) {
  console.log('\n7) Barras agrupadas');
  if (ENERGIA.every(hay)) await pieza('agrupadas · energía por fuente en 3 momentos', {plantilla: 'agrupadas', series: bib(...ENERGIA), titulo: 'La energía, fuente por fuente'});
}

if (quiere('agrupadas') && hay('pais_COL_urbanizacion')) {
  console.log('\n7b) Barras por década (serie anual con tendencia)');
  await pieza('barras_decada · urbanización de Colombia', {plantilla: 'barras_decada', series: bib('pais_COL_urbanizacion'), titulo: 'Colombia, década a década'});
}

// ── 8. BULLET ───────────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('bullet')) {
  console.log('\n8) Bullet');
  const ids = ['fred_unrate', 'fred_fedfunds', 'fred_dgs10', 'fred_mortgage30us'].filter(hay);
  if (ids.length >= 2) { await pieza('bullet · 4 indicadores contra su mediana', {plantilla: 'bullet', series: bib(...ids), titulo: 'Dónde estamos hoy'}); await pieza('bullet · meta escrita sin fuente (debe fallar)', {plantilla: 'bullet', series: bib(ids[0]), meta: {valor: 4.5}, titulo: 'Meta a mano'}, {esperar: 'error'}); }
}

// ── 9. SERIE CON BANDAS ─────────────────────────────────────────────────────────────────────────────────────────
if (quiere('bandas')) {
  console.log('\n9) Serie con bandas');
  if (hay('fred_unrate')) await pieza('bandas · desempleo de EE. UU., último año vs rango por mes', {plantilla: 'bandas', series: bib('fred_unrate'), titulo: 'Desempleo: este año y la historia'});
  if (hay('fred_mortgage30us')) await pieza('bandas · hipoteca a 30 años (semanal)', {plantilla: 'bandas', series: bib('fred_mortgage30us'), titulo: 'La hipoteca y su rango'});
}

// ── 10. PICTOGRAMA ──────────────────────────────────────────────────────────────────────────────────────────────
if (quiere('pictograma')) {
  console.log('\n10) Pictograma');
  const idx = leerIndice('AAPL'), t = idx?.trimestres?.find((x) => x.puente);
  if (t) {
    const filas = fs.readFileSync(path.join(RAIZ, t.puente), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')), partes = filas.filter((f) => f[2] !== 'total' && f[2] !== 'inicio'), neta = filas[filas.length - 1];
    const csv = 'concepto,valor\n' + [...partes.map((f) => [f[0].replace(/"/g, ''), Math.abs(+f[1])]), [neta[0], +neta[1]]].filter((f) => f[1] > 0).map((f) => `"${f[0]}",${f[1]}`).join('\n');
    const meta = JSON.parse(fs.readFileSync(path.join(RAIZ, t.puente + '.meta.json'), 'utf8')), p = meta.presentacion;
    const it = itemCsv('picto_aapl', csv, {nombre: meta.fuente.nombre, url: meta.fuente.url, obtenido: meta.fuente.obtenido, licencia: meta.fuente.licencia}, {divisor: p.divisor, prefijo: p.prefijo, sufijo: p.sufijo, decimales: p.decimales, unidad: p.unidad});
    await pieza('pictograma · a dónde fue cada dólar de Apple', {plantilla: 'pictograma', series: [it], titulo: 'A dónde fue el dinero'});
  } else console.log('  (sin trimestres de AAPL)');
}

// ── 11. RANKING POR PAÍS ────────────────────────────────────────────────────────────────────────────────────────
if (quiere('ranking')) {
  console.log('\n11) Ranking por país');
  const P = paisesUltimos(), fuente = {nombre: 'Banco Mundial — World Development Indicators (último dato de cada país)', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', obtenido: hoy, licencia: 'CC BY 4.0'};
  const filas = Object.entries(P.ultimos.pib_pc).sort((a, b) => b[1].valor - a[1].valor).map(([iso, d]) => `${iso} · ${NOMBRE_PAIS[iso] ?? iso},${d.valor}`);
  const it = itemCsv('ranking_pib_pc', 'concepto,valor\n' + filas.join('\n'), fuente, {prefijo: 'US$ ', decimales: 0, unidad: 'US$ corrientes por habitante'});
  await pieza('ranking · PIB per cápita (Colombia resaltada)', {plantilla: 'ranking_pais', series: [it], resalta: 'COL', titulo: 'PIB por habitante'});
  const inf = Object.entries(P.ultimos.inflacion).filter(([, d]) => d.valor > 0).sort((a, b) => b[1].valor - a[1].valor).map(([iso, d]) => `${iso} · ${NOMBRE_PAIS[iso] ?? iso},${d.valor}`);
  await pieza('ranking · inflación', {plantilla: 'ranking_pais', series: [itemCsv('ranking_inflacion', 'concepto,valor\n' + inf.join('\n'), {...fuente, url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG'}, {sufijo: ' %', decimales: 1, unidad: '% anual'})], resalta: 'COL', titulo: 'Inflación por país'});
}

// ── 13. DISTRIBUCIÓN: enjambre, cordillera, corriente (2026-11-09) ───────────────────────────────────────
if (quiere('distribucion')) {
  console.log('\n13) Distribución: enjambre, cordillera, corriente');
  const P = paisesUltimos(), fuente = {nombre: 'Banco Mundial — World Development Indicators (último dato de cada país)', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD', obtenido: hoy, licencia: 'CC BY 4.0'};
  const filas = Object.entries(P.ultimos.pib_pc).sort((a, b) => b[1].valor - a[1].valor).map(([iso, d]) => `${iso} · ${NOMBRE_PAIS[iso] ?? iso},${d.valor}`);
  await pieza('enjambre · PIB per cápita (Colombia resaltada)', {plantilla: 'enjambre_pais', series: [itemCsv('enjambre_pib_pc', 'concepto,valor\n' + filas.join('\n'), fuente, {prefijo: 'US$ ', decimales: 0, unidad: 'US$ corrientes por habitante'})], resalta: 'COL', titulo: 'PIB por habitante'});
  await pieza('enjambre · pocas filas (debe fallar)', {plantilla: 'enjambre_pais', series: [itemCsv('enjambre_pocas', 'concepto,valor\n' + filas.slice(0, 5).join('\n'), fuente, {decimales: 0})], titulo: 'Pocas filas'}, {esperar: 'error'});
  if (hay('fred_dgs10')) await pieza('cordillera · bono a 10 años desde 2010', {plantilla: 'cordillera', series: bib('fred_dgs10'), titulo: 'El bono del Tesoro, año a año'}, {ajuste: (s) => { s.datos.d.desde = '2010-01-01'; }});
  if (ENERGIA.every(hay)) { await pieza('corriente · energía mundial por fuente', {plantilla: 'corriente', series: bib(...ENERGIA), titulo: 'La energía como un río'}, {ajuste: (s) => { s.datos.d.desde = '1900-01-01'; }}); let corto = false; try { generar({plantilla: 'corriente', series: bib(...ENERGIA.slice(0, 2)), titulo: 'Dos', formato: 'horizontal'}); } catch { corto = true; } ok(corto, 'corriente · con 2 series la plantilla se niega'); }
}

// ── visualizador autónomo ───────────────────────────────────────────────────────────────────────────────────────
if (!SOLO.length) {
  console.log('\n12) El visualizador recomienda los modelos nuevos');
  const rec = (ids, extra = {}) => recomendar({series: bib(...ids), formato: 'vertical', ...extra}).map((c) => c.plantilla);
  const nuevo = new Set(['radar', 'apilada', 'apilada100', 'velas', 'histograma', 'retornos', 'dumbbell_series', 'calendario', 'agrupadas', 'bullet', 'bandas']);
  if (hay('yf_gspc')) { const r = rec(['yf_gspc']); ok(r.includes('velas') && r.includes('retornos') && r.includes('calendario'), `1 serie diaria de precios → ${r.join(', ')}`); }
  if (hay('fred_unrate')) { const r = rec(['fred_unrate']); ok(r.includes('bandas') && r.includes('bullet') && r.includes('histograma'), `1 serie mensual → ${r.join(', ')}`); }
  if (ENERGIA.every(hay)) { const r = rec(ENERGIA); ok(r.includes('apilada') && r.includes('apilada100') && r.includes('agrupadas'), `5 series de la misma unidad → ${r.join(', ')}`); const o = await proponer({series: bib(...ENERGIA), formato: 'vertical'}, {max: 6}); ok(o.filter((x) => x.ok).length >= 4 && o.some((x) => nuevo.has(x.plantilla) && x.ok), `propone ${o.map((x) => x.plantilla + (x.ok ? '' : ' ✗')).join(', ')}${o.filter((x) => !x.ok).length ? ' · ' + o.filter((x) => !x.ok).map((x) => x.problemas[0]).join(' | ').slice(0, 200) : ''}`); }
  const mix = ['fred_unrate', 'fred_dgs10', 'fred_vixcls', 'fred_umcsent'].filter(hay);
  if (mix.length === 4) { const r = rec(mix); ok(r.includes('radar') && !r.includes('apilada'), `4 series de unidades distintas → ${r.join(', ')} (sin apilada)`); }
}
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
