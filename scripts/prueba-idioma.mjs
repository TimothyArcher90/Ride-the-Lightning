// PRUEBA DE IDIOMA: renderiza los 28 modelos de gráfica en INGLÉS (spec.idioma = 'en') y FALLA si en el texto realmente dibujado
// aparece un diacrítico español (á é í ó ú ñ ¿ ¡ ü) o una palabra vacía española (de, del, la, el, los, por, para, fuente, otros…).
// Los textos se leen del lienzo real (se intercepta fillText en cada fotograma), así que se mide lo que verá el espectador.
//   16 modelos de scripts/modelos-16.mjs  +  12 del visualizador universal (radar, apilada, velas, histograma, dumbbell, calendario,
//   agrupadas, bullet, bandas, pictograma, ranking, dos_hitos), en horizontal y en vertical.
// Además revisa las advertencias/métodos del compilador en inglés (fallo salvo con --sin-informe) y comprueba que 'es' sigue siendo el
// idioma por defecto (las mismas piezas sin idioma se dibujan sin claves ni marcadores sueltos).
// Uso: node scripts/prueba-idioma.mjs [modelo,modelo] [horizontal|vertical] [--sin-informe]
import {iniciarServidor} from '../servidor/web.mjs';
import {lanzarNavegador} from '../servidor/render.mjs';
import {compilar} from '../servidor/compilar.mjs';
import {construirModelos, construirExtras, MODELOS, MODELOS_EXTRA} from './modelos-16.mjs';

const args = process.argv.slice(2), INFORME = !args.includes('--sin-informe'), pos = args.filter((a) => !a.startsWith('--'));
const filtro = (pos[0] ?? '').split(',').filter(Boolean), soloFormato = pos[1];
const TODOS = [...MODELOS, ...MODELOS_EXTRA], ESCOGIDOS = filtro.length ? TODOS.filter((m) => filtro.includes(m)) : TODOS;
let fallos = 0;
const PALABRAS = new Set();   // todas las palabras dibujadas en inglés (con --palabras se listan para revisarlas a ojo)
const ok =(c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; return c; };

// ── detector de español ─────────────────────────────────────────────────────────────────────────────────────────────
const DIACRITICOS = /[áéíóúñ¿¡ÁÉÍÓÚÑüÜ]/;
// Palabras vacías y vocabulario de los rótulos que NO existen en inglés (se excluyen a propósito: a, no, me, en, se, y, con, ago, mar, sep, total, ranking).
const VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'por', 'para', 'una', 'que', 'desde', 'hasta', 'entre', 'sobre', 'hacia', 'hace', 'fuente', 'otros', 'otras', 'mes', 'meses', 'año', 'años', 'ano', 'anos',
  'día', 'dia', 'dias', 'días', 'ene', 'abr', 'dic', 'máximo', 'maximo', 'mínimo', 'minimo', 'mediana', 'mayor', 'menor', 'valor', 'datos', 'cada', 'quién', 'quien', 'primero', 'último', 'ultimo', 'cuadro', 'cuadros', 'vale', 'pero', 'según', 'serie',
  'mil', 'miles', 'millones', 'oro', 'cobre', 'petróleo', 'trigo', 'ingresos', 'utilidad', 'costo', 'gastos', 'impuestos', 'cifras', 'índice', 'indice', 'puesto', 'abajo', 'arriba', 'sube', 'baja', 'cierre', 'apertura', 'volumen', 'obtenido', 'anterior', 'ahora', 'antes', 'hoy', 'mostrando', 'fecha', 'trimestre', 'semana', 'barra', 'barras', 'escala', 'línea', 'linea', 'partes', 'parte', 'suma', 'todas', 'esta', 'este', 'sin', 'son', 'hay', 'más', 'mas']);
/** Claves de texto sin resolver («c.log_nota») o marcadores sin rellenar («{n}»): un texto que se dibujó sin traducir o sin sus variables. */
const clavesSueltas = (s) => (/(?:^|\s)(?:c|ce|pl|pe|m|analisis)\.[a-z_0-9]+(?:\s|$)/.test(s) || /\{[a-z0-9_]+\}/i.test(s) ? ['clave de texto o marcador sin resolver'] : []);
/** Devuelve los motivos por los que un texto dibujado parece español, o []. */
function espanol(s) {
  const out = clavesSueltas(s), d = s.match(DIACRITICOS);
  if (d) out.push(`diacrítico «${d[0]}»`);
  for (const w of s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)) if (VACIAS.has(w)) out.push(`palabra «${w}»`);
  return out;
}

