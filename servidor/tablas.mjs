// Datos que NO son series de tiempo: flujos (de → a → cuánto, para diagramas Sankey) y categorías (concepto → valor, para
// donut y cascada). Mismas reglas de exactitud que las series: fuente obligatoria, números de verdad, y lo que debe cuadrar cuadra.
import {columnaNumeros, indiceColumna} from './datos.mjs';
import {traducir} from '../motor/idioma.js';   // etiquetas de reportes y unidades en el idioma de la pieza

const sinTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const ALIAS = {
  origen: ['origen', 'de', 'desde', 'from', 'source', 'fuente_nodo'], destino: ['destino', 'a', 'hacia', 'to', 'target'],
  valor: ['valor', 'monto', 'importe', 'value', 'amount', 'cifra', 'actual'], anterior: ['anterior', 'previo', 'ano anterior', 'prior', 'previous', 'hace un ano'],
  tipo: ['tipo', 'type', 'clase'], concepto: ['concepto', 'categoria', 'nombre', 'item', 'rubro', 'partida', 'label', 'concept'],
};
/** Busca una columna por nombre (sin tildes, sin importar mayúsculas) con alias comunes. Devuelve el nombre real o null. */
export function columnaPor(t, clave, pedida) {
  const cands = [pedida, ...(ALIAS[clave] ?? [])].filter(Boolean).map(sinTildes);
  return t.columnas.find((c) => cands.includes(sinTildes(c))) ?? null;
}
/** ¿Qué tipo de tabla es? Sirve para que el estudio proponga el uso correcto al subir un archivo. */
export function detectarTabla(columnas) {
  const t = {columnas}, tiene = (k) => !!columnaPor(t, k);
  if (tiene('origen') && tiene('destino') && tiene('valor')) return 'flujos';
  if (tiene('concepto') && tiene('valor')) return 'categorias';
  return null;
}

const TIPOS_NODO = ['ingreso', 'beneficio', 'costo', 'neutral'];
const fmtDe = (d) => ({prefijo: d.prefijo ?? '', sufijo: traducir(d.sufijo ?? ''), decimales: d.decimales ?? 'auto', unidad: traducir(d.unidad ?? '')});

function numeros(t, col, d, err) {
  const r = columnaNumeros(t, col, {decimal: d.decimal});
  if (r.invalidos.length) { err(`la columna "${col}" tiene texto donde se esperaba número: ${r.invalidos.slice(0, 5).map((i) => `fila ${i.fila}: "${i.valor}"`).join('; ')}. Si usa coma decimal declara "decimal":",".`); return null; }
  return r.valores.map((v) => (v == null ? null : v / (d.divisor ?? 1)));
}

