// Regenerates, in one go, everything that is published as visual documentation:
//   docs/gallery/<model>-h.png | -v.png    one final frame per chart model and format (real data, ≤ 400 KB each)
//   examples/<slug>/                         spec.json (+ spec.vertical.json), README.md, preview.png and the derived data.csv
//   examples/video/*.mp4 and README.gif      short draft videos (open-licence data only; ≤ 6 MB each, ≤ 25 MB in total)
//
// Usage:  npm run gallery                      everything
//         node scripts/generar-galeria.mjs --solo=historia,radar   only those cases (ids from scripts/galeria-casos.mjs)
//         node scripts/generar-galeria.mjs --sin-video             images + examples, no videos
//         node scripts/generar-galeria.mjs --solo-video            only the videos
//
// Needs: the data library already downloaded (datos/ is not versioned: see docs/ for `node servidor/cli.mjs bajar …`,
// `npm run catalogo` and `npm run trimestres`), Edge or Chrome (Playwright) and ffmpeg on the PATH.
// Cases whose data is missing on this machine are SKIPPED and listed at the end; nothing is ever made up.
// Examples with a restricted data licence (Coin Metrics NC, IMF) are written as spec only: no image, no data.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {generar} from '../servidor/plantillas.mjs';
import {compilar, RAIZ} from '../servidor/compilar.mjs';
import {vistaPrevia, renderizar, auditarColisiones} from '../servidor/render.mjs';
import {CASOS, RESTRINGIDOS, dirDatos, bib, hay} from './galeria-casos.mjs';

const args = process.argv.slice(2), SOLO = (args.find((a) => a.startsWith('--solo=')) ?? '').slice(7).split(',').filter(Boolean);
const SIN_VIDEO = args.includes('--sin-video'), SOLO_VIDEO = args.includes('--solo-video'), AUDITAR = args.includes('--auditar');
const GAL = path.join(RAIZ, 'docs', 'gallery'), EJ = path.join(RAIZ, 'examples'), VID = path.join(EJ, 'video'), TMP = path.join(RAIZ, '.tmp', 'galeria');
const MAX_PNG = 400 * 1024, MAX_MP4 = 6 * 1024 * 1024, MAX_TOTAL_MP4 = 25 * 1024 * 1024, MAX_GIF = 4 * 1024 * 1024;
for (const d of [GAL, EJ, VID, TMP]) fs.mkdirSync(d, {recursive: true});
const hoy = new Date().toISOString().slice(0, 10), omitidos = [], fallos = [], tamanos = {png: 0, mp4: 0, gif: 0};
const kb = (f) => Math.round(fs.statSync(f).size / 1024);

/** Builds the (uncompiled) spec of a case for a format, plus its compile report. */
function construir(caso, formato) {
  const dir = dirDatos(caso);
  if (caso.manual) { const spec = caso.manual(formato, dir); delete spec._fuente; return {spec, informe: compilar(spec).informe}; }
  const r = generar({...caso.entrada(formato, dir), formato, camara: formato === 'vertical' ? 'dinamico' : 'documental'});
  let spec = r.spec, informe = r.informe;
  if (caso.ajuste) { spec = JSON.parse(JSON.stringify(spec)); caso.ajuste(spec); informe = compilar(spec).informe; }
  return {spec, informe};
}

/** PNG from the engine → small palette PNG (flat dark charts compress very well); falls back to fewer colours, smaller size, then JPEG. */
function comprimir(origen, destino) {
  const intentos = [{c: 256, d: 'none', w: 0}, {c: 192, d: 'sierra2_4a', w: 0}, {c: 128, d: 'bayer:bayer_scale=5', w: 0}, {c: 128, d: 'bayer:bayer_scale=5', w: 0.85}];
  for (const t of intentos) {
    const esc = t.w ? `scale=iw*${t.w}:-2:flags=lanczos,` : '';
    const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', origen, '-vf', `${esc}split[a][b];[a]palettegen=max_colors=${t.c}:stats_mode=full[p];[b][p]paletteuse=dither=${t.d}`, '-frames:v', '1', destino]);
    if (r.status === 0 && fs.existsSync(destino) && fs.statSync(destino).size <= MAX_PNG) return destino;
  }
  const jpg = destino.replace(/\.png$/, '.jpg');   // last resort: high-quality JPEG (the name changes; MODELS.md is generated from what exists)
  spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', origen, '-q:v', '3', jpg]);
  if (fs.existsSync(destino)) fs.rmSync(destino);
  return jpg;
}

