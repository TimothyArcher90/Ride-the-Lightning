// PRUEBA DE CALIDAD «amateur vs. pro» (checklist de docs/research/ANIMATION_RESEARCH.md §2, hecho automático).
// Recorre los 16 modelos × 2 formatos (horizontal 1920×1080 y vertical 1080×1920) con datos reales de la biblioteca y comprueba:
//   1 tamaño mínimo de letra por formato y por tipo de texto      5 pie «Fuente: … · fecha · RTL» presente, legible y dentro de la zona segura
//   2 contraste ≥ 4,5:1 medido sobre los píxeles dibujados         6 tiempo de lectura ≥ 3 s por texto
//   3 zona segura del celular (x ≥ 72,2 % e y ≥ 43,75 %)           7 movimiento: easing (nunca lineal), escalón 30-50 ms, ≤ 2 anotaciones a la vez
//   4 textos que se pisan o se salen (auditarColisiones)           8 comparar con la misma unidad usa valores reales (no índice 100)
// Los textos se leen del lienzo real (se intercepta fillText), así que lo que se mide es lo que verá el espectador.
// Uso: node scripts/prueba-calidad.mjs [modelo,modelo] [horizontal|vertical]
import fs from 'node:fs';
import path from 'node:path';
import {iniciarServidor} from '../servidor/web.mjs';
import {lanzarNavegador, auditarColisiones} from '../servidor/render.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {generar} from '../servidor/plantillas.mjs';
import {construirModelos, MODELOS} from './modelos-16.mjs';
import {TIPO, ZONA, MOV, retardo, entrada, CURVA} from '../motor/diseno.js';

const filtro = (process.argv[2] ?? '').split(',').filter(Boolean), soloFormato = process.argv[3];
const ESCOGIDOS = filtro.length ? MODELOS.filter((m) => filtro.includes(m)) : MODELOS;
let fallos = 0; const resumen = [];
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos++; return c; };

// ── lo que corre dentro del navegador: dibuja un instante en un lienzo propio y devuelve todos los textos con su caja y su contraste
const EN_PAGINA = async ({spec, W, H, tiempos, contraste: medir}) => {
  const {Escena} = await import('/motor/escena.js');
  const D = await import('/motor/diseno.js');
  const esc = new Escena(spec, {});
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', {willReadFrequently: true});
  let rec = [];
  const ft = ctx.fillText.bind(ctx);
  ctx.fillText = (s, x, y, mw) => {
    const m = ctx.measureText(String(s)), tf = ctx.getTransform(), px = parseFloat(/([\d.]+)px/.exec(ctx.font)?.[1] ?? '0') * Math.hypot(tf.a, tf.b);
    const w = m.width, x0 = ctx.textAlign === 'center' ? x - w / 2 : ctx.textAlign === 'right' || ctx.textAlign === 'end' ? x - w : x;
    const pts = [[x0, y - m.actualBoundingBoxAscent], [x0 + w, y - m.actualBoundingBoxAscent], [x0, y + m.actualBoundingBoxDescent], [x0 + w, y + m.actualBoundingBoxDescent]].map(([a, b]) => tf.transformPoint(new DOMPoint(a, b)));
    rec.push({s: String(s), px, x0: Math.min(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), x1: Math.max(...pts.map((p) => p.x)), y1: Math.max(...pts.map((p) => p.y)), a: ctx.globalAlpha, fill: typeof ctx.fillStyle === 'string' ? ctx.fillStyle : null});
    return ft(s, x, y, mw);
  };
  const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const color = (c) => { if (!c) return null; if (c[0] === '#') return {rgb: h2r(c.length === 4 ? '#' + [...c.slice(1)].map((q) => q + q).join('') : c), a: 1}; const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const q = m[1].split(',').map(Number); return {rgb: q.slice(0, 3), a: q[3] ?? 1}; };
  const out = [];
  for (const t of tiempos) {
    rec = []; esc.dibujar(ctx, W, H, t, {});
    for (const r of rec) {
      if (medir && r.a >= 0.95 && r.fill) {
        const M = 4, x = Math.max(0, Math.floor(r.x0) - M), y = Math.max(0, Math.floor(r.y0) - M), w = Math.min(W - x, Math.ceil(r.x1 - r.x0) + 1 + 2 * M), h = Math.min(H - y, Math.ceil(r.y1 - r.y0) + 1 + 2 * M);
        if (w > 1 && h > 1) {
          const d = ctx.getImageData(x, y, w, h).data, bins = new Map(), paso = 1;   // solo el anillo exterior (el fondo que rodea al texto, no la tinta)
          for (let j = 0; j < h; j += paso) for (let i = 0; i < w; i += paso) { if (i >= M && i < w - M && j >= M && j < h - M) continue; const k = (j * w + i) * 4, key = (d[k] >> 4) << 8 | (d[k + 1] >> 4) << 4 | (d[k + 2] >> 4); const b = bins.get(key) ?? {n: 0, r: 0, g: 0, b: 0}; b.n++; b.r += d[k]; b.g += d[k + 1]; b.b += d[k + 2]; bins.set(key, b); }
          const mejor = [...bins.values()].sort((p, q) => q.n - p.n)[0], bg = [mejor.r / mejor.n, mejor.g / mejor.n, mejor.b / mejor.n], c = color(r.fill);
          if (c) { const a = c.a * r.a, ink = c.rgb.map((v, i) => v * a + bg[i] * (1 - a)); r.contraste = D.contraste(ink, bg); }
        }
      }
    }
    out.push({t, textos: rec});
  }
  return out;
};