// ── lo que corre dentro del navegador: dibuja varios instantes y devuelve todos los textos fillText ──────────────────
const EN_PAGINA = async ({spec, W, H, tiempos}) => {
  const {Escena} = await import('/motor/escena.js');
  const esc = new Escena(spec, {});
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', {willReadFrequently: true});
  let rec = [];
  const ft = ctx.fillText.bind(ctx), st = ctx.strokeText.bind(ctx);
  ctx.fillText = (s, x, y, mw) => { rec.push(String(s)); return ft(s, x, y, mw); };
  ctx.strokeText = (s, x, y, mw) => { rec.push(String(s)); return st(s, x, y, mw); };
  const out = new Set();
  for (const t of tiempos) { rec = []; esc.dibujar(ctx, W, H, t, {}); rec.forEach((s) => out.add(s)); }
  return [...out];
};

async function revisar(nav, srv, m, formato, soloClaves = false) {
  const W = m.spec.ancho, H = m.spec.alto, dur = m.spec.duracion, tiempos = [];
  for (let t = 0.4; t < dur; t += 0.5) tiempos.push(+t.toFixed(2));
  tiempos.push(+(dur - 0.1).toFixed(2));
  const pag = await nav.newPage({viewport: {width: 800, height: 600}});
  pag.on('pageerror', (er) => { throw er; });
  try {
    await pag.goto(`http://127.0.0.1:${srv.puerto}/render.html`); await pag.waitForFunction(() => window.RTL_LISTO === true);
    await pag.evaluate(([s, w, h]) => window.RTL.cargar(s, w, h), [m.spec, W, H]);
    const textos = await pag.evaluate(EN_PAGINA, {spec: m.spec, W, H, tiempos});
    const malos = []; for (const s of textos) { const r = soloClaves ? clavesSueltas(s) : espanol(s); if (r.length) malos.push(`«${s.slice(0, 70)}» → ${[...new Set(r)].join(', ')}`); }
    if (!soloClaves) for (const x of textos) for (const w of x.toLowerCase().split(/[^\p{L}]+/u).filter((q) => q.length > 2)) PALABRAS.add(w);
    return {malos, n: textos.length};
  } finally { await pag.close(); }
}

// ── 1) español por defecto: sin `idioma` la pieza no cambia ─────────────────────────────────────────────────────────
console.log('\n0) El español sigue siendo el idioma por defecto');
{
  const es = await construirModelos('horizontal', {idioma: 'es'}), en = await construirModelos('horizontal', {idioma: 'en'});
  const a = es.find((x) => x.id === 'barras'), b = en.find((x) => x.id === 'barras');
  ok(a.spec.idioma === undefined && b.spec.idioma === 'en', 'la spec en español no lleva «idioma»; la inglesa sí');
  const sello = (x) => x.spec.capas.find((c) => c.tipo === 'sello')?.texto ?? '';
  ok(/Banco Mundial/.test(sello(a)) && /World Bank/.test(sello(b)), 'el sello de fuente se traduce solo con idioma = en');
  const sub = (x) => x.spec.capas.find((c) => c.tipo === 'titulo')?.sub ?? '';
  ok(/Precio mensual/.test(sub(a)) && /Monthly price/.test(sub(b)), 'el subtítulo cambia solo con idioma = en');
  ok(compilar({version: 1, capas: [{tipo: 'titulo', texto: 'x', t: [0, 1]}]}).spec.idioma === undefined, 'compilar sin idioma deja el plano sin campo «idioma»');
}

