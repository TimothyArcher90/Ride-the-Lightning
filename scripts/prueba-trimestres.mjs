// Prueba la biblioteca de trimestres: que cada pieza compile (todo cuadra) y que ningún texto se pise, con datos REALES de la SEC.
// Requiere haber construido la biblioteca (node scripts/trimestres.mjs construir). Sin llaves ni costo.
import fs from 'node:fs';
import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {auditarColisiones} from '../servidor/render.mjs';
import {leerIndice, itemTrimestre, empresas} from '../servidor/trimestres.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const hay = empresas().filter((e) => leerIndice(e.ticker));
if (!hay.length) { console.log('Primero: node scripts/trimestres.mjs construir'); process.exit(2); }

console.log('\n1) Todo trimestre guardado compila (los flujos cuadran, la cascada suma) — todas las empresas, todos los trimestres');
let n = 0, malos = [];
for (const e of hay) {
  const idx = leerIndice(e.ticker);
  for (const t of idx.trimestres) {
    for (const uso of ['sankey', 'puente']) {
      if (uso === 'sankey' && !t.archivo) continue;
      const it = itemTrimestre(e.ticker, t.fin, uso), r = compilar({version: 1, datos: {d: {archivo: it.ruta, tipo: it.tabla, uso: uso === 'puente' ? 'cascada' : undefined, fuente: it.fuente, divisor: it.divisor, prefijo: it.prefijo, sufijo: it.sufijo, decimales: it.decimales}}, capas: []});
      n++; if (r.informe.errores.length) malos.push(`${e.ticker} ${t.etiqueta} ${uso}: ${r.informe.errores[0]}`);
    }
  }
}
ok(malos.length === 0, `${n} diagramas compilan sin errores${malos.length ? ' · ' + malos.slice(0, 3).join(' | ') : ''}`);

console.log('\n2) Piezas completas (sankey y cascada) sin textos que se pisen — último trimestre de cada empresa y uno viejo');
async function pieza(nombre, ticker, fin, uso, formato = 'horizontal') {
  const it = itemTrimestre(ticker, fin, uso), r = generar({plantilla: uso === 'sankey' ? 'resultados' : 'puente', series: [it], formato});
  const bien = r.informe.ok && r.informe.errores.length === 0;
  const aud = bien ? await auditarColisiones(compilar(r.spec).spec, {paso: 0.6}) : {ok: false, problemas: [{a: r.informe.errores[0]}]};
  ok(bien && aud.ok, `${nombre}${aud.ok ? '' : ' · ' + JSON.stringify(aud.problemas[0])}`);
}
for (const e of hay.slice(0, 16)) {
  const idx = leerIndice(e.ticker), ult = idx.trimestres.find((t) => t.archivo), viejo = [...idx.trimestres].reverse().find((t) => t.archivo);
  if (ult) await pieza(`${e.ticker} ${ult.etiqueta} · sankey`, e.ticker, ult.fin, 'sankey');
  if (viejo && viejo !== ult && e.ticker !== 'WMT') await pieza(`${e.ticker} ${viejo.etiqueta} · sankey`, e.ticker, viejo.fin, 'sankey');
}
const t0 = leerIndice('AMZN').trimestres[0];
await pieza('AMZN último · cascada', 'AMZN', t0.fin, 'puente');
await pieza('AMZN último · sankey vertical', 'AMZN', t0.fin, 'sankey', 'vertical');
const perd = hay.map((e) => ({e, t: leerIndice(e.ticker).trimestres.find((t) => !t.archivo)})).find((x) => x.t);
if (perd) await pieza(`${perd.e.ticker} ${perd.t.etiqueta} (con pérdida) · cascada`, perd.e.ticker, perd.t.fin, 'puente');

console.log('\n3) Cifras que se pueden contrastar con el reporte oficial');
const a = leerIndice('AMZN').trimestres.find((t) => t.fin === '2026-09-30');
if (a) {
  const csv = fs.readFileSync(path.join(RAIZ, a.archivo), 'utf8');
  ok(a.ingresos === 201944000000 && /Utilidad operativa,Utilidad neta,20685000000/.test(csv), 'Amazon Q3 FY2026: ingresos US$ 201.944 M y utilidad neta US$ 20.685 M (coinciden con el 10-Q)');
}
console.log(fallos ? `\n✗ ${fallos} prueba(s) fallaron` : '\n✓ biblioteca de trimestres OK');
process.exit(fallos ? 1 : 0);
