// Builds catalogo/series.en.json: the English overlay of catalogo/series.json (all series). Usage: node scripts/construir-ingles.mjs [--sin-informe]
//
// - Only VISIBLE text is translated: nombre, categoria, tema, etiquetas, frecuencia, fuente_original, fuente_corto, licencia, nota, pais{nombre,region}.
// - ids, adaptador, args and the original `unidad` are never touched; the English unit goes in `unidad_vis`.
// - Country series (pais_<ISO3>_<indicator>, ~4,000) come from servidor/paises.mjs `entradasPaises('en')` (same tables as the runtime).
// - Everything else is translated with the tables in scripts/ingles-tablas.mjs. A term that has no table entry and still looks Spanish is NOT guessed:
//   it stays in the original and is listed in docs/diagnosticos/2026-11-08-ingles-frente3-pendientes.md.
// Idempotent and deterministic (no dates, no network). Re-run after construir-catalogo / construir-paises / construir-ampliacion.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PAISES, PAISES_EN, entradasPaises} from '../servidor/paises.mjs';
import {rutaCatalogo, rutaCatalogoEn} from '../servidor/catalogo.mjs';
import * as TB from './ingles-tablas.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rutaInforme = path.join(RAIZ, 'docs', 'diagnosticos', '2026-11-08-ingles-frente3-pendientes.md');
const base = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8'));
const paisEn = new Map(entradasPaises('en').map((e) => [e.id, e]));
const es2en = new Map(PAISES.map((p) => [p.nombre, PAISES_EN[p.iso3]]));   // «Alemania» → «Germany»
for (const [k, v] of Object.entries(TB.AGREGADOS_UE)) es2en.set(k, v);

// ── Pending registry: field → text → ids ────────────────────────────────────────────────────────────────────────────
const pendientes = new Map();
const pend = (campo, texto, id) => { const m = pendientes.get(campo) ?? new Map(); pendientes.set(campo, m); (m.get(texto) ?? m.set(texto, []).get(texto)).push(id); };
/** Table lookup; if there is no entry and the text does not look Spanish it passes through; otherwise it is kept in the original and reported. */
const buscar = (tabla, campo, texto, id) => {
  if (texto == null) return undefined;
  if (Object.hasOwn(tabla, texto)) return tabla[texto];
  if (!TB.pareceEspanol(texto)) return texto;
  pend(campo, texto, id); return texto;
};
const fragmentos = (s) => { let t = s; for (const [a, b] of TB.FRAGMENTOS) t = t.split(a).join(b); return t; };
const org = (s) => s.replace(/ y /g, ' and ');   // «U.S. Department of the Treasury y U.S. Office of Management and Budget»

// ── Notes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
function nota(n, id) {
  if (n == null) return undefined;
  if (Object.hasOwn(TB.NOTAS, n)) return TB.NOTAS[n];
  if (Object.hasOwn(TB.NOTA_GUS, n)) return TB.NOTA_GUS[n];
  let m;
  if ((m = /^Página de la serie: (\S+) \(unidades y fuente original oficial allí\)\. La unidad indicada aquí es de catálogo: confírmala en esa página antes de rotular\.$/.exec(n)))
    return `Series page: ${m[1]} (units and official original source there). The unit shown here is a catalog unit: confirm it on that page before labeling.`;
  if ((m = /^Fuente original: (.+)\. Página de la serie: (\S+?)\. Los valores se guardan tal como los publica FRED \(ajuste estacional y base del índice según la serie\); las revisiones posteriores de la fuente pueden cambiar cifras ya publicadas\.$/.exec(n)))
    return `Original source: ${org(m[1])}. Series page: ${m[2]}. Values are stored as published by FRED (seasonal adjustment and index base depend on the series); later revisions by the source may change figures already published.`;
  if ((m = /^Entidad «World» de la página (\S+?)\. Fuente primaria: (.+)\. Años sin valor omitidos, nunca interpolados\.$/.exec(n))) {
    const f = fragmentos(m[2]);
    if (!TB.pareceEspanol(f)) return `Entity "World" on the page ${m[1]}. Primary source: ${f}. Years without a value are omitted, never interpolated.`;
  }
  if (!TB.pareceEspanol(n)) return n;
  pend('nota', n, id); return n;
}

