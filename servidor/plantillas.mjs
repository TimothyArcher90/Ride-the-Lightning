// Plantillas: convierten "qué dato quiero y cómo lo quiero ver" en una spec completa (capas, cámara, tiempos, colores).
// Aquí vive el oficio de edición (ritmo, zooms, una idea por plano) para que quien no sabe de cine ni de finanzas no tenga que tocarlo.
// Nunca se inventan cifras: los momentos salen de los datos (analisis.mjs) y los textos solo llevan etiquetas cortas.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RAIZ, compilar} from './compilar.mjs';
import {leerCatalogo} from './catalogo.mjs';
import {combinar} from './biblioteca.mjs';
import {momentos, resumenSerie} from './analisis.mjs';

/** Presets de cámara y ritmo. Valores en segundos. */
export const CAMARAS = {
  cinematico: {nombre: 'Cinemático', descripcion: 'Trazo lento y zooms suaves a cada momento. Para videos largos y documentales.', dibujo: 10, mov: 1.8, mantener: 2.4, zoom: 0.18, respiro: 1.8, inicio: 1.2},
  documental: {nombre: 'Documental', descripcion: 'Ritmo de editorial: trazo medio, un zoom claro por idea. El punto medio para casi todo.', dibujo: 7, mov: 1.3, mantener: 1.9, zoom: 0.14, respiro: 1.3, inicio: 1.0},
  dinamico: {nombre: 'Dinámico (Reels y Shorts)', descripcion: 'Rápido y directo: trazo corto, zooms enérgicos. Pensado para vertical.', dibujo: 4.5, mov: 0.9, mantener: 1.4, zoom: 0.12, respiro: 0.9, inicio: 0.6},
  seguir: {nombre: 'Sigue la línea (estilo Johnny Harris)', descripcion: 'La cámara acompaña la punta de la línea mientras se dibuja, reescala el eje y al final se abre al plano completo. Luego marca los momentos.', dibujo: 8, mov: 0, mantener: 1.9, zoom: 1, respiro: 1.2, inicio: 0.8, seguir: true},
  estatico: {nombre: 'Sin movimiento de cámara', descripcion: 'La gráfica se dibuja completa y los momentos aparecen sobre ella. Sencillo y sobrio.', dibujo: 6, mov: 0, mantener: 1.9, zoom: 1, respiro: 1.2, inicio: 0.8},
};

