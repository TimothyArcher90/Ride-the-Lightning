// Compilador de specs: lee los datos, valida, resuelve anclas y plantillas y produce (a) la spec "plana" que
// dibuja el navegador y (b) el INFORME DE VERIFICACIÓN: de dónde sale cada cifra que aparece en pantalla.
// Reglas de exactitud (duras):
//   1. Toda serie lleva fuente. Sin fuente, no compila.
//   2. Ninguna cifra se escribe a mano: el texto usa {valor}, {cambio:N}, {pct:N}, {max}… calculados de los datos.
//      Un número literal en un texto es un ERROR salvo que la capa declare `verificada` {fuente,url}.
//   3. Una fecha anclada debe existir en los datos (tolerancia = 1,5 pasos); si se ajusta, se avisa.
//   4. Por defecto la serie va completa desde su primer dato. Recortarla es explícito y queda avisado.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {leerTabla, columnaNumeros, columnaFechas, indiceColumna, metaSerie} from './datos.mjs';
import {fmtNum, fmtSigno, fmtPct, fmtFecha, colorDe, utc, TEMAS_DISPONIBLES} from '../motor/nucleo.js';
import {cargarFlujos, cargarCategorias} from './tablas.mjs';
import {TIPOS_EXTRA, EXTRA_CLASE, validarExtra} from '../motor/capas_extra.js';
import {fijarIdioma, traducir, t as tr, registrar} from '../motor/idioma.js';
import {traducirInforme} from './mensajes_en.mjs';
import {revisarLicencias} from './licencias.mjs';

registrar('m', {indice_unidad: {es: 'Índice (100 = {base})', en: 'Index (100 = {base})'}});

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS_GRAFICA = ['linea', 'barras', 'carrera', 'dispersion', 'calor', 'sankey', 'donut', 'cascada', 'pendiente', 'bump', 'treemap', 'waffle', 'lollipop', 'divergente', ...TIPOS_EXTRA];
const TIPOS = [...TIPOS_GRAFICA, 'zona', 'llamada', 'contador', 'titulo', 'cortina', 'cierre', 'imagen', 'sello'];
const MAX_PX = {horizontal: [1920, 1080], vertical: [1080, 1920]};

/** Ruta segura dentro del proyecto (evita que una spec lea fuera de la carpeta). */
export function rutaSegura(rel, raiz = RAIZ) {
  const abs = path.resolve(raiz, rel);
  if (!abs.startsWith(raiz + path.sep) && abs !== raiz) throw new Error(`Ruta fuera del proyecto: ${rel}`);
  return abs;
}