// ── Licences ────────────────────────────────────────────────────────────────────────────────────────────────────────────
function licencia(l, id) {
  if (l == null) return undefined;
  if (Object.hasOwn(TB.LICENCIAS, l)) return TB.LICENCIAS[l];
  let m;
  if ((m = /^Dominio público \(obra del gobierno de EE\. UU\.: (.+)\), redistribuida por FRED; citar la fuente$/.exec(l))) return `Public domain (U.S. government work: ${org(m[1])}), redistributed by FRED; cite the source`;
  if ((m = /^Ver términos de la serie en FRED \(fuente: (.+)\); no se redistribuye en la instantánea$/.exec(l))) return `See the series terms on FRED (source: ${m[1]}); not redistributed in the snapshot`;
  if ((m = /^CC BY 4\.0 \(OWID\); fuente primaria: (.+)$/.exec(l))) {
    const f = fragmentos(m[1]);
    if (!TB.pareceEspanol(f)) return `CC BY 4.0 (OWID); primary source: ${f}`;
  }
  if (!TB.pareceEspanol(l)) return l;
  pend('licencia', l, id); return l;
}

const unidad = (u, id) => { const m = /^([A-Z]{3}) por ((?:1 )?(?:US\$|[A-Z]{3}))$/.exec(u); return m ? `${m[1]} per ${m[2]}` : buscar(TB.UNIDADES, 'unidad', u, id); };   // «JPY por US$» → «JPY per US$»

// ── Names ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const paisDe = (s) => es2en.get(s);
function nombre(e) {
  const n = e.nombre, id = e.id;
  if (Object.hasOwn(TB.NOMBRES_ID, id)) return TB.NOMBRES_ID[id];
  let m;
  if (id.startsWith('bm_') && (m = /^(.+) — precio nominal mensual$/.exec(n))) {
    const b = Object.hasOwn(TB.BM_BASE, m[1]) ? TB.BM_BASE[m[1]] : (TB.pareceEspanol(m[1]) ? null : m[1]);
    if (b) return `${b} — monthly nominal price`;
  }
  if (id.startsWith('yf_') && n.includes(' — ')) {
    const [b, ...resto] = n.split(' — '), bb = Object.hasOwn(TB.YF_BASE, b) ? TB.YF_BASE[b] : (TB.pareceEspanol(b) ? null : b);
    const rr = resto.map((r) => (Object.hasOwn(TB.YF_PARTE, r) ? TB.YF_PARTE[r] : null));
    if (bb && rr.every(Boolean)) return [bb, ...rr].join(' — ');
  }
  if (id.startsWith('eu_hicp_cp') && (m = /^IPCA de (.+): (.+) — variación anual$/.exec(n)) && paisDe(m[1]) && TB.RUBROS_IPCA[m[2]]) return `HICP ${paisDe(m[1])}: ${TB.RUBROS_IPCA[m[2]]} — annual change`;
  if (id.startsWith('eu_') && (m = /^Tasa de desempleo de (.+) \(ajustada estacionalmente\)$/.exec(n)) && paisDe(m[1])) return `Unemployment rate of ${paisDe(m[1])} (seasonally adjusted)`;
  if (id.startsWith('eu_') && (m = /^Crecimiento real del PIB de (.+) \(trimestral, ajustado\)$/.exec(n)) && paisDe(m[1])) return `Real GDP growth of ${paisDe(m[1])} (quarterly, adjusted)`;
  if (id.startsWith('eu_') && (m = /^Producción industrial de (.+) \(índice 2021=100, ajustado\)$/.exec(n)) && paisDe(m[1])) return `Industrial production of ${paisDe(m[1])} (index 2021=100, adjusted)`;
  if (id.startsWith('eu_') && (m = /^Población de (.+) a 1 de enero$/.exec(n)) && paisDe(m[1])) return `Population of ${paisDe(m[1])} on 1 January`;
  if (id.startsWith('eu_') && (m = /^Deuda de las administraciones públicas de (.+) \/ PIB$/.exec(n)) && paisDe(m[1])) return `General government debt of ${paisDe(m[1])} / GDP`;
  if (id.startsWith('wb_') && (m = /^(.+) — (.+)$/.exec(n)) && TB.IND_AGREGADO[m[1]] && TB.REGIONES_AGREGADO[m[2]]) return `${TB.IND_AGREGADO[m[1]]} — ${TB.REGIONES_AGREGADO[m[2]]}`;
  if (!TB.pareceEspanol(n)) return n;
  pend('nombre', n, id); return n;
}