const quiere = (id) => !SOLO.length || SOLO.includes(id);

// ── 1. gallery + examples ───────────────────────────────────────────────────────────────────────────────────────
async function galeriaYEjemplos() {
  for (const caso of CASOS) {
    if (!quiere(caso.id)) continue;
    const falta = caso.faltan();
    if (falta.length) { omitidos.push(`${caso.id}: missing data (${falta.join(', ')})`); console.log(`– ${caso.id}: skipped, missing ${falta.join(', ')}`); continue; }
    const specs = {};
    for (const [formato, sufijo] of [['horizontal', 'h'], ['vertical', 'v']]) {
      try {
        const {spec, informe} = construir(caso, formato);
        if (!informe.ok) { fallos.push(`${caso.id} ${formato}: ${informe.errores[0]}`); console.log(`✗ ${caso.id} ${formato}: ${informe.errores[0]}`); continue; }
        const plano = compilar(spec).spec;
        if (AUDITAR) { const a = await auditarColisiones(plano, {paso: 0.4}); if (!a.ok || a.zonaSegura.length) fallos.push(`${caso.id} ${formato}: text collisions/safe zone (${(a.problemas[0] ?? a.zonaSegura[0]).mensaje})`); }
        const [crudo] = await vistaPrevia(plano, [+(plano.duracion - 0.3).toFixed(2)], {dir: path.join(TMP, 'crudo'), nombre: `${caso.id}_${sufijo}`, escala: 0.75});
        const salida = comprimir(crudo, path.join(GAL, `${caso.id}-${sufijo}.png`));
        tamanos.png += fs.statSync(salida).size;
        console.log(`✓ ${caso.id} ${formato} → ${path.relative(RAIZ, salida)} (${kb(salida)} KB)${informe.avisos.length ? ' · ' + informe.avisos.length + ' notice(s)' : ''}`);
        specs[formato] = {spec, informe};
      } catch (e) { fallos.push(`${caso.id} ${formato}: ${e.message}`); console.log(`✗ ${caso.id} ${formato}: ${e.message}`); }
    }
    if (caso.ejemplo && specs.horizontal) escribirEjemplo(caso, specs);
  }
}

function leerPrevia(caso) { const f = path.join(GAL, `${caso.id}-h.png`), j = f.replace(/\.png$/, '.jpg'); return fs.existsSync(f) ? f : fs.existsSync(j) ? j : null; }

/** examples/<slug>/ : spec.json (horizontal), spec.vertical.json, preview image, README.md. The spec must compile as written. */
function escribirEjemplo(caso, specs, {restringido = null} = {}) {
  const e = restringido ?? caso.ejemplo, dir = path.join(EJ, e.slug ?? caso.ejemplo.slug); fs.mkdirSync(dir, {recursive: true});
  const h = specs.horizontal, v = specs.vertical;
  fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(h.spec, null, 2) + '\n');
  if (v) fs.writeFileSync(path.join(dir, 'spec.vertical.json'), JSON.stringify(v.spec, null, 2) + '\n');
  const chk = compilar(JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')));
  if (!chk.informe.ok) { fallos.push(`example ${path.basename(dir)}: spec.json does not compile: ${chk.informe.errores[0]}`); return; }
  const previa = restringido ? null : leerPrevia(caso);
  if (previa) fs.copyFileSync(previa, path.join(dir, 'preview' + path.extname(previa)));
  const datos = chk.informe.datos, ids = [...new Set(Object.values(h.spec.datos).map((d) => (d.archivo ?? '').match(/datos\/biblioteca\/(.+)\.csv$/)?.[1]).filter(Boolean))];
  const licencias = [...new Set(datos.map((d) => `${d.fuente.nombre} — ${d.fuente.licencia ?? 'see source'}`))];
  const lic = restringido ? restringido.licencia : caso.licencia, fuente = restringido ? restringido.fuente : caso.fuente;
  const rel = (f) => path.relative(RAIZ, f).split(path.sep).join('/'), slug = path.basename(dir);
  const md = [
    `# ${slug.split('-').map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(' ')}`, '',
    previa ? `![preview](preview${path.extname(previa)})\n` : (restringido ? '> No preview image is shipped for this example: its data licence does not allow redistributing it (see below).\n' : ''),
    `**What it shows.** ${e.que}`, '',
    `- **Model:** ${caso.nombre} — template \`${restringido ? restringido.plantilla ?? 'historia' : caso.plantilla}\` (see [docs/MODELS.md](../../docs/MODELS.md))`,
    `- **Source:** ${fuente}`,
    `- **Licence of the data:** ${lic}`,
    `- **Data actually read by the spec:** ${licencias.map((l) => `\n  - ${l}`).join('')}`,
    `- **Duration / format:** ${h.spec.duracion} s, 1920×1080 (\`spec.vertical.json\` is the 1080×1920 version for reels)`, '',
    '## Run it', '',
    '```bash',
    ...(ids.length ? [`# 1. download the series this example reads (the data folder is not versioned)`, `node servidor/cli.mjs bajar ${ids.join(' ')}`, ''] : ['# the data (data.csv) is in this folder; nothing to download', '']),
    `# 2. compile: validates the spec and prints the verification report (every figure traced to a row)`,
    `node servidor/cli.mjs compilar ${rel(path.join(dir, 'spec.json'))}`, '',
    `# 3. preview frames (PNG in .tmp/vistas) and a fast draft video`,
    `node servidor/cli.mjs vista ${rel(path.join(dir, 'spec.json'))} 4,9`,
    `node servidor/cli.mjs render ${rel(path.join(dir, 'spec.json'))} --borrador --sin-alfa`,
    '```', '',
    `Final delivery (MP4 + ProRes 4444 with alpha): \`node servidor/cli.mjs render ${rel(path.join(dir, 'spec.json'))}\`. Regenerate this folder with \`npm run gallery\`.`,
    ...(chk.informe.avisos.length ? ['', '## Compiler notices (in Spanish, as the engine prints them)', '', ...chk.informe.avisos.slice(0, 4).map((a) => `- ${a}`)] : []),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'README.md'), md);
  console.log(`  ↳ examples/${slug}/ (${restringido ? 'spec only' : 'spec + preview'})`);
}

