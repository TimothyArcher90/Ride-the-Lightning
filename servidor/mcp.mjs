// Servidor MCP (stdio): permite dirigir Ride the Lightning desde Claude Code / Claude Desktop.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {compilar, RAIZ, rutaSegura} from './compilar.mjs';
import {vistaPrevia, renderizar} from './render.mjs';
import {buscar, descargar, leerCatalogo} from './catalogo.mjs';
import {descargarAdHoc, combinar} from './biblioteca.mjs';
import {inspeccionar, hayEnBiblioteca} from './datos.mjs';
import {PLANTILLAS, CAMARAS, analizar, generar} from './plantillas.mjs';
import {proponer as proponerViz} from './visualizador.mjs';
import {buscarEmpresas, asegurarEmpresa, itemTrimestre, vigilar as vigilarSec} from './trimestres.mjs';
import {tr} from '../web/i18n.js';

// Language of the messages and tool descriptions: RTL_LANG (the studio chat sets it to the interface language), or the system language.
const LS = ['es', 'en'].includes(process.env.RTL_LANG) ? process.env.RTL_LANG : /^es/i.test(Intl.DateTimeFormat().resolvedOptions().locale) ? 'es' : 'en';
const T = (k, v) => tr(k, v, LS);
// English tool descriptions (the Spanish originals below are used when LS is 'es').
const EN = {
  guia_de_direccion: 'Accuracy rules, motion language and chart criteria. Read it before directing a piece.',
  buscar_series: 'Search the library of historical series (commodities, markets, macro, crypto, long history). Returns the REAL start/end if already downloaded.',
  descargar_serie: 'Download the COMPLETE history (from the first data point) of a catalog series, with provenance (.meta.json, sha256, first and last data point).',
  descargar_serie_adhoc: 'Download a series outside the catalog: adapter fred {id}, yahoo {simbolo}, coinmetrics {activo, metrica, inicio}, owid {slug, entidad, columna}, worldbank {indicador, pais}, imf {indicador, pais, proyecciones}, eurostat {dataset, filtros}, tesoro {campo}, trm {}. Full history.',
  combinar_series: 'Join already-downloaded series into a wide table by EXACT date (no resampling). It rebuilds itself when a component changes. Use it for multi-panel pieces and correlation matrices.',
  listar_plantillas: 'Animation templates (historia, comparar, panel, carrera, correlacion…) and the available camera presets.',
  analizar_serie: 'Summary of a library series and the KEY MOMENTS detected in the data (maximum, biggest rise/fall, first, last), with their explanation. Use it before generating a story.',
  proponer_visualizaciones: 'THE VISUALIZER: given library data (1 or several series), picks the charts that tell it best, builds up to 4 genuinely different options, verifies them (accuracy and overlapping texts) and saves each one that passes in specs/opcion-<name>-<template>.json.',
  generar_pieza: 'Generates the COMPLETE spec of a piece from a template (camera, pace, timings and colours resolved) and saves it in specs/<name>.json. Then use vista_previa and exportar_video with that path.',
  inspeccionar_datos: 'Inspect a data file (xlsx, xls, xlsb, ods, csv, tsv, txt, json): sheets, columns, types, ranges, blanks, hash. Use it before writing the spec.',
  compilar_spec: 'Validate and compile a spec: errors, warnings and the verification report (each figure → series, date, row).',
  vista_previa: 'Render PNG frames at the requested instants (seconds) to REVIEW the result. Returns the images: look for overlapping cards, cut-off text and framing.',
  exportar_video: 'Render in the background: reference MP4 (h264 crf17, yuv420p) and, with alfa, a ProRes 4444 .mov with an alpha channel for Premiere. Returns an id; poll estado_render.',
  estado_render: 'Status of a render started with exportar_video.',
  listar_trimestres: 'Library of quarters per company (SEC EDGAR, official data since 2009). Without «ticker» lists the companies; with «ticker» (AMZN, AAPL…) its quarters and which ones support a Sankey. If the company is not downloaded yet, it downloads it.',
  generar_trimestre: 'Generates the spec of ONE quarter of a company (Sankey “where it comes from and where it goes”, or waterfall) and saves it in specs/. Then use vista_previa and exportar_video. «fin» = closing date (YYYY-MM-DD) or «ultimo».',
  vigilar_reportes: 'Asks the SEC whether any library company filed a new 10-Q/10-K; if so, adds the quarter to the library. (The 24/7 updater already does this every 4 h.)',
  pieza_actual: 'The piece the user has open in the studio: its full spec and whether it compiles. ALWAYS start here when the user asks for a change (“make it vertical”, “remove the taxes”, “change the colour”).',
  editar_pieza: 'Edit the open piece: list of changes {ruta, valor} (sets), {ruta, eliminar:true} (deletes) or {ruta:"capas", insertar:{…layer…}}. Paths like «tema», «formato», «duracion», «titulo», «capas[1].t». Validates before saving: if it does not compile it is NOT saved and you are told why. The studio updates instantly.',
};
const IDI = z.enum(['es', 'en']).optional().describe('Language of the piece (idioma). Default: the interface language.');

