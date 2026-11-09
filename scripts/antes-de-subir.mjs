// `npm run antes-de-subir`: guardia manual (NO es un hook de git: nunca bloquea a nadie) que se corre antes de `git push`.
// Hace lo barato (< 2 min): suites rápidas + salud sin navegador + instrucciones sincronizadas + espacios sobrantes en lo preparado.
// Sale con 1 si algo falla; lo que imprime dice qué corregir. Para la batería completa: npm run check.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pasos = [
  ['instrucciones sincronizadas', ['scripts/sincronizar-instrucciones.mjs', '--verificar']],
  ['suites rápidas', ['scripts/check.mjs', '--rapido', '--jobs=3']],
];
let mal = 0;
for (const [nombre, a] of pasos) {
  const r = spawnSync(process.execPath, a, {cwd: RAIZ, stdio: 'inherit'});
  console.log(r.status === 0 ? `✓ ${nombre}\n` : `✗ ${nombre}\n`); if (r.status !== 0) mal++;
}
const g = spawnSync('git', ['diff', '--cached', '--check'], {cwd: RAIZ, encoding: 'utf8'});
if (g.status !== 0) { console.log(`✗ espacios sobrantes o marcas de conflicto en lo preparado:\n${g.stdout}`); mal++; } else console.log('✓ nada raro en lo preparado (git diff --cached --check)');
console.log(mal ? `\n✗ ${mal} comprobación(es) fallan: corrige antes de subir.` : '\n✓ listo para git push');
process.exit(mal ? 1 : 0);