/** Examples that need a hand-picked spec (curated camera and callouts) or restricted data: spec only, never data. */
async function ejemplosEspeciales() {
  // curated specs that already live in specs/ (camera moves + dated callouts written by hand)
  const copias = [
    {slug: 'fed-balance-sheet', origen: 'specs/fed-balance.json', nombre: 'Federal Reserve balance sheet', plantilla: 'historia (hand-directed)', que: 'Total assets of the Federal Reserve since 2002 with the camera zooming into the 2008 crisis, the pandemic and the shrinking of the balance sheet.', fuente: 'Federal Reserve Board via FRED: total assets (WALCL)', licencia: 'Public domain', ids: ['fed_balance'], video: 'h'},
  ];
  for (const c of copias) {
    if (!quiere(c.slug) || !hay(...c.ids)) { if (!hay(...c.ids)) omitidos.push(`${c.slug}: missing data (${c.ids.join(', ')})`); continue; }
    const spec = JSON.parse(fs.readFileSync(path.join(RAIZ, c.origen), 'utf8')), inf = compilar(spec).informe;
    if (!inf.ok) { fallos.push(`${c.slug}: ${inf.errores[0]}`); continue; }
    const [crudo] = await vistaPrevia(compilar(spec).spec, [+(spec.duracion - 0.3).toFixed(2)], {dir: path.join(TMP, 'crudo'), nombre: c.slug, escala: 0.75});
    const dir = path.join(EJ, c.slug); fs.mkdirSync(dir, {recursive: true});
    const prev = comprimir(crudo, path.join(dir, 'preview.png')); tamanos.png += fs.statSync(prev).size;
    escribirEjemplo({id: c.slug, nombre: c.nombre, plantilla: c.plantilla, fuente: c.fuente, licencia: c.licencia, ejemplo: {slug: c.slug, que: c.que}}, {horizontal: {spec, informe: inf}});
    c.listo = true;
  }
  for (const r of RESTRINGIDOS) {
    if (!quiere(r.slug)) continue;
    if (!hay(...r.ids)) { omitidos.push(`${r.slug}: missing data (${r.ids.join(', ')}) — spec not written`); continue; }
    let spec;
    if (r.origen) spec = JSON.parse(fs.readFileSync(path.join(RAIZ, r.origen), 'utf8'));
    else spec = generar({plantilla: r.plantilla, series: bib(...r.ids), foco: r.foco, formato: 'horizontal', camara: 'documental'}).spec;
    const vspec = r.origen ? null : generar({plantilla: r.plantilla, series: bib(...r.ids), foco: r.foco, formato: 'vertical', camara: 'dinamico'}).spec;
    escribirEjemplo({id: r.slug, nombre: r.slug.replace(/-/g, ' ').replace(/^./, (x) => x.toUpperCase()), plantilla: r.plantilla ?? 'historia', fuente: r.fuente, licencia: r.licencia}, {horizontal: {spec}, ...(vspec ? {vertical: {spec: vspec}} : {})}, {restringido: r});
  }
  return copias;
}