const server = new McpServer({name: 'ride-the-lightning', version: '0.1.0'},
  {instructions: tr('srv_mcp_instr', null, LS)});
const _tool = server.tool.bind(server);
server.tool = (nombre, desc, ...resto) => _tool(nombre, LS === 'en' ? (EN[nombre] ?? desc) : desc, ...resto);
const texto = (o) => ({content: [{type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2)}]});
const leerSpec = (spec, ruta) => { if (spec) return spec; if (ruta) return JSON.parse(fs.readFileSync(rutaSegura(ruta), 'utf8')); throw new Error(T('srv_mcp_pasa_spec')); };
const resumen = (i) => ({ok: i.ok, errores: i.errores, avisos: i.avisos, datos: i.datos.map((d) => ({id: d.id, filas: d.filas, inicio: d.inicio, fin: d.fin, recortada: d.recortada, fuente: d.fuente.nombre, sha256: d.sha256.slice(0, 16)})),
  cifras: i.cifras.filter((c) => c.mostrado).map((c) => ({mostrado: c.mostrado, serie: c.serie, fecha: c.fecha, fila: c.fila})), metodos: i.metodos});
const trabajos = new Map();

server.tool('guia_de_direccion', 'Reglas de exactitud, lenguaje de movimiento y criterio de gráficas. Léela antes de dirigir.', {}, async () =>
  texto(fs.readFileSync(path.join(RAIZ, 'servidor', 'guia-de-direccion.md'), 'utf8')));

server.tool('buscar_series', 'Busca en la biblioteca de series históricas (commodities, mercados, macro, cripto, historia larga). Devuelve inicio/fin REALES si ya se descargó.', {consulta: z.string().default('')}, async ({consulta}) => texto(buscar(consulta).slice(0, 60)));

server.tool('descargar_serie', 'Descarga la historia COMPLETA (desde el primer dato) de una serie del catálogo, con procedencia (.meta.json, sha256, primer y último dato).', {id: z.string()}, async ({id}) => {
  const e = leerCatalogo().find((x) => x.id === id); if (!e) return texto(T('srv_mcp_no_existe', {id}));
  const m = await descargar(e);
  return texto({archivo: path.relative(RAIZ, m.archivo), filas: m.filas, inicio: m.inicio, fin: m.fin, columnas: fs.readFileSync(m.archivo, 'utf8').split('\n')[0], fuente: m.fuente});
});

server.tool('descargar_serie_adhoc', 'Descarga una serie fuera del catálogo: adaptador fred {id}, yahoo {simbolo}, coinmetrics {activo, metrica, inicio}, owid {slug, entidad, columna}, worldbank {indicador, pais}, imf {indicador, pais, proyecciones}, eurostat {dataset, filtros}, tesoro {campo}, trm {}. Historia completa.',
  {id: z.string(), nombre: z.string(), adaptador: z.enum(['fred', 'yahoo', 'coinmetrics', 'owid', 'worldbank', 'imf', 'eurostat', 'tesoro', 'trm']), args: z.record(z.any()), unidad: z.string().optional(), frecuencia: z.string().optional()},
  async (a) => { const m = await descargarAdHoc(a); return texto({archivo: path.relative(RAIZ, m.archivo), filas: m.filas, inicio: m.inicio, fin: m.fin, fuente: m.fuente}); });