/** Flujos origen → destino con valor. Los nodos y su tamaño SALEN de las filas; nada se teclea. */
export function cargarFlujos(id, d, t, informe) {
  const err = (m) => informe.errores.push(`datos.${id}: ${m}`), aviso = (m) => informe.avisos.push(`datos.${id}: ${m}`);
  const co = columnaPor(t, 'origen', d.origen), cd = columnaPor(t, 'destino', d.destino), cv = columnaPor(t, 'valor', d.valor);
  if (!co || !cd || !cv) { err(`una tabla de flujos necesita las columnas origen, destino y valor (encontré: ${t.columnas.join(', ')}).`); return null; }
  const ca = columnaPor(t, 'anterior', d.anterior), ct = columnaPor(t, 'tipo', d.tipoCol);
  const vals = numeros(t, cv, d, err); if (!vals) return null;
  const ant = ca ? numeros(t, ca, d, err) : null; if (ca && !ant) return null;
  const io = indiceColumna(t, co), idd = indiceColumna(t, cd), it = ct ? indiceColumna(t, ct) : -1;
  const enlaces = [], orden = [], nodos = new Map();
  const nodo = (n) => { if (!nodos.has(n)) { nodos.set(n, {nombre: n, tipo: null, entra: 0, sale: 0, entraAnt: 0, saleAnt: 0, filas: [], orden: orden.length}); orden.push(n); } return nodos.get(n); };
  t.filas.forEach((f, k) => {
    const a = f[io] == null ? '' : traducir(String(f[io]).trim()), b = f[idd] == null ? '' : traducir(String(f[idd]).trim()), v = vals[k];
    if (!a && !b && v == null) return;
    if (!a || !b) { err(`fila ${k + 2}: falta el origen o el destino.`); return; }
    if (v == null || !(v > 0)) { err(`fila ${k + 2} (${a} → ${b}): el valor debe ser un número mayor que 0 (los costos también van en positivo; el color lo da el tipo).`); return; }
    if (a === b) { err(`fila ${k + 2}: «${a}» no puede fluir hacia sí mismo.`); return; }
    const na = nodo(a), nb = nodo(b);
    na.sale += v; nb.entra += v; na.filas.push(k + 2); nb.filas.push(k + 2);
    if (ant && ant[k] != null) { na.saleAnt += ant[k]; nb.entraAnt += ant[k]; }
    if (it >= 0 && f[it] != null && String(f[it]).trim()) {
      const tp = sinTildes(f[it]);
      if (!TIPOS_NODO.includes(tp)) err(`fila ${k + 2}: tipo "${f[it]}" no existe. Usa: ${TIPOS_NODO.join(', ')}.`);
      else { if (nb.tipo && nb.tipo !== tp) aviso(`«${b}» aparece con dos tipos distintos (${nb.tipo} y ${tp}); se usa el último.`); nb.tipo = tp; }
    }
    enlaces.push({origen: a, destino: b, valor: v, anterior: ant ? ant[k] : null, fila: k + 2});
  });
  if (informe.errores.length && informe.errores.some((e) => e.startsWith(`datos.${id}:`))) return null;
  if (enlaces.length < 2) { err('un diagrama de flujos necesita al menos 2 filas.'); return null; }
  // profundidad = camino más largo desde una fuente; detecta ciclos
  const entrantes = new Map([...nodos.keys()].map((n) => [n, []])); enlaces.forEach((e) => entrantes.get(e.destino).push(e.origen));
  const nivel = new Map(), pila = new Set();
  const calc = (n) => { if (nivel.has(n)) return nivel.get(n); if (pila.has(n)) { err(`hay un ciclo de flujos que pasa por «${n}».`); return 0; } pila.add(n); let m = 0; for (const p of entrantes.get(n)) m = Math.max(m, calc(p) + 1); pila.delete(n); nivel.set(n, m); return m; };
  [...nodos.keys()].forEach(calc);
  // los destinos finales de un nodo cuyos hijos son TODOS finales (p. ej. las líneas de gasto) se alinean en la última columna, como en un estado de resultados
  const maxNivel = Math.max(...nivel.values()), sumideros = (n) => !enlaces.some((e) => e.origen === n);
  for (const n of nodos.keys()) { const hijos = enlaces.filter((e) => e.origen === n).map((e) => e.destino); if (hijos.length && hijos.every(sumideros) && entrantes.get(n).length) hijos.forEach((h) => nivel.set(h, maxNivel)); }
  // una fuente pura se coloca justo antes de su primer destino (así «Otros ingresos» entra donde se suma, no desde el extremo izquierdo)
  for (const n of nodos.keys()) if (!entrantes.get(n).length) nivel.set(n, Math.max(0, Math.min(...enlaces.filter((e) => e.origen === n).map((e) => nivel.get(e.destino))) - 1));
  if (informe.errores.some((e) => e.startsWith(`datos.${id}:`))) return null;
  const lista = orden.map((n) => {
    // el valor de un nodo es lo que ENTRA (así «Ingresos» muestra la suma de sus segmentos, como la reporta la fuente); las fuentes puras usan lo que sale
    const o = nodos.get(n), esFuente = !o.entra, esSumidero = !o.sale, valor = o.entra || o.sale, mayor = Math.max(o.entra, o.sale);
    if (!esFuente && !esSumidero) {
      const dif = Math.abs(o.entra - o.sale) / mayor;
      if (dif > 0.05) err(`«${n}» no cuadra: entra ${o.entra.toLocaleString('es-CO')} y sale ${o.sale.toLocaleString('es-CO')} (filas ${[...new Set(o.filas)].join(', ')}). Corrige el archivo: un flujo no crea ni destruye valor.`);
      else if (dif > 0.005) aviso(`«${n}»: entra ${o.entra.toFixed(2)} y sale ${o.sale.toFixed(2)} (diferencia ${(dif * 100).toFixed(1)} %, normalmente por redondeo de la fuente). Se muestra lo que entra.`);
    }
    const anterior = o.entraAnt || o.saleAnt ? Math.max(o.entraAnt, o.saleAnt) : null;
    return {nombre: n, tipo: o.tipo ?? (esFuente ? 'ingreso' : 'neutral'), valor, anterior, nivel: nivel.get(n), orden: o.orden, filas: [...new Set(o.filas)], esFuente, esSumidero};
  });
  if (informe.errores.some((e) => e.startsWith(`datos.${id}:`))) return null;
  return {tipoX: 'flujos', x: [], series: [], nodos: lista, enlaces, fmt: fmtDe(d), baseNodo: lista.reduce((a, n) => (n.valor > a.valor ? n : a), lista[0]).nombre};
}