const MES = /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?(\s\d{2,4})?$/i;
const esMarca = (s) => /^[\d.,\s%−+–:·$-]+$/.test(s) || MES.test(s.trim()) || /^\d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i.test(s);   // marcas de eje y cifras sueltas
const esNombre = (s) => !/[\d$%]/.test(s) && s !== s.toUpperCase() && s.length <= 24 && !/^Fuente:/.test(s);                                                       // nombres y etiquetas: lo que hay que leer

function marcarPie(frames) {
  for (const f of frames) {
    const i = f.textos.find((x) => /^Fuente:/.test(x.s)); f.pieSet = new Set(); f.pieLineas = [];
    if (i) for (const x of f.textos) if (Math.abs(x.x0 - i.x0) < 3 && x.y0 >= i.y0 - 2 && x.y0 <= i.y0 + 4 * i.px) { f.pieSet.add(x.s); f.pieLineas.push(x); }
  }
}
function evaluar(modelo, formato, frames, T, dur) {
  marcarPie(frames);
  const e = [], vert = formato === 'vertical', W = vert ? 1080 : 1920, H = vert ? 1920 : 1080;
  const pie = (s, f) => /^Fuente:/.test(s) || !!f?.pieSet?.has(s);
  // 1 y 2: tamaño y contraste, en los fotogramas asentados (último segundo)
  const asentados = frames.filter((f) => f.t >= dur - 1.6);
  const pisoGeneral = T.secundario, pisoNombre = T.clave, pisoPie = T.pie, vistos = new Set();
  for (const f of asentados) for (const x of f.textos) {
    if (x.a < 0.95 || !x.s.trim() || x.x1 < 0 || x.y1 < 0) continue;
    const k = `${x.s}|${Math.round(x.px)}`; if (vistos.has(k)) continue; vistos.add(k);
    const piso = pie(x.s, f) ? pisoPie : esNombre(x.s) ? pisoNombre : pisoGeneral;
    if (x.px < piso - 0.6) e.push(`letra pequeña: «${x.s.slice(0, 40)}» mide ${x.px.toFixed(0)} px y el mínimo es ${piso} px (${pie(x.s, f) ? 'pie de fuente' : esNombre(x.s) ? 'nombre o etiqueta' : 'cifra, eje o unidad'})`);
    if (x.contraste != null && x.contraste < 4.5) e.push(`poco contraste: «${x.s.slice(0, 40)}» tiene ${x.contraste.toFixed(1).replace('.', ',')}:1 y el mínimo es 4,5:1`);
  }
  // 3: zona segura del celular, en TODOS los fotogramas (incluye el pie)
  if (vert) { const malos = new Map(); for (const f of frames) for (const x of f.textos) if (x.a > 0.3 && x.x1 > ZONA.x * W + 2 && x.y1 > ZONA.y * H && x.x0 < W) { const k = x.s.slice(0, 30); (malos.get(k) ?? malos.set(k, []).get(k)).push(f.t); } for (const [k, ts] of malos) e.push(`zona de botones del celular: «${k}» entra en la zona prohibida (segundos ${ts[0].toFixed(1)}–${ts[ts.length - 1].toFixed(1)})`); }
  // 5: pie
  const ult = frames[frames.length - 1], pies = ult.pieLineas;
  if (!pies.length) e.push('falta el pie «Fuente: … · fecha · RTL»');
  else {
    const txt = pies.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0).map((x) => x.s).join(' ');
    if (!/RTL$/.test(txt.trim())) e.push(`el pie no termina en «RTL»: «${txt}»`);
    if (!/(\d{4})/.test(txt)) e.push(`el pie no trae la fecha del último dato: «${txt}»`);
    if (pies.some((x) => x.y1 > H || x.x0 < 0 || x.x1 > W)) e.push('el pie se sale del cuadro');
    if (pies.some((x) => x.px < pisoPie - 0.6)) e.push('el pie es demasiado pequeño');
  }
  // 6: tiempo de lectura (cada texto con letras, quieto, visible ≥ 3 s)
  const paso = frames.length > 1 ? frames[1].t - frames[0].t : 0.25, vida = new Map(), pos = new Map();
  for (const f of frames) for (const x of f.textos) { if (x.a < 0.5) continue; const kp = `${Math.round(x.x0 / 25)}:${Math.round(x.y0 / 25)}`; (pos.get(kp) ?? pos.set(kp, new Set()).get(kp)).add(x.s); const v = vida.get(x.s) ?? {ini: f.t, fin: f.t, kp}; v.fin = f.t; vida.set(x.s, v); }
  for (const [s, v] of vida) {
    if (esMarca(s) || (pos.get(v.kp)?.size ?? 0) > 4 || !/\p{L}{3}/u.test(s)) continue;   // marcas de eje y textos que cambian cuadro a cuadro (contadores) no cuentan
    if (v.fin - v.ini + paso < MOV.lectura - 1e-6) e.push(`se lee muy poco: «${s.slice(0, 40)}» está ${(v.fin - v.ini + paso).toFixed(1).replace('.', ',')} s en pantalla y debe estar al menos ${MOV.lectura} s`);
  }
  return [...new Set(e)];
}