server.tool('combinar_series', 'Une series ya descargadas en una tabla ancha por fecha EXACTA (sin remuestrear). Se reconstruye sola cuando cambia un componente. Úsala para paneles múltiples y matrices de correlación.',
  {ids: z.array(z.string()).min(2), nombre: z.string(), id: z.string()}, async (a) => { const r = combinar(a); return texto({archivo: path.relative(RAIZ, r.archivo), filas: r.filas, filasConTodas: r.filasConTodas, inicio: r.inicio, fin: r.fin, fuente: r.fuente.nombre}); });

server.tool('listar_plantillas', 'Plantillas de animación (historia, comparar, panel, carrera, correlación) y presets de cámara disponibles.', {}, async () => texto({plantillas: PLANTILLAS, camaras: Object.entries(CAMARAS).map(([id, c]) => ({id, nombre: c.nombre, descripcion: c.descripcion}))}));

server.tool('analizar_serie', 'Resumen de una serie de la biblioteca y MOMENTOS CLAVE detectados en los datos (máximo, mayor subida/caída, primero, último), con su explicación. Úsalo antes de generar una historia.',
  {id: z.string()}, async ({id}) => { const e = leerCatalogo().find((x) => x.id === id); if (e && !hayEnBiblioteca(id)) await descargar(e); return texto(analizar([{origen: 'biblioteca', id}])); });

server.tool('proponer_visualizaciones', 'EL VISUALIZADOR: dado un dato de la biblioteca (1 o varias series), elige las gráficas que mejor lo cuentan, construye hasta 4 opciones realmente distintas (línea, pendiente, bump, carrera, panel…), las verifica (exactitud y textos pisados) y guarda cada una que pase en specs/opcion-<nombre>-<plantilla>.json. Entrega al usuario SOLO las que salen ok:true, con su porqué.',
  {nombre: z.string(), series: z.array(z.string()), formato: z.enum(['horizontal', 'vertical']).default('vertical'), titulo: z.string().optional(), max: z.number().min(1).max(6).default(4)},
  async (a) => {
    const cat = leerCatalogo(); for (const id of a.series) { const e = cat.find((x) => x.id === id); if (e && !hayEnBiblioteca(id)) await descargar(e); }
    const ops = await proponerViz({series: a.series.map((id) => ({origen: 'biblioteca', id})), formato: a.formato, titulo: a.titulo}, {max: a.max});
    return texto(ops.map((o) => { let ruta = null; if (o.ok) { ruta = path.join('specs', `opcion-${a.nombre.replace(/[^\w-]+/g, '_')}-${o.plantilla}.json`); fs.writeFileSync(path.join(RAIZ, ruta), JSON.stringify(o.spec, null, 2)); } return {plantilla: o.plantilla, nombre: o.nombre, porque: o.porque, tema: o.tema, ok: o.ok, ruta, problemas: o.problemas, notas: o.notas}; }));
  });

