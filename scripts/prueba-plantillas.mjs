// Prueba las 5 plantillas, los presets de cámara y los dos estilos de momento con datos reales de la biblioteca:
// cada pieza generada debe compilar sin errores y pasar la auditoría de textos (nada se pisa).
import {analizar, generar, CAMARAS} from '../servidor/plantillas.mjs';
import {compilar} from '../servidor/compilar.mjs';
import {auditarColisiones} from '../servidor/render.mjs';
import {leerCatalogo} from '../servidor/catalogo.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from '../servidor/compilar.mjs';
import {calcularDosHitos} from '../motor/capas_extra.js';
import {HITOS_DOLAR} from './modelos-16.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
const hay = (id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`));
const necesarias = ['fed_balance', 'cm_btc_precio', 'bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw', 'fred_dgs10', 'yf_gspc'];
const faltan = necesarias.filter((i) => !hay(i));
if (faltan.length) { console.log('Faltan series descargadas (usa «bajar»):', faltan.join(', ')); process.exit(2); }

async function pieza(nombre, entrada, {paso = 0.5} = {}) {
  const r = generar(entrada);
  const bien = r.informe.ok && r.informe.errores.length === 0;
  const aud = bien ? await auditarColisiones(compilar(r.spec).spec, {paso}) : {ok: false, problemas: [{a: 'no compila'}]};
  ok(bien && aud.ok, `${nombre} · ${r.spec.duracion} s${bien ? '' : ' · ' + r.informe.errores[0]}${aud.ok ? '' : ' · ' + JSON.stringify(aud.problemas[0])}`);
  return r;
}

console.log('\n1) La historia de una cifra: 4 cámaras × 2 estilos de momento (serie corta y serie de siglos)');
for (const id of ['fed_balance', 'cm_btc_precio']) {
  const a = analizar(bib(id)), mom = a.momentos.filter((m) => m.seleccionado).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: m.etiqueta}));
  ok(a.ok && a.momentos.length >= 3, `${id}: ${a.momentos.length} momentos detectados desde los datos`);
  for (const cam of Object.keys(CAMARAS)) for (const estiloMomento of ['tarjeta', 'barra']) await pieza(`${id} · ${cam} · ${estiloMomento}`, {plantilla: 'historia', series: bib(id), momentos: mom, camara: cam, estiloMomento}, {paso: 0.5});
}
console.log('\n2) Panel, carrera, correlación y comparación');
await pieza('panel de 4', {plantilla: 'panel', series: bib('bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw')});
await pieza('panel de 2 vertical', {plantilla: 'panel', series: bib('bm_gold', 'bm_copper'), formato: 'vertical'});
await pieza('carrera de 4', {plantilla: 'carrera', series: bib('bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw')});
await pieza('correlación de 4', {plantilla: 'correlacion', series: bib('bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw')});
const mixta = await pieza('comparar con frecuencias distintas (diaria + mensual)', {plantilla: 'comparar', series: bib('fred_dgs10', 'bm_gold', 'yf_gspc'), foco: 1});
ok(mixta.notas.some((n) => /frecuencias distintas/.test(n)), 'avisa que llevó las series a una frecuencia común, con el método');
ok(mixta.informe.metodos.some((m) => /BASE 100/.test(m)), 'declara el índice base 100 en el informe');

console.log('\n2b) Estilo Harris/Caspian: cámara «seguir», píldora, círculo y temas');
for (const id of ['fed_balance', 'cm_btc_precio']) {
  const a = analizar(bib(id)), mom = a.momentos.filter((m) => m.seleccionado).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: m.etiqueta}));
  for (const estiloMomento of ['pildora', 'circulo']) for (const tema of ['oscuro', 'harris', 'carbon']) {
    const r = await pieza(`${id} · seguir · ${estiloMomento} · tema ${tema}`, {plantilla: 'historia', series: bib(id), momentos: mom, camara: 'seguir', estiloMomento, tema}, {paso: 0.4});
    ok(r.spec.capas.find((c) => c.tipo === 'linea').camara === 'seguir', '   la línea usa la cámara que sigue la punta');
  }
}
await pieza('historia vertical con píldora (dinámico)', {plantilla: 'historia', series: bib('fed_balance'), momentos: analizar(bib('fed_balance')).momentos.filter((m) => m.seleccionado).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: m.etiqueta})), camara: 'dinamico', formato: 'vertical', estiloMomento: 'pildora', tema: 'harris'}, {paso: 0.4});
let errT = ''; try { const r = generar({plantilla: 'historia', series: bib('fed_balance'), momentos: [], tema: 'inventado'}); if (r.informe.errores.length) errT = r.informe.errores[0]; } catch (e) { errT = e.message; }
ok(/tema/.test(errT), 'un tema inexistente se rechaza con mensaje claro');

console.log('\n2c) Dos hitos (dos_hitos / two_milestones): una serie diaria, dos fechas-hito, base 100 y sesiones desde el hito');
if (hay('fred_dtwexbgs')) {
  const serie = bib('fred_dtwexbgs');
  for (const idioma of ['es', 'en']) for (const formato of ['horizontal', 'vertical']) {
    const r = await pieza(`dólar · dos hitos · ${idioma} · ${formato}`, {plantilla: 'dos_hitos', series: serie, hitos: HITOS_DOLAR(idioma === 'en'), formato, idioma, camara: formato === 'vertical' ? 'dinamico' : 'documental', titulo: idioma === 'en' ? 'The broad dollar after two shocks' : 'El dólar tras dos choques'}, {paso: 0.4});
    if (idioma === 'es' && formato === 'horizontal') {
      // las cifras salen de la serie: se recalculan aquí, de forma independiente, desde el CSV y deben coincidir con las que declara el informe
      const filas = fs.readFileSync(path.join(RAIZ, 'datos', 'biblioteca', 'fred_dtwexbgs.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')).filter((f) => f[1] !== '').map((f) => [f[0], +f[1]]);
      const cifras = r.informe.cifras.filter((c) => c.tipo === 'hito');
      ok(cifras.length === 2, 'el informe declara las cifras de los dos hitos (retorno, caídas, máximo, fechas)');
      HITOS_DOLAR(false).forEach((h, k) => {
        let j = -1; filas.forEach((f, i) => { if (f[0] <= h.fecha) j = i; });
        const base = filas[j][1], v = filas.slice(j).map((f) => (f[1] / base) * 100); let mx = -Infinity, peor = 0, pico = 0; v.forEach((q, i) => { mx = Math.max(mx, q); peor = Math.min(peor, (q / mx - 1) * 100); if (q > v[pico]) pico = i; });
        const c = cifras[k];
        ok(c.base === base && c.sesiones === v.length - 1 && Math.abs(c.retorno_pct - (v[v.length - 1] - 100)) < 1e-3 && Math.abs(c.peor_caida_pct - peor) < 1e-3 && Math.abs(c.maximo_base100 - v[pico]) < 1e-3, `hito ${h.fecha}: base ${base}, ${v.length - 1} sesiones, retorno ${c.retorno_pct.toFixed(1)} %, peor caída ${c.peor_caida_pct.toFixed(1)} % y máximo ${c.maximo_base100.toFixed(1)} coinciden con el recálculo independiente`);
      });
      ok(r.informe.avisos.some((a) => /sin proyección/.test(a)), 'avisa que la serie más corta termina antes y que no se proyecta nada');
      ok(r.informe.metodos.some((m) => /base 100 en el cierre/.test(m)), 'declara el método (rebase base 100 por sesiones)');
    }
  }
  const alias = generar({plantilla: 'two_milestones', series: serie, hitos: HITOS_DOLAR(true), idioma: 'en'});
  ok(alias.spec.capas[1].tipo === 'dos_hitos', '«two_milestones» es un alias de «dos_hitos»');
  // eje: logarítmico por defecto si máx/mín > 5, lineal si no, y se puede forzar (serie sintética, solo para la prueba)
  const X = Array.from({length: 3000}, (_, i) => Date.UTC(2000, 0, 1) + i * 86400000), tab = (f) => ({x: X, series: [{y: X.map((_, i) => f(i)), nombre: 'sintética'}]});
  const hh = [{fecha: '2000-01-10', nombre: 'A'}, {fecha: '2003-01-10', nombre: 'B'}];
  ok(calcularDosHitos({hitos: hh}, tab((i) => 100 * Math.pow(1.001, i))).escala === 'log', 'máx/mín > 5 → eje logarítmico por defecto');
  ok(calcularDosHitos({hitos: hh}, tab((i) => 100 + 20 * Math.sin(i / 90))).escala === 'lineal', 'máx/mín ≤ 5 → eje lineal por defecto');
  ok(calcularDosHitos({hitos: hh, escala: 'lineal'}, tab((i) => 100 * Math.pow(1.001, i))).escala === 'lineal' && calcularDosHitos({hitos: hh, escala: 'log'}, tab((i) => 100 + 20 * Math.sin(i / 90))).escala === 'log', 'la escala se puede forzar con «escala»');
  // errores claros
  let e1 = ''; try { generar({plantilla: 'dos_hitos', series: serie}); } catch (e) { e1 = e.message; }
  ok(/hitos/.test(e1), 'sin «hitos» no se genera, con mensaje claro');
  const mal = (hitos) => generar({plantilla: 'dos_hitos', series: serie, hitos}).informe.errores.join(' | ');
  ok(/antes del primer dato/.test(mal([{fecha: '1990-01-01', nombre: 'A'}, {fecha: '2020-03-11', nombre: 'B'}])), 'un hito anterior al primer dato se rechaza');
  ok(/misma sesión/.test(mal([{fecha: '2008-09-15', nombre: 'A'}, {fecha: '2008-09-15', nombre: 'B'}])), 'dos hitos en la misma sesión se rechazan');
  ok(/solo \d+ sesiones/.test(mal([{fecha: '2008-09-15', nombre: 'A'}, {fecha: '2026-10-20', nombre: 'B'}])), 'un hito con menos de 30 sesiones por delante se rechaza');
  ok(/AAAA-MM-DD/.test(mal([{fecha: '15/09/2008', nombre: 'A'}, {fecha: '2020-03-11', nombre: 'B'}])), 'una fecha que no es AAAA-MM-DD se rechaza');
  // el ejemplo del Nasdaq-100 queda «pending open licence»: falla con un mensaje claro hasta que exista una serie abierta
  const pend = compilar(JSON.parse(fs.readFileSync(path.join(RAIZ, 'specs', 'ejemplo_dos_hitos_nasdaq.json'), 'utf8'))).informe;
  ok(!pend.ok && /pending open licence/.test(pend.errores[0]), 'specs/ejemplo_dos_hitos_nasdaq.json falla con «pending open licence» en el primer error');
  const dolar = compilar(JSON.parse(fs.readFileSync(path.join(RAIZ, 'specs', 'ejemplo_dos_hitos_dolar.json'), 'utf8'))).informe;
  ok(dolar.ok, 'specs/ejemplo_dos_hitos_dolar.json compila');
} else console.log('  (falta fred_dtwexbgs: «bajar fred_dtwexbgs»; se omite)');

console.log('\n3) Reglas de seguridad de las plantillas');
let err = ''; try { generar({plantilla: 'carrera', series: bib('bm_gold')}); } catch (e) { err = e.message; }
ok(/necesita/.test(err), 'una plantilla rechaza una cantidad de datos que no le sirve, con mensaje claro');
err = ''; try { generar({plantilla: 'historia', series: [{origen: 'archivo', ruta: 'entradas/x.csv', x: 'f', col: 'v'}]}); } catch (e) { err = e.message; }
ok(/fuente|dónde vienen/i.test(err), 'datos propios sin fuente → no se genera (exactitud)');
const cat = leerCatalogo();
ok(cat.length > 150, `catálogo con ${cat.length} series`);
console.log(fallos ? `\n✗ ${fallos} prueba(s) fallaron` : '\n✓ todas las pruebas de plantillas pasaron');
process.exit(fallos ? 1 : 0);