async function modeloFormato(nav, srv, m, formato) {
  const W = m.spec.ancho, H = m.spec.alto, dur = m.spec.duracion;
  const tiempos = []; for (let t = 0.5; t < dur; t += 0.25) tiempos.push(+t.toFixed(2)); tiempos.push(+(dur - 0.1).toFixed(2));
  const pag = await nav.newPage({viewport: {width: 800, height: 600}});
  pag.on('pageerror', (er) => { throw er; });
  await pag.goto(`http://127.0.0.1:${srv.puerto}/render.html`); await pag.waitForFunction(() => window.RTL_LISTO === true);
  await pag.evaluate(([s, w, h]) => window.RTL.cargar(s, w, h), [m.spec, W, H]);
  const asentados = new Set(tiempos.filter((t) => t >= dur - 1.6));
  const frames = [];
  for (let i = 0; i < tiempos.length; i += 12) { const lote = tiempos.slice(i, i + 12); frames.push(...await pag.evaluate(EN_PAGINA, {spec: m.spec, W, H, tiempos: lote, contraste: lote.some((t) => asentados.has(t))})); }
  await pag.close();
  const errs = evaluar(m.id, formato, frames, TIPO[formato], dur);
  const aud = await auditarColisiones(m.spec, {paso: 0.5});
  aud.problemas.forEach((p) => errs.push('textos que se pisan: ' + p.mensaje));
  aud.zonaSegura.forEach((p) => errs.push('zona segura (auditor): ' + p.mensaje));
  return errs;
}