server.tool('generar_pieza', 'Genera la spec COMPLETA de una pieza a partir de una plantilla (cámara, ritmo, tiempos y colores resueltos) y la guarda en specs/<nombre>.json. Luego usa vista_previa y exportar_video con esa ruta.',
  {idioma: IDI, nombre: z.string(), plantilla: z.enum(['historia', 'comparar', 'panel', 'carrera', 'correlacion', 'pendiente', 'bump', 'divergente']), series: z.array(z.string()), momentos: z.array(z.object({tipo: z.enum(['primero', 'subida', 'caida', 'max', 'min', 'ultimo']), etiqueta: z.string().max(30).optional()})).optional(),
    camara: z.enum(['cinematico', 'documental', 'dinamico', 'seguir', 'estatico']).default('documental'), formato: z.enum(['horizontal', 'vertical']).default('horizontal'), titulo: z.string().optional(), foco: z.number().optional(), estiloMomento: z.enum(['tarjeta', 'barra', 'pildora', 'circulo']).default('tarjeta'), tema: z.enum(['oscuro', 'harris', 'carbon']).default('oscuro'), vivo: z.boolean().default(false)},
  async (a) => {
    const cat = leerCatalogo(); for (const id of a.series) { const e = cat.find((x) => x.id === id); if (e && !hayEnBiblioteca(id)) await descargar(e); }
    const items = a.series.map((id) => ({origen: 'biblioteca', id})), an = a.plantilla === 'historia' && items.length === 1 ? analizar(items) : null;
    const momentos = (a.momentos ?? an?.momentos?.filter((x) => x.seleccionado) ?? []).map((m) => { const c = an?.momentos?.find((x) => x.tipo === m.tipo); return {tipo: m.tipo, ancla: c?.ancla ?? {max: true}, etiqueta: m.etiqueta ?? c?.etiqueta}; });
    const r = generar({idioma: a.idioma ?? LS, plantilla: a.plantilla, series: items, momentos, camara: a.camara, formato: a.formato, titulo: a.titulo, foco: a.foco, estiloMomento: a.estiloMomento, tema: a.tema, vivo: a.vivo ? {render: 'final', alfa: true, minEntreRendersMin: 360} : null});
    const ruta = path.join('specs', a.nombre.replace(/[^\w-]+/g, '_') + '.json'); fs.writeFileSync(path.join(RAIZ, ruta), JSON.stringify(r.spec, null, 2));
    return texto({ruta, duracion: r.spec.duracion, notas: r.notas, ...resumen(r.informe)});
  });

server.tool('inspeccionar_datos', 'Inspecciona un archivo de datos (xlsx, xls, xlsb, ods, csv, tsv, txt, json): hojas, columnas, tipos, rangos, vacíos, hash. Úsalo antes de escribir la spec.',
  {archivo: z.string(), hoja: z.string().optional(), filaEncabezado: z.number().optional()}, async ({archivo, hoja, filaEncabezado}) => texto(inspeccionar(rutaSegura(archivo), {hoja, filaEncabezado})));

server.tool('compilar_spec', 'Valida y compila una spec: errores, avisos y el informe de verificación (cada cifra → serie, fecha, fila).', {spec: z.any().optional(), ruta: z.string().optional()}, async ({spec, ruta}) => {
  const {informe} = compilar(leerSpec(spec, ruta)); return texto(resumen(informe));
});

server.tool('vista_previa', 'Renderiza fotogramas PNG en los instantes pedidos (segundos) para REVISAR el resultado. Devuelve las imágenes: mira tarjetas solapadas, texto cortado y encuadres.',
  {spec: z.any().optional(), ruta: z.string().optional(), tiempos: z.array(z.number()).min(1).max(8), completa: z.boolean().default(false)}, async ({spec, ruta, tiempos, completa}) => {
    const {spec: p, informe} = compilar(leerSpec(spec, ruta));
    if (!informe.ok) return texto(resumen(informe));
    const files = await vistaPrevia(p, tiempos, {dir: path.join(RAIZ, '.tmp', 'vistas'), nombre: 'mcp_' + crypto.randomBytes(2).toString('hex'), escala: completa ? 1 : 0.5, informe});
    return {content: [{type: 'text', text: `${T('srv_mcp_vistas')} ${files.join(' | ')}\n${JSON.stringify(resumen(informe).avisos)}`}, ...files.map((f) => ({type: 'image', data: fs.readFileSync(f).toString('base64'), mimeType: 'image/png'}))]};
  });

