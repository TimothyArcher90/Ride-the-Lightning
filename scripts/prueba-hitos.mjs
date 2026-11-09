// Prueba de la fuente obligatoria de los hitos (paso «hitos» del estudio): node scripts/prueba-hitos.mjs
// El estudio manda estricto:true; ahí una fecha sin fuente NO se dibuja. La CLI/MCP (sin estricto) compila pero avisa «sin verificar».
import {generar} from '../servidor/plantillas.mjs';

let fallos = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗'} ${m}`); if (!c) fallos++; };
const serie = [{origen: 'biblioteca', id: 'fred_dtwexbgs'}];
const H = (f1, f2) => [{fecha: '2008-09-15', nombre: 'Quiebra de Lehman', ...(f1 ? {fuente: f1} : {})}, {fecha: '2020-03-11', nombre: 'Pandemia declarada', ...(f2 ? {fuente: f2} : {})}];
const lanza = (ent) => { try { generar({plantilla: 'dos_hitos', series: serie, formato: 'horizontal', ...ent}); return ''; } catch (e) { return e.message; } };

console.log('Hitos con fuente obligatoria');
ok(/FUENTE|SOURCE/.test(lanza({hitos: H('', ''), estricto: true})), 'estricto: sin fuente en ningún hito no se dibuja');
ok(/FUENTE|SOURCE/.test(lanza({hitos: H('https://www.federalreserve.gov/', ''), estricto: true})), 'estricto: basta que UN hito no tenga fuente para rechazar');
ok(/FUENTE|SOURCE/.test(lanza({hitos: H('corta', 'x'), estricto: true})), 'estricto: una fuente de menos de 8 caracteres no cuenta');
ok(/FUENTE|SOURCE/.test(lanza({hitos: [{fecha: '15/09/2008', nombre: 'a', fuente: 'https://example.org/a'}, {fecha: '2020-03-11', nombre: 'b', fuente: 'https://example.org/b'}], estricto: true})), 'estricto: la fecha debe ser AAAA-MM-DD');
ok(/FUENTE|SOURCE/.test(lanza({hitos: [{fecha: '2008-09-15', nombre: '  ', fuente: 'https://example.org/a'}, {fecha: '2020-03-11', nombre: 'b', fuente: 'https://example.org/b'}], estricto: true})), 'estricto: el nombre no puede estar vacío');
const b = generar({plantilla: 'dos_hitos', series: serie, formato: 'horizontal', hitos: H('https://www.federalreserve.gov/releases/h10/', 'https://www.who.int/director-general/speeches'), estricto: true});
ok(b.informe.ok && !b.informe.avisos.some((a) => /sin verificar/.test(a)), 'con fuente en los dos: compila sin avisos de «sin verificar»');
ok(b.informe.cifras.filter((c) => c.tipo === 'hito').every((c) => c.fuente && c.fuente.length >= 8), 'la fuente de cada hito queda en el informe de cifras');
ok(b.spec.capas.find((c) => c.tipo === 'dos_hitos').hitos.every((h) => h.fuente), 'la spec guarda la fuente de cada hito');
const c = generar({plantilla: 'dos_hitos', series: serie, formato: 'horizontal', hitos: H('', '')});
ok(c.informe.ok && c.informe.avisos.filter((a) => /sin verificar/.test(a)).length === 2, 'sin estricto (CLI/MCP): compila pero avisa dos veces «sin verificar»');
const en = generar({plantilla: 'dos_hitos', series: serie, formato: 'horizontal', hitos: H('', ''), idioma: 'en'});
ok(en.informe.avisos.some((a) => /unverified claim/.test(a)), 'el aviso también sale en inglés');
console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ hitos: la fuente es obligatoria en el estudio');
process.exit(fallos ? 1 : 0);