// ── 2. videos ──────────────────────────────────────────────────────────────────────────────────────────────────
async function videos(copias) {
  const lista = [];
  for (const c of CASOS) if (c.ejemplo?.video && c.faltan().length === 0 && quiere(c.id)) lista.push({slug: c.ejemplo.slug, fmt: c.ejemplo.video, spec: () => { const f = c.ejemplo.video === 'v' ? 'vertical' : 'horizontal'; return construir(c, f); }});
  for (const c of copias) if (c.listo && quiere(c.slug)) lista.push({slug: c.slug, fmt: c.video, spec: () => ({spec: JSON.parse(fs.readFileSync(path.join(EJ, c.slug, 'spec.json'), 'utf8')), informe: null})});
  let total = 0, mejorGif = null;
  for (const v of lista) {
    try {
      const {spec} = v.spec(), {spec: plano, informe} = compilar(spec);
      if (!informe.ok) throw new Error(informe.errores[0]);
      const r = await renderizar(plano, informe, {nombre: v.slug, calidad: 'borrador', alfa: false, salidaDir: path.join(TMP, 'render'), forzar: false});
      const destino = path.join(VID, `${v.slug}-${v.fmt}.mp4`); fs.copyFileSync(r.salidas.mp4, destino);
      const tam = fs.statSync(destino).size; total += tam;
      console.log(`▶ ${path.relative(RAIZ, destino)} ${kb(destino)} KB · ${plano.duracion} s · ${r.segundos} s to render`);
      if (tam > MAX_MP4) { fallos.push(`video ${v.slug} is ${kb(destino)} KB (> 6 MB)`); }
      if (v.fmt === 'h' && !mejorGif && plano.duracion <= 14) mejorGif = {destino, plano};
    } catch (e) { fallos.push(`video ${v.slug}: ${e.message}`); console.log(`✗ video ${v.slug}: ${e.message}`); }
  }
  tamanos.mp4 = total;
  if (total > MAX_TOTAL_MP4) fallos.push(`videos total ${Math.round(total / 1048576)} MB (> 25 MB)`);
  // README GIF: first horizontal video of ≤ 14 s, 640 px wide, 12 fps, palette; reduces the frame rate / width until it is ≤ 4 MB
  if (mejorGif) {
    const gif = path.join(VID, 'README.gif');
    for (const [w, fps] of [[720, 12], [640, 12], [560, 10], [480, 10], [420, 8]]) {
      const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mejorGif.destino, '-vf', `fps=${fps},scale=${w}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=5`, '-loop', '0', gif]);
      if (r.status === 0 && fs.existsSync(gif) && fs.statSync(gif).size <= MAX_GIF) break;
    }
    if (fs.existsSync(gif)) { tamanos.gif = fs.statSync(gif).size; console.log(`▶ ${path.relative(RAIZ, gif)} ${kb(gif)} KB (from ${path.basename(mejorGif.destino)})`); if (tamanos.gif > MAX_GIF) fallos.push(`README.gif ${kb(gif)} KB (> 4 MB)`); }
  } else console.log('– no horizontal video of ≤ 14 s: README.gif not made');
}

// ── main ────────────────────────────────────────────────────────────────────────────────────────────────────────
console.log(`Gallery ${hoy} — ffmpeg: ${spawnSync('ffmpeg', ['-version']).status === 0 ? 'ok' : 'MISSING (images will fail)'}`);
let copias = [];
if (!SOLO_VIDEO) { await galeriaYEjemplos(); copias = await ejemplosEspeciales(); }
else copias = [{slug: 'fed-balance-sheet', video: 'h', listo: fs.existsSync(path.join(EJ, 'fed-balance-sheet', 'spec.json'))}];
if (!SIN_VIDEO) await videos(copias);
console.log(`\nPNG total ${(tamanos.png / 1048576).toFixed(1)} MB · MP4 total ${(tamanos.mp4 / 1048576).toFixed(1)} MB · GIF ${(tamanos.gif / 1024).toFixed(0)} KB`);
if (omitidos.length) console.log('\nSkipped (data missing on this machine):\n  ' + omitidos.join('\n  '));
if (fallos.length) { console.log('\nProblems:\n  ' + fallos.join('\n  ')); process.exit(1); }
console.log('Done.');