server.tool('exportar_video', 'Renderiza en segundo plano: MP4 de referencia (h264 crf17, yuv420p) y, si alfa, .mov ProRes 4444 con canal alfa para Premiere. Devuelve un id; consulta estado_render.',
  {spec: z.any().optional(), ruta: z.string().optional(), calidad: z.enum(['borrador', 'final']).default('borrador'), alfa: z.boolean().default(false), nombre: z.string().optional()}, async ({spec, ruta, calidad, alfa, nombre}) => {
    const s = leerSpec(spec, ruta), {spec: p, informe} = compilar(s);
    if (!informe.ok) return texto(resumen(informe));
    const id = crypto.randomBytes(4).toString('hex'), t = {estado: 'en curso', progreso: null}; trabajos.set(id, t);
    renderizar(p, informe, {nombre: nombre ?? (ruta ? path.basename(ruta, '.json') : s.titulo), calidad, alfa, onProgreso: (pr) => (t.progreso = pr)})
      .then((r) => Object.assign(t, {estado: 'listo', resultado: r})).catch((e) => Object.assign(t, {estado: 'error', error: String(e.message ?? e)}));
    return texto({id, nota: T('srv_mcp_nota_render')});
  });

server.tool('estado_render', 'Estado de un render lanzado con exportar_video.', {id: z.string()}, async ({id}) => texto(trabajos.get(id) ?? {estado: 'desconocido'}));

// ── trimestres (SEC EDGAR): biblioteca de estados de resultados por Q + agente vigilante ───────────────────────────
server.tool('listar_trimestres', 'Biblioteca de trimestres por empresa (SEC EDGAR, datos oficiales desde 2009). Sin «ticker» lista las empresas; con «ticker» (AMZN, AAPL…) sus trimestres y cuáles admiten Sankey. Si la empresa aún no está bajada, la baja.',
  {ticker: z.string().optional(), buscar: z.string().optional().describe(LS === 'en' ? 'Text to search for a company by name or ticker across the WHOLE US stock exchange.' : 'Texto para buscar una empresa por nombre o ticker en TODA la bolsa de EE. UU.')}, async ({ticker, buscar}) => {
    if (!ticker) return texto(buscarEmpresas(buscar ?? ''));
    const t = ticker.toUpperCase();
    let i; try { i = await asegurarEmpresa(t); } catch (e) { return texto({error: e.message}); }
    return texto({ticker: t, nombre: i.nombre, actualizado: i.actualizado, trimestres: i.trimestres.map((x) => ({fin: x.fin, etiqueta: x.etiqueta, ingresos: x.ingresos, utilidadNeta: x.utilidadNeta, sankey: !!x.archivo, q4Calculado: x.q4Calculado, notas: x.notas})), omitidos: i.omitidos});
  });
server.tool('generar_trimestre', 'Genera la spec de UN trimestre de una empresa (Sankey «de dónde viene y adónde va», o cascada) y la guarda en specs/. Luego usa vista_previa y exportar_video. «fin» = fecha de cierre (AAAA-MM-DD) o «ultimo».',
  {idioma: IDI, ticker: z.string(), fin: z.string().default('ultimo'), uso: z.enum(['sankey', 'puente']).default('sankey'), formato: z.enum(['horizontal', 'vertical']).default('horizontal'), tema: z.enum(['oscuro', 'harris', 'carbon']).default('oscuro'), como_actual: z.boolean().default(false).describe(LS === 'en' ? 'true = replaces the piece the user has open in the studio (chat)' : 'true = reemplaza la pieza que el usuario tiene abierta en el estudio (chat)')},
  async (a) => {
    const t = a.ticker.toUpperCase(); let idx; try { idx = await asegurarEmpresa(t); } catch (e) { return texto({error: e.message}); }
    const trim = a.fin === 'ultimo' ? idx.trimestres.find((x) => (a.uso === 'sankey' ? x.archivo : true)) : idx.trimestres.find((x) => x.fin === a.fin);
    if (!trim) return texto({error: T('srv_mcp_no_trimestre', {t})});
    const r = generar({idioma: a.idioma ?? LS, plantilla: a.uso === 'sankey' ? 'resultados' : 'puente', series: [itemTrimestre(t, trim.fin, a.uso)], formato: a.formato, tema: a.tema});
    const nombre = `trimestre-${t}-${trim.etiqueta.replace(/\s+/g, '-')}${a.uso === 'puente' ? '-cascada' : ''}`, ruta = a.como_actual ? path.join('specs', '_chat_actual.json') : path.join('specs', nombre + '.json');
    fs.writeFileSync(path.join(RAIZ, ruta), JSON.stringify(r.spec, null, 2));
    return texto({spec: ruta, etiqueta: trim.etiqueta, errores: r.informe.errores, avisos: r.informe.avisos, notas: r.notas});
  });
