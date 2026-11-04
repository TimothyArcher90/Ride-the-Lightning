// Prueba de las series por país: catálogo (conteo, ids únicos, patrón, campos), fichas de 5 países con valores plausibles,
// valores nulos con motivo, comparación de 3 países y coherencia ficha ↔ serie descargada (mismo último dato).
import fs from 'node:fs';
import {leerCatalogo, descargar, rutaVerificado} from '../servidor/catalogo.mjs';
import {listarPaises, indicadoresPais, fichaPais, compararPaises, PAISES, INDICADORES} from '../servidor/paises.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };

console.log('\nCatálogo');
const cat = leerCatalogo(), pa = cat.filter((e) => e.id.startsWith('pais_')), previas = cat.filter((e) => !e.id.startsWith('pais_'));
ok(previas.length === 185, `las 185 series previas siguen (hay ${previas.length})`);
ok(new Set(cat.map((e) => e.id)).size === cat.length, `ids únicos (${cat.length} series)`);
ok(pa.length >= 600 && pa.length <= PAISES.length * INDICADORES.length, `series de país: ${pa.length} de ${PAISES.length * INDICADORES.length} posibles`);
ok(pa.every((e) => new RegExp(`^pais_${e.pais?.iso3}_[a-z_]+$`).test(e.id) && INDICADORES.some((i) => e.id === `pais_${e.pais.iso3}_${i.clave}`)), 'todas con id pais_<ISO3>_<indicador> y su indicador conocido');
ok(pa.every((e) => e.pais?.iso3?.length === 3 && e.pais.nombre && e.pais.region && e.tema && e.licencia && e.fuente_original && e.args && ['worldbank', 'imf'].includes(e.adaptador)), 'todas con pais{iso3,nombre,region}, tema, licencia, fuente y adaptador abierto');
ok(listarPaises().length === PAISES.length && listarPaises().every((p) => p.nIndicadores >= 12), `${PAISES.length} países, cada uno con ≥12 indicadores (min ${Math.min(...listarPaises().map((p) => p.nIndicadores))})`);
ok(indicadoresPais().length === INDICADORES.length && indicadoresPais().every((i) => i.clave && i.nombre && i.unidad && i.tema && i.fuente), `${INDICADORES.length} indicadores con nombre, unidad, tema y fuente`);

