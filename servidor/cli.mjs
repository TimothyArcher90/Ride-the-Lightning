// CLI: compilar | vista | render | buscar | bajar | inspeccionar
import fs from 'node:fs';
import path from 'node:path';
import {compilar, RAIZ} from './compilar.mjs';
import {vistaPrevia, renderizar, auditarColisiones} from './render.mjs';
import {buscar, descargar, leerCatalogo} from './catalogo.mjs';
import {inspeccionar} from './datos.mjs';
import {ciclo, iniciarVivo, eventos} from './vivo.mjs';
import {tr} from '../web/i18n.js';

const [, , cmd, ...args] = process.argv;
const flags = new Set(args.filter((a) => a.startsWith('--')));
// Output language: --lang=es|en, or RTL_LANG, or the system language (Spanish if the machine is Spanish, English otherwise).
const LS = [...flags].map((f) => /^--lang=(es|en)$/.exec(f)?.[1]).find(Boolean) ?? (['es', 'en'].includes(process.env.RTL_LANG) ? process.env.RTL_LANG : /^es/i.test(Intl.DateTimeFormat().resolvedOptions().locale) ? 'es' : 'en');
const T = (k, v) => tr(k, v, LS);
const pos = args.filter((a) => !a.startsWith('--'));
const leerSpec = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
const mostrar = (inf) => {
  for (const e of inf.errores) console.log(T('srv_cli_error'), e);
  for (const a of inf.avisos) console.log(T('srv_cli_aviso'), a);
  for (const d of inf.datos) console.log(T('srv_cli_dato', {id: d.id, filas: d.filas, inicio: d.inicio, fin: d.fin, fuente: d.fuente.nombre, sha: d.sha256.slice(0, 12)}));
  for (const c of inf.cifras.filter((x) => x.mostrado)) console.log(T('srv_cli_cifra', {m: c.mostrado, s: c.serie, f: c.fecha, r: c.fila}));
  console.log(inf.ok ? T('srv_cli_compila') : T('srv_cli_no_compila'));
};

try {
  if (cmd === 'compilar') { const {informe} = compilar(leerSpec(pos[0])); mostrar(informe); process.exit(informe.ok ? 0 : 1); }
  else if (cmd === 'vista') {
    const {spec, informe} = compilar(leerSpec(pos[0])); mostrar(informe); if (!informe.ok) process.exit(1);
    const t = (pos[1] ?? '1,4,8').split(',').map(Number);
    const out = await vistaPrevia(spec, t, {dir: path.join(RAIZ, '.tmp', 'vistas'), nombre: path.basename(pos[0], '.json'), escala: flags.has('--completa') ? 1 : 0.5, informe});
    console.log(out.join('\n'));
  } else if (cmd === 'auditar') {
    const {spec, informe} = compilar(leerSpec(pos[0])); mostrar(informe); if (!informe.ok) process.exit(1);
    const a = await auditarColisiones(spec);
    a.problemas.forEach((p) => console.log(T('srv_cli_problema', {t: p.tipo, ab: p.a + (p.b ? ' × ' + p.b : ''), d: p.desde, h: p.hasta})));
    console.log(a.ok ? T('srv_cli_nada_pisa', {n: a.instantes}) : T('srv_cli_n_problemas', {n: a.problemas.length})); process.exit(a.ok ? 0 : 1);
  } else if (cmd === 'render') {
    const spec0 = leerSpec(pos[0]); if (flags.has('--cierre')) spec0.cierre = true;   // --cierre: video individual de MacroWise (hold 5 s + cierre con logo)
    const {spec, informe} = compilar(spec0); mostrar(informe); if (!informe.ok) process.exit(1);
    let ult = 0;
    const r = await renderizar(spec, informe, {nombre: path.basename(pos[0], '.json'), calidad: flags.has('--borrador') ? 'borrador' : 'final', alfa: !flags.has('--sin-alfa'),
      onProgreso: (p) => { if (Date.now() - ult > 4000 || p.cuadro === p.total) { ult = Date.now(); process.stdout.write(`\r${p.tipo} ${p.cuadro}/${p.total}   `); } }});
    console.log('\n' + JSON.stringify(r, null, 2));
  } else if (cmd === 'buscar') console.table(buscar(pos.join(' ')));
  else if (cmd === 'bajar') {
    const cat = leerCatalogo(), ids = pos[0] === 'todo' ? cat.map((e) => e.id) : pos;
    for (const id of ids) {
      const e = cat.find((x) => x.id === id); if (!e) { console.log(T('srv_cli_no_catalogo'), id); continue; }
      try { const m = await descargar(e); console.log(T('srv_cli_bajado', {id, filas: m.filas, inicio: m.inicio, fin: m.fin})); } catch (err) { console.log(`✗ ${id}: ${err.message}`); }
    }
  } else if (cmd === 'inspeccionar') console.log(JSON.stringify(inspeccionar(path.resolve(pos[0]), {hoja: pos[1]}), null, 2));
  else if (cmd === 'actualizar') { const r = await ciclo({forzar: pos[0] === 'todo' || flags.has('--todo'), ids: pos[0] && pos[0] !== 'todo' ? pos : null}); console.log(JSON.stringify(r, null, 2)); }
  else if (cmd === 'vivo') { for (const t of ['serie', 'derivado', 'render-inicio', 'render', 'error', 'inicio']) eventos.on(t, (e) => console.log(JSON.stringify(e))); iniciarVivo(); console.log(T('srv_cli_vivo')); await new Promise(() => {}); }
  else console.log(T('srv_cli_uso'));
} catch (e) { console.error('✗', e.message); process.exit(1); }
