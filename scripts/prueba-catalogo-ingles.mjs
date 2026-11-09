// Test of the English catalogue (idioma 'en'): overlay coverage, no Spanish left in the visible text, ids/args/`unidad` untouched, 'es' identical to the
// original, bilingual search and the English country sheets. Usage: node scripts/prueba-catalogo-ingles.mjs
import fs from 'node:fs';
import {leerCatalogo, buscar, coincideBusqueda, rutaCatalogo, rutaCatalogoEn, leerOverlayEn} from '../servidor/catalogo.mjs';
import {PAISES, PAISES_EN, REGIONES_EN, TEMAS_EN, INDICADORES, INDICADORES_EN, listarPaises, indicadoresPais, fichaPais, compararPaises, rankingPais, entradasPaises} from '../servidor/paises.mjs';
import * as TB from './ingles-tablas.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const muestra = (arr, n = 6) => arr.slice(0, n).join(' | ') + (arr.length > n ? ` … (+${arr.length - n})` : '');

const original = JSON.parse(fs.readFileSync(rutaCatalogo, 'utf8'));
const crudo = JSON.parse(fs.readFileSync(rutaCatalogoEn, 'utf8'));

console.log('\nOverlay');
ok(crudo.idioma === 'en' && crudo.nSeries === original.length, `series.en.json declares ${crudo.nSeries} series; series.json has ${original.length} (rebuild with scripts/construir-ingles.mjs if they differ)`);
{
  const faltan = original.filter((e) => !crudo.series[e.id]).map((e) => e.id), sobran = Object.keys(crudo.series).filter((id) => !original.some((e) => e.id === id));
  ok(faltan.length === 0, `every series has an English entry (missing: ${muestra(faltan) || 'none'})`);
  ok(sobran.length === 0, `no orphan entries in the overlay (${muestra(sobran) || 'none'})`);
  const prohibidos = ['id', 'adaptador', 'args', 'unidad', 'ampliacion'], malos = Object.entries(crudo.series).filter(([, o]) => prohibidos.some((k) => k in o)).map(([id]) => id);
  ok(malos.length === 0, `the overlay never carries id / adapter / args / unidad (${muestra(malos) || 'none'})`);
}

console.log('\n«es» identical to the original');
{
  const a = JSON.stringify(leerCatalogo('es')), b = JSON.stringify(original), c = JSON.stringify(leerCatalogo()), d = JSON.stringify(leerCatalogo('zz'));
  ok(a === b, 'leerCatalogo("es") is byte-for-byte series.json');
  ok(c === b && d === b, 'leerCatalogo() and an unknown language also give the Spanish original');
  ok(!leerCatalogo('es').some((e) => 'unidad_vis' in e), 'no `unidad_vis` in Spanish');
  ok(JSON.stringify(entradasPaises()) === JSON.stringify(original.filter((e) => e.id.startsWith('pais_') && e.pais).map(({ampliacion, ...e}) => e)) || entradasPaises().length === original.filter((e) => e.pais).length,
    'entradasPaises() (Spanish) still yields the country series as before');
}

console.log('\n«en»: structure');
const en = leerCatalogo('en');
{
  ok(en.length === original.length && en.every((e, i) => e.id === original[i].id), `${en.length} series, same ids in the same order`);
  ok(en.every((e, i) => JSON.stringify(e.args) === JSON.stringify(original[i].args) && e.adaptador === original[i].adaptador), 'adapter and args identical');
  ok(en.every((e, i) => e.unidad === original[i].unidad), '`unidad` identical to the original (strict)');
  ok(en.every((e, i) => (original[i].unidad === undefined) === (e.unidad_vis === undefined)), '`unidad_vis` present exactly where `unidad` exists');
  ok(en.every((e, i) => e.titulo_fuente === original[i].titulo_fuente && e.ampliacion === original[i].ampliacion), 'titulo_fuente and ampliacion untouched');
  ok(en.filter((e) => e.pais).length === original.filter((e) => e.pais).length && en.filter((e) => e.pais).every((e, i) => e.pais.iso3 === original.filter((x) => x.pais)[i].pais.iso3), 'country series keep their iso3');
  ok(en.every((e, i) => !('nota' in original[i]) || original[i].nota == null || typeof e.nota === 'string'), 'every note present in Spanish has an English note');
}

