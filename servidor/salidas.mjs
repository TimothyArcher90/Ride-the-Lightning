// Dónde se guardan los outputs. David (2026-11-09): NADA de outputs en el disco C. Destino configurable en marca/salidas.json
// ({"destino": "E:\CARPETA OUTPUTS IA 2026\Ride the Lightning", "exigir": true}); RTL_SALIDAS lo sobrescribe (las pruebas lo usan para no tocar el disco de salidas).
// Sin configuración (instalación de otra persona) las salidas van a <proyecto>/salidas. Con `exigir`, si el disco no está conectado se DETIENE (nunca cae a C: en silencio).
import fs from 'node:fs';
import path from 'node:path';
import {RAIZ} from './compilar.mjs';
import {t as tx, registrar} from '../motor/idioma.js';

registrar('salidas', {
  sin_disco: {es: 'El disco de salidas no está conectado ({d}). Conéctalo y repite: los outputs no se guardan en el disco C.', en: 'The outputs disk is not connected ({d}). Connect it and try again: outputs are not saved on the C drive.'},
});

export function configSalidas() { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'marca', 'salidas.json'), 'utf8')); } catch { return null; } }

/** Carpeta base de outputs (se crea si falta). */
export function salidaBase() {
  if (process.env.RTL_SALIDAS) { fs.mkdirSync(process.env.RTL_SALIDAS, {recursive: true}); return process.env.RTL_SALIDAS; }
  const cfg = configSalidas();
  if (!cfg?.destino) return path.join(RAIZ, 'salidas');
  const raiz = path.parse(cfg.destino).root;
  if (!fs.existsSync(raiz)) { if (cfg.exigir !== false) throw new Error(tx('salidas.sin_disco', {d: cfg.destino})); return path.join(RAIZ, 'salidas'); }
  fs.mkdirSync(cfg.destino, {recursive: true});
  return cfg.destino;
}

/** Documenta cada output: una fila en <base>/INDICE.md (fecha, pieza, versión, formato, duración, cierre, archivos). */
export function indexar(base, {pieza, version, formato, duracion, cierre, archivos}) {
  const f = path.join(base, 'INDICE.md');
  if (!fs.existsSync(f)) fs.writeFileSync(f, '# Outputs de Ride the Lightning\n\nUna fila por render (la más reciente abajo). Generado por servidor/salidas.mjs.\n\n| Fecha | Pieza | Versión | Formato | Duración (s) | Logo MacroWise | Archivos |\n|---|---|---|---|---|---|---|\n');
  const rel = (a) => path.relative(base, a).split(path.sep).join('/');
  fs.appendFileSync(f, `| ${new Date().toISOString().slice(0, 16).replace('T', ' ')} | ${pieza} | v${version} | ${formato} | ${Math.round(duracion)} | ${cierre ? 'sí' : 'no'} | ${archivos.filter(Boolean).map(rel).join(' · ')} |\n`);
}
