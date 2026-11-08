// UI language test: node scripts/prueba-ui-idioma.mjs
// 1) the es and en dictionaries (web/i18n.js) have the same keys, no empty value, same {placeholders};
// 2) every T('key') / tt() used by web/estudio.js and every data-i* key in web/estudio.html exists in the dictionary;
// 3) in English, no Spanish string remains visible in web/estudio.html or web/estudio.js (every visible literal goes through the dictionary);
// 4) server files only use existing «srv_» keys.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DICT} from '../web/i18n.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const fallos = [];
const F = (m) => fallos.push(m);

// 1) parity
const kes = Object.keys(DICT.es), ken = Object.keys(DICT.en);
for (const k of kes) if (!(k in DICT.en)) F(`key only in es: ${k}`);
for (const k of ken) if (!(k in DICT.es)) F(`key only in en: ${k}`);
const marcadores = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const k of kes) {
  if (!DICT.es[k]?.trim() && DICT.es[k] !== ' ') F(`empty es: ${k}`);
  if (!DICT.en[k]?.trim()) F(`empty en: ${k}`);
  if (marcadores(DICT.es[k]) !== marcadores(DICT.en[k])) F(`placeholders differ in ${k}: es {${marcadores(DICT.es[k])}} en {${marcadores(DICT.en[k])}}`);
}
// an English value identical to the Spanish one is suspicious (untranslated), except proper names / symbols
const IGUALES_OK = /^(G7|BRICS|MacroWise.*|.*Reels.*|Horizontal 16:9.*|Vertical 9:16|Amazon, Apple.*|{n} min|.*YouTube.*|Spec.*|Vertical 9:16|✗ ERROR\s*|{id}.*|Amazon.*|NVIDIA.*)$/;
for (const k of kes) if (DICT.es[k] === DICT.en[k] && !IGUALES_OK.test(DICT.en[k]) && !/^tpl\.|^cam\./.test(k) && DICT.en[k].length > 12) F(`en equals es (untranslated?): ${k}`);

// 2) keys used
const js = leer('web/estudio.js'), html = leer('web/estudio.html');
const usadas = new Set([...js.matchAll(/\bT\('([\w.]+)'/g)].map((m) => m[1]));
for (const m of js.matchAll(/'((?:int|sug|tabla|grp|paso|em|tema|fmt|res|r_k)_[\w]*)'/g)) usadas.add(m[1]);
for (const m of js.matchAll(/\bplural\([^,]+,\s*'(\w+)',\s*'(\w+)'/g)) { usadas.add(m[1]); usadas.add(m[2]); }
for (const m of html.matchAll(/data-i(?:-aria|-title|-ph)?="([\w.]+)"/g)) usadas.add(m[1]);
for (const k of usadas) if (k !== 'grp_' && !(k in DICT.en)) F(`key used but missing: ${k}`);
for (const m of js.matchAll(/\btt\('(\w+)',/g)) if (!['tpl', 'cam'].includes(m[1])) F(`unknown tt prefix: ${m[1]}`);

// 3) Spanish left over in the visible code. We strip comments, imports and the SVG mini drawings, then look for Spanish markers
//    inside string literals and template text.
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');
const sinMini = (s) => { const i = s.indexOf('const MINI = {'), j = s.indexOf('\n};', i); return i >= 0 ? s.slice(0, i) + s.slice(j) : s; };
const ESP = /[áéíóúñ¿¡]|\b(?:el|la|los|las|de|del|para|con|sin|una?|que|qué|tu|tus|elige|datos?|paso|siguiente|atrás|ver|más|quitar|cargando|buscar|descargar|empresa|trimestre|año|serie|resultado|animación)\b/i;
const candidatos = [];
// Per line: drop T('key') / tt(...) calls and ${...} blocks, then inspect (a) text between > and < and (b) quoted literals that contain spaces or accents.
// Single words without accents are identifiers (class names, event names, spec fields) and are allowed.
for (const linea of sinMini(sinComentarios(js)).split('\n')) {
  const l = linea.replace(/\bT\('[\w.]+'(?:,\s*\{[^}]*\})?\)/g, ' ').replace(/\btt\([^)]*\)/g, ' ').replace(/\$\{[^{}]*\}/g, ' ');
  for (const m of l.matchAll(/>([^<>]{3,})</g)) candidatos.push(m[1].trim());
  for (const m of l.matchAll(/'([^'\n]{3,})'/g)) if (/\s/.test(m[1]) || /[áéíóúñ¿¡]/i.test(m[1])) candidatos.push(m[1].trim());
}
for (const t of candidatos) {
  if (/^(?:número|fecha)$/.test(t)) continue;   // column types sent by the server as data
  if (!ESP.test(t) && !/[áéíóúñ¿¡]/i.test(t)) continue;
  if (/[\\[\]=;(){}]/.test(t) && !/[áéíóúñ¿¡]/i.test(t)) continue;   // code, regex or markup, not prose
  F('visible Spanish left in code: ' + t.slice(0, 80));
}
// HTML: visible text (outside <style>/<script>) must be English by default and carry data-i when it is text
const cuerpo = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
const textoHtml = cuerpo.replace(/<[^>]+>/g, '\n').split('\n').map((s) => s.trim()).filter(Boolean);
for (const t of textoHtml) if (/[áéíóúñ¿¡]/i.test(t) || /\b(?:elige|siguiente|aquí|cargando|enviar|nuevo)\b/i.test(t)) F(`visible Spanish left in html: ${t.slice(0, 80)}`);
for (const m of cuerpo.matchAll(/\b(?:aria-label|title|placeholder)="([^"]*)"/g)) if (/[áéíóúñ¿¡]/i.test(m[1])) F(`Spanish attribute in html: ${m[1].slice(0, 80)}`);
if (!/<html lang="en">/.test(html)) F('html lang must default to "en"');

// 4) server keys
for (const arch of ['servidor/estudio.mjs', 'servidor/chat.mjs', 'servidor/cli.mjs', 'servidor/mcp.mjs']) {
  const s = leer(arch);
  for (const m of s.matchAll(/\b(?:tr|T)\('(srv_[\w]+)'/g)) if (!(m[1] in DICT.en) && !/_$/.test(m[1])) F(`${arch}: missing key ${m[1]}`);
  for (const m of s.matchAll(/'(srv_(?:ex|h)_[\w]*)'/g)) if (!(m[1] in DICT.en) && !/_$/.test(m[1])) F(`${arch}: missing key ${m[1]}`);
}
for (const t of ['pieza_actual', 'editar_pieza', 'generar_trimestre', 'generar_pieza', 'listar_trimestres', 'buscar_series', 'descargar_serie', 'analizar_serie', 'vista_previa', 'compilar_spec']) if (!(`srv_h_${t}` in DICT.en)) F(`missing srv_h_${t}`);

console.log(`es keys: ${kes.length} · en keys: ${ken.length} · keys used by the UI: ${usadas.size}`);
if (fallos.length) { console.log(`\nFAIL (${fallos.length}):\n` + fallos.map((f) => '  ✗ ' + f).join('\n')); process.exit(1); }
console.log('OK: es and en match, every key used exists, and no Spanish is left in the English interface.');