function fechaSpec(v) {
  if (typeof v === 'number') return v;
  const s = String(v);
  let m;
  if ((m = s.match(/^(-?\d{1,6})$/))) return utc(+m[1], 1, 1);
  if ((m = s.match(/^(-?\d{1,6})-(\d{2})$/))) return utc(+m[1], +m[2], 1);
  if ((m = s.match(/^(-?\d{1,6})-(\d{2})-(\d{2})$/))) return utc(+m[1], +m[2], +m[3]);
  throw new Error(`Fecha no válida en la spec: "${v}" (usa AAAA, AAAA-MM o AAAA-MM-DD)`);
}
const iso = (ms) => { const d = new Date(ms); const y = d.getUTCFullYear(); return `${y < 0 ? '-' : ''}${String(Math.abs(y)).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };

function cargarDataset(id, d, informe) {
  const err = (m) => informe.errores.push(`datos.${id}: ${m}`);
  const aviso = (m) => informe.avisos.push(`datos.${id}: ${m}`);
  let ruta;
  try { ruta = rutaSegura(d.archivo); } catch (e) { err(e.message); return null; }
  let t;
  try { t = leerTabla(ruta, {hoja: d.hoja, filaEncabezado: d.filaEncabezado}); } catch (e) { err(e.message); return null; }
  t.avisos.forEach(aviso);

  // procedencia: sidecar escrito por el descargador, o `fuente` declarada en la spec
  let fuente = d.fuente;
  const meta = metaSerie(ruta);   // .meta.json al lado del CSV o, si el CSV viene de la instantánea data/, su procedencia en MANIFEST.json
  if (meta) {
    fuente = {...meta.fuente, ...(fuente ?? {})};
    if (meta.sha256 && meta.sha256 !== t.hash) aviso('el archivo cambió desde que se descargó (sha256 distinto al de su .meta.json). Re-descarga para restablecer la procedencia.');
  }
  if (!fuente?.nombre) { err('sin fuente. Declara "fuente":{"nombre","url","obtenido"} o descarga la serie con el catálogo (escribe su .meta.json).'); return null; }
  if (!fuente.url) aviso('la fuente no tiene url: queda como "datos del usuario"; no verificable por terceros.');
  if (/\bNC\b|uso personal|no redistribuir|investigaci/i.test(fuente.licencia ?? '')) aviso(`LICENCIA: «${fuente.licencia}». Si la pieza se monetiza (YouTube, clientes), esta fuente puede NO permitirlo: confirma la licencia o sustitúyela por una fuente oficial.`);

  if (d.tipo === 'flujos' || d.tipo === 'categorias') {   // tablas que no son series de tiempo
    const tab = d.tipo === 'flujos' ? cargarFlujos(id, d, t, informe) : cargarCategorias(id, d, t, informe);
    if (!tab) return null;
    tab.fuente = fuente;
    const n = tab.tipoX === 'flujos' ? tab.nodos.length : tab.items.length;
    informe.datos.push({id, archivo: d.archivo, formato: t.formato, hoja: t.hoja ?? null, sha256: t.hash, filas: t.filas.length, filasEnArchivo: t.filas.length, inicio: null, fin: null, recortada: false, fuente, series: [], tipoTabla: d.tipo, elementos: n});
    if (tab.tipoX === 'flujos') tab.nodos.forEach((nd) => informe.cifras.push({capa: `datos.${id}`, tipo: 'nodo', nombre: nd.nombre, mostrado: fmtNum(nd.valor, tab.fmt), valorCrudo: nd.valor * (d.divisor ?? 1), divisor: d.divisor ?? 1, filas: nd.filas, nota: 'Tamaño = suma de los flujos que entran/salen de este nodo; el % sobre la base y la variación se calculan de las mismas filas.', dataset: id, archivo: d.archivo}));
    else tab.items.forEach((it) => informe.cifras.push({capa: `datos.${id}`, tipo: 'categoría', nombre: it.nombre, mostrado: fmtNum(it.valor, tab.fmt), valorCrudo: it.valor * (d.divisor ?? 1), divisor: d.divisor ?? 1, fila: it.fila, dataset: id, archivo: d.archivo}));
    return tab;
  }

  const tipoX = d.tipoX ?? 'fecha';
  let x, tipoFinal = tipoX === 'anio' ? 'fecha' : tipoX;
  const xcol = d.x;
  if (!xcol) { err('falta "x" (nombre de la columna del eje X).'); return null; }
  try {
    if (tipoX === 'fecha' || tipoX === 'anio') {
      const r = columnaFechas(t, xcol, {formatoFecha: d.formatoFecha, anio: tipoX === 'anio', serial: d.fechaSerial});
      if (r.invalidos.length) { err(`fechas no reconocidas en "${xcol}": ${r.invalidos.slice(0, 5).map((i) => `fila ${i.fila}: ${i.valor}`).join('; ')}${r.invalidos.length > 5 ? ` … (+${r.invalidos.length - 5})` : ''}. Si son números de serie de Excel declara "fechaSerial":true; si son años, "tipoX":"anio".`); return null; }
      x = r.valores;
    } else if (tipoX === 'num') {
      const r = columnaNumeros(t, xcol, {decimal: d.decimal});
      if (r.invalidos.length) { err(`valores no numéricos en x "${xcol}": ${r.invalidos.slice(0, 5).map((i) => `fila ${i.fila}: ${i.valor}`).join('; ')}`); return null; }
      x = r.valores;
    } else if (tipoX === 'cat') {
      const ci = indiceColumna(t, xcol); x = t.filas.map((f) => (f[ci] == null ? null : String(f[ci])));
    } else { err(`tipoX desconocido: ${tipoX}`); return null; }
  } catch (e) { err(e.message); return null; }

  const cols = d.columnas ?? [];
  if (!cols.length) { err('falta "columnas": lista de {col, nombre, color, divisor, prefijo, sufijo, decimales, unidad}.'); return null; }
  const series = [];
  for (const c of cols) {
    let r;
    try { r = columnaNumeros(t, c.col, {decimal: d.decimal}); } catch (e) { err(e.message); return null; }
    if (r.invalidos.length) { err(`columna "${c.col}" tiene texto donde se esperaba número: ${r.invalidos.slice(0, 5).map((i) => `fila ${i.fila}: "${i.valor}"`).join('; ')}${r.invalidos.length > 5 ? ` … (+${r.invalidos.length - 5})` : ''}. Si usa coma decimal declara "decimal":",".`); return null; }
    const div = c.divisor ?? 1;
    series.push({
      nombre: c.nombre ?? c.col, col: c.col, color: c.color, nulos: r.nulos,
      y: r.valores.map((v) => (v == null ? null : v / div)),
      fmt: {prefijo: c.prefijo ?? '', sufijo: traducir(c.sufijo ?? ''), decimales: c.decimales ?? 2, unidad: traducir(c.unidad ?? '')},
      divisor: div,
    });
  }
  // filas sin x se descartan (y se cuentan); orden obligatorio por x
  let filas = x.map((xv, i) => i).filter((i) => x[i] != null);
  const descartadas = x.length - filas.length;
  if (descartadas) aviso(`${descartadas} fila(s) sin valor en "${xcol}" descartadas.`);
  if (tipoFinal !== 'cat' && !d.sinOrden) {
    let desorden = false;
    for (let k = 1; k < filas.length; k++) if (x[filas[k]] < x[filas[k - 1]]) { desorden = true; break; }
    if (desorden) {
      if (d.ordenar) { filas.sort((a, b) => x[a] - x[b]); aviso('filas reordenadas por x (ordenar:true).'); }
      else { err(`"${xcol}" no está en orden ascendente. Ordena el archivo o declara "ordenar":true.`); return null; }
    }
    const dup = filas.findIndex((v, k) => k && x[v] === x[filas[k - 1]]);
    if (dup > 0) aviso(`hay valores de x repetidos (p. ej. ${tipoFinal === 'fecha' ? iso(x[filas[dup]]) : x[filas[dup]]}); no se promedian ni se eliminan: revisa el archivo.`);
  }
  // recorte explícito
  const total = filas.length, primero = x[filas[0]], ultimo = x[filas[filas.length - 1]];
  if (tipoFinal === 'fecha') {
    if (d.desde && d.desde !== 'inicio') { const lim = fechaSpec(d.desde); filas = filas.filter((i) => x[i] >= lim); aviso(`serie RECORTADA por "desde": ${iso(primero)} → ${iso(lim)}. Por defecto se muestra desde el primer dato.`); }
    if (d.hasta && d.hasta !== 'fin') { const lim = fechaSpec(d.hasta); filas = filas.filter((i) => x[i] <= lim); aviso(`serie RECORTADA por "hasta": hasta ${iso(lim)} (el último dato es ${iso(ultimo)}).`); }
  }
  if (filas.length < 2) { err('quedan menos de 2 filas útiles.'); return null; }
  const tab = {
    tipoX: tipoFinal, x: filas.map((i) => x[i]),
    series: series.map((s) => ({...s, y: filas.map((i) => s.y[i])})),
  };
  // Índice base 100: permite comparar series de unidades o magnitudes distintas. Se declara, se explica y cada cifra conserva su valor crudo.
  if (d.base100) {
    let b = d.base100 === true || d.base100 === 'primero' ? tab.x.findIndex((_, k) => tab.series.every((s) => s.y[k] != null && s.y[k] > 0)) : tab.x.findIndex((v) => v >= fechaSpec(d.base100));
    if (b < 0) { err('base100: no hay una fecha en la que todas las series tengan un valor positivo para usar de base.'); return null; }
    const fb = tipoFinal === 'fecha' ? iso(tab.x[b]) : String(tab.x[b]);
    tab.series.forEach((s) => {
      const base = s.y[b];
      if (!(base > 0)) { err(`base100: la serie «${s.nombre}» no tiene un valor positivo en ${fb}.`); return; }
      s.y = s.y.map((v) => (v == null ? null : (v / base) * 100));
      s.divisor = (base / 100) * s.divisor;
      s.fmt = {prefijo: '', sufijo: '', decimales: 1, unidad: tr('m.indice_unidad', {base: tipoFinal === 'fecha' ? fmtFecha(tab.x[b], 'mes') : fb})};
    });
    informe.metodos.push(`datos.${id}: series expresadas como ÍNDICE BASE 100 en ${fb} (valor / valor en esa fecha × 100), para poder compararlas aunque tengan unidades o tamaños distintos. El valor original de cada cifra se conserva en el informe.`);
  }
  informe.datos.push({
    id, archivo: d.archivo, formato: t.formato, hoja: t.hoja ?? null, sha256: t.hash, filas: tab.x.length, filasEnArchivo: total,
    inicio: tipoFinal === 'fecha' ? iso(tab.x[0]) : tab.x[0], fin: tipoFinal === 'fecha' ? iso(tab.x[tab.x.length - 1]) : tab.x[tab.x.length - 1],
    inicioDeLaSerie: tipoFinal === 'fecha' ? iso(primero) : primero, recortada: tab.x.length !== total,
    fuente, series: tab.series.map((s) => ({nombre: s.nombre, col: s.col, nulos: s.nulos, unidad: s.fmt.unidad || null, divisor: s.divisor})),
  });
  tab.fuente = fuente;
  return tab;
}

// ── plantillas: el único camino para poner una cifra en pantalla ──────────────────────────────────────────────
const TOKEN = /\{([a-z_]+)(?::([^}]+))?\}/gi;
function expandir(plantilla, c, informe, donde) {
  if (plantilla == null) return plantilla;
  const {tab, si, i} = c;
  const s = tab.series[si], y = s.y;
  const modoFecha = (arg) => arg ?? (medianaPaso(tab) > 40 * 86400000 ? 'mes' : 'dia');
  const usados = [];
  const out = String(plantilla).replace(TOKEN, (todo, nombre, arg) => {
    nombre = nombre.toLowerCase();
    const k = Math.max(0, i);
    switch (nombre) {
      case 'valor': usados.push('valor'); return fmtNum(y[i], s.fmt);
      case 'fecha': usados.push('fecha'); return tab.tipoX === 'fecha' ? fmtFecha(tab.x[i], modoFecha(arg)) : String(tab.x[i]);
      case 'cambio': { const n = +arg; if (!(n > 0) || i - n < 0 || y[i - n] == null || y[i] == null) { informe.errores.push(`${donde}: {cambio:${arg}} sin fila previa válida`); return '?'; } usados.push(`cambio:${n}`); return fmtSigno(y[i] - y[i - n], s.fmt); }
      case 'pct': { const n = +arg; if (!(n > 0) || i - n < 0 || !y[i - n] || y[i] == null) { informe.errores.push(`${donde}: {pct:${arg}} sin fila previa válida`); return '?'; } usados.push(`pct:${n}`); return fmtPct(((y[i] / y[i - n]) - 1) * 100, 1); }
      case 'max': { usados.push('max'); return fmtNum(Math.max(...y.filter((v) => v != null)), s.fmt); }
      case 'min': { usados.push('min'); return fmtNum(Math.min(...y.filter((v) => v != null)), s.fmt); }
      case 'desde': usados.push('desde'); return tab.tipoX === 'fecha' ? fmtFecha(tab.x[0], arg ?? 'anio') : String(tab.x[0]);
      case 'hasta': usados.push('hasta'); return tab.tipoX === 'fecha' ? fmtFecha(tab.x[tab.x.length - 1], arg ?? 'anio') : String(tab.x[tab.x.length - 1]);
      case 'n': usados.push('n'); return String(tab.x.length);
      case 'serie': return s.nombre;
      default: informe.errores.push(`${donde}: marcador desconocido {${nombre}}. Disponibles: valor fecha cambio:N pct:N max min desde hasta n serie`); return '?';
    }
  });
  return {texto: out, usados};
}
function medianaPaso(tab) {
  if (tab._paso) return tab._paso;
  if (tab.x.length < 2 || tab.tipoX !== 'fecha') return (tab._paso = 1);
  const d = []; for (let k = 1; k < tab.x.length; k++) d.push(tab.x[k] - tab.x[k - 1]);
  d.sort((a, b) => a - b); return (tab._paso = d[Math.floor(d.length / 2)] || 1);
}
function chequearDigitos(plantilla, capa, donde, informe) {
  if (plantilla == null) return;
  const libre = String(plantilla).replace(TOKEN, '');
  if (/\d/.test(libre)) {
    if (capa.verificada?.fuente) informe.avisos.push(`${donde}: contiene cifra escrita a mano ("${libre.trim()}") declarada verificada en ${capa.verificada.fuente}${capa.verificada.url ? ' · ' + capa.verificada.url : ''}.`);
    else informe.errores.push(`${donde}: contiene un número escrito a mano ("${libre.trim()}"). Usa marcadores ({valor}, {fecha}, {cambio:N}, {pct:N}, {max}, {desde}…) o declara "verificada":{"fuente","url"} en la capa.`);
  }
}

function resolverAncla(capa, tab, si, informe, donde) {
  const a = capa.ancla ?? {};
  const y = tab.series[si].y;
  let i = -1;
  if ('fecha' in a || 'x' in a) {
    const objetivo = tab.tipoX === 'fecha' ? fechaSpec(a.fecha ?? a.x) : tab.tipoX === 'num' ? +(a.x ?? a.fecha) : null;
    if (tab.tipoX === 'cat') { i = tab.x.findIndex((v) => v === String(a.x ?? a.categoria)); if (i < 0) informe.errores.push(`${donde}: la categoría "${a.x ?? a.categoria}" no existe en los datos.`); }
    else {
      let mejor = Infinity;
      tab.x.forEach((v, k) => { if (y[k] != null && Math.abs(v - objetivo) < mejor) { mejor = Math.abs(v - objetivo); i = k; } });
      const tol = 1.5 * medianaPaso(tab);
      if (mejor > tol) { informe.errores.push(`${donde}: no hay dato cerca de ${tab.tipoX === 'fecha' ? iso(objetivo) : objetivo} (el más cercano está a ${tab.tipoX === 'fecha' ? Math.round(mejor / 86400000) + ' días' : mejor}). No se inventa un punto.`); i = -1; }
      else if (mejor > 0) informe.avisos.push(`${donde}: ${tab.tipoX === 'fecha' ? iso(objetivo) : objetivo} no tiene fila exacta; se usa la más cercana (${tab.tipoX === 'fecha' ? iso(tab.x[i]) : tab.x[i]}).`);
    }
  } else {
    let lo = 0, hi = tab.x.length - 1;
    if (a.rango && tab.tipoX === 'fecha') { const r0 = fechaSpec(a.rango[0]), r1 = fechaSpec(a.rango[1]); lo = tab.x.findIndex((v) => v >= r0); hi = tab.x.length - 1 - [...tab.x].reverse().findIndex((v) => v <= r1); }
    if (a.max || a.min) {
      let best = null;
      for (let k = lo; k <= hi; k++) if (y[k] != null && (best === null || (a.max ? y[k] > y[best] : y[k] < y[best]))) best = k;
      i = best ?? -1;
    } else if (a.ultimo) { i = y.length - 1; while (i >= 0 && y[i] == null) i--; }
    else if (a.primero) { i = 0; while (i < y.length && y[i] == null) i++; }
    else if ('indice' in a) i = a.indice;
    else informe.errores.push(`${donde}: "ancla" necesita fecha | x | max | min | ultimo | primero | indice.`);
  }
  return i;
}

/** Cierre de marca determinista (marca/cierre.json): a TODA pieza se le añade al final `hold` s con la gráfica final quieta y una tarjeta con el logo.
 *  Las capas que duraban hasta el final se prolongan para que la imagen final no se apague antes. No toca la spec original. Se apaga con spec.cierre=false. */
function conCierre(spec, raiz) {
  if (spec.cierre === false || process.env.RTL_SIN_CIERRE === '1' || (spec.capas ?? []).some((k) => k.tipo === 'cierre')) return spec;
  let cfg; try { cfg = JSON.parse(fs.readFileSync(path.join(raiz, 'marca', 'cierre.json'), 'utf8')); } catch { return spec; }
  if (!cfg.activo) return spec;
  const d0 = spec.duracion ?? 15, hold = cfg.hold ?? 5, tarjeta = cfg.tarjeta ?? 4.6;
  const capas = (spec.capas ?? []).map((k) => (Array.isArray(k.t) && k.t[1] >= d0 - 1 ? {...k, t: [k.t[0], k.t[1] + hold + tarjeta]} : k));
  capas.push({tipo: 'cierre', id: 'cierre', archivo: cfg.archivo, t: [d0 + hold, d0 + hold + tarjeta]});
  return {...spec, duracion: +(d0 + hold + tarjeta).toFixed(2), capas};
}

export function compilar(spec, {raiz = RAIZ} = {}) {
  spec = conCierre(spec, raiz);
  fijarIdioma(spec.idioma);   // el compilador formatea cifras y fechas con el idioma de la pieza ('es' por defecto)
  const informe = {errores: [], avisos: [], datos: [], cifras: [], metodos: []};
  const E = (m) => informe.errores.push(m);
  if (spec.version && spec.version !== 1) E(`version ${spec.version} no soportada (actual: 1).`);
  if (spec.pendiente) E(`pieza pendiente: ${spec.pendiente}`);   // p. ej. «pending open licence»: la pieza no se compila hasta que exista el dato abierto
  const formato = spec.formato ?? 'horizontal';
  if (!MAX_PX[formato]) E(`formato debe ser horizontal|vertical, no "${formato}".`);
  const [ancho, alto] = MAX_PX[formato] ?? MAX_PX.horizontal;
  const fps = spec.fps ?? 30, duracion = spec.duracion ?? 15;
  if (!(duracion > 0 && duracion <= 600)) E('duracion debe estar entre 0 y 600 s.');

  const tablas = {};
  for (const [id, d] of Object.entries(spec.datos ?? {})) {
    const usos = (spec.capas ?? []).filter((c) => c.datos === id);
    if (!usos.length) informe.avisos.push(`datos.${id}: ninguna capa usa este dataset.`);
    const dd = !usos.length || usos.every((c) => c.tipo === 'dispersion') ? {...d, sinOrden: true} : d;   // dispersión (y datasets sin uso) no exigen X ordenado
    const t = cargarDataset(id, dd, informe); if (t) tablas[id] = t;
  }
  if (!Object.keys(spec.datos ?? {}).length && !(spec.capas ?? []).every((c) => !TIPOS_GRAFICA.includes(c.tipo))) E('hay gráficas pero no hay "datos".');

  const imagenes = new Set();
  const capas = [];
  const ids = new Map();
  (spec.capas ?? []).forEach((c0, n) => {
    const capa = JSON.parse(JSON.stringify(c0));
    const donde = `capas[${n}]${capa.id ? ` (${capa.id})` : ''}:${capa.tipo}`;
    if (!TIPOS.includes(capa.tipo)) { E(`${donde}: tipo desconocido. Disponibles: ${TIPOS.join(', ')}.`); return; }
    if (capa.id) { if (ids.has(capa.id)) E(`${donde}: id repetido.`); ids.set(capa.id, capa); }
    if (capa.t && (capa.t[0] < 0 || capa.t[0] > duracion)) informe.avisos.push(`${donde}: empieza en t=${capa.t[0]} s, fuera de la duración (${duracion} s).`);

    if (TIPOS_GRAFICA.includes(capa.tipo)) {
      const tab = tablas[capa.datos];
      if (!tab) { E(`${donde}: "datos":"${capa.datos}" no existe o no compiló.`); return; }
      const esTabla = tab.tipoX === 'flujos' || tab.tipoX === 'categorias';
      if (capa.tipo === 'sankey' && tab.tipoX !== 'flujos') { E(`${donde}: el Sankey necesita datos de tipo "flujos" (origen, destino, valor).`); return; }
      if (EXTRA_CLASE[capa.tipo]) {   // visualizador universal: cada capa extra valida su propia clase de dato y sus reglas (motor/capas_extra.js)
        const r = validarExtra(capa, tab, donde); r.errores.forEach(E); informe.avisos.push(...r.avisos); informe.metodos.push(...r.metodos); informe.cifras.push(...r.cifras);
        if (r.errores.length) return;
      } else {
      if (['donut', 'cascada', 'treemap', 'waffle', 'lollipop'].includes(capa.tipo) && tab.tipoX !== 'categorias') { E(`${donde}: ${capa.tipo} necesita datos de tipo "categorias" (concepto, valor).`); return; }
      if (esTabla && !['sankey', 'donut', 'cascada', 'treemap', 'waffle', 'lollipop'].includes(capa.tipo)) { E(`${donde}: estos datos son una tabla de ${tab.tipoX}, no una serie de tiempo: úsalos con sankey, donut, cascada, treemap o waffle.`); return; }
      }
      if (['pendiente', 'bump', 'divergente'].includes(capa.tipo) && (tab.series.length < 2 || tab.x.length < 2)) { E(`${donde}: ${capa.tipo} necesita al menos 2 series y 2 momentos.`); return; }
      if (capa.tipo === 'pendiente' || capa.tipo === 'divergente') {
        const n = tab.x.length, de = capa.de ?? 0, a = capa.a ?? n - 1;
        if (!Number.isInteger(de) || !Number.isInteger(a) || de < 0 || a >= n || de >= a) { E(`${donde}: "de" y "a" deben ser posiciones enteras de la tabla con de < a (hay ${n} filas).`); return; }
      }
      (capa.series ?? []).forEach((s) => { if (!tab.series[s]) E(`${donde}: serie ${s} no existe (hay ${tab.series.length}).`); });
      if (capa.curva != null && (capa.tipo !== 'linea' || !['lineal', 'escalon', 'monotono'].includes(capa.curva))) E(`${donde}: "curva" solo existe en gráficas de línea y vale lineal (por defecto), escalon o monotono.`);
      if (capa.camara === 'seguir') {
        if (capa.tipo !== 'linea') E(`${donde}: la cámara "seguir" solo existe en gráficas de línea.`);
        else if (tab.tipoX !== 'fecha' && tab.tipoX !== 'num') E(`${donde}: la cámara requiere eje X numérico o de fechas.`);
      } else if (capa.camara) {
        if (tab.tipoX !== 'fecha' && tab.tipoX !== 'num' && capa.tipo === 'linea') E(`${donde}: la cámara requiere eje X numérico o de fechas.`);
        capa.camara = capa.camara.map((k) => ({...k, x: Array.isArray(k.x) ? k.x.map((v) => (tab.tipoX === 'fecha' ? fechaSpec(v) : +v)) : 'auto'}));
      }
      if (capa.tipo === 'calor') {
        const base = capa.series ?? tab.series.map((_, i) => i), sobre = capa.sobre ?? 'variaciones';
        const serie = (i) => { const y = tab.series[i].y; return sobre === 'niveles' ? y : y.map((v, k) => (k && v != null && y[k - 1] ? v / y[k - 1] - 1 : null)); };
        const S = base.map(serie), n = base.length;
        const val = Array.from({length: n}, () => Array(n).fill(null)), np = Array.from({length: n}, () => Array(n).fill(0));
        for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
          const xs = [], ys = [];
          for (let k = 0; k < tab.x.length; k++) if (S[a][k] != null && S[b][k] != null) { xs.push(S[a][k]); ys.push(S[b][k]); }
          np[a][b] = xs.length; if (xs.length < 3) continue;
          const mx = xs.reduce((p, q) => p + q, 0) / xs.length, my = ys.reduce((p, q) => p + q, 0) / ys.length;
          let sxy = 0, sxx = 0, syy = 0; xs.forEach((v, k) => { sxy += (v - mx) * (ys[k] - my); sxx += (v - mx) ** 2; syy += (ys[k] - my) ** 2; });
          val[a][b] = sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
        }
        capa.matriz = {etiquetas: base.map((i) => tab.series[i].nombre), valores: val, n: np, sobre};
        informe.metodos.push(`${donde}: correlación de Pearson sobre ${sobre === 'niveles' ? 'NIVELES (ojo: series con tendencia dan correlaciones espurias)' : 'VARIACIONES entre filas consecutivas (v[t]/v[t-1]−1)'}, solo con pares completos; n por celda: ${np[0].join(', ')}… (matriz completa en el informe JSON).`);
        informe.cifras.push({capa: donde, tipo: 'matriz de correlación', etiquetas: capa.matriz.etiquetas, valores: val.map((r) => r.map((v) => (v == null ? null : +v.toFixed(4)))), n: np, metodo: sobre});
      }
      if (capa.tipo === 'dispersion') {
        if (tab.tipoX !== 'num') E(`${donde}: dispersión necesita tipoX:"num" (el eje X es numérico).`);
        else if (capa.regresion !== false) {
          const xs = [], ys = [];
          tab.x.forEach((v, k) => { if (tab.series[0].y[k] != null) { xs.push(v); ys.push(tab.series[0].y[k]); } });
          const n = xs.length, mx = xs.reduce((p, q) => p + q, 0) / n, my = ys.reduce((p, q) => p + q, 0) / n;
          let sxy = 0, sxx = 0, syy = 0; xs.forEach((v, k) => { sxy += (v - mx) * (ys[k] - my); sxx += (v - mx) ** 2; syy += (ys[k] - my) ** 2; });
          const m = sxy / sxx, b = my - m * mx, r2 = (sxy * sxy) / (sxx * syy);
          capa.regresion = {m, b, r2, n};
          informe.metodos.push(`${donde}: regresión lineal por mínimos cuadrados (OLS) y = ${m.toPrecision(6)}·x + ${b.toPrecision(6)}; R² = ${r2.toFixed(4)}; n = ${n}.`);
          informe.cifras.push({capa: donde, tipo: 'regresión', pendiente: m, intercepto: b, r2, n});
        }
      }
    }

    if (['llamada', 'contador', 'zona'].includes(capa.tipo)) {
      const g = ids.get(capa.capa);
      if (!g) { E(`${donde}: "capa":"${capa.capa}" no existe o está definida después (las gráficas van antes que sus anotaciones).`); return; }
      const tab = tablas[g.datos];
      const si = capa.serie ?? g.series?.[0] ?? 0;
      if (capa.tipo === 'llamada' && tab) {
        const i = resolverAncla(capa, tab, si, informe, donde);
        if (i < 0) return;
        capa.x = tab.x[i]; capa.y = tab.series[si].y[i]; capa.serie = si;
        const ctx = {tab, si, i};
        // la tarjeta muestra siempre el año y el dato anclado: salen de la fila, no se teclean
        const base = {capa: donde, serie: tab.series[si].nombre, columna: tab.series[si].col, fecha: tab.tipoX === 'fecha' ? iso(tab.x[i]) : tab.x[i], fila: i, valorCrudo: tab.series[si].y[i] * tab.series[si].divisor, divisor: tab.series[si].divisor, dataset: g.datos, archivo: informe.datos.find((d) => d.id === g.datos)?.archivo};
        capa.anioTxt = tab.tipoX === 'fecha' ? fmtFecha(capa.x, 'anio') : String(capa.x);
        capa.valorTxt = fmtNum(capa.y, tab.series[si].fmt);
        informe.cifras.push({...base, campo: 'anio', mostrado: capa.anioTxt, marcadores: ['fecha']}, {...base, campo: 'valor', mostrado: capa.valorTxt, marcadores: ['valor']});
        if (capa.texto && String(capa.texto).length > 30) informe.avisos.push(`${donde}: el texto «${capa.texto}» es largo (${String(capa.texto).length} car.). Menos es más: tres o cuatro palabras.`);
        if (capa.detalle) informe.avisos.push(`${donde}: «detalle» añade una cuarta línea a la tarjeta; mejor quitarla y dejar año · qué pasó · dato.`);
        ['texto', 'detalle'].forEach((campo) => {
          chequearDigitos(capa[campo], capa, `${donde}.${campo}`, informe);
          const r = expandir(capa[campo], ctx, informe, `${donde}.${campo}`);
          if (r) { capa[campo] = r.texto; informe.cifras.push({capa: donde, campo, mostrado: r.texto, serie: tab.series[si].nombre, columna: tab.series[si].col, fecha: tab.tipoX === 'fecha' ? iso(tab.x[i]) : tab.x[i], fila: i, valorCrudo: tab.series[si].y[i] * tab.series[si].divisor, divisor: tab.series[si].divisor, marcadores: r.usados, dataset: g.datos, archivo: informe.datos.find((d) => d.id === g.datos)?.archivo}); }
        });
      }
      if (capa.tipo === 'zona' && tab) {
        if (tab.tipoX !== 'fecha') { E(`${donde}: las zonas necesitan eje de fechas.`); return; }
        capa.x0 = fechaSpec(capa.desde); capa.x1 = fechaSpec(capa.hasta);
        if (capa.x0 < tab.x[0] || capa.x1 > tab.x[tab.x.length - 1]) informe.avisos.push(`${donde}: la zona sale del rango de los datos (${iso(tab.x[0])} – ${iso(tab.x[tab.x.length - 1])}).`);
        chequearDigitos(capa.texto, capa, `${donde}.texto`, informe);
        informe.cifras.push({capa: donde, tipo: 'zona', desde: iso(capa.x0), hasta: iso(capa.x1), texto: capa.texto ?? null, nota: 'Fechas de la zona fijadas por el autor; el texto editorial (sin cifras) debe revisarse.'});
      }
    }

    if (capa.tipo === 'titulo') {
      const g = [...ids.values()].find((x) => TIPOS_GRAFICA.includes(x.tipo));
      const tab = g ? tablas[g.datos] : Object.values(tablas)[0];
      ['texto', 'sub'].forEach((campo) => {
        if (capa[campo] == null) return;
        // el nombre de una serie puede llevar cifras legítimas («S&P 500», «Tesoro a 10 años»): salen del catálogo, no se teclean
        chequearDigitos((tab?.series ?? []).reduce((r, s) => (s.nombre ? r.split(s.nombre).join('') : r), String(capa[campo])), capa, `${donde}.${campo}`, informe);
        if (tab && tab.tipoX !== 'flujos' && tab.tipoX !== 'categorias') { const r = expandir(capa[campo], {tab, si: 0, i: tab.x.length - 1}, informe, `${donde}.${campo}`); capa[campo] = r.texto; if (r.usados.length) informe.cifras.push({capa: donde, campo, mostrado: r.texto, marcadores: r.usados}); }
      });
    }

    if (capa.tipo === 'imagen' || (capa.tipo === 'cierre' && capa.archivo)) {
      try { const abs = rutaSegura(capa.archivo, raiz); if (!fs.existsSync(abs)) E(`${donde}: no existe la imagen ${capa.archivo}`); else imagenes.add(capa.archivo); } catch (e) { E(`${donde}: ${e.message}`); }
    }
    capas.push(capa);
  });

  // una idea a la vez: dos tarjetas de la misma gráfica no deben coincidir en pantalla
  const lls = capas.filter((c) => c.tipo === 'llamada');
  for (let a = 0; a < lls.length; a++) for (let b = a + 1; b < lls.length; b++) {
    const A = lls[a], Bq = lls[b];
    if (A.capa === Bq.capa && (A.t?.[0] ?? 0) < (Bq.t?.[1] ?? 99) && (Bq.t?.[0] ?? 0) < (A.t?.[1] ?? 99)) informe.avisos.push(`Las llamadas «${A.texto}» y «${Bq.texto}» coinciden en pantalla (${A.t?.join('–')} s y ${Bq.t?.join('–')} s). Una idea por encuadre: sepáralas en el tiempo.`);
  }
  if (spec.fondo?.imagen) { try { if (!fs.existsSync(rutaSegura(spec.fondo.imagen, raiz))) E(`fondo: no existe ${spec.fondo.imagen}`); else imagenes.add(spec.fondo.imagen); } catch (e) { E(`fondo: ${e.message}`); } }

  if (spec.tema && !TEMAS_DISPONIBLES.includes(spec.tema)) E(`tema "${spec.tema}" no existe. Disponibles: ${TEMAS_DISPONIBLES.join(', ')}.`);
  // puerta de licencias: una pieza `comercial: true` no compila con fuentes restringidas o sin verificar que no lleven su aviso (servidor/licencias.mjs)
  if (spec.comercial === true) for (const p of revisarLicencias(informe.datos, spec).problemas) E(p.mensaje);
  // sello de fuente automático (todas las fuentes distintas)
  if (spec.sello !== false && informe.datos.length) {
    const f = [...new Set(informe.datos.map((d) => `${traducir(d.fuente.corto ?? d.fuente.nombre)}${d.fuente.obtenido ? ` (obtenido ${d.fuente.obtenido})` : ''}`))].join(' · ');
    capas.push({tipo: 'sello', texto: f});
  }

  const plano = {
    version: 1, titulo: spec.titulo ?? '', ...(spec.idioma && spec.idioma !== 'es' ? {idioma: spec.idioma} : {}), ancho, alto, fps, duracion, formato, fondo: spec.fondo ?? {}, tema: spec.tema ?? 'oscuro',
    tablas: Object.fromEntries(Object.entries(tablas).map(([k, t]) => [k, t.tipoX === 'flujos' || t.tipoX === 'categorias' ? {tipoX: t.tipoX, x: [], series: [], nodos: t.nodos, enlaces: t.enlaces, items: t.items, total: t.total, fmt: t.fmt, baseNodo: t.baseNodo} : {tipoX: t.tipoX, x: t.x, series: t.series.map((s) => ({nombre: s.nombre, y: s.y, color: colorDe(s.color, 0) && s.color, fmt: s.fmt}))}])),
    capas, imagenes: [...imagenes],
  };
  if (spec.idioma === 'en') traducirInforme(informe);   // avisos, errores y métodos en el idioma de la pieza (el original en español no se toca)
  informe.ok = informe.errores.length === 0;
  return {spec: plano, informe};
}