// ── pruebas de movimiento y de diseño que no necesitan dibujar
console.log('\n0) Sistema de diseño y movimiento');
ok(TIPO.vertical.clave >= 40 && TIPO.vertical.secundario >= 32 && TIPO.vertical.pie >= 28, `pisos tipográficos en vertical: clave ${TIPO.vertical.clave}, secundario ${TIPO.vertical.secundario}, pie ${TIPO.vertical.pie} px`);
ok(Math.abs(retardo(1, 10) - 0.04) < 1e-9 && retardo(1, 10) >= 0.03 && retardo(1, 10) <= 0.05, `escalón entre elementos: ${(retardo(1, 10) * 1000).toFixed(0)} ms (entre 30 y 50)`);
ok(retardo(19, 20) <= MOV.topeGrupo + 1e-9 && retardo(59, 60) <= MOV.topeGrupo + 1e-9, 'un grupo grande nunca tarda más de 0,8 s en entrar');
ok(CURVA.entrada(0.5) > 0.7 && CURVA.salida(0.5) < 0.4 && Math.abs(CURVA.estandar(0.5) - 0.5) > 0.05 && entrada(1, 0, 0, 1, 1) === 1, 'las curvas de entrada (frena al llegar), salida (acelera) y estándar no son lineales');
const fuenteMotor = fs.readFileSync(path.join(RAIZ, 'motor', 'capas.js'), 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const lineales = (fuenteMotor.match(/ease\.lin\b/g) ?? []).length;
ok(lineales <= 2, `easing lineal en el motor: ${lineales} uso(s) (solo se permite el avance del tiempo de los datos en la carrera y el zoom lento de las imágenes)`);

// ── barrido de los 16 modelos
const srv = await iniciarServidor(0), nav = await lanzarNavegador();
try {
  for (const formato of ['horizontal', 'vertical']) {
    if (soloFormato && soloFormato !== formato) continue;
    console.log(`\n${formato === 'vertical' ? '2' : '1'}) ${formato === 'vertical' ? 'Vertical 1080×1920 (reels)' : 'Horizontal 1920×1080'}`);
    const modelos = (await construirModelos(formato)).filter((m) => ESCOGIDOS.includes(m.id));
    for (const m of modelos) {
      let errs;
      try { errs = m.informe.errores?.length ? ['no compila: ' + m.informe.errores[0]] : await modeloFormato(nav, srv, m, formato); } catch (er) { errs = ['error al medir: ' + er.message.split('\n')[0]]; }
      ok(errs.length === 0, `${m.id}${errs.length ? ' · ' + errs.length + ' problema(s)' : ''}`);
      errs.slice(0, 6).forEach((x) => console.log('       - ' + x)); if (errs.length > 6) console.log(`       … y ${errs.length - 6} más`);
      resumen.push({modelo: m.id, formato, problemas: errs.length});
    }
  }
} finally { await nav.close(); await srv.cerrar(); }

// ── reglas de contenido (sin dibujar)
console.log('\n3) Reglas de contenido');
const bib = (...ids) => ids.map((id) => ({origen: 'biblioteca', id}));
{
  const iguales = ['COL', 'MEX', 'BRA'].map((c) => `pais_${c}_deuda_pib`).filter((id) => fs.existsSync(path.join(RAIZ, 'datos', 'biblioteca', `${id}.csv`)));
  if (iguales.length === 3) {
    const r = generar({plantilla: 'comparar', series: bib(...iguales), formato: 'vertical'});
    ok(!r.spec.datos.d.base100 && /reales/i.test(r.spec.capas[0].sub ?? ''), 'misma unidad (% del PIB): se comparan valores reales sobre un eje común, no índice 100');
  } else console.log('  (faltan series de países: se omite)');
  const mixtas = bib('bm_gold', 'bm_copper'); const r2 = generar({plantilla: 'comparar', series: mixtas, formato: 'vertical'});
  ok(r2.spec.datos.d.base100 === true && /ndice/.test(r2.spec.capas[0].sub ?? ''), 'unidades distintas: índice base 100, declarado en el subtítulo');
  const h = generar({plantilla: 'historia', series: bib('bm_gold'), formato: 'vertical', camara: 'dinamico', momentos: [{tipo: 'subida'}, {tipo: 'caida'}]});
  const ll = h.spec.capas.filter((c) => c.tipo === 'llamada');
  ok(ll.length === 0 || ll.every((c) => c.t[1] - c.t[0] >= MOV.lectura - 1e-6), `las tarjetas de anotación duran ≥ 3 s (${ll.length} revisadas)`);
  let solape = 0; for (let a = 0; a < ll.length; a++) for (let b = a + 1; b < ll.length; b++) if (ll[a].t[0] < ll[b].t[1] && ll[b].t[0] < ll[a].t[1]) solape++;
  ok(solape === 0, 'nunca hay dos tarjetas de anotación compitiendo a la vez');
}
console.log(fallos ? `\n✗ ${fallos} comprobación(es) fallaron` : '\n✓ calidad profesional: los 16 modelos × 2 formatos pasan');
process.exit(fallos ? 1 : 0);