export const PLANTILLAS = [
  {id: 'historia', nombre: 'La historia de una cifra', descripcion: 'Una línea que se dibuja y la cámara se acerca a los momentos que importan. La más usada.', necesita: {min: 1, max: 1}, ayuda: 'Elige 1 dato.'},
  {id: 'comparar', nombre: 'Una contra las demás', descripcion: 'Varias líneas en la misma gráfica, una protagonista resaltada y las otras de contexto. Se expresan como índice (100 = el inicio común) para que sean comparables.', necesita: {min: 2, max: 6}, ayuda: 'Elige de 2 a 6 datos.'},
  {id: 'panel', nombre: 'Comparar varias a la vez', descripcion: 'De 2 a 4 gráficas en pantalla, cada una con su cifra al lado y un año común arriba.', necesita: {min: 2, max: 4}, ayuda: 'Elige de 2 a 4 datos.'},
  {id: 'carrera', nombre: 'Ranking en carrera', descripcion: 'Barras que compiten y se reordenan con el tiempo: quién va primero en cada año.', necesita: {min: 3, max: 10}, ayuda: 'Elige de 3 a 10 datos del mismo tipo.'},
  {id: 'correlacion', nombre: '¿Se mueven juntas?', descripcion: 'Un mapa de colores que muestra qué series suben y bajan a la vez, y cuáles al revés.', necesita: {min: 3, max: 8}, ayuda: 'Elige de 3 a 8 datos.'},
  {id: 'pendiente', nombre: '¿Quién subió y quién bajó?', descripcion: 'Una línea por cada dato entre dos momentos (el primero y el último): se ve de un vistazo quién ganó, quién perdió y cuánto, con el cambio calculado.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos.'},
  {id: 'divergente', nombre: '¿Cuánto ganó o perdió cada una?', descripcion: 'El cambio en % de cada dato entre el primer y el último momento, en una sola escala: ganadores a la derecha, perdedores a la izquierda. Sirve aunque los datos tengan unidades distintas.', necesita: {min: 2, max: 8}, ayuda: 'Elige de 2 a 8 datos.'},
  {id: 'bump', nombre: '¿Quién superó a quién?', descripcion: 'La posición (1.º, 2.º, 3.º…) de cada dato en varios momentos, unidas por curvas: los cruces son los adelantamientos.', necesita: {min: 3, max: 8}, ayuda: 'Elige de 3 a 8 datos del mismo tipo.'},
  // — tablas (no son series de tiempo): se alimentan de un archivo con una tabla de flujos o de categorías —
  {id: 'resultados', datos: 'flujos', nombre: '¿De dónde viene y adónde va?', descripcion: 'Un diagrama de flujo (Sankey): de dónde entra el dinero, en qué se reparte y qué queda. Los porcentajes se calculan solos.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de flujos (origen, destino, valor).'},
  {id: 'composicion', datos: 'categorias', nombre: 'Qué parte pesa cuánto', descripcion: 'Un anillo que se llena parte por parte, con su valor y su porcentaje al lado.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor).'},
  {id: 'treemap', datos: 'categorias', nombre: 'Mapa de áreas', descripcion: 'Rectángulos cuya área es proporcional al valor: ideal con muchas partes (más de 6). Lo que no cabe rotulado se lista con su cifra.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor).'},
  {id: 'lollipop', datos: 'categorias', nombre: 'Ranking de partes', descripcion: 'Un palo con círculo por cada parte, ordenadas de mayor a menor, con su valor y porcentaje. Letra grande: pensada para el celular.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor).'},
  {id: 'waffle', datos: 'categorias', nombre: '100 cuadros', descripcion: 'Cien cuadros, cada uno vale 1 %: la forma más fácil de entender «de cada 100, cuántos son…». Suma exacta a 100.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor).'},
  {id: 'puente', datos: 'categorias', nombre: 'Qué sumó y qué restó', descripcion: 'Una cascada: parte de un total, muestra cada suma y cada resta y llega al resultado. Los subtotales se comprueban.', necesita: {min: 1, max: 1}, ayuda: 'Necesita una tabla de categorías (concepto, valor, y «total» en los subtotales).'},
];
/** Qué clase de dato usa cada plantilla: 'serie' (tiempo), 'flujos' o 'categorias'. */
export const tipoDatosDe = (id) => PLANTILLAS.find((p) => p.id === id)?.datos ?? 'serie';

const COLORES = ['oro', 'teal', 'purpura', 'piedra'];
const COLOR_MOMENTO = {subida: 'teal', caida: 'purpura'};
const sinPrefijoNombre = (n) => String(n).split(' — ')[0];

/** Escala legible: 6.745.635 «millones de US$» se rotula «US$ 6,75 bill.» (billón = 10^12 en español). */
function presentacion(unidad = '', maxAbs = 0) {
  if (/miles de millones de US\$/i.test(unidad) && maxAbs >= 1000) return {divisor: 1000, prefijo: 'US$ ', sufijo: ' bill.', unidad: 'billones de US$', decimales: 2};
  if (/millones de US\$/i.test(unidad) && maxAbs >= 1e6) return {divisor: 1e6, prefijo: 'US$ ', sufijo: ' bill.', unidad: 'billones de US$', decimales: 2};
  if (/^US\$/i.test(unidad)) return {prefijo: 'US$ ', unidad, decimales: 'auto'};
  if (/^%|% /.test(unidad) || /^%/.test(unidad)) return {sufijo: ' %', unidad, decimales: 2};
  return {unidad, decimales: 'auto'};
}
const maxAbsDeCsv = (archivo, colIdx) => {
  let m = 0;
  for (const l of fs.readFileSync(archivo, 'utf8').trim().split('\n').slice(1)) { const v = Math.abs(Number(l.split(',')[colIdx])); if (Number.isFinite(v) && v > m) m = v; }
  return m;
};
const relativo = (abs) => path.relative(RAIZ, abs).replace(/\\/g, '/');

