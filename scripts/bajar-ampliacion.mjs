// Descarga (historia completa, con procedencia) todas las series añadidas por la ampliación y resume fallos. Uso: node scripts/bajar-ampliacion.mjs [--solo=prefijo] [--paralelo=4]
// Es la prueba de humo de «cada serie nueva baja de la fuente real»: un fallo aquí es un id que hay que corregir o retirar del catálogo.
import {leerCatalogo, descargar} from '../servidor/catalogo.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const solo = arg('solo', ''), par = +arg('paralelo', 4);
const lista = leerCatalogo().filter((e) => e.ampliacion && e.id.startsWith(solo));
const fallos = [], ok = [];
let i = 0;
await Promise.all(Array.from({length: par}, async () => {
  while (i < lista.length) {
    const e = lista[i++];
    try { const m = await descargar(e); ok.push({id: e.id, filas: m.filas, inicio: m.inicio, fin: m.fin}); }
    catch (x) { fallos.push({id: e.id, error: String(x.message).slice(0, 200)}); }
  }
}));
console.log(`descargadas ${ok.length} de ${lista.length}`);
for (const f of fallos) console.log('FALLO', f.id, '→', f.error);
process.exit(fallos.length ? 1 : 0);
