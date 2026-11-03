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
import {inspeccionar} from './datos.mjs';
import {PLANTILLAS, CAMARAS, analizar, generar} from './plantillas.mjs';
import {buscarEmpresas, asegurarEmpresa, itemTrimestre, vigilar as vigilarSec} from './trimestres.mjs';

const server = new McpServer({name: 'ride-the-lightning', version: '0.1.0'},
  {instructions: 'Ride the Lightning anima gráficas de datos con cifras 100 % trazables. Antes de dirigir una pieza llama a guia_de_direccion. Flujo: buscar_series → descargar_serie → compilar_spec → vista_previa (mira las imágenes) → exportar_video. Nunca escribas cifras a mano en los textos: usa marcadores.'});
const texto = (o) => ({content: [{type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2)}]});
const leerSpec = (spec, ruta) => { if (spec) return spec; if (ruta) return JSON.parse(fs.readFileSync(rutaSegura(ruta), 'utf8')); throw new Error('Pasa "spec" (objeto) o "ruta" (archivo .json dentro del proyecto).'); };
const resumen = (i) => ({ok: i.ok, errores: i.errores, avisos: i.avisos, datos: i.datos.map((d) => ({id: d.id, filas: d.filas, inicio: d.inicio, fin: d.fin, recortada: d.recortada, fuente: d.fuente.nombre, sha256: d.sha256.slice(0, 16)})),
  cifras: i.cifras.filter((c) => c.mostrado).map((c) => ({mostrado: c.mostrado, serie: c.serie, fecha: c.fecha, fila: c.fila})), metodos: i.metodos});
const trabajos = new Map();

server.tool('guia_de_direccion', 'Reglas de exactitud, lenguaje de movimiento y criterio de gráficas. Léela antes de dirigir.', {}, async () =>
  texto(fs.readFileSync(path.join(RAIZ, 'servidor', 'guia-de-direccion.md'), 'utf8')));

server.tool('buscar_series', 'Busca en la biblioteca de series históricas (commodities, mercados, macro, cripto, historia larga). Devuelve inicio/fin REALES si ya se descargó.', {consulta: z.string().default('')}, async ({consulta}) => texto(buscar(consulta).slice(0, 60)));

server.tool('descargar_serie', 'Descarga la historia COMPLETA (desde el primer dato) de una serie del catálogo, con procedencia (.meta.json, sha256, primer y último dato).', {id: z.string()}, async ({id}) => {
  const e = leerCatalogo().find((x) => x.id === id); if (!e) return texto(`No existe "${id}" en el catálogo. Usa buscar_series.`);
  const m = await descargar(e);
  return texto({archivo: path.relative(RAIZ, m.archivo), filas: m.filas, inicio: m.inicio, fin: m.fin, columnas: fs.readFileSync(m.archivo, 'utf8').split('\n')[0], fuente: m.fuente});
});

server.tool('descargar_serie_adhoc', 'Descarga una serie fuera del catálogo: adaptador fred {id}, yahoo {simbolo}, coinmetrics {activo, metrica, inicio}, owid {slug, entidad, columna}. Historia completa.',
  {id: z.string(), nombre: z.string(), adaptador: z.enum(['fred', 'yahoo', 'coinmetrics', 'owid']), args: z.record(z.any()), unidad: z.string().optional(), frecuencia: z.string().optional()},
  async (a) => { const m = await descargarAdHoc(a); return texto({archivo: path.relative(RAIZ, m.archivo), filas: m.filas, inicio: m.inicio, fin: m.fin, fuente: m.fuente}); });

server.tool('combinar_series', 'Une series ya descargadas en una tabla ancha por fecha EXACTA (sin remuestrear). Se reconstruye sola cuando cambia un componente. Úsala para paneles múltiples y matrices de correlación.',
  {ids: z.array(z.string()).min(2), nombre: z.string(), id: z.string()}, async (a) => { const r = combinar(a); return texto({archivo: path.relative(RAIZ, r.archivo), filas: r.filas, filasConTodas: r.filasConTodas, inicio: r.inicio, fin: r.fin, fuente: r.fuente.nombre}); });

server.tool('listar_plantillas', 'Plantillas de animación (historia, comparar, panel, carrera, correlación) y presets de cámara disponibles.', {}, async () => texto({plantillas: PLANTILLAS, camaras: Object.entries(CAMARAS).map(([id, c]) => ({id, nombre: c.nombre, descripcion: c.descripcion}))}));

