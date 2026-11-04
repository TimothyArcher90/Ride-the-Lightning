// Los 16 modelos de gráfica con DATOS REALES de la biblioteca, para revisarlos y para la prueba de calidad.
// Cada entrada: {id, nombre, spec (ya compilada), informe}. Uso: `await construirModelos('vertical')`.
// Los que no salen de una plantilla (barras, dispersión) se arman aquí con una spec a mano sobre series de la biblioteca.
import fs from 'node:fs';
import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
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

function barras(formato) {
  const m = meta('bm_gold');
  const datos = {d: {archivo: 'datos/biblioteca/bm_gold.csv', x: 'fecha', tipoX: 'fecha', desde: '2026-03', columnas: [{col: 'Gold', nombre: 'Oro', color: 'oro', prefijo: 'US$ ', decimales: 0, unidad: 'US$ por onza troy'}]}};
  return {version: 1, titulo: 'El oro, mes a mes', formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: 'El oro, mes a mes', color: 'oro', sub: 'Precio mensual, US$ por onza troy', t: [0.2, 7.9]}, {tipo: 'barras', datos: 'd', formatoX: 'mes', t: [0.9, 4.5]}], _fuente: m.fuente.nombre};
}
function dispersion(formato) {
  // oro vs. cobre (mensual, desde 2000): una fila por mes con los dos precios; la regresión y R² los calcula el compilador.
  const rd = (id) => new Map(fs.readFileSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')));
  const a = rd('bm_gold'), b = rd('bm_copper'), filas = [];
  for (const [f, v] of a) if (f >= '2000-01-01' && b.has(f) && v !== '' && b.get(f) !== '') filas.push(`${f},${v},${b.get(f)}`);
  fs.mkdirSync(path.join(RAIZ, '.tmp'), {recursive: true});
  const ruta = '.tmp/viz-oro-cobre.csv'; fs.writeFileSync(path.join(RAIZ, ruta), 'fecha,oro,cobre\n' + filas.join('\n'));
  const m = meta('bm_gold');
  const datos = {d: {archivo: ruta, x: 'oro', tipoX: 'num', fuente: {nombre: m.fuente.nombre, corto: 'Banco Mundial · Pink Sheet · Oro y cobre', url: m.fuente.url, obtenido: m.fuente.obtenido, licencia: m.fuente.licencia}, columnas: [{col: 'cobre', nombre: 'Cobre', color: 'teal', prefijo: 'US$ ', decimales: 0, unidad: 'US$ por tonelada'}]}};
  return {version: 1, titulo: '¿Suben juntos el oro y el cobre?', formato, fps: 30, duracion: 8, datos, capas: [{tipo: 'titulo', texto: '¿Suben juntos el oro y el cobre?', color: 'oro', t: [0.2, 7.9]}, {tipo: 'dispersion', datos: 'd', etiquetaX: 'Oro, US$ por onza', etiquetaY: 'Cobre, US$ por tonelada', t: [0.9, 4.5]}]};
}

/** Devuelve [{id, nombre, spec, informe, duracion}] de los 16 modelos para el formato pedido. */
export async function construirModelos(formato = 'vertical', {camara = 'dinamico'} = {}) {
  const out = [];
  const G = (id, nombre, entrada) => { const r = generar({formato, camara, ...entrada}); out.push({id, nombre, spec: compilar(r.spec).spec, informe: r.informe, duracion: r.spec.duracion, notas: r.notas}); };
  const ids = ['bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw', 'fred_dgs10'].filter(hay);
  G('historia', 'La historia de una cifra', {plantilla: 'historia', series: bib('bm_gold'), momentos: []});
  G('comparar', 'Una contra las demás', {plantilla: 'comparar', series: bib(...ids.slice(0, 3)), foco: 0});
  G('panel', 'Comparar varias a la vez', {plantilla: 'panel', series: bib(...ids.slice(0, 3))});
  for (const [id, nombre, fn] of [['barras', 'Barras', barras], ['dispersion', 'Dispersión', dispersion]]) {
    const spec = fn(formato), c = compilar(spec); out.push({id, nombre, spec: c.spec, informe: c.informe, duracion: spec.duracion, notas: []});
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
