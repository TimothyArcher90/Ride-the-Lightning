// Prueba del suavizador LOESS (motor/loess.js): recupera una recta exacta, es determinista y respeta huecos; sobre datos reales mide cuánto recorta los extremos.
import fs from 'node:fs';
import path from 'node:path';
import {loess} from '../motor/loess.js';
import {RAIZ} from '../servidor/compilar.mjs';
let fallos = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; };
const x = Array.from({length: 200}, (_, i) => i), recta = x.map((v) => 3 + 0.5 * v);
const s = loess(x, recta, 0.2); ok(s.every((v, i) => Math.abs(v - recta[i]) < 1e-6), 'recupera una recta exacta (error < 1e-6)');
ok(JSON.stringify(loess(x, recta, 0.3)) === JSON.stringify(loess(x, recta, 0.3)), 'determinista');
const hueco = recta.map((v, i) => (i % 50 === 7 ? null : v)); ok(loess(x, hueco, 0.2).every((v, i) => (hueco[i] == null ? v == null : v != null)), 'respeta los huecos (null sigue null)');
const f = path.join(RAIZ, 'datos', 'biblioteca', 'fred_dcoilwtico.csv');
if (fs.existsSync(f)) {
  const filas = fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')).filter((r) => r[1] !== '' && Number.isFinite(+r[1])), xs = filas.map((r) => Date.parse(r[0])), ys = filas.map((r) => +r[1]);
  const t0 = Date.now(), sm = loess(xs, ys, 0.05), ms = Date.now() - t0;
  ok(sm.every((v) => v != null && Number.isFinite(v)), `WTI diario (${ys.length} filas): todo finito`);
  ok(Math.max(...sm) <= Math.max(...ys) && Math.min(...sm) >= Math.min(...ys) - 1, 'nunca inventa un máximo ni un mínimo mayor que los reales');
  console.log(`      máximo real ${Math.max(...ys)} · máximo suavizado ${Math.max(...sm).toFixed(1)} · ${ms} ms`);
}
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo bien'); process.exit(fallos ? 1 : 0);