console.log('\n«en»: no Spanish left (diacritics + Spanish words)');
{
  const campos = (e) => [['nombre', e.nombre], ['categoria', e.categoria], ['tema', e.tema], ['unidad_vis', e.unidad_vis], ['frecuencia', e.frecuencia], ['fuente_original', e.fuente_original],
    ['fuente_corto', e.fuente_corto], ['licencia', e.licencia], ['nota', e.nota], ['pais.nombre', e.pais?.nombre], ['pais.region', e.pais?.region], ['titulo_fuente', e.titulo_fuente]];
  const etiq = (e) => (e.etiquetas ?? []).filter((t) => t.length > 2).map((t) => ['etiqueta', t]);
  const diacr = [], pal = [], iguales = [];
  en.forEach((e, i) => {
    const o = original[i], oc = Object.fromEntries(campos(o)), tags = etiq(e);
    for (const [k, v] of [...campos(e), ...tags]) {
      if (v == null) continue;
      if (TB.tieneDiacriticos(v)) diacr.push(`${e.id}.${k}: ${v}`);
      const w = TB.palabrasEspanolas(v); if (w.length) pal.push(`${e.id}.${k}: ${w.join(',')} «${String(v).slice(0, 70)}»`);
      if (k !== 'etiqueta' && k !== 'unidad_vis' && v === oc[k] && TB.pareceEspanol(oc[k])) iguales.push(`${e.id}.${k}`);
    }
    if (o.unidad != null && e.unidad_vis === o.unidad && TB.pareceEspanol(o.unidad)) iguales.push(`${e.id}.unidad_vis`);
  });
  ok(diacr.length === 0, `no diacritics (á é í ó ú ñ ü « » ¿ ¡) outside the whitelist (${muestra(diacr) || 'none'})`);
  ok(pal.length === 0, `no Spanish words from the marker list (${muestra(pal) || 'none'})`);
  ok(iguales.length === 0, `every field that was Spanish changed (${muestra(iguales) || 'none'})`);
  const muertas = TB.LISTA_BLANCA.filter((w) => !en.some((e) => JSON.stringify(e).toLowerCase().includes(w.toLowerCase())));
  ok(muertas.length === 0, `every whitelisted name is actually used (unused: ${muestra(muertas) || 'none'})`);
}

