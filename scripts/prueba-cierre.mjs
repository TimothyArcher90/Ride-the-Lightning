// El cierre de marca es DETERMINISTA: toda pieza compilada queda `hold` s quieta y termina en la tarjeta con el logo. Esta prueba lo exige (con el cierre ACTIVO).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
delete process.env.RTL_SIN_CIERRE;
const {compilar, RAIZ} = await import('../servidor/compilar.mjs');
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, 'marca', 'cierre.json'), 'utf8'));
const dir = path.join(RAIZ, '.tmp', 'prueba-cierre'); fs.mkdirSync(dir, {recursive: true});
fs.writeFileSync(path.join(dir, 's.csv'), ['fecha,v', '2020-01-01,1', '2020-02-01,2', '2020-03-01,3', '2020-04-01,2', ''].join('\n'));
const base = (extra = {}) => ({version: 1, titulo: 'Prueba', formato: 'horizontal', fps: 30, duracion: 10, ...extra, datos: {d: {archivo: '.tmp/prueba-cierre/s.csv', x: 'fecha', tipoX: 'fecha', columnas: [{col: 'v', nombre: 'Serie', color: 'oro', unidad: 'puntos'}], fuente: {nombre: 'Prueba', corto: 'Prueba', obtenido: '2026-11-09', licencia: 'Dominio público'}}},
  capas: [{tipo: 'titulo', texto: 'Prueba', t: [0.2, 9.5]}, {tipo: 'linea', id: 'g', datos: 'd', t: [0.5, 6]}]});
console.log('Cierre de marca determinista');
ok(cfg.activo === true && cfg.hold >= 5, 'marca/cierre.json activo y con hold ≥ 5 s');
ok(fs.existsSync(path.join(RAIZ, cfg.archivo)), 'el logo existe: ' + cfg.archivo);
const a = compilar(base()), cap = a.spec.capas.find((k) => k.tipo === 'cierre');
ok(a.informe.ok, 'una pieza cualquiera compila con el cierre');
ok(!!cap && cap.archivo === cfg.archivo && !cap.sub, 'lleva la capa de cierre, SOLO con el logo (sin texto)');
ok(a.spec.duracion === +(10 + cfg.hold + cfg.tarjeta).toFixed(2), 'la duración crece hold + tarjeta (' + a.spec.duracion + ' s)');
ok(cap && cap.t[0] === 10 + cfg.hold, 'la tarjeta entra después de ' + cfg.hold + ' s de gráfica final quieta');
const ti = a.spec.capas.find((k) => k.tipo === 'titulo');
ok(ti.t[1] >= 10 + cfg.hold, 'las capas que duraban hasta el final se prolongan (la imagen final no se apaga)');
ok(!compilar(base({cierre: false})).spec.capas.some((k) => k.tipo === 'cierre'), 'cierre:false lo desactiva');
const b = compilar(a.spec);
ok(b.spec.capas.filter((k) => k.tipo === 'cierre').length === 1 && b.spec.duracion === a.spec.duracion, 'idempotente: recompilar no lo duplica ni alarga');
fs.rmSync(dir, {recursive: true, force: true});
console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodas las pruebas del cierre pasan');
process.exit(fallos ? 1 : 0);
