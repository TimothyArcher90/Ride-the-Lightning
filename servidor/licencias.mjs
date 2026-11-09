// Puerta de licencias: una pieza marcada `comercial: true` (YouTube monetizado, clientes) FALLA al compilar si alguna de sus fuentes tiene licencia
// restringida («Copyright», NC, uso personal, permiso del FMI…) o sin verificar y la spec no trae su aviso.
//   spec.comercial  true  → activa la puerta (por defecto no se aplica: las piezas de prueba no cambian)
//   spec.avisos     ["texto exacto del aviso", …]   (también cuenta cualquier texto de una capa y spec.pie)
//   spec.permisos   {"<id del dataset>": "referencia del permiso escrito"}   (único camino para licencias restringidas)
// Estados: libre (dominio público) · atribucion (CC BY, reuso con cita: basta el sello de fuente automático) · sin_verificar (hay que leer la
// licencia y llevar su aviso) · restringida (hace falta permiso; un aviso solo NO basta).
// Una entrada del catálogo puede fijar su estado con `licencia_estado` SOLO si trae `licencia_verificada` (fecha en que alguien leyó la página de
// términos) y `licencia_url`; sin eso el estado sale del texto de `licencia` y, ante la duda, es sin_verificar.
import {t as tx, registrar} from '../motor/idioma.js';

registrar('cat', {
  lic_restringida: {es: '{id}: licencia restringida ({lic}) en una pieza marcada como comercial. Hace falta el permiso del titular: declara "permisos": {"{id}": "referencia del permiso"} en la spec o sustituye la fuente. Un aviso en pantalla no lo reemplaza.',
    en: '{id}: restricted license ({lic}) in a piece marked as commercial. The rights holder\'s permission is required: declare "permisos": {"{id}": "permission reference"} in the spec or replace the source. An on-screen notice does not replace it.'},
  lic_sin_verificar: {es: '{id}: licencia sin verificar ({lic}) en una pieza comercial. Léela en la fuente y añade a "avisos" de la spec el aviso exacto: «{aviso}» (o declara "permisos").',
    en: '{id}: unverified license ({lic}) in a commercial piece. Read it at the source and add the exact notice to "avisos" in the spec: "{aviso}" (or declare "permisos").'},
  lic_sin_aviso: {es: '{id}: la licencia exige citar la fuente ({lic}) y el sello de fuente está desactivado. Activa el sello o añade a "avisos" la cita exacta: «{aviso}».',
    en: '{id}: the license requires citing the source ({lic}) and the source stamp is switched off. Turn the stamp on or add the exact citation to "avisos": "{aviso}".'},
  lic_ninguna: {es: 'sin licencia declarada', en: 'no license declared'},
  lic_cabecera: {es: 'Puerta de licencias: {n} fuente(s) bloquean la pieza comercial.', en: 'License gate: {n} source(s) block the commercial piece.'},
  lic_aviso_defecto: {es: 'Datos: {fuente}. Licencia: {lic}.', en: 'Data: {fuente}. License: {lic}.'},
});

export const ESTADOS_LICENCIA = ['libre', 'atribucion', 'sin_verificar', 'restringida'];

const RESTRINGIDA = /copyright|\bNC\b|uso personal|personal use|no redistribuir|do not redistribute|permiso|permission|restring|investigaci[oó]n|t[eé]rminos de uso del fmi|confirmar reutilizaci|confirm commercial/i;
const SIN_VERIFICAR = /sin verificar|unverified|revisar licencia|check the primary|ver t[eé]rminos|see the series terms|^datos p[uú]blicos|public data of/i;
const LIBRE = /dominio p[uú]blico|public domain|U\.S\. government work|obra del gobierno de EE/i;
const ATRIBUCION = /\bCC[ -]BY|\bCC0\b|\bOGL\b|open government licen[cs]e/i;

