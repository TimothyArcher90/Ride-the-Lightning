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

await server.connect(new StdioServerTransport());