// ── Tags ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const etiquetas = (arr, id) => [...new Set((arr ?? []).map((t) => {
  if (Object.hasOwn(TB.TAGS, t)) return TB.TAGS[t];
  if (t.length <= 2 || !TB.pareceEspanol(t)) return t;   // 2-letter tags are country codes (de, es, el...)
  pend('etiquetas', t, id); return t;
}))];   // de-duplicated: «tesoro» and «treasury» both become «treasury»

// ── Short source label ──────────────────────────────────────────────────────────────────────────────────────────────────
const fuenteCorto = (s, id) => {
  if (s == null) return undefined;
  const r = s.split(' · ').map((seg) => (Object.hasOwn(TB.FUENTE_CORTO_SEG, seg) ? TB.FUENTE_CORTO_SEG[seg] : seg)).join(' · ');
  if (!TB.pareceEspanol(r)) return r;
  pend('fuente_corto', s, id); return s;
};

// ── Build ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const out = {}, conteo = {pais: 0, otras: 0};
for (const e of base) {
  const p = paisEn.get(e.id);
  if (e.pais && p) {
    const {id, adaptador, args, unidad, ...vis} = p;   // ids/args/unidad come from series.json, not from the overlay
    out[e.id] = vis; conteo.pais++;
    continue;
  }
  const o = {
    nombre: nombre(e), categoria: buscar(TB.CATEGORIAS, 'categoria', e.categoria, e.id),
    ...(e.tema ? {tema: e.tema} : {}), etiquetas: etiquetas(e.etiquetas, e.id),
    ...(e.unidad !== undefined && e.unidad !== null ? {unidad_vis: unidad(e.unidad, e.id)} : {}),
    frecuencia: buscar(TB.FRECUENCIAS, 'frecuencia', e.frecuencia, e.id), fuente_original: buscar(TB.FUENTES, 'fuente_original', e.fuente_original, e.id),
    fuente_corto: fuenteCorto(e.fuente_corto, e.id), licencia: licencia(e.licencia, e.id),
  };
  const n = nota(e.nota, e.id); if (n !== undefined) o.nota = n;
  if (e.pais) { pend('pais', e.pais.nombre, e.id); o.pais = {...e.pais}; }   // a country series that entradasPaises('en') no longer yields: keep and report
  out[e.id] = o; conteo.otras++;
}

fs.mkdirSync(path.dirname(rutaCatalogoEn), {recursive: true});
const cuerpo = Object.entries(out).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',\n');
fs.writeFileSync(rutaCatalogoEn, `{"idioma":"en","fuente":"catalogo/series.json","nSeries":${base.length},"series":{\n${cuerpo}\n}}\n`);

// ── Report of what was left in the original ─────────────────────────────────────────────────────────────────────────────
let total = 0; const lineas = [];
for (const [campo, m] of pendientes) for (const [t, ids] of m) { total++; lineas.push(`- **${campo}** (${ids.length} series, e.g. \`${ids[0]}\`): ${JSON.stringify(t)}`); }
if (!process.argv.includes('--sin-informe')) {
  fs.mkdirSync(path.dirname(rutaInforme), {recursive: true});
  fs.writeFileSync(rutaInforme, [
    '# English catalogue: terms left in the original',
    '',
    'Generated by `scripts/construir-ingles.mjs`. A term lands here when it has no entry in `scripts/ingles-tablas.mjs` and still looks Spanish: it is NOT guessed, it stays in the original text of `catalogo/series.json`.',
    '',
    total ? `${total} distinct term(s):` : 'None: every visible field of every series has an English text (or is a proper name listed in `LISTA_BLANCA`).',
    '',
    ...lineas,
    '',
    '## Kept in Spanish on purpose (proper names, see `LISTA_BLANCA`)',
    '',
    ...TB.LISTA_BLANCA.map((w) => `- ${w}`),
    '',
  ].join('\n'));
}
console.log(`series.en.json: ${base.length} series (${conteo.pais} from the country tables, ${conteo.otras} from the translation tables); ${total} term(s) left in the original${total ? ' — see ' + path.relative(RAIZ, rutaInforme) : ''}`);
for (const l of lineas.slice(0, 40)) console.log(l);
