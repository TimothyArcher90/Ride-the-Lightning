// Pone Ride the Lightning al día antes de arrancar (igual que Electric Eye): baja los cambios del repositorio y, si cambiaron
// las dependencias, las instala. Si no hay git, no hay conexión o hay cambios locales sin guardar, sigue con la versión que hay.
// Nunca borra ni pisa cambios locales: con el árbol sucio no actualiza.
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENT = {...process.env, GIT_TERMINAL_PROMPT: '0', GIT_HTTP_LOW_SPEED_LIMIT: '1000', GIT_HTTP_LOW_SPEED_TIME: '30', GIT_OPTIONAL_LOCKS: '0'};
const git = (args, timeout = 40000) => {
  const r = spawnSync('git', ['-c', `safe.directory=${RAIZ.replace(/\\/g, '/')}`, ...args], {cwd: RAIZ, env: ENT, timeout, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  return {ok: r.status === 0 && !r.error, salida: `${r.stdout ?? ''}`.trim(), error: `${r.stderr ?? ''}`.trim()};
};

console.log('\n  Comprobando actualizaciones de Ride the Lightning...');
if (!existsSync(join(RAIZ, '.git'))) { console.log('  (carpeta sin git: se usa esta versión)'); process.exit(0); }
if (!git(['ls-remote', '--heads', 'origin', 'main'], 15000).ok) { console.log('  Sin conexión con GitHub: se usa la versión instalada.'); process.exit(0); }
if (git(['status', '--porcelain', '--untracked-files=no']).salida) { console.log('  Hay cambios locales sin guardar: no se actualiza (no se pisa nada).'); process.exit(0); }
const antes = git(['rev-parse', 'HEAD']).salida, lockAntes = existsSync(join(RAIZ, 'package-lock.json')) ? readFileSync(join(RAIZ, 'package-lock.json'), 'utf8') : '';
const f = git(['pull', '--ff-only', 'origin', 'main'], 90000);
if (!f.ok) { console.log(`  No pude actualizar (${f.error.split('\n')[0] || 'sin detalle'}); se usa la versión instalada.`); process.exit(0); }
const despues = git(['rev-parse', 'HEAD']).salida;
if (antes === despues) console.log('  Ya estaba al día.');
else {
  console.log(`  Actualizado (${antes.slice(0, 7)} → ${despues.slice(0, 7)}).`);
  const lockDespues = readFileSync(join(RAIZ, 'package-lock.json'), 'utf8');
  if (lockDespues !== lockAntes || !existsSync(join(RAIZ, 'node_modules'))) {
    console.log('  Instalando dependencias nuevas...');
    spawnSync('npm', ['install', '--no-audit', '--no-fund'], {cwd: RAIZ, stdio: 'inherit', shell: true});
  }
}
