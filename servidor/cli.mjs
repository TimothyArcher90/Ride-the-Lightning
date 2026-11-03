// CLI: compilar | vista | render | buscar | bajar | inspeccionar
import fs from 'node:fs';
import path from 'node:path';
import {compilar, RAIZ} from './compilar.mjs';
import {vistaPrevia, renderizar, auditarColisiones} from './render.mjs';
import {buscar, descargar, leerCatalogo} from './catalogo.mjs';
import {inspeccionar} from './datos.mjs';
import {ciclo, iniciarVivo, eventos} from './vivo.mjs';

const [, , cmd, ...args] = process.argv;
const flags = new Set(args.filter((a) => a.startsWith('--')));
const pos = args.filter((a) => !a.startsWith('--'));
const leerSpec = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
const mostrar = (inf) => {
  for (const e of inf.errores) console.log('✗ ERROR  ', e);
  for (const a of inf.avisos) console.log('! aviso  ', a);
  for (const d of inf.datos) console.log(`• ${d.id}: ${d.filas} filas · ${d.inicio} → ${d.fin} · ${d.fuente.nombre} · sha256 ${d.sha256.slice(0, 12)}…`);
  for (const c of inf.cifras.filter((x) => x.mostrado)) console.log(`  cifra «${c.mostrado}» ← ${c.serie} @ ${c.fecha} (fila ${c.fila})`);
  console.log(inf.ok ? '✓ compila sin errores' : '✗ NO compila');
};

try {
  if (cmd === 'compilar') { const {informe} = compilar(leerSpec(pos[0])); mostrar(informe); process.exit(informe.ok ? 0 : 1); }
  else if (cmd === 'vista') {
    const {spec, informe} = compilar(leerSpec(pos[0])); mostrar(informe); if (!informe.ok) process.exit(1);
    const t = (pos[1] ?? '1,4,8').split(',').map(Number);
    const out = await vistaPrevia(spec, t, {dir: path.join(RAIZ, '.tmp', 'vistas'), nombre: path.basename(pos[0], '.json'), escala: flags.has('--completa') ? 1 : 0.5});
    console.log(out.join('\n'));
  } else if (cmd === 'auditar') {
    const {spec, informe} = compilar(leerSpec(pos[0])); mostrar(informe); if (!informe.ok) process.exit(1);
    const a = await auditarColisiones(spec);
    a.problemas.forEach((p) => console.log(`✗ ${p.tipo}: ${p.a}${p.b ? ' × ' + p.b : ''} entre ${p.desde} y ${p.hasta} s`));
    console.log(a.ok ? `✓ ningún texto se pisa (${a.instantes} instantes revisados)` : `✗ ${a.problemas.length} problema(s)`); process.exit(a.ok ? 0 : 1);
  } else if (cmd === 'render') {
    const {spec, informe} = compilar(leerSpec(pos[0])); mostrar(informe); if (!informe.ok) process.exit(1);
    let ult = 0;
    const r = await renderizar(spec, informe, {nombre: path.basename(pos[0], '.json'), calidad: flags.has('--borrador') ? 'borrador' : 'final', alfa: !flags.has('--sin-alfa'),
      onProgreso: (p) => { if (Date.now() - ult > 4000 || p.cuadro === p.total) { ult = Date.now(); process.stdout.write(`\r${p.tipo} ${p.cuadro}/${p.total}   `); } }});
    console.log('\n' + JSON.stringify(r, null, 2));
  } else if (cmd === 'buscar') console.table(buscar(pos.join(' ')));
  else if (cmd === 'bajar') {
    const cat = leerCatalogo(), ids = pos[0] === 'todo' ? cat.map((e) => e.id) : pos;
    for (const id of ids) {
      const e = cat.find((x) => x.id === id); if (!e) { console.log('✗ no está en el catálogo:', id); continue; }
      try { const m = await descargar(e); console.log(`✓ ${id}: ${m.filas} filas · ${m.inicio} → ${m.fin}`); } catch (err) { console.log(`✗ ${id}: ${err.message}`); }
    }
  } else if (cmd === 'inspeccionar') console.log(JSON.stringify(inspeccionar(path.resolve(pos[0]), {hoja: pos[1]}), null, 2));
  else if (cmd === 'actualizar') { const r = await ciclo({forzar: pos[0] === 'todo' || flags.has('--todo'), ids: pos[0] && pos[0] !== 'todo' ? pos : null}); console.log(JSON.stringify(r, null, 2)); }
  else if (cmd === 'vivo') { for (const t of ['serie', 'derivado', 'render-inicio', 'render', 'error', 'inicio']) eventos.on(t, (e) => console.log(JSON.stringify(e))); iniciarVivo(); console.log('Actualizador vivo en marcha (Ctrl+C para salir)…'); await new Promise(() => {}); }
  else console.log('Uso: cli.mjs compilar|vista|auditar|render <spec.json> [tiempos] [--borrador] [--sin-alfa] | buscar <texto> | bajar <id…|todo> | actualizar [ids|todo] | vivo | inspeccionar <archivo> [hoja]');
} catch (e) { console.error('✗', e.message); process.exit(1); }