/** Construye el bloque `datos` para la lista de series elegidas. Devuelve {datos:{d}, nombres:[…], notas:[…]}. */
function armarDatos(items, {comun = false} = {}) {
  const cat = leerCatalogo(), notas = [];
  if (!items?.length) throw new Error('Elige al menos un dato.');
  const lib = items.filter((i) => i.origen === 'biblioteca'), arch = items.filter((i) => i.origen === 'archivo');
  if (lib.length && arch.length) throw new Error('Por ahora no se pueden mezclar datos de la biblioteca con datos tuyos en la misma pieza. Usa solo uno de los dos tipos.');
  if (lib.length) {
    const ents = lib.map((i) => { const e = cat.find((x) => x.id === i.id); if (!e) throw new Error(`No existe la serie «${i.id}» en la biblioteca.`); return e; });
    let archivo, cols;
    if (ents.length === 1) {
      archivo = path.join(RAIZ, 'datos', 'biblioteca', `${ents[0].id}.csv`);
      if (!fs.existsSync(archivo)) throw new Error(`«${ents[0].nombre}» aún no está descargada.`);
      cols = [{col: fs.readFileSync(archivo, 'utf8').split('\n')[0].split(',')[1], ent: ents[0], idx: 1}];
    } else {
      // Frecuencias distintas (diaria vs. mensual…): se llevan todas a la más lenta, usando el último dato de cada periodo. Se avisa.
      const rango = {diaria: 0, semanal: 1, mensual: 2, trimestral: 3, anual: 4}, frec = ents.map((e) => { const f = String(e.frecuencia).toLowerCase(); return ['anual', 'trimestral', 'mensual', 'seman', 'diaria'].find((k) => f.includes(k)) ?? 'mensual'; }).map((k) => (k === 'seman' ? 'semanal' : k));
      const lenta = frec.reduce((a, k) => (rango[k] > rango[a] ? k : a), frec[0]), mezcla = new Set(frec).size > 1;
      const remuestreo = mezcla ? (lenta === 'anual' ? 'anual' : lenta === 'trimestral' ? 'trimestral' : 'mensual') : null;
      const id = 'pieza_' + crypto.createHash('sha1').update(ents.map((e) => e.id).join('|') + (remuestreo ?? '') + (comun ? 'c' : '')).digest('hex').slice(0, 10);
      if (remuestreo) notas.push(`Los datos tenían frecuencias distintas (${[...new Set(frec)].join(', ')}). Para poder compararlos se llevaron todos a frecuencia ${remuestreo}, usando el último dato de cada periodo. No se inventó ningún valor.`);
      const r = combinar({ids: ents.map((e) => e.id), nombre: 'Series combinadas', id, remuestreo, desde: comun ? '0000-00-00' : null});
      if (comun) notas.push(`La comparación empieza en ${r.inicio}, la primera fecha en la que todas las series tienen dato. Antes de esa fecha no hay con qué comparar.`);
      archivo = r.archivo;
      if (r.filasConTodas < r.filas * 0.5) notas.push(`Las series no comparten fechas en la mayoría de sus filas (${r.filasConTodas} de ${r.filas} tienen todas). Con frecuencias distintas (diaria vs. mensual) conviene elegir series de la misma frecuencia.`);
      cols = ents.map((e, k) => ({col: e.id, ent: e, idx: k + 1}));
    }
    const columnas = cols.map((c, k) => {
      const p = presentacion(c.ent.unidad, maxAbsDeCsv(archivo, c.idx));
      return {col: c.col, nombre: sinPrefijoNombre(c.ent.nombre), color: COLORES[k % 4], ...p};
    });
    return {datos: {d: {archivo: relativo(archivo), x: 'fecha', tipoX: 'fecha', columnas}}, nombres: columnas.map((c) => c.nombre), notas, desdeBiblioteca: true, ids: ents.map((e) => e.id)};
  }
  // Datos del usuario: todas las columnas deben venir del mismo archivo y hoja.
  const a0 = arch[0];
  if (a0.tabla) {   // tabla de flujos o de categorías
    if (!a0.fuente?.nombre) throw new Error('Cuéntanos de dónde vienen tus datos (por ejemplo «Informe trimestral de la empresa, 2026»). Sin fuente no se puede garantizar la exactitud.');
    const {prefijo, sufijo, decimales, unidad, divisor, decimal} = a0;
    return {datos: {d: {archivo: a0.ruta, ...(a0.hoja ? {hoja: a0.hoja} : {}), ...(a0.filaEncabezado ? {filaEncabezado: a0.filaEncabezado} : {}), tipo: a0.tabla, uso: a0.uso, fuente: a0.fuente,
      ...(prefijo ? {prefijo} : {}), ...(sufijo ? {sufijo} : {}), decimales: decimales ?? 'auto', ...(unidad ? {unidad} : {}), ...(divisor ? {divisor} : {}), ...(decimal ? {decimal} : {})}}, nombres: [a0.nombre ?? 'Tabla'], notas: [...notas, ...(a0.notasFuente ?? [])], desdeBiblioteca: false, tabla: a0.tabla};
  }
  if (arch.some((a) => a.ruta !== a0.ruta || (a.hoja ?? '') !== (a0.hoja ?? ''))) throw new Error('Con tus propios datos, todas las series deben ser columnas del mismo archivo (y la misma hoja).');
  if (!a0.fuente?.nombre) throw new Error('Cuéntanos de dónde vienen tus datos (por ejemplo «Banco Central de Chile, 2026»). Sin fuente no se puede garantizar la exactitud.');
  const columnas = arch.map((a, k) => ({col: a.col, nombre: a.nombre ?? a.col, color: COLORES[k % 4], decimales: a.decimales ?? 'auto', ...(a.prefijo ? {prefijo: a.prefijo} : {}), ...(a.sufijo ? {sufijo: a.sufijo} : {}), ...(a.unidad ? {unidad: a.unidad} : {}), ...(a.divisor ? {divisor: a.divisor} : {})}));
  return {datos: {d: {archivo: a0.ruta, ...(a0.hoja ? {hoja: a0.hoja} : {}), ...(a0.filaEncabezado ? {filaEncabezado: a0.filaEncabezado} : {}), x: a0.x, tipoX: a0.tipoX ?? 'fecha', ...(a0.decimal ? {decimal: a0.decimal} : {}), ...(a0.formatoFecha ? {formatoFecha: a0.formatoFecha} : {}),
    ...(a0.fechaSerial ? {fechaSerial: true} : {}), fuente: a0.fuente, columnas}}, nombres: columnas.map((c) => c.nombre), notas, desdeBiblioteca: false};
}