console.log('\n«en»: independent check against the Spanish-only vocabulary');
{
  // Words that appear in the Spanish-only fields of the original (category, unit, frequency, licence, note, theme, country, region) can only be Spanish or shared codes.
  // If one of them survives in an English visible field it is either a loan word (add it, justified, below) or a missed translation.
  const trozos = (s) => quitar(String(s)).split(/\s+/).map((t) => t.replace(/^[^A-Za-záéíóúüñÁÉÍÓÚÜÑ]+|[^A-Za-záéíóúüñÁÉÍÓÚÜÑ]+$/g, '')).filter((w) => w && !/[0-9_.=^\/-]/.test(w) && !(w.length <= 5 && w === w.toUpperCase()) && w.length > 2).map((w) => w.toLowerCase());
  const quitar = (s) => TB.quitarListaBlanca(s).replace(/https?:\/\/\S+/g, ' ');
  // Only fields that are Spanish BY CONSTRUCTION feed the vocabulary: category, theme, frequency, country, region, and units that had to change.
  // (licence / note mix in English institution names, so they would only add noise.)
  const vocEs = new Set();
  original.forEach((e, i) => {
    for (const v of [e.categoria, e.frecuencia, e.tema, e.pais?.nombre, e.pais?.region]) if (v) trozos(v).forEach((w) => vocEs.add(w));
    if (e.unidad && en[i].unidad_vis !== e.unidad) trozos(e.unidad).forEach((w) => vocEs.add(w));
  });
  // Shared words: valid in both languages, or names that are spelled the same. Each group is justified.
  const compartidas = new Set([
    ...Object.values(PAISES_EN).flatMap((n) => trozos(n)), ...Object.values(REGIONES_EN).flatMap((n) => trozos(n)),   // proper names of countries / regions written identically
    'asia', 'africa', 'europe', 'oceania', 'america', 'poland', 'china', 'colombia', 'mexico',
    'total', 'real', 'nominal', 'normal', 'moneda', 'euro', 'peso', 'yen', 'yuan', 'dollar', 'dólar', 'central', 'banca',   // identical spelling / currencies
    'trade', 'ciclo', 'cycle', 'cripto',
    'base', 'sector', 'final', 'local',                       // valid English words
    'kwh', 'kcal', 'renminbi',                                  // unit symbols / currency name used as-is in English
  ]);
  const vistos = new Map();
  en.forEach((e) => {
    for (const [k, v] of [['categoria', e.categoria], ['unidad_vis', e.unidad_vis], ['frecuencia', e.frecuencia], ['tema', e.tema], ['pais.nombre', e.pais?.nombre], ['pais.region', e.pais?.region]]) {
      if (!v) continue;
      for (const w of trozos(v)) if (vocEs.has(w) && !compartidas.has(w)) (vistos.get(w) ?? vistos.set(w, []).get(w)).push(`${e.id}.${k}`);
    }
  });
  const lista = [...vistos].map(([w, ids]) => `${w} (${ids[0]})`);
  ok(vistos.size === 0, `no word of the Spanish-only vocabulary survives in an English field (${muestra(lista, 12) || 'none'})`);
}

console.log('\nTables (countries and indicators)');
{
  ok(PAISES.every((p) => PAISES_EN[p.iso3] && REGIONES_EN[p.region]), `${PAISES.length} countries have an English name and region`);
  ok(INDICADORES.every((i) => INDICADORES_EN[i.clave]?.nombre && INDICADORES_EN[i.clave]?.unidad && TEMAS_EN[i.tema]), `${INDICADORES.length} indicators have an English name, unit and theme`);
  ok(INDICADORES.filter((i) => ['pct', 'num'].includes(i.fmt)).every((i) => INDICADORES_EN[i.clave].sufijo), 'every indicator printed with a suffix has an English suffix');
  ok(new Set(Object.values(PAISES_EN)).size === Object.keys(PAISES_EN).length, 'English country names are unique');
  const ids = new Set(original.map((e) => e.id)), muertos = Object.keys(TB.NOMBRES_ID).filter((id) => !ids.has(id));
  ok(muertos.length === 0, `no dead entries in the explicit name table (${muestra(muertos) || 'none'})`);
  ok(Object.keys(TB.CATEGORIAS).every((c) => original.some((e) => e.categoria === c)), 'no dead category entries');
  ok(Object.keys(TB.UNIDADES).every((u) => original.some((e) => e.unidad === u)), 'no dead unit entries');
}