/** Clasifica la licencia de una fuente ({licencia, corto, nombre, cita?, cita_pie?, licencia_estado?, licencia_verificada?, licencia_url?}). */
export function clasificarLicencia(f = {}) {
  const lic = String(f.licencia ?? '').trim();
  const fuenteTxt = f.corto ?? f.fuente_corto ?? f.nombre ?? f.fuente_original ?? '';
  const fijado = f.licencia_estado && ESTADOS_LICENCIA.includes(f.licencia_estado) && f.licencia_verificada && f.licencia_url;
  let estado, motivo;
  if (fijado) { estado = f.licencia_estado; motivo = 'verificada'; }
  else if (!lic) { estado = 'sin_verificar'; motivo = 'sin_licencia'; }
  else if (RESTRINGIDA.test(lic)) { estado = 'restringida'; motivo = 'texto'; }
  else if (SIN_VERIFICAR.test(lic)) { estado = 'sin_verificar'; motivo = 'texto'; }
  else if (LIBRE.test(lic)) { estado = 'libre'; motivo = 'texto'; }
  else if (ATRIBUCION.test(lic)) { estado = 'atribucion'; motivo = 'texto'; }
  else { estado = 'sin_verificar'; motivo = 'desconocida'; }
  const licTxt = lic || tx('cat.lic_ninguna');
  const aviso = f.requiere_aviso ?? f.requiereAviso ?? f.cita ?? tx('cat.lic_aviso_defecto', {fuente: fuenteTxt, lic: licTxt});
  return {estado, motivo, licencia: licTxt, aviso, citaPie: f.cita_pie ?? f.citaPie ?? fuenteTxt};
}

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Todo el texto "de aviso" que lleva la pieza: spec.avisos, spec.pie y el texto de cada capa. */
export function textosDeLaPieza(spec = {}) {
  const t = [];
  for (const a of [].concat(spec.avisos ?? [], spec.aviso ?? [])) if (typeof a === 'string') t.push(a);
  if (typeof spec.pie === 'string') t.push(spec.pie);
  for (const c of spec.capas ?? []) for (const k of ['texto', 'nota', 'subtitulo']) if (typeof c?.[k] === 'string') t.push(c[k]);
  return t;
}
const contiene = (textos, aviso) => { const a = norm(aviso); return a.length > 0 && textos.some((x) => norm(x).includes(a)); };

/**
 * Revisa las fuentes de una pieza. `datos`: [{id, fuente:{…}}] (informe.datos del compilador). Devuelve {aplica, ok, problemas:[{id, estado, mensaje}], estados:{id: estado}}.
 * Si la spec no es comercial devuelve {aplica:false, ok:true}.
 */
export function revisarLicencias(datos, spec = {}) {
  if (spec.comercial !== true) return {aplica: false, ok: true, problemas: [], estados: {}};
  const textos = textosDeLaPieza(spec), problemas = [], estados = {};
  for (const d of datos ?? []) {
    const c = clasificarLicencia(d.fuente ?? {});
    estados[d.id] = c.estado;
    const permiso = spec.permisos?.[d.id];
    if (typeof permiso === 'string' && permiso.trim()) continue;   // permiso escrito declarado: la responsabilidad queda documentada en la spec
    if (c.estado === 'libre') continue;
    if (c.estado === 'restringida') { problemas.push({id: d.id, estado: c.estado, mensaje: tx('cat.lic_restringida', {id: d.id, lic: c.licencia})}); continue; }
    if (c.estado === 'sin_verificar') {
      if (!contiene(textos, c.aviso)) problemas.push({id: d.id, estado: c.estado, mensaje: tx('cat.lic_sin_verificar', {id: d.id, lic: c.licencia, aviso: c.aviso})});
      continue;
    }
    // atribucion: el sello automático (corto de la fuente) cumple la cita si lo lleva y no está apagado
    const corto = String(d.fuente?.corto ?? d.fuente?.nombre ?? '');
    const enSello = spec.sello !== false && norm(corto).includes(norm(c.citaPie));
    if (!enSello && !contiene(textos, c.aviso)) problemas.push({id: d.id, estado: c.estado, mensaje: tx('cat.lic_sin_aviso', {id: d.id, lic: c.licencia, aviso: c.aviso})});
  }
  return {aplica: true, ok: problemas.length === 0, problemas, estados};
}

/** Como revisarLicencias, pero lanza un Error con todos los motivos si algo bloquea. */
export function exigirLicencias(datos, spec = {}) {
  const r = revisarLicencias(datos, spec);
  if (!r.ok) throw new Error([tx('cat.lic_cabecera', {n: r.problemas.length}), ...r.problemas.map((p) => `- ${p.mensaje}`)].join('\n'));
  return r;
}

/** Cuenta cuántas entradas del catálogo caen en cada estado (para auditar el catálogo antes de monetizar). */
export function resumenLicenciasCatalogo(catalogo) {
  const por = {libre: 0, atribucion: 0, sin_verificar: 0, restringida: 0};
  for (const e of catalogo) por[clasificarLicencia({licencia: e.licencia, corto: e.fuente_corto, nombre: e.fuente_original, licencia_estado: e.licencia_estado, licencia_verificada: e.licencia_verificada, licencia_url: e.licencia_url}).estado]++;
  return por;
}