/** Qué hay en una serie elegida: resumen, momentos propuestos y avisos. Sirve para el paso 2 de la interfaz. */
export function analizar(items) {
  const {datos, nombres, notas} = armarDatos(items.slice(0, 1));
  const {spec, informe} = compilar({version: 1, datos, capas: []});
  const tab = spec.tablas?.d;
  if (!tab) return {ok: false, errores: informe.errores, avisos: informe.avisos};
  return {ok: true, nombre: nombres[0], resumen: resumenSerie(tab, 0), momentos: momentos(tab, 0), avisos: [...notas, ...informe.avisos], datos: informe.datos[0]};
}

// ── generadores ────────────────────────────────────────────────────────────────────────────────────────────────
function historia({datos, tab, nombre, titulo, momentosElegidos, camara, escala, vivo, estilo}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, x0 = tab.x[0], x1 = tab.x[tab.x.length - 1], span = x1 - x0, esFecha = tab.tipoX === 'fecha';
  const res = resumenSerie(tab, 0), usaLog = escala === 'log' || (escala !== 'lineal' && res.positivos && res.razonMaxMin > 200);
  const ordenados = [...momentosElegidos].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
  const capas = [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, 9999]}];
  const camaraKf = [{t: 0, x: 'auto', y: 'auto'}], llamadas = [];
  let cursor = P.inicio + P.dibujo + (P.seguir ? 1.9 : 0.5);   // con cámara «seguir» esperamos a que se abra al plano completo (t1+0.3…t1+1.6)
  for (const m of ordenados) {
    const kfT = cursor + P.mov;
    if (P.mov > 0 && esFecha) {
      const w = span * P.zoom, c = tab.x[m.i];
      let a = c - w / 2, b = c + w / 2; if (a < x0) { b += x0 - a; a = x0; } if (b > x1) { a -= b - x1; b = x1; }
      camaraKf.push({t: +kfT.toFixed(2), x: [Math.max(x0, a), Math.min(x1, b)], y: 'ajustar', mov: P.mov});
    }
    const t0 = P.mov > 0 ? kfT + 0.15 : cursor + 0.2;
    llamadas.push({tipo: 'llamada', capa: 'g1', serie: 0, ancla: m.ancla, t: [+t0.toFixed(2), +(t0 + P.mantener).toFixed(2)], texto: m.etiqueta, color: ['pildora', 'circulo'].includes(estilo) ? 'amarillo' : (COLOR_MOMENTO[m.tipo] ?? 'oro'), ...(['barra', 'pildora', 'circulo'].includes(estilo) ? {estilo} : {})});
    cursor = t0 + P.mantener + 0.25;
  }
  let fin = cursor + P.respiro;
  if (P.mov > 0 && ordenados.length) { camaraKf.push({t: +(cursor + P.mov).toFixed(2), x: 'auto', y: 'auto', mov: P.mov}); fin = cursor + P.mov + P.respiro; }
  const duracion = +fin.toFixed(1);
  capas[0].t = [0.2, duracion - 0.1];
  capas.push({tipo: 'linea', id: 'g1', datos: 'd', area: true, ...(usaLog ? {escala: 'log'} : {}), t: [P.inicio, P.inicio + P.dibujo], ...(P.seguir && esFecha ? {camara: 'seguir'} : camaraKf.length > 1 ? {camara: camaraKf} : {})});
  capas.push({tipo: 'contador', capa: 'g1', serie: 0, t: [0, duracion - 0.1]}, ...llamadas);
  return {duracion, capas, notas: usaLog ? [`Escala logarítmica activada automáticamente: la serie varía más de ${Math.round(res.razonMaxMin)} veces, y en escala normal los primeros años se verían planos.`] : [], ...(vivo ? {vivo} : {})};
}

