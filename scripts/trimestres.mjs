// Biblioteca de trimestres (SEC EDGAR). Uso:
//   node scripts/trimestres.mjs construir [TICKER…]   baja y escribe todos los trimestres (por defecto, todas las empresas de catalogo/empresas.json)
//   node scripts/trimestres.mjs vigilar               pregunta a la SEC si hay reportes nuevos (lo mismo que hace el actualizador 24/7)
//   node scripts/trimestres.mjs indice                escribe datos/trimestres/INDICE.md con lo que hay
import fs from 'node:fs';
import path from 'node:path';
import {actualizarEmpresa, vigilar, leerIndice, empresas, DIR} from '../servidor/trimestres.mjs';

const [cmd = 'construir', ...resto] = process.argv.slice(2);
if (cmd === 'construir') {
  for (const t of resto.length ? resto : empresas().filter((e) => e.destacada).map((e) => e.ticker)) {
    try { const r = await actualizarEmpresa(t, {forzar: true}); console.log(t.padEnd(6), `${r.trimestres} trimestres (${r.omitidos} sin datos básicos) · último ${r.ultimo}`); } catch (e) { console.log(t, 'ERROR', e.message); }
  }
}
if (cmd === 'vigilar') { const r = await vigilar(); console.log(JSON.stringify(r, null, 2)); }
if (cmd === 'construir' || cmd === 'indice') {
  const L = ['# Biblioteca de trimestres', '', `Generado: ${new Date().toISOString().slice(0, 10)} · Fuente: SEC EDGAR (XBRL «company facts», dominio público). Cómo funciona: docs/TRIMESTRES.md`, '', '| Empresa | Trimestres | Desde | Último | Sankey | Solo cascada (pérdida) |', '|---|---|---|---|---|---|'];
  for (const e of empresas()) { const i = leerIndice(e.ticker); if (!i) continue; const t = i.trimestres; L.push(`| ${e.nombre} (${e.ticker}) | ${t.length} | ${t.at(-1)?.etiqueta ?? ''} | ${t[0]?.etiqueta ?? ''} | ${t.filter((x) => x.archivo).length} | ${t.filter((x) => !x.archivo).length} |`); }
  fs.mkdirSync(DIR, {recursive: true}); fs.writeFileSync(path.join(DIR, 'INDICE.md'), L.join('\n') + '\n'); console.log('INDICE.md escrito');
}
if (cmd === 'universo') {   // node scripts/trimestres.mjs universo [cuántas] [minutos]
  const {construirUniverso} = await import('../servidor/trimestres.mjs');
  const r = await construirUniverso({limite: Number(resto[0]) || Infinity, minutos: Number(resto[1]) || 120, alAvanzar: (p) => console.log(`  … ${p.hechas} hechas · ${p.fallidas} sin datos · última ${p.ticker}`)});
  console.log(JSON.stringify(r));
}