console.log('\nFichas (rangos plausibles, no valores fijos)');
const rangos = {
  USA: {pib: [2.5e13, 4e13], poblacion: [3.3e8, 3.6e8], inflacion: [0, 8], desempleo: [2, 8], deuda_pib: [90, 140]},
  CHN: {pib: [1.5e13, 2.5e13], poblacion: [1.38e9, 1.45e9], esperanza_vida: [75, 80]},
  DEU: {pib: [4e12, 6e12], poblacion: [8e7, 8.7e7], exportaciones: [30, 55]},
  COL: {pib: [3e11, 5e11], poblacion: [4.9e7, 5.4e7], desempleo: [5, 14], gini: [45, 60]},
  BRA: {pib: [1.8e12, 2.8e12], poblacion: [2.05e8, 2.25e8], deuda_pib: [70, 110]},
};
for (const [iso, r] of Object.entries(rangos)) {
  const f = await fichaPais(iso), por = Object.fromEntries(f.indicadores.map((i) => [i.clave, i]));
  ok(f.indicadores.length === INDICADORES.length && f.pais.iso3 === iso, `${f.pais.nombre}: ${f.indicadores.length} indicadores`);
  for (const [k, [a, b]] of Object.entries(r)) ok(por[k].valor >= a && por[k].valor <= b, `  ${k} = ${por[k].valorFormateado} (${por[k].anio}) ∈ [${a}, ${b}]`);
  ok(f.indicadores.filter((i) => i.valor != null).every((i) => i.fuente.url.startsWith('https://') && i.fuente.nombre && /^\d{4}$/.test(String(i.anio)) && i.valorFormateado && i.serieId?.startsWith(`pais_${iso}_`)), '  cada dato con año, fuente+URL, texto formateado y serieId');
}
{
  const f = await fichaPais('USA'), pib = f.indicadores.find((i) => i.clave === 'pib'), ded = f.indicadores.find((i) => i.clave === 'deuda_pib'), cre = f.indicadores.find((i) => i.clave === 'crec_pib');
  ok(/^US\$ \d+,\d billones$/.test(pib.valorFormateado), `formato PIB: «${pib.valorFormateado}»`);
  ok(/^\d+,\d % del PIB$/.test(ded.valorFormateado), `formato deuda: «${ded.valorFormateado}»`);
  ok(/ % anual$/.test(cre.valorFormateado), `formato crecimiento: «${cre.valorFormateado}»`);
  ok(/estimaci/i.test(ded.nota ?? ''), 'la cifra del FMI avisa que puede ser estimación');
}
console.log('\nSin dato → null + motivo (nunca inventado)');
{
  const v = (await fichaPais('VEN')).indicadores.find((i) => i.clave === 'deuda_pib'), s = (await fichaPais('SGP')).indicadores.find((i) => i.clave === 'gini');
  ok(v.valor === null && v.valorFormateado === null && v.anio === null && v.motivo && v.serieId === null, `VEN deuda: ${v.motivo}`);
  ok(s.valor === null && s.motivo, `SGP Gini: ${s.motivo}`);
  const cmp = compararPaises(['VEN', 'COL'], 'deuda_pib');
  ok(cmp.length === 1 && cmp.omitidos.length === 1 && cmp.omitidos[0].iso3 === 'VEN', 'compararPaises no descarta en silencio: VEN sale en .omitidos');
}
console.log('\nComparación');
{
  const ids = compararPaises(['COL', 'MEX', 'BRA'], 'pib');
  ok(JSON.stringify(ids) === JSON.stringify(['pais_COL_pib', 'pais_MEX_pib', 'pais_BRA_pib']) && ids.omitidos.length === 0, `ids: ${ids.join(', ')}`);
  ok(ids.every((id) => cat.some((e) => e.id === id)), 'todos existen en el catálogo');
  let e; try { compararPaises(['COL'], 'no_existe'); } catch (x) { e = x; } ok(!!e, 'indicador desconocido se rechaza');
  try { await fichaPais('XXX'); e = null; } catch (x) { e = x; } ok(!!e, 'país desconocido se rechaza');
}
console.log('\nCoherencia ficha ↔ serie descargada (mismo último dato)');
{
  const ver = JSON.parse(fs.readFileSync(rutaVerificado, 'utf8')), borrar = [];
  for (const [iso, k] of [['COL', 'pib'], ['JPN', 'deuda_pib'], ['MEX', 'poblacion']]) {
    const e = cat.find((x) => x.id === `pais_${iso}_${k}`), m = await descargar({...e, id: `prueba_${e.id}`});
    borrar.push(m.archivo);
    const filas = fs.readFileSync(m.archivo, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')), u = filas.at(-1);
    const d = (await fichaPais(iso)).indicadores.find((i) => i.clave === k);
    ok(d.anio === +u[0].slice(0, 4) && Math.abs(d.valor - Number(u[1])) <= 1e-9 * Math.abs(d.valor), `${iso} ${k}: ficha ${d.anio}=${d.valor} ≡ serie completa ${u[0]}=${u[1]} (${filas.length} años desde ${filas[0][0].slice(0, 4)})`);
  }
  for (const f of borrar) { fs.rmSync(f, {force: true}); fs.rmSync(f + '.meta.json', {force: true}); }
  const v2 = JSON.parse(fs.readFileSync(rutaVerificado, 'utf8')); for (const k of Object.keys(v2)) if (k.startsWith('prueba_')) delete v2[k];
  fs.writeFileSync(rutaVerificado, JSON.stringify(v2, null, 2));
  ok(!Object.keys(v2).some((k) => k.startsWith('prueba_')), 'la prueba no deja rastro en verificado.json');
}
console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodas las pruebas de países pasan');
process.exit(fallos ? 1 : 0);