function comparar({titulo, camara, foco, n}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(5, Math.min(10, P.dibujo + 1)), dur = +(P.inicio + dib + 3).toFixed(1), f = Math.min(Math.max(0, foco ?? 0), n - 1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'linea', id: 'g1', datos: 'd', foco: f, ejeUnidad: true, t: [P.inicio, P.inicio + dib]}, {tipo: 'contador', capa: 'g1', serie: f, t: [0, dur - 0.1]}],
    notas: ['Las series se muestran como índice base 100 en la primera fecha en la que todas tienen dato, para que series de unidades distintas se puedan comparar. Cada cifra conserva su valor original en el informe.']};
}
function layoutPanel(n, vertical) {
  if (vertical) { const top = 0.2, alto = 0.68, h = alto / n - 0.11; return Array.from({length: n}, (_, k) => ({caja: [0.15, +(top + k * (alto / n) + 0.055).toFixed(3), 0.55, +h.toFixed(3)], pos: [0.12, +(top + k * (alto / n)).toFixed(3)]})); }
  if (n === 2) return [0.075, 0.54].map((x) => ({caja: [x, 0.36, 0.385, 0.4], pos: [x, 0.30]}));
  if (n === 3) return [0.065, 0.375, 0.685].map((x) => ({caja: [x, 0.36, 0.26, 0.4], pos: [x, 0.30]}));
  const xs = [0.075, 0.575], ys = [[0.27, 0.24], [0.66, 0.23]];
  return [0, 1, 2, 3].map((k) => ({caja: [xs[k % 2], ys[k >> 1][0], 0.4, ys[k >> 1][1]], pos: [xs[k % 2], +(ys[k >> 1][0] - 0.062).toFixed(3)]}));
}
function panel({datos, titulo, vertical, camara}) {
  const cols = datos.d.columnas, L = layoutPanel(cols.length, vertical), P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.min(9, Math.max(5, P.dibujo)), dur = +(dib + 2.6).toFixed(1);
  const capas = [{tipo: 'titulo', texto: titulo, color: 'oro', tam: vertical ? 42 : 52, t: [0.2, dur - 0.1]}];
  cols.forEach((c, i) => capas.push({tipo: 'linea', id: 'g' + (i + 1), datos: 'd', series: [i], area: true, caja: L[i].caja, etiquetas: false, t: [0.9, 0.9 + dib]}));
  if (!vertical) capas.push({tipo: 'contador', capa: 'g1', serie: 0, modo: 'fecha', t: [0, dur - 0.1]});
  cols.forEach((c, i) => capas.push({tipo: 'contador', capa: 'g' + (i + 1), serie: i, modo: 'compacto', pos: L[i].pos, alinea: 'left', t: [0, dur - 0.1]}));
  return {duracion: dur, capas, notas: []};
}
function carrera({datos, titulo, tab}) {
  const n = datos.d.columnas.length, paso = tab.x.length > 1 ? (tab.x[tab.x.length - 1] - tab.x[0]) / (tab.x.length - 1) / 86400000 : 365, dur = 12;
  return {duracion: dur + 2, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur + 1.9]}, {tipo: 'carrera', datos: 'd', top: Math.min(8, n), t: [1, 1 + dur], formatoX: paso > 300 ? 'anio' : 'mes'}], notas: []};
}
// Tablas: la animación es una sola gráfica que se construye en el tiempo; el título y la fuente acompañan.
function resultados({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(5, Math.min(9, P.dibujo + 1)), dur = +(1 + dib + 3.5).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'sankey', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['Cada cinta mide exactamente su fila de la tabla; el tamaño de cada caja es la suma de sus cintas y el porcentaje se calcula sobre el nodo mayor. Si algo no cuadra, el programa lo avisa antes de dibujar.']};
}
function composicion({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(8, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'donut', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['El porcentaje de cada parte es su valor entre la suma de todas.']};
}
function puente({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(5, Math.min(9, P.dibujo + 1)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'cascada', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['Los subtotales marcados como «total» se comprueban contra la suma de lo anterior.']};
}
function pendiente({titulo, camara, foco}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(7, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'pendiente', id: 'g1', datos: 'd', ...(foco != null ? {foco} : {}), t: [0.9, 0.9 + dib]}], notas: ['Se comparan solo el primer y el último momento de la tabla; el cambio (%) es último ÷ primero − 1. Las series sin dato en alguno de los dos momentos no se dibujan.']};
}
function bump({titulo, camara, foco}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(5, Math.min(9, P.dibujo + 1)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'bump', id: 'g1', datos: 'd', ...(foco != null ? {foco} : {}), t: [0.9, 0.9 + dib]}], notas: ['La posición en cada momento sale de ordenar las series por su crecimiento acumulado desde el primer momento (valor ÷ valor inicial), para que series de unidades distintas sean comparables. Se muestran hasta 8 momentos repartidos de forma uniforme; solo entran las series con dato en todos ellos.']};
}
function divergente({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(7, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'divergente', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['El cambio (%) es último ÷ primero − 1 de cada serie, todas en la misma escala. Bajo cada barra se muestran los dos valores originales.']};
}
function lollipop({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(7, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'lollipop', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['Los palos parten de cero y su largo es proporcional al valor; el porcentaje es el valor entre la suma de todas las partes.']};
}
function treemap({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(7, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'treemap', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['El área de cada rectángulo es proporcional a su valor; el porcentaje es su valor entre la suma de todas las partes.']};
}
function waffle({titulo, camara}) {
  const P = CAMARAS[camara] ?? CAMARAS.documental, dib = Math.max(4, Math.min(7, P.dibujo)), dur = +(1 + dib + 3).toFixed(1);
  return {duracion: dur, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, dur - 0.1]}, {tipo: 'waffle', id: 'g1', datos: 'd', t: [0.9, 0.9 + dib]}], notas: ['Cada cuadro vale 1 %. Los 100 cuadros se reparten por «mayor resto» para que sumen exactamente 100; el porcentaje de la leyenda es el exacto, sin redondear a cuadros.']};
}
function correlacion({titulo}) {
  return {duracion: 8, capas: [{tipo: 'titulo', texto: titulo, color: 'oro', t: [0.2, 7.9]}, {tipo: 'calor', datos: 'd', sobre: 'variaciones', t: [0.8, 3.6]}], notas: ['La correlación se mide sobre las variaciones entre periodos (no sobre los niveles), que es la forma correcta cuando las series tienen tendencia.']};
}

