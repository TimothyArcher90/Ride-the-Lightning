// Prueba las 5 plantillas, los presets de cámara y los dos estilos de momento con datos reales de la biblioteca:
// cada pieza generada debe compilar sin errores y pasar la auditoría de textos (nada se pisa).
import {analizar, generar, CAMARAS} from '../servidor/plantillas.mjs';
import {compilar} from '../servidor/compilar.mjs';
import {auditarColisiones} from '../servidor/render.mjs';
import {leerCatalogo} from '../servidor/catalogo.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from '../servidor/compilar.mjs';

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

console.log('\n3) Reglas de seguridad de las plantillas');
let err = ''; try { generar({plantilla: 'carrera', series: bib('bm_gold')}); } catch (e) { err = e.message; }
ok(/necesita/.test(err), 'una plantilla rechaza una cantidad de datos que no le sirve, con mensaje claro');
err = ''; try { generar({plantilla: 'historia', series: [{origen: 'archivo', ruta: 'entradas/x.csv', x: 'f', col: 'v'}]}); } catch (e) { err = e.message; }
ok(/fuente|dónde vienen/i.test(err), 'datos propios sin fuente → no se genera (exactitud)');
const cat = leerCatalogo();
ok(cat.length > 150, `catálogo con ${cat.length} series`);
console.log(fallos ? `\n✗ ${fallos} prueba(s) fallaron` : '\n✓ todas las pruebas de plantillas pasaron');
process.exit(fallos ? 1 : 0);