/** Categorías: concepto → valor. `tipo` opcional: total (subtotal que debe cuadrar). */
export function cargarCategorias(id, d, t, informe) {
  const err = (m) => informe.errores.push(`datos.${id}: ${m}`), aviso = (m) => informe.avisos.push(`datos.${id}: ${m}`);
  const cc = columnaPor(t, 'concepto', d.concepto), cv = columnaPor(t, 'valor', d.valor);
  if (!cc || !cv) { err(`una tabla de categorías necesita las columnas concepto y valor (encontré: ${t.columnas.join(', ')}).`); return null; }
  const ct = columnaPor(t, 'tipo', d.tipoCol), ca = columnaPor(t, 'anterior', d.anterior);
  const vals = numeros(t, cv, d, err); if (!vals) return null;
  const ant = ca ? numeros(t, ca, d, err) : null; if (ca && !ant) return null;
  const ic = indiceColumna(t, cc), it = ct ? indiceColumna(t, ct) : -1;
  const items = [];
  t.filas.forEach((f, k) => {
    const nombre = f[ic] == null ? '' : traducir(String(f[ic]).trim()); if (!nombre && vals[k] == null) return;
    if (!nombre) { err(`fila ${k + 2}: falta el nombre del concepto.`); return; }
    if (vals[k] == null) { err(`fila ${k + 2} («${nombre}»): falta el valor.`); return; }
    const tp = it >= 0 && f[it] != null ? sinTildes(f[it]) : '';
    if (tp && !['total', 'inicio', 'cambio'].includes(tp)) { err(`fila ${k + 2}: tipo "${f[it]}" no existe. Usa: total, inicio o cambio (o déjalo vacío).`); return; }
    items.push({nombre, valor: vals[k], anterior: ant ? ant[k] : null, tipo: tp, fila: k + 2});
  });
  if (informe.errores.some((e) => e.startsWith(`datos.${id}:`))) return null;
  if (items.length < 2) { err('necesito al menos 2 filas.'); return null; }
  if (d.uso === 'cascada') {
    // primera fila = inicio; las que dicen «total» deben coincidir con la suma acumulada (precisión: se comprueba, no se asume)
    let acum = 0;
    items.forEach((it2, k) => {
      if (k === 0 || it2.tipo === 'inicio') { it2.tipo = 'inicio'; acum = it2.valor; return; }
      if (it2.tipo === 'total') {
        const dif = Math.abs(acum - it2.valor), rel = dif / Math.max(Math.abs(items[0].valor), Math.abs(it2.valor), 1);   // la tolerancia es relativa a la escala de la cascada (el punto de partida), no al subtotal, que puede ser pequeño
        if (rel > 0.05) err(`el total «${it2.nombre}» (${it2.valor.toLocaleString('es-CO')}) no cuadra con la suma de lo anterior (${acum.toLocaleString('es-CO')}) · fila ${it2.fila}.`);
        else if (rel > 0.005) aviso(`el total «${it2.nombre}» difiere ${(rel * 100).toFixed(1)} % de la suma de lo anterior (redondeo de la fuente); se dibuja el total tal como viene.`);
        acum = it2.valor;
      } else { it2.tipo = 'cambio'; acum += it2.valor; }
    });
    if (informe.errores.some((e) => e.startsWith(`datos.${id}:`))) return null;
  } else if (d.uso === 'donut' || d.uso == null) {
    const neg = items.find((x) => x.valor < 0);
    if (neg && d.uso === 'donut') { err(`un donut no admite valores negativos («${neg.nombre}», fila ${neg.fila}). Usa la cascada para sumas y restas.`); return null; }
  }
  const total = items.filter((x) => x.tipo !== 'total').reduce((a, x) => a + x.valor, 0);
  return {tipoX: 'categorias', x: [], series: [], items, total, fmt: fmtDe(d)};
}