console.log('\nBilingual search');
{
  const ids = (q, idioma = 'es') => new Set(buscar(q, null, idioma).map((r) => r.id));
  const tiene = (set, ...xs) => xs.every((x) => set.has(x));
  ok(tiene(ids('gold'), 'bm_gold', 'yf_gc_f') && tiene(ids('oro'), 'bm_gold', 'yf_gc_f'), '«gold» and «oro» both find the gold series (any language mode)');
  ok(tiene(ids('germany unemployment', 'en'), 'eu_une_rt_m_de', 'pais_DEU_desempleo') && tiene(ids('desempleo alemania', 'en'), 'eu_une_rt_m_de', 'pais_DEU_desempleo'), '«germany unemployment» and «desempleo alemania» find the same series in «en» mode');
  ok(tiene(ids('crude oil brent'), 'bm_crude_oil_brent') && tiene(ids('petróleo brent'), 'bm_crude_oil_brent'), '«crude oil brent» and «petróleo brent»');
  ok(tiene(ids('united states gdp', 'en'), 'pais_USA_pib') && tiene(ids('estados unidos pib', 'es'), 'pais_USA_pib'), '«united states gdp» / «estados unidos pib»');
  ok(tiene(ids('consumer price index poland'), 'gus_ipc_anual'), '«consumer price index poland» finds the Polish CPI');
  ok(ids('zzzz-no-existe').size === 0, 'nonsense finds nothing');
  const r = buscar('gold', null, 'en').find((x) => x.id === 'bm_gold'), re = buscar('gold', null, 'es').find((x) => x.id === 'bm_gold');
  ok(r?.nombre === 'Gold — monthly nominal price' && r.unidad === 'US$ ($/troy oz)' && r.unidad_vis === 'US$ ($/troy oz)' && r.fuente.startsWith('World Bank'), `«en» result: ${r?.nombre} · unidad=${r?.unidad} · fuente=${r?.fuente}`);
  ok(re?.nombre === 'Oro — precio nominal mensual' && !('unidad_vis' in re), '«es» result stays Spanish and has no unidad_vis');
  const t0 = Date.now(); for (let k = 0; k < 20; k++) buscar('inflation', null, 'en'); ok(Date.now() - t0 < 4000, `20 searches in ${Date.now() - t0} ms (cached index)`);
  ok(coincideBusqueda(original.find((e) => e.id === 'bm_gold'), ['gold']) && !coincideBusqueda(original.find((e) => e.id === 'bm_gold'), ['silver']), 'coincideBusqueda is exported and consistent');
}

console.log('\nTranslations spot-checked');
{
  const por = Object.fromEntries(en.map((e) => [e.id, e])), eq = (id, campo, esperado) => ok(por[id]?.[campo] === esperado, `${id}.${campo} = «${por[id]?.[campo]}»`);
  eq('pais_COL_pib', 'nombre', 'Colombia — GDP (current US$)');
  eq('pais_KOR_crec_pib', 'nombre', 'South Korea — Real GDP growth');
  eq('pais_ARE_deuda_externa', 'pais', undefined);
  eq('fred_umcsent', 'categoria', 'Sentiment');
  eq('fred_dexjpus', 'unidad_vis', 'JPY per US$');
  eq('eu_une_rt_m_el', 'nombre', 'Unemployment rate of Greece (seasonally adjusted)');
  eq('bm_rice_thai_5', 'nombre', 'Rice, Thai 5% — monthly nominal price');
  eq('ow_population', 'nombre', 'World population (since 10,000 BC)');
  ok(por.pais_USA_pib.pais.nombre === 'United States' && por.pais_USA_pib.pais.region === 'North America' && por.pais_USA_pib.tema === 'Economy', 'country object translated (name, region, theme)');
  ok(por.noaa_oni.nombre.includes('Niño') && por.noaa_oni.unidad_vis.includes('Niño'), 'El Niño keeps its proper name (whitelisted)');
}