server.tool('vigilar_reportes', 'Pregunta a la SEC si alguna empresa de la biblioteca publicó un 10-Q/10-K nuevo; si sí, suma el trimestre a la biblioteca. (El actualizador 24/7 ya lo hace cada 4 h.)', {}, async () => texto(await vigilarSec()));

// ── chat del estudio: editar en vivo la pieza que el usuario tiene abierta ────────────────────────────────────────
const ACTUAL = path.join(RAIZ, 'specs', '_chat_actual.json');
const leerActual = () => { if (!fs.existsSync(ACTUAL)) throw new Error(T('srv_mcp_sin_pieza')); return JSON.parse(fs.readFileSync(ACTUAL, 'utf8')); };
const resumenPieza = (spec) => { const c = compilar(spec); return {titulo: spec.titulo, duracion: spec.duracion, formato: spec.formato, tema: spec.tema ?? 'oscuro', capas: (spec.capas ?? []).map((x, i) => `${i}: ${x.tipo}${x.id ? ' #' + x.id : ''}${x.texto ? ' «' + String(x.texto).slice(0, 40) + '»' : ''}${x.t ? ' t=' + JSON.stringify(x.t) : ''}`), datos: Object.fromEntries(Object.entries(spec.datos ?? {}).map(([k, d]) => [k, {archivo: d.archivo, tipo: d.tipo ?? 'serie', fuente: d.fuente?.nombre}])), errores: c.informe.errores, avisos: c.informe.avisos.slice(0, 8)}; };
function aplicar(obj, ruta, valor, eliminar) {   // «capas[1].t», «tema»: pone (o borra) un valor
  const pasos = String(ruta).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean); let o = obj;
  for (let i = 0; i < pasos.length - 1; i++) { o = o[pasos[i]]; if (o == null) throw new Error(T('srv_mcp_ruta_no', {ruta, paso: pasos[i]})); }
  const k = pasos[pasos.length - 1];
  if (eliminar) { if (Array.isArray(o)) o.splice(+k, 1); else delete o[k]; } else o[k] = valor;
}
server.tool('pieza_actual', 'La pieza que el usuario tiene abierta en el estudio: su spec completa y si compila. Empieza SIEMPRE por aquí cuando el usuario pida un cambio («cámbialo a vertical», «quita los impuestos», «pon otro color»).', {}, async () => {
  const spec = leerActual(); return texto({spec, ...resumenPieza(spec)});
});
server.tool('editar_pieza', 'Edita la pieza abierta: lista de cambios {ruta, valor} (pone), {ruta, eliminar:true} (borra) o {ruta:"capas", insertar:{…capa…}}. Rutas como «tema», «formato», «duracion», «titulo», «capas[1].t». Valida antes de guardar: si no compila, NO se guarda y te dice por qué. El estudio se actualiza solo.',
  {cambios: z.array(z.object({ruta: z.string(), valor: z.any().optional(), eliminar: z.boolean().optional(), insertar: z.any().optional()})).min(1)}, async ({cambios}) => {
    const spec = leerActual(), copia = JSON.parse(JSON.stringify(spec));
    try {
      for (const c of cambios) {
        if (c.insertar !== undefined) { const lista = String(c.ruta).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean).reduce((o, k) => o[k], copia); if (!Array.isArray(lista)) throw new Error(T('srv_mcp_no_lista', {ruta: c.ruta})); lista.push(c.insertar); }
        else aplicar(copia, c.ruta, c.valor, c.eliminar);
      }
    } catch (e) { return texto({guardado: false, error: e.message}); }
    const r = resumenPieza(copia);
    if (r.errores.length) return texto({guardado: false, motivo: T('srv_mcp_no_compila'), errores: r.errores});
    fs.writeFileSync(ACTUAL, JSON.stringify(copia, null, 2));
    return texto({guardado: true, ...r});
  });

await server.connect(new StdioServerTransport());
