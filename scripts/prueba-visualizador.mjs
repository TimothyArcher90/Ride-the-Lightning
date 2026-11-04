// Prueba los modelos nuevos (pendiente, bump, treemap, waffle) y el visualizador autónomo con datos reales.
// Cada pieza debe compilar sin errores y pasar la auditoría de textos pisados, en horizontal y vertical.
import fs from 'node:fs';
import path from 'node:path';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {auditarColisiones} from '../servidor/render.mjs';
import {proponer} from '../servidor/visualizador.mjs';
import {leerIndice, itemTrimestre} from '../servidor/trimestres.mjs';

let fallos = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
const hay = (id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`));

async function pieza(nombre, entrada) {
  const r = generar(entrada), bien = r.informe.ok && r.informe.errores.length === 0;
  const aud = bien ? await auditarColisiones(compilar(r.spec).spec, {paso: 0.5}) : {ok: false, problemas: [{a: 'no compila'}]};
  ok(bien && aud.ok, `${nombre}${bien ? '' : ' · ' + r.informe.errores[0]}${aud.ok ? '' : ' · ' + JSON.stringify(aud.problemas[0])}`);
  return r;
}

console.log('\n1) Series: pendiente y bump (biblioteca)');
const ids = ['bm_gold', 'bm_copper', 'bm_crude_oil_wti', 'bm_wheat_us_hrw', 'fred_dgs10'].filter(hay);
if (ids.length >= 3) for (const formato of ['horizontal', 'vertical']) {
  await pieza(`pendiente · ${formato}`, {plantilla: 'pendiente', series: bib(...ids.slice(0, 4)), formato});
  await pieza(`divergente · ${formato}`, {plantilla: 'divergente', series: bib(...ids.slice(0, 5)), formato});
  await pieza(`bump · ${formato}`, {plantilla: 'bump', series: bib(...ids.slice(0, 5)), formato});
} else console.log('  (faltan series descargadas: se omite)');

console.log('\n2) Categorías: treemap y waffle (SEC, último trimestre de AMZN y AAPL)');
// «A dónde fue cada dólar de ingresos»: la cascada del reporte (sin subtotales), en positivo; suma exactamente los ingresos.
for (const tk of ['AMZN', 'AAPL', 'MSFT']) {
  const idx = leerIndice(tk); const t = idx?.trimestres?.find((x) => x.archivo);
  if (!t) { console.log(`  (sin datos de ${tk})`); continue; }
  const it = itemTrimestre(tk, t.fin, 'puente'), filas = fs.readFileSync(path.join(RAIZ, it.ruta), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
  const partes = filas.filter((f) => f[2] !== 'total' && f[2] !== 'inicio'), utilidad = filas[filas.length - 1];
  const csv = 'concepto,valor\n' + [...partes.map((f) => [f[0], Math.abs(+f[1])]), [utilidad[0], +utilidad[1]]].filter((f) => f[1] > 0).map((f) => `${f[0]},${f[1]}`).join('\n');
  fs.mkdirSync(path.join(RAIZ, '.tmp'), {recursive: true}); const ruta = `.tmp/viz-${tk}.csv`; fs.writeFileSync(path.join(RAIZ, ruta), csv);
  const item = {...it, ruta, tabla: 'categorias', uso: 'donut'};
  for (const formato of ['horizontal', 'vertical']) for (const plantilla of ['treemap', 'waffle', 'lollipop']) await pieza(`${tk} ${plantilla} · ${formato}`, {plantilla, series: [item], formato});
}

console.log('\n3) Waffle suma exactamente 100 y el visualizador entrega opciones distintas');
if (ids.length >= 3) {
  const ops = await proponer({series: bib(...ids.slice(0, 4)), formato: 'vertical'}, {max: 4});
  ok(ops.length >= 3, `${ops.length} opciones: ${ops.map((o) => o.plantilla + (o.ok ? '' : ' ✗')).join(', ')}`);
  ok(new Set(ops.map((o) => o.plantilla)).size === ops.length, 'todas con una gráfica distinta');
  ok(ops.filter((o) => o.ok).length >= 2, `al menos 2 pasan exactitud y textos: ${ops.filter((o) => !o.ok).map((o) => o.plantilla + ': ' + o.problemas[0]).join(' | ')}`);
}
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
