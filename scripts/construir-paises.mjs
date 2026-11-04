// Genera catalogo/paises.json (qué series NO publica la fuente) y añade/actualiza las series `pais_*` en catalogo/series.json
// SIN tocar las demás. Hace ~14 peticiones por lotes (todos los países a la vez); no descarga series completas.
import fs from 'node:fs';
import {rutaCatalogo} from '../servidor/catalogo.mjs';
import {PAISES, INDICADORES, rutaPaises, actualizarUltimos, entradasPaises} from '../servidor/paises.mjs';

fs.rmSync(rutaPaises, {force: true});   // entradasPaises() parte de «todo existe»
const c = await actualizarUltimos(), sin = {};
for (const p of PAISES) for (const i of INDICADORES) if (!c.ultimos[i.clave][p.iso3])
  (sin[p.iso3] ??= {})[i.clave] = `${i.ad === 'worldbank' ? 'El Banco Mundial' : 'El FMI'} no publica ningún valor de «${i.nombre}» para ${p.nombre}.`;
fs.writeFileSync(rutaPaises, JSON.stringify({generado: new Date().toISOString().slice(0, 10), paises: PAISES.length, indicadores: INDICADORES.length, sinDatos: sin}, null, 2));

const viejas = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8')), previas = viejas.filter((e) => !e.id.startsWith('pais_'));
// Orden estable (diffs de git mínimos): las series de país que ya estaban se actualizan EN SU SITIO; las nuevas van al final; las que la fuente dejó de publicar se retiran.
const nuevas = entradasPaises(), porId = new Map(nuevas.map((e) => [e.id, e])), ids = new Set(), usadas = new Set(), out = [];
for (const e of viejas) { if (!e.id.startsWith('pais_')) out.push(e); else if (porId.has(e.id)) { out.push(porId.get(e.id)); usadas.add(e.id); } }
for (const e of nuevas) if (!usadas.has(e.id)) out.push(e);
for (const e of out) { if (ids.has(e.id)) throw new Error(`id duplicado ${e.id}`); ids.add(e.id); }
fs.writeFileSync(rutaCatalogo, JSON.stringify(out, null, 2));
console.log(`series previas: ${previas.length} · series de país nuevas: ${nuevas.length} de ${PAISES.length * INDICADORES.length} posibles · omitidas por falta de dato: ${PAISES.length * INDICADORES.length - nuevas.length}`);
console.log(JSON.stringify(sin, null, 1).slice(0, 3000));