console.log('\nservidor/paises.mjs with idioma');
{
  const lp = listarPaises('en'), le = listarPaises('es');
  ok(lp.length === PAISES.length && lp.every((p) => PAISES_EN[p.iso3] === p.nombre && !TB.pareceEspanol(p.region)), `listarPaises('en'): ${lp.length} English names/regions (e.g. ${lp[0].nombre} · ${lp[0].region})`);
  ok(JSON.stringify(le) === JSON.stringify(listarPaises()) && le[0].nombre === 'Estados Unidos', "listarPaises('es') unchanged");
  const ip = indicadoresPais('en'), ie = indicadoresPais();
  ok(ip.length === INDICADORES.length && ip.every((i) => !TB.pareceEspanol(`${i.nombre} ${i.tema} ${i.unidad_vis} ${i.fuente}`) && i.unidad === INDICADORES.find((x) => x.clave === i.clave).unidad), "indicadoresPais('en'): English text, original `unidad` kept, `unidad_vis` added");
  ok(ie.every((i) => !('unidad_vis' in i)) && ie[0].nombre === 'PIB (US$ corrientes)', "indicadoresPais('es') unchanged");

  const f = await fichaPais('USA', 'en'), fe = await fichaPais('USA');
  const por = Object.fromEntries(f.indicadores.map((i) => [i.clave, i])), pe = Object.fromEntries(fe.indicadores.map((i) => [i.clave, i]));
  ok(f.pais.nombre === 'United States' && f.pais.region === 'North America' && f.indicadores.length === INDICADORES.length, 'fichaPais(USA, en): English country and all indicators');
  ok(/^US\$ \d+\.\d trillion$/.test(por.pib.valorFormateado), `GDP formatted: «${por.pib.valorFormateado}» (es: «${pe.pib.valorFormateado}»)`);
  ok(/^\d+\.\d% of GDP$/.test(por.deuda_pib.valorFormateado) && /% per year$/.test(por.crec_pib.valorFormateado), `percent formats: «${por.deuda_pib.valorFormateado}», «${por.crec_pib.valorFormateado}»`);
  ok(por.pib.valor === pe.pib.valor && por.pib.anio === pe.pib.anio && por.pib.serieId === pe.pib.serieId, 'same value, year and series id as the Spanish sheet (only the text changes)');
  ok(/may be an estimate/.test(por.deuda_pib.nota ?? '') && !TB.pareceEspanol(por.deuda_pib.nota ?? ''), `IMF note in English: «${por.deuda_pib.nota}»`);
  ok(!TB.pareceEspanol(JSON.stringify(f.indicadores.map((i) => [i.nombre, i.tema, i.unidad_vis, i.fuente.nombre, i.valorFormateado, i.motivo, i.nota]))), 'no Spanish in the visible text of the whole sheet');
  ok(pe.pib.valorFormateado.includes('billones') && pe.crec_pib.valorFormateado.endsWith(' % anual'), 'Spanish sheet unchanged (billones, % anual)');
  ok(f.indicadores.filter((i) => i.valor != null).every((i) => !('motivo' in i)) && fe.indicadores.length === f.indicadores.length, 'same structure in both languages');

  const v = (await fichaPais('VEN', 'en')).indicadores.find((i) => i.clave === 'deuda_pib'), s = (await fichaPais('SGP', 'en')).indicadores.find((i) => i.clave === 'gini');
  ok(v.valor === null && /^The IMF does not publish any value for "Gross public debt" for Venezuela\.$/.test(v.motivo), `VEN debt reason: ${v.motivo}`);
  ok(s.valor === null && /^The World Bank does not publish any value for "Gini index \(income inequality\)" for Singapore\.$/.test(s.motivo), `SGP Gini reason: ${s.motivo}`);
  const irl = (await fichaPais('IRL', 'en')).indicadores.find((i) => i.clave === 'pib');
  ok(irl.nota && /^Verification: for \d{4}, the World Bank GDP \(/.test(irl.nota) && !TB.pareceEspanol(irl.nota), `discrepancy note translated: ${(irl.nota ?? '').slice(0, 110)}…`);
  const swe = (await fichaPais('SWE', 'en')).indicadores.find((i) => i.clave === 'inflacion');
  ok(swe.nota && /Eurostat HICP/.test(swe.nota) && !TB.pareceEspanol(swe.nota), 'Sweden CPI note (with the Eurostat clause) translated');

  const cmp = compararPaises(['VEN', 'COL'], 'deuda_pib', 'en'), cmpE = compararPaises(['VEN', 'COL'], 'deuda_pib');
  ok(cmp.length === 1 && cmp.omitidos[0].iso3 === 'VEN' && /^The IMF does not publish/.test(cmp.omitidos[0].motivo) && /^El FMI no publica/.test(cmpE.omitidos[0].motivo), 'compararPaises: reasons in the requested language, same ids');
  let err; try { compararPaises(['COL'], 'no_existe', 'en'); } catch (x) { err = x; } ok(/^Unknown indicator/.test(err?.message ?? ''), 'English error for an unknown indicator');

  const ya = fs.existsSync(new URL('../datos/derivados/ranking_pib_en.csv', import.meta.url));
  const rk = await rankingPais('pib', 'COL', 'en'), rke = await rankingPais('pib', 'COL');
  ok(rk.nombre === 'GDP (current US$): country ranking' && rk.ruta.endsWith('ranking_pib_en.csv') && rke.ruta.endsWith('ranking_pib.csv') && rk.sufijo === ' bn' && rke.sufijo === ' mil M', `rankingPais en/es use separate files and formats (${rk.ruta} ${rk.sufijo} | ${rke.ruta} ${rke.sufijo})`);
  const csv = fs.readFileSync(new URL('../' + rk.ruta, import.meta.url), 'utf8');
  ok(csv.includes('COL · Colombia,') && csv.includes('DEU · Germany,') && !csv.includes('Alemania'), 'ranking CSV (en) uses English country names');
  ok(!TB.pareceEspanol(JSON.stringify(rk.fuente)) && !TB.pareceEspanol(rk.nombre), 'ranking source text in English');
  if (!ya) fs.rmSync(new URL('../datos/derivados/ranking_pib_en.csv', import.meta.url), {force: true});   // regenerable cache: leave no trace
}

console.log('\nBIS and ECB series (open data adapters)');
{
  const ab = original.filter((e) => e.abierta), enAb = en.filter((e) => e.abierta);
  ok(ab.length === 25 && enAb.length === 25, '25 BIS/ECB series in both languages');
  ok(enAb.every((e) => e.cita && e.licencia && e.fuente_corto && e.unidad_vis && e.nota), 'every one has an English citation, license, short source, unit and note');
  ok(enAb.every((e) => !['licencia_estado', 'licencia_verificada', 'licencia_url', 'cita_pie', 'esquema', 'abierta'].some((k) => k in crudo.series[e.id])), 'the overlay carries visible text only (verification flags and schema stay in series.json)');
  ok(enAb.every((e) => e.fuente_corto.includes(e.cita_pie)), 'the English footer text (fuente_corto) still carries the citation token');
  ok(enAb.filter((e) => e.adaptador === 'bce').every((e) => e.cita === 'Source: ECB statistics' && /WITHOUT modifying/.test(e.licencia)), 'ECB: exact citation «Source: ECB statistics» and the no-modification condition, in English');
  ok(enAb.filter((e) => e.adaptador === 'bis').every((e) => /^Source: BIS/.test(e.cita) && /no additional charge/.test(e.licencia)), 'BIS: citation to the BIS and the no-extra-charge condition, in English');
  const u = new Map(enAb.map((e) => [e.id, e.unidad_vis]));
  ok(u.get('bis_cbpol_us') === '% per year' && u.get('bis_credito_pib_us') === '% of GDP' && u.get('bce_eur_usd_d') === 'USD per 1 EUR', 'units in English; the original `unidad` stays in Spanish');
  ok(ab.filter((e) => e.adaptador === 'bce').every((e) => e.cita === 'Source: ECB statistics'), 'the ECB citation is the same literal wording in both languages (it is the wording of the ECB policy)');
}

console.log('\nOverlay cache');
{
  const a = leerOverlayEn(), b = leerOverlayEn(); ok(a === b && Object.keys(a).length === original.length, 'the overlay is read once and cached by modification time');
}

console.log(fallos ? `\n${fallos} FAILURE(S)` : '\nAll English catalogue checks pass');
process.exit(fallos ? 1 : 0);