server.tool('analizar_serie', 'Resumen de una serie de la biblioteca y MOMENTOS CLAVE detectados en los datos (máximo, mayor subida/caída, primero, último), con su explicación. Úsalo antes de generar una historia.',
  {id: z.string()}, async ({id}) => { const e = leerCatalogo().find((x) => x.id === id); if (e && !fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', id + '.csv'))) await descargar(e); return texto(analizar([{origen: 'biblioteca', id}])); });

server.tool('generar_pieza', 'Genera la spec COMPLETA de una pieza a partir de una plantilla (cámara, ritmo, tiempos y colores resueltos) y la guarda en specs/<nombre>.json. Luego usa vista_previa y exportar_video con esa ruta.',
  {nombre: z.string(), plantilla: z.enum(['historia', 'comparar', 'panel', 'carrera', 'correlacion']), series: z.array(z.string()), momentos: z.array(z.object({tipo: z.enum(['primero', 'subida', 'caida', 'max', 'min', 'ultimo']), etiqueta: z.string().max(30).optional()})).optional(),
    camara: z.enum(['cinematico', 'documental', 'dinamico', 'seguir', 'estatico']).default('documental'), formato: z.enum(['horizontal', 'vertical']).default('horizontal'), titulo: z.string().optional(), foco: z.number().optional(), estiloMomento: z.enum(['tarjeta', 'barra', 'pildora', 'circulo']).default('tarjeta'), tema: z.enum(['oscuro', 'harris', 'carbon']).default('oscuro'), vivo: z.boolean().default(false)},
  async (a) => {
    const cat = leerCatalogo(); for (const id of a.series) { const e = cat.find((x) => x.id === id); if (e && !fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', id + '.csv'))) await descargar(e); }
    const items = a.series.map((id) => ({origen: 'biblioteca', id})), an = a.plantilla === 'historia' && items.length === 1 ? analizar(items) : null;
    const momentos = (a.momentos ?? an?.momentos?.filter((x) => x.seleccionado) ?? []).map((m) => { const c = an?.momentos?.find((x) => x.tipo === m.tipo); return {tipo: m.tipo, ancla: c?.ancla ?? {max: true}, etiqueta: m.etiqueta ?? c?.etiqueta}; });
    const r = generar({plantilla: a.plantilla, series: items, momentos, camara: a.camara, formato: a.formato, titulo: a.titulo, foco: a.foco, estiloMomento: a.estiloMomento, tema: a.tema, vivo: a.vivo ? {render: 'final', alfa: true, minEntreRendersMin: 360} : null});
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
    const files = await vistaPrevia(p, tiempos, {dir: path.join(RAIZ, '.tmp', 'vistas'), nombre: 'mcp_' + crypto.randomBytes(2).toString('hex'), escala: completa ? 1 : 0.5});
    return {content: [{type: 'text', text: `Vistas en: ${files.join(' | ')}\n${JSON.stringify(resumen(informe).avisos)}`}, ...files.map((f) => ({type: 'image', data: fs.readFileSync(f).toString('base64'), mimeType: 'image/png'}))]};
  });

server.tool('exportar_video', 'Renderiza en segundo plano: MP4 de referencia (h264 crf17, yuv420p) y, si alfa, .mov ProRes 4444 con canal alfa para Premiere. Devuelve un id; consulta estado_render.',
  {spec: z.any().optional(), ruta: z.string().optional(), calidad: z.enum(['borrador', 'final']).default('borrador'), alfa: z.boolean().default(false), nombre: z.string().optional()}, async ({spec, ruta, calidad, alfa, nombre}) => {
    const s = leerSpec(spec, ruta), {spec: p, informe} = compilar(s);
    if (!informe.ok) return texto(resumen(informe));
    const id = crypto.randomBytes(4).toString('hex'), t = {estado: 'en curso', progreso: null}; trabajos.set(id, t);
    renderizar(p, informe, {nombre: nombre ?? (ruta ? path.basename(ruta, '.json') : s.titulo), calidad, alfa, onProgreso: (pr) => (t.progreso = pr)})
      .then((r) => Object.assign(t, {estado: 'listo', resultado: r})).catch((e) => Object.assign(t, {estado: 'error', error: String(e.message ?? e)}));
    return texto({id, nota: 'Consulta estado_render con este id.'});
  });

server.tool('estado_render', 'Estado de un render lanzado con exportar_video.', {id: z.string()}, async ({id}) => texto(trabajos.get(id) ?? {estado: 'desconocido'}));

// ── trimestres (SEC EDGAR): biblioteca de estados de resultados por Q + agente vigilante ───────────────────────────
server.tool('listar_trimestres', 'Biblioteca de trimestres por empresa (SEC EDGAR, datos oficiales desde 2009). Sin «ticker» lista las empresas; con «ticker» (AMZN, AAPL…) sus trimestres y cuáles admiten Sankey. Si la empresa aún no está bajada, la baja.',
  {ticker: z.string().optional(), buscar: z.string().optional().describe('Texto para buscar una empresa por nombre o ticker en TODA la bolsa de EE. UU.')}, async ({ticker, buscar}) => {
    if (!ticker) return texto(buscarEmpresas(buscar ?? ''));
    const t = ticker.toUpperCase();
    let i; try { i = await asegurarEmpresa(t); } catch (e) { return texto({error: e.message}); }
    return texto({ticker: t, nombre: i.nombre, actualizado: i.actualizado, trimestres: i.trimestres.map((x) => ({fin: x.fin, etiqueta: x.etiqueta, ingresos: x.ingresos, utilidadNeta: x.utilidadNeta, sankey: !!x.archivo, q4Calculado: x.q4Calculado, notas: x.notas})), omitidos: i.omitidos});
  });
server.tool('generar_trimestre', 'Genera la spec de UN trimestre de una empresa (Sankey «de dónde viene y adónde va», o cascada) y la guarda en specs/. Luego usa vista_previa y exportar_video. «fin» = fecha de cierre (AAAA-MM-DD) o «ultimo».',
  {ticker: z.string(), fin: z.string().default('ultimo'), uso: z.enum(['sankey', 'puente']).default('sankey'), formato: z.enum(['horizontal', 'vertical']).default('horizontal'), tema: z.enum(['oscuro', 'harris', 'carbon']).default('oscuro'), como_actual: z.boolean().default(false).describe('true = reemplaza la pieza que el usuario tiene abierta en el estudio (chat)')},
  async (a) => {
    const t = a.ticker.toUpperCase(); let idx; try { idx = await asegurarEmpresa(t); } catch (e) { return texto({error: e.message}); }
    const tr = a.fin === 'ultimo' ? idx.trimestres.find((x) => (a.uso === 'sankey' ? x.archivo : true)) : idx.trimestres.find((x) => x.fin === a.fin);
    if (!tr) return texto({error: `No hay ese trimestre. Usa listar_trimestres con ticker ${t}.`});
    const r = generar({plantilla: a.uso === 'sankey' ? 'resultados' : 'puente', series: [itemTrimestre(t, tr.fin, a.uso)], formato: a.formato, tema: a.tema});
    const nombre = `trimestre-${t}-${tr.etiqueta.replace(/\s+/g, '-')}${a.uso === 'puente' ? '-cascada' : ''}`, ruta = a.como_actual ? path.join('specs', '_chat_actual.json') : path.join('specs', nombre + '.json');
    fs.writeFileSync(path.join(RAIZ, ruta), JSON.stringify(r.spec, null, 2));
    return texto({spec: ruta, etiqueta: tr.etiqueta, errores: r.informe.errores, avisos: r.informe.avisos, notas: r.notas});
  });
server.tool('vigilar_reportes', 'Pregunta a la SEC si alguna empresa de la biblioteca publicó un 10-Q/10-K nuevo; si sí, suma el trimestre a la biblioteca. (El actualizador 24/7 ya lo hace cada 4 h.)', {}, async () => texto(await vigilarSec()));

// ── chat del estudio: editar en vivo la pieza que el usuario tiene abierta ────────────────────────────────────────
const ACTUAL = path.join(RAIZ, 'specs', '_chat_actual.json');
const leerActual = () => { if (!fs.existsSync(ACTUAL)) throw new Error('No hay una pieza abierta en el estudio. Pídele al usuario que elija un dato primero, o genera una con generar_trimestre/generar_pieza (como_actual: true).'); return JSON.parse(fs.readFileSync(ACTUAL, 'utf8')); };
const resumenPieza = (spec) => { const c = compilar(spec); return {titulo: spec.titulo, duracion: spec.duracion, formato: spec.formato, tema: spec.tema ?? 'oscuro', capas: (spec.capas ?? []).map((x, i) => `${i}: ${x.tipo}${x.id ? ' #' + x.id : ''}${x.texto ? ' «' + String(x.texto).slice(0, 40) + '»' : ''}${x.t ? ' t=' + JSON.stringify(x.t) : ''}`), datos: Object.fromEntries(Object.entries(spec.datos ?? {}).map(([k, d]) => [k, {archivo: d.archivo, tipo: d.tipo ?? 'serie', fuente: d.fuente?.nombre}])), errores: c.informe.errores, avisos: c.informe.avisos.slice(0, 8)}; };
function aplicar(obj, ruta, valor, eliminar) {   // «capas[1].t», «tema»: pone (o borra) un valor
  const pasos = String(ruta).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean); let o = obj;
  for (let i = 0; i < pasos.length - 1; i++) { o = o[pasos[i]]; if (o == null) throw new Error(`La ruta «${ruta}» no existe (falla en «${pasos[i]}»).`); }
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
        if (c.insertar !== undefined) { const lista = String(c.ruta).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean).reduce((o, k) => o[k], copia); if (!Array.isArray(lista)) throw new Error(`«${c.ruta}» no es una lista.`); lista.push(c.insertar); }
        else aplicar(copia, c.ruta, c.valor, c.eliminar);
      }
    } catch (e) { return texto({guardado: false, error: e.message}); }
    const r = resumenPieza(copia);
    if (r.errores.length) return texto({guardado: false, motivo: 'La pieza editada no compila: no se guardó.', errores: r.errores});
    fs.writeFileSync(ACTUAL, JSON.stringify(copia, null, 2));
    return texto({guardado: true, ...r});
  });

await server.connect(new StdioServerTransport());