// ── 2) los 28 modelos en inglés ─────────────────────────────────────────────────────────────────────────────────────
const srv = await iniciarServidor(0), nav = await lanzarNavegador();
const informes = [];
try {
  for (const formato of ['horizontal', 'vertical']) {
    if (soloFormato && soloFormato !== formato) continue;
    console.log(`\n${formato === 'vertical' ? '2' : '1'}) ${formato === 'vertical' ? 'Vertical 1080×1920' : 'Horizontal 1920×1080'} · inglés`);
    const base = (await construirModelos(formato, {idioma: 'en'})).filter((m) => ESCOGIDOS.includes(m.id));
    const ex = await construirExtras(formato, {idioma: 'en'});
    ex.omitidos.forEach((o) => console.log(`  (omitido: ${o})`));
    for (const m of [...base, ...ex.modelos.filter((x) => ESCOGIDOS.includes(x.id))]) {
      let r;
      try { r = m.informe.errores?.length ? {malos: ['no compila: ' + m.informe.errores[0]], n: 0} : await revisar(nav, srv, m, formato); } catch (er) { r = {malos: ['error al dibujar: ' + er.message.split('\n')[0]], n: 0}; }
      ok(r.malos.length === 0, `${m.id}${r.malos.length ? ` · ${r.malos.length} texto(s) en español` : ` · ${r.n} textos revisados`}`);
      r.malos.slice(0, 8).forEach((x) => console.log('       - ' + x)); if (r.malos.length > 8) console.log(`       … y ${r.malos.length - 8} más`);
      informes.push({id: `${m.id}/${formato}`, textos: [...(m.informe.avisos ?? []), ...(m.informe.metodos ?? []), ...(m.notas ?? [])]});
    }
  }
} finally { await nav.close(); await srv.cerrar(); }

// ── 2b) el español no se rompe: mismas piezas sin idioma, sin claves ni marcadores sueltos ─────────────────────────────
{
  console.log('\n2b) Español por defecto · ningún texto dibujado queda como clave o marcador sin rellenar');
  const srv2 = await iniciarServidor(0), nav2 = await lanzarNavegador();
  try {
    for (const formato of ['horizontal', 'vertical']) {
      if (soloFormato && soloFormato !== formato) continue;
      const base = (await construirModelos(formato, {idioma: 'es'})).filter((m) => ESCOGIDOS.includes(m.id)), ex = await construirExtras(formato, {idioma: 'es'});
      let n = 0, malos = [];
      for (const m of [...base, ...ex.modelos.filter((x) => ESCOGIDOS.includes(x.id))]) {
        if (m.informe.errores?.length) { malos.push(`${m.id}: no compila: ${m.informe.errores[0]}`); continue; }
        try { const r = await revisar(nav2, srv2, m, formato, true); n += r.n; r.malos.forEach((x) => malos.push(`${m.id}: ${x}`)); } catch (er) { malos.push(`${m.id}: ${er.message.split('\n')[0]}`); }
      }
      ok(malos.length === 0, `${formato}: ${base.length + ex.modelos.length} modelos en español, ${n} textos revisados`);
      malos.slice(0, 8).forEach((x) => console.log('       - ' + x));
    }
  } finally { await nav2.close(); await srv2.cerrar(); }
}

// ── 3) avisos, métodos y notas del compilador/plantillas en inglés ──────────────────────────────────────────────────
console.log('\n3) Avisos, métodos y notas (compilador y plantillas) en inglés');
{
  const malos = new Map();
  for (const i of informes) for (const s of i.textos) { const r = espanol(String(s).replace(/^(datos\.\S+|capas\[\d+\][^:]*:\S+): /, '').replace(/"[^"]*"/g, '""')); if (r.length) malos.set(String(s).slice(0, 110), i.id); }
  if (INFORME) ok(malos.size === 0, `${malos.size} mensaje(s) todavía en español`);
  else console.log(`  ${malos.size === 0 ? '✓' : '·'} ${malos.size} mensaje(s) del informe aún en español (con --sin-informe no cuentan como fallo)`);
  [...malos].slice(0, 12).forEach(([s, id]) => console.log(`       - [${id}] ${s}`));
}
if (args.includes('--palabras')) console.log('\nPalabras dibujadas en inglés:\n' + [...PALABRAS].sort().join(' '));
console.log(fallos ? `\n✗ ${fallos} comprobación(es) fallaron` : '\n✓ idioma: los modelos revisados no dibujan español en la versión inglesa');
process.exit(fallos ? 1 : 0);
