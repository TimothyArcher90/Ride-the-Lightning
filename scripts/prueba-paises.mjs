// Prueba de las series por país: catálogo (conteo, ids únicos, patrón, campos), fichas de 5 países con valores plausibles,
// valores nulos con motivo, comparación de 3 países y coherencia ficha ↔ serie descargada (mismo último dato).
import fs from 'node:fs';
import {leerCatalogo, descargar, rutaVerificado} from '../servidor/catalogo.mjs';
import {listarPaises, indicadoresPais, fichaPais, compararPaises, PAISES, INDICADORES} from '../servidor/paises.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };

console.log('\nCatálogo');
const cat = leerCatalogo(), pa = cat.filter((e) => e.id.startsWith('pais_')), previas = cat.filter((e) => !e.id.startsWith('pais_'));
ok(previas.filter((e) => !e.ampliacion && !e.abierta).length === 185, `las 185 series previas no-país siguen (hay ${previas.filter((e) => !e.ampliacion && !e.abierta).length}; más ${previas.filter((e) => e.ampliacion).length} de la ampliación y ${previas.filter((e) => e.abierta).length} de BIS/BCE)`);
ok(new Set(cat.map((e) => e.id)).size === cat.length, `ids únicos (${cat.length} series)`);
ok(pa.length >= 3800 && pa.length <= PAISES.length * INDICADORES.length, `series de país: ${pa.length} de ${PAISES.length * INDICADORES.length} posibles`);
ok(pa.every((e) => new RegExp(`^pais_${e.pais?.iso3}_[a-z0-9_]+$`).test(e.id) && INDICADORES.some((i) => e.id === `pais_${e.pais.iso3}_${i.clave}`)), 'todas con id pais_<ISO3>_<indicador> y su indicador conocido');
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
// ── BIS y BCE: catálogo, esquemas por serie y puerta de licencias (sin red) ──────────────────────────────────────────
console.log('\nBIS y BCE en el catálogo (licencia verificada, cita, esquema)');
const {ADAPTADORES} = await import('../servidor/catalogo.mjs');
const {validarSerie, revisarEsquema} = await import('../servidor/esquemas.mjs');
const {clasificarLicencia, revisarLicencias, exigirLicencias, resumenLicenciasCatalogo} = await import('../servidor/licencias.mjs');
const {parsearCsv, periodoAFecha} = await import('../servidor/datos_abiertos.mjs');
const {compilar, RAIZ: RAIZ_PROY} = await import('../servidor/compilar.mjs');
const {conIdioma} = await import('../motor/idioma.js');
const path = await import('node:path');
{
  const ab = cat.filter((e) => e.abierta);
  ok(ab.length === 25 && ab.every((e) => e.adaptador === 'bis' || e.adaptador === 'bce') && ab.filter((e) => e.adaptador === 'bis').length === 18, `25 series de BIS/BCE (18 BIS + 7 BCE); hay ${ab.length}`);
  ok(ab.every((e) => e.licencia_estado === 'atribucion' && /^\d{4}-\d{2}-\d{2}$/.test(e.licencia_verificada) && /^https:\/\//.test(e.licencia_url) && e.cita && e.cita_pie && e.requiere_aviso), 'cada una declara licencia verificada (fecha + URL), cita exacta y aviso');
  ok(ab.every((e) => e.fuente_corto.includes(e.cita_pie)), 'el pie «Fuente» (fuente_corto) lleva el texto de cita exigido (BIS / ECB statistics)');
  ok(ab.filter((e) => e.adaptador === 'bce').every((e) => e.cita === 'Source: ECB statistics' && /SIN modificar/.test(e.licencia)), 'BCE: cita literal «Source: ECB statistics» y condición de no modificar en la licencia');
  ok(ab.filter((e) => e.adaptador === 'bis').every((e) => /BIS/.test(e.cita) && /data\.bis\.org\/help\/legal/.test(e.licencia_url + e.licencia)), 'BIS: cita al BIS y términos de data.bis.org/help/legal');
  ok(ab.every((e) => revisarEsquema(e.esquema).length === 0 && e.esquema.unidad === e.unidad), 'cada esquema es válido y su unidad coincide con la del catálogo');
  ok(ab.every((e) => e.args.flujo && e.args.clave && !/\s/.test(e.args.clave)), 'cada una trae flujo y clave SDMX');
  ok(ab.every((e) => clasificarLicencia({licencia: e.licencia, corto: e.fuente_corto, licencia_estado: e.licencia_estado, licencia_verificada: e.licencia_verificada, licencia_url: e.licencia_url, cita_pie: e.cita_pie}).estado === 'atribucion'), 'la puerta las clasifica como «atribucion»');
  const r = resumenLicenciasCatalogo(cat);
  ok(r.restringida > 0 && r.sin_verificar > 0 && r.libre > 0 && r.atribucion >= 25 && r.libre + r.atribucion + r.sin_verificar + r.restringida === cat.length, `auditoría del catálogo por estado: ${JSON.stringify(r)}`);
  const est = (id) => { const e = cat.find((x) => x.id === id); return clasificarLicencia({licencia: e.licencia, corto: e.fuente_corto}).estado; };
  ok(est('cm_btc_precio') === 'restringida' && est('yf_gspc') === 'restringida', 'Coin Metrics (NC) y Yahoo (uso personal) salen restringidas');
  ok(cat.filter((e) => e.adaptador === 'imf').every((e) => clasificarLicencia({licencia: e.licencia, corto: e.fuente_corto}).estado === 'restringida'), 'las series del FMI salen restringidas (uso comercial pide permiso)');
  ok(est('fred_wtisplc') === 'sin_verificar', 'FRED con «Ver términos de la serie» sale sin verificar');
  ok(est('ust_deuda_total') === 'libre' && est('bm_gold') === 'atribucion', 'Tesoro de EE. UU. libre; Banco Mundial (CC BY) con atribución');
}

console.log('\nUtilidades SDMX');
{
  const m = parsearCsv('A,B,C\n1,"x, y",3\n"a ""q"" b","línea1\nlínea2",\n');
  ok(m.length === 3 && m[1][1] === 'x, y' && m[2][0] === 'a "q" b' && m[2][1] === 'línea1\nlínea2' && m[2][2] === '', 'el lector CSV respeta comillas, comas y saltos de línea dentro de campos');
  ok(periodoAFecha('2026-09') === '2026-09-01' && periodoAFecha('2026-Q1') === '2026-01-01' && periodoAFecha('2026-Q4') === '2026-10-01' && periodoAFecha('1999') === '1999-01-01' && periodoAFecha('2026-11-06') === '2026-11-06' && periodoAFecha('2026-W05') === null, 'periodos SDMX → primer día (mes, trimestre, año, día); semanas no soportadas');
}

console.log('\nEsquema por serie');
{
  const M = {unidad: '% anual', frecuencia: 'M', min: -2, max: 100, saltoMax: 5};
  const buenas = [['2026-01-01', '3.5'], ['2026-02-01', 3.75], ['2026-03-01', '4']];
  ok(validarSerie(buenas, M, {id: 'x', unidadCatalogo: '% anual'}).ok, 'datos correctos pasan (cadenas y números)');
  const falla = (filas, esq = M, o = {unidadCatalogo: '% anual'}) => validarSerie(filas, esq, {id: 'x', ...o});
  ok(/fuera del rango/.test(falla([['2026-01-01', '3'], ['2026-02-01', '250']]).errores.join()), 'rechaza un valor fuera del rango plausible (250 con tope 100)');
  ok(/no numérico/.test(falla([['2026-01-01', 'n/a']]).errores.join()), 'rechaza un valor no numérico');
  ok(/no crecientes/.test(falla([['2026-02-01', '3'], ['2026-01-01', '3']]).errores.join()), 'rechaza fechas desordenadas');
  ok(/no corresponde/.test(falla([['2026-01-15', '3']]).errores.join()), 'rechaza una fecha que no es de frecuencia mensual (día 15)');
  ok(/no corresponde/.test(falla([['2026-02-01', '3']], {...M, frecuencia: 'Q'}).errores.join()), 'rechaza un mes que no inicia trimestre en una serie trimestral');
  ok(/no coincide/.test(falla(buenas, M, {unidadCatalogo: '% del PIB'}).errores.join()), 'rechaza si la unidad del esquema difiere de la del catálogo');
  ok(/fecha no válida/.test(falla([['2026-13-40', '3']]).errores.join()), 'rechaza una fecha de calendario imposible');
  ok(falla([]).errores.length === 1 && !falla([]).ok, 'rechaza una serie vacía');
  ok(!validarSerie(buenas, {...M, min: 5, max: 1}, {id: 'x'}).ok, 'rechaza un esquema mal formado (min ≥ max)');
  const g = validarSerie([['2026-01-01', '3'], ['2026-04-01', '3.1']], M, {id: 'x'});
  ok(g.ok && /2 periodo\(s\) sin dato/.test(g.avisos.join()), 'un hueco de periodos es AVISO (no se rellena), no error');
  const s = validarSerie([['2026-01-01', '3'], ['2026-02-01', '12']], M, {id: 'x'});
  ok(s.ok && /salto de/.test(s.avisos.join()), 'un salto mayor que el umbral es AVISO (puede ser real)');
  ok(validarSerie([['2026-01-01', '3'], ['2026-02-20', '3']], {...M, frecuencia: 'D'}, {id: 'x'}).ok, 'frecuencia diaria admite cualquier fecha válida');
  const en = conIdioma('en', () => falla([['2026-01-01', '3'], ['2026-02-01', '250']]).errores.join());
  ok(/outside the plausible range/.test(en) && !/[áéíóúñ]/i.test(en), `el error sale en inglés con idioma «en»: «${en.slice(0, 70)}»`);
  // descargar() aplica el esquema ANTES de escribir nada
  let n = 0; ADAPTADORES.prueba_esq = async () => ({columnas: ['fecha', 'v'], filas: n++ ? [['2026-01-01', '3'], ['2026-02-01', '4']] : [['2026-01-01', '3'], ['2026-02-01', '250']], url: 'https://example.org/', urlDatos: 'https://example.org/d'});
  const ent = {id: 'prueba_esquema', adaptador: 'prueba_esq', args: {}, unidad: '% anual', frecuencia: 'Mensual', fuente_original: 'Prueba', licencia: 'CC BY 4.0', esquema: M};
  const archivo = path.join(RAIZ_PROY, 'datos', 'biblioteca', 'prueba_esquema.csv');
  fs.rmSync(archivo, {force: true});
  let err = ''; try { await descargar(ent); } catch (x) { err = x.message; }
  ok(/no cumple su esquema/.test(err) && !fs.existsSync(archivo), 'una descarga que viola su esquema falla y NO escribe el CSV');
  ok(!('prueba_esquema' in JSON.parse(fs.readFileSync(rutaVerificado, 'utf8'))), '…ni deja rastro en verificado.json');
  const mm = await descargar({...ent, cita: 'Source: X', cita_pie: 'X', licencia_estado: 'atribucion', licencia_verificada: '2026-11-09', licencia_url: 'https://example.org/legal'});
  const meta = JSON.parse(fs.readFileSync(archivo + '.meta.json', 'utf8'));
  ok(mm.filas === 2 && meta.validacion?.esquema?.max === 100 && meta.fuente.cita === 'Source: X' && meta.fuente.licencia_verificada === '2026-11-09' && meta.fuente.licencia_url, 'una descarga válida guarda en el .meta.json su validación y su licencia verificada');
  for (const f of [archivo, archivo + '.meta.json']) fs.rmSync(f, {force: true});
  delete ADAPTADORES.prueba_esq;
  const v3 = JSON.parse(fs.readFileSync(rutaVerificado, 'utf8')); delete v3.prueba_esquema; fs.writeFileSync(rutaVerificado, JSON.stringify(v3, null, 2));
}

console.log('\nPuerta de licencias (piezas comerciales)');
{
  const F = {
    libre: {nombre: 'Tesoro', corto: 'Tesoro de EE. UU.', licencia: 'Dominio público (obra del gobierno de EE. UU.; FiscalData)'},
    bce: {nombre: 'BCE EXR', corto: 'ECB statistics · EXR · USD/EUR', licencia: 'Reuso libre citando la fuente', cita: 'Source: ECB statistics', cita_pie: 'ECB statistics', requiere_aviso: 'Source: ECB statistics', licencia_estado: 'atribucion', licencia_verificada: '2026-11-09', licencia_url: 'https://example.org/legal'},
    restr: {nombre: 'Coin Metrics', corto: 'Coin Metrics · BTC', licencia: 'CC BY-NC 4.0 (datos comunitarios de Coin Metrics)'},
    copy: {nombre: 'Índice de un tercero', corto: 'Tercero · IDX', licencia: 'Copyright del titular; ver notas de la serie'},
    sinv: {nombre: 'FRED', corto: 'FRED · XYZ', licencia: 'Ver términos de la serie en FRED'},
    nada: {nombre: 'Archivo propio', corto: 'Archivo propio'},
    sinvEn: {nombre: 'FRED', corto: 'FRED · XYZ', licencia: 'See the series terms on FRED'},
  };
  const D = (...k) => k.map((c) => ({id: `d_${c}`, fuente: F[c]}));
  ok(clasificarLicencia(F.copy).estado === 'restringida' && clasificarLicencia(F.nada).estado === 'sin_verificar' && clasificarLicencia(F.libre).estado === 'libre', '«Copyright» → restringida; sin licencia → sin verificar; dominio público → libre');
  const noComercial = revisarLicencias(D('restr', 'copy', 'sinv', 'nada'), {});
  ok(!noComercial.aplica && noComercial.ok, 'una spec sin `comercial: true` no cambia: la puerta no se aplica');
  const lim = revisarLicencias(D('libre', 'bce'), {comercial: true});
  ok(lim.aplica && lim.ok, 'comercial con fuente libre y BCE (el sello automático lleva «ECB statistics») pasa');
  const r = revisarLicencias(D('restr', 'copy', 'sinv', 'nada', 'bce'), {comercial: true});
  ok(!r.ok && r.problemas.length === 4 && r.problemas.map((p) => p.id).join() === 'd_restr,d_copy,d_sinv,d_nada', 'comercial con licencia restringida o sin verificar sin aviso: bloquea las 4 (y no a la del BCE)');
  ok(/licencia restringida/.test(r.problemas[0].mensaje) && /permisos/.test(r.problemas[0].mensaje) && /licencia sin verificar/.test(r.problemas[2].mensaje) && /avisos/.test(r.problemas[2].mensaje), 'los mensajes en español dicen qué falta y cómo resolverlo');
  const aviso = clasificarLicencia(F.sinv).aviso;
  ok(revisarLicencias(D('sinv'), {comercial: true, avisos: [`Datos: ${aviso}`]}).ok === true && revisarLicencias(D('sinv'), {comercial: true, avisos: ['otro texto']}).ok === false, 'sin verificar: pasa con su aviso exacto en `avisos`, no con otro texto');
  ok(revisarLicencias(D('sinv'), {comercial: true, capas: [{tipo: 'titulo', texto: aviso}]}).ok, '…también cuenta el aviso dibujado como texto de una capa');
  ok(!revisarLicencias(D('restr'), {comercial: true, avisos: [clasificarLicencia(F.restr).aviso]}).ok, 'restringida: un aviso NO basta (hace falta permiso)');
  ok(revisarLicencias(D('restr', 'copy'), {comercial: true, permisos: {d_restr: 'carta de Coin Metrics, 2026-11-09', d_copy: 'licencia 123'}}).ok, 'restringida: pasa con `permisos` documentados por dataset');
  ok(!revisarLicencias(D('restr'), {comercial: true, permisos: {d_restr: '   '}}).ok, 'un permiso vacío no cuenta');
  ok(!revisarLicencias(D('bce'), {comercial: true, sello: false}).ok && revisarLicencias(D('bce'), {comercial: true, sello: false, avisos: ['Source: ECB statistics']}).ok, 'atribución: con el sello apagado exige la cita exacta en `avisos`');
  const en = conIdioma('en', () => revisarLicencias(D('restr', 'sinvEn'), {comercial: true}).problemas.map((p) => p.mensaje).join(' '));
  ok(/restricted license/.test(en) && /unverified license/.test(en) && !/[áéíóúñ¿¡]/i.test(en.replace(/«[^»]*»/g, '')), 'los mensajes de la puerta salen en inglés con idioma «en»');
  let lanzo = ''; try { exigirLicencias(D('restr'), {comercial: true}); } catch (x) { lanzo = x.message; }
  ok(/Puerta de licencias/.test(lanzo) && /d_restr/.test(lanzo), 'exigirLicencias lanza un Error con el motivo');
}

console.log('\nPuerta de licencias integrada en el compilador');
{
  const dir = path.join(RAIZ_PROY, '.tmp', 'prueba-licencias'); fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'serie.csv'), 'fecha,v\n2020-01-01,1\n2020-02-01,2\n2020-03-01,3\n2020-04-01,2\n2020-05-01,4\n');
  const spec = (extra = {}, lic = 'CC BY-NC 4.0 (prueba)') => ({version: 1, titulo: 'Prueba de licencia', formato: 'horizontal', fps: 30, duracion: 4, ...extra,
    datos: {d: {archivo: '.tmp/prueba-licencias/serie.csv', x: 'fecha', tipoX: 'fecha', columnas: [{col: 'v', nombre: 'Serie', color: 'oro', unidad: 'puntos'}], fuente: {nombre: 'Serie de prueba', corto: 'Serie de prueba', url: 'https://example.org/', obtenido: '2026-11-09', licencia: lic}}},
    capas: [{tipo: 'linea', id: 'g1', datos: 'd', t: [0.3, 3.5]}]});
  const base = compilar(spec());
  ok(base.informe.ok && base.informe.avisos.some((a) => /LICENCIA/.test(a)), 'sin `comercial`: compila y sigue avisando de la licencia NC (comportamiento previo)');
  const com = compilar(spec({comercial: true}));
  ok(!com.informe.ok && com.informe.errores.some((e) => /^d: licencia restringida/.test(e)), 'con `comercial: true` y licencia NC: el compilador FALLA con el motivo');
  const conPermiso = compilar(spec({comercial: true, permisos: {d: 'carta del titular, 2026-11-09'}}));
  ok(conPermiso.informe.ok, 'con `permisos.d` documentado compila');
  const ingles = compilar(spec({comercial: true, idioma: 'en'}));
  ok(!ingles.informe.ok && ingles.informe.errores.some((e) => /restricted license/.test(e)), 'el error también sale en inglés con idioma «en»');
  const libre = compilar(spec({comercial: true}, 'Dominio público (prueba)'));
  ok(libre.informe.ok, 'comercial con fuente de dominio público compila');
  // conexión: generar() (estudio y MCP) reenvía comercial/permisos a la spec y la puerta actúa con series reales de la biblioteca
  const {generar} = await import('../servidor/plantillas.mjs'), {hayEnBiblioteca} = await import('../servidor/datos.mjs');
  const restr = leerCatalogo().find((e) => /no redistribuir/i.test(e.licencia ?? '') && hayEnBiblioteca(e.id));
  if (restr) {
    const g = (extra) => generar({plantilla: 'historia', series: [{origen: 'biblioteca', id: restr.id}], ...extra});
    const a = g({}), b = g({comercial: true}), c = g({comercial: true, permisos: {d: 'carta del titular, 2026-11-09'}});
    ok(a.informe.ok && a.spec.comercial === undefined, 'generar sin `comercial`: compila y no marca la spec');
    ok(!b.informe.ok && b.spec.comercial === true && b.informe.errores.some((e) => /licencia restringida/.test(e)), 'generar con `comercial: true` y serie restringida: la puerta bloquea');
    ok(c.informe.ok && c.spec.permisos?.d, 'generar con `permisos` documentados: compila y los conserva en la spec');
  } else console.log('  (sin serie restringida en la biblioteca local: se omite la prueba de generar)');
  fs.rmSync(dir, {recursive: true, force: true});
}

console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodas las pruebas de países pasan');
process.exit(fallos ? 1 : 0);