/**
 * Genera la spec de una pieza. `entrada`: {plantilla, series:[…], momentos:[{ancla, etiqueta, tipo}], camara, formato, titulo, escala, vivo}
 * Devuelve {spec, informe, notas}. La spec es la misma que un experto escribiría a mano (se puede abrir y editar en «Modo experto»).
 */
export function generar(entrada) {
  const {plantilla = 'historia', series = [], camara = 'documental', formato = 'horizontal', escala = 'auto', vivo = null} = entrada;
  const def = PLANTILLAS.find((p) => p.id === plantilla); if (!def) throw new Error(`Plantilla desconocida: ${plantilla}`);
  if (series.length < def.necesita.min || series.length > def.necesita.max) throw new Error(`«${def.nombre}» necesita ${def.necesita.min === def.necesita.max ? def.necesita.min : `de ${def.necesita.min} a ${def.necesita.max}`} datos y elegiste ${series.length}.`);
  const clase = def.datos ?? 'serie', esTabla = series.some((s) => s.tabla);
  if (clase === 'serie' && esTabla) throw new Error(`«${def.nombre}» se usa con series de tiempo, y elegiste una tabla de ${series.find((s) => s.tabla).tabla}. Elige otro estilo en el paso 2.`);
  if (clase !== 'serie' && !series.every((s) => s.tabla === clase)) throw new Error(`«${def.nombre}» necesita ${clase === 'flujos' ? 'una tabla de flujos (columnas origen, destino y valor)' : 'una tabla de categorías (columnas concepto y valor)'}. ${def.ayuda}`);
  const {datos, nombres, notas: n0} = armarDatos(series, {comun: ['comparar', 'correlacion', 'pendiente', 'bump', 'divergente'].includes(plantilla)});
  if (datos.d.tipo === 'categorias') datos.d.uso = plantilla === 'puente' ? 'cascada' : 'donut';
  if (plantilla === 'comparar') { datos.d.base100 = true; const f0 = Math.min(Math.max(0, entrada.foco ?? 0), datos.d.columnas.length - 1), otros = ['teal', 'purpura', 'piedra']; let k = 0; datos.d.columnas.forEach((c, i) => { c.color = i === f0 ? 'oro' : otros[k++ % 3]; }); }
  const base = compilar({version: 1, datos, capas: []});
  const tab = base.spec.tablas?.d;
  if (!tab) return {spec: {version: 1, datos, capas: []}, informe: base.informe, notas: n0};
  const titulo = entrada.titulo?.trim() || (nombres.length === 1 ? nombres[0].replace(/\s*\(.*\)\s*$/, '') : plantilla === 'carrera' ? 'Quién va primero' : plantilla === 'correlacion' ? '¿Se mueven juntas?' : 'Comparación');
  let g;
  if (plantilla === 'historia') {
    const elegidos = (entrada.momentos ?? []).map((m) => {
      const lista = momentos(tab, 0), cand = lista.find((c) => c.tipo === m.tipo) ?? lista.find((c) => JSON.stringify(c.ancla) === JSON.stringify(m.ancla));
      const i = cand ? Number(cand.id.split('-').pop()) : 0;
      return {...m, i, x: tab.x[i], ancla: m.ancla ?? cand?.ancla, etiqueta: (m.etiqueta || cand?.etiqueta || 'Momento').slice(0, 30)};
    });
    g = historia({datos, tab, nombre: nombres[0], titulo, momentosElegidos: elegidos, camara, escala, vivo, estilo: entrada.estiloMomento});
  } else if (plantilla === 'panel') g = panel({datos, titulo, vertical: formato === 'vertical', camara});
  else if (plantilla === 'comparar') g = comparar({titulo, camara, foco: entrada.foco, n: nombres.length});
  else if (plantilla === 'carrera') g = carrera({datos, titulo, tab});
  else if (plantilla === 'resultados') g = resultados({titulo, camara});
  else if (plantilla === 'composicion') g = composicion({titulo, camara});
  else if (plantilla === 'puente') g = puente({titulo, camara});
  else if (plantilla === 'treemap') g = treemap({titulo, camara});
  else if (plantilla === 'waffle') g = waffle({titulo, camara});
  else if (plantilla === 'lollipop') g = lollipop({titulo, camara});
  else if (plantilla === 'divergente') g = divergente({titulo, camara});
  else if (plantilla === 'pendiente') g = pendiente({titulo, camara, foco: entrada.foco});
  else if (plantilla === 'bump') g = bump({titulo, camara, foco: entrada.foco});
  else g = correlacion({titulo});
  // el período («Q3 FY2026») sale de la fecha de cierre del reporte oficial, no se teclea: se declara verificado
  if (series[0]?.trimestre && g.capas[0]?.tipo === 'titulo' && /\d/.test(g.capas[0].texto)) g.capas[0].verificada = {fuente: `Período del reporte ${series[0].trimestre.etiqueta} (SEC EDGAR, fecha de cierre ${series[0].trimestre.fin})`, url: series[0].fuente?.url};
  const spec = {version: 1, titulo, formato, fps: 30, duracion: g.duracion, datos, capas: g.capas, ...(entrada.tema && entrada.tema !== 'oscuro' ? {tema: entrada.tema} : {}), ...(g.vivo ? {vivo: g.vivo} : {})};
  const comp = compilar(spec);
  return {spec, plano: comp.spec, informe: comp.informe, notas: [...n0, ...(g.notas ?? [])]};
}
