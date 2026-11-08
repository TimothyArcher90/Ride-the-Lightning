// Chat del estudio: editar la pieza en vivo hablando. Igual que el chat de Electric Eye: cada mensaje lanza Claude Code en modo no interactivo
// (`claude -p`) con SOLO las herramientas de Ride the Lightning (servidor/mcp.mjs). Usa la cuenta con la que hayas entrado en Claude Code
// (o ANTHROPIC_API_KEY si existe). La conversación sigue con --resume. La pieza abierta viaja por specs/_chat_actual.json:
// el estudio la escribe antes de cada mensaje, Claude la edita con editar_pieza (que valida antes de guardar) y el estudio recibe el cambio al instante.
import {execSync, spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RAIZ, compilar} from './compilar.mjs';
import {tr} from '../web/i18n.js';

const ACTUAL = path.join(RAIZ, 'specs', '_chat_actual.json');
const TMP = path.join(os.tmpdir(), 'ride-the-lightning');
const MAX_MS = (Number(process.env.RTL_CHAT_MAX_MIN) || 10) * 60000;
let sesion = null, hijo = null, ocupado = false;

const INSTRUCCIONES = `You are the chat editor of Ride the Lightning, a local studio that animates financial charts (quarterly income-statement Sankeys, lines, rings, waterfalls).
The user has a piece open in the studio and asks for changes by talking. Make the change YOURSELF with the ride-the-lightning tools, fast and without detours.

HOW TO WORK
1) Call pieza_actual first, always, to see the open piece.
2) Small changes (theme, format, duration, title, texts, moment styles, camera, removing or adding a layer): editar_pieza with the exact path. If it says it does not compile, fix it; nothing broken is saved.
3) Big changes (another company, another quarter, another data series): generar_trimestre or generar_pieza with como_actual: true. To look up a company: listar_trimestres({buscar}); its quarters: listar_trimestres({ticker}). For market series: buscar_series, then generar_pieza.
4) Answer in the language of the user (see LANGUAGE), in 1–3 short sentences: what you changed and, if something is doubtful, what. No paragraphs.
5) Do not export videos unless explicitly asked.

WHAT CAN BE CHANGED (editar_pieza paths)
- tema: oscuro | harris (black and pink-red) | carbon (charcoal grey and teal). formato: horizontal | vertical. duracion: seconds. titulo and capas[i].texto of the title.
- Moments (llamada): capas[i].estilo = tarjeta | barra | pildora | circulo; capas[i].t = [start, end]. Camera of a line: capas[i].camara = "seguir".
- Sankey, donut and cascada layers: capas[i].t = [start, end] (how long they take to build).

HARD ACCURACY RULES
- Never type a figure by hand into a text: figures come from the data (placeholders such as {valor}, {fecha}). A literal number in a text does not compile.
- Every series carries its source. Do not invent companies, quarters or figures. If what is asked needs data that does not exist, say so and propose the closest thing.
- Little text, no overlapping texts, the year always visible. If a change makes something overlap, the audit detects it: do not hide it.

LANGUAGE
- The studio interface and the piece are in the language given in the first line of each user message, «[language: en]» or «[language: es]». Reply in that language.
- The piece has the field idioma ("en" or "es"). Keep it equal to that language in every spec you edit or generate, and write any title or text you set in that language.`;
const HERRAMIENTAS = ['pieza_actual', 'editar_pieza', 'generar_trimestre', 'generar_pieza', 'listar_trimestres', 'buscar_series', 'descargar_serie', 'analizar_serie', 'vista_previa', 'compilar_spec'];
const humano = (corto, lang) => (HERRAMIENTAS.includes(corto) ? tr('srv_h_' + corto, null, lang) : null);

function ejecutableClaude() {
  if (process.platform !== 'win32') return 'claude';
  try { const r = execSync('where claude', {stdio: ['ignore', 'pipe', 'ignore']}).toString().split(/\r?\n/).filter(Boolean); return r.find((x) => /\.exe$/i.test(x)) ?? r.find((x) => /\.cmd$/i.test(x)) ?? 'claude'; } catch { return 'claude'; }
}
const comillas = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a);
const matar = (p) => { if (!p?.pid) return; if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], {stdio: 'ignore', windowsHide: true}).on('error', () => p.kill()); else p.kill('SIGTERM'); };

function archivosTemporales() {
  fs.mkdirSync(TMP, {recursive: true});
  const mcp = path.join(TMP, 'mcp.json'), instr = path.join(TMP, 'instrucciones.md');
  fs.writeFileSync(mcp, JSON.stringify({mcpServers: {'ride-the-lightning': {command: process.execPath, args: [path.join(RAIZ, 'servidor', 'mcp.mjs')], env: {}}}}));
  fs.writeFileSync(instr, INSTRUCCIONES);
  return {mcp, instr};
}

const estadoPieza = () => { try { const spec = JSON.parse(fs.readFileSync(ACTUAL, 'utf8')), {spec: plano, informe} = compilar(spec); return {spec, plano: informe.ok ? plano : null, informe}; } catch { return null; } };

/** Atiende POST /api/chat: escribe ND-JSON (una línea por evento) hasta que Claude termina. */
export function chat(req, res, {mensaje, spec, idioma = 'en'}) {
  const lang = idioma === 'es' ? 'es' : 'en';
  const linea = (o) => { try { res.write(JSON.stringify(o) + '\n'); } catch { /* cliente cerrado */ } };
  res.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store'});
  if (ocupado) { linea({tipo: 'error', texto: tr('srv_chat_ocupado', null, lang)}); linea({tipo: 'fin'}); res.end(); return; }
  ocupado = true;
  try { if (spec) fs.writeFileSync(ACTUAL, JSON.stringify(spec, null, 2)); else if (fs.existsSync(ACTUAL)) fs.unlinkSync(ACTUAL); } catch (e) { linea({tipo: 'error', texto: tr('srv_chat_no_guardo', {e: e.message}, lang)}); }
  const mtime0 = fs.existsSync(ACTUAL) ? fs.statSync(ACTUAL).mtimeMs : 0;
  const {mcp, instr} = archivosTemporales();
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--mcp-config', mcp, '--strict-mcp-config', '--allowedTools', 'mcp__ride-the-lightning',
    '--disallowedTools', 'Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', '--append-system-prompt-file', instr];
  if (sesion) args.push('--resume', sesion);
  const exe = ejecutableClaude(), conShell = process.platform === 'win32' && !/\.exe$/i.test(exe);
  const entorno = {...process.env, MCP_TIMEOUT: '60000', MCP_TOOL_TIMEOUT: '900000', RTL_LANG: lang};
  hijo = conShell ? spawn([exe, ...args].map(comillas).join(' '), {cwd: RAIZ, shell: true, windowsHide: true, env: entorno}) : spawn(exe, args, {cwd: RAIZ, windowsHide: true, env: entorno});
  const p = hijo; let resto = '', ultimaMtime = mtime0, terminado = false, huboTexto = false, errTxt = '';
  const revisarPieza = () => { try { const m = fs.statSync(ACTUAL).mtimeMs; if (m !== ultimaMtime) { ultimaMtime = m; const e = estadoPieza(); if (e) linea({tipo: 'pieza', ...e}); } } catch { /* aún no existe */ } };
  const poll = setInterval(revisarPieza, 700);
  const reloj = setTimeout(() => { linea({tipo: 'error', texto: tr('srv_chat_tiempo', {m: Math.round(MAX_MS / 60000)}, lang)}); matar(p); }, MAX_MS);
  const fin = () => { if (terminado) return; terminado = true; clearInterval(poll); clearTimeout(reloj); revisarPieza(); if (!huboTexto && errTxt) linea({tipo: 'error', texto: errTxt}); linea({tipo: 'fin'}); try { res.end(); } catch { /* ya cerrado */ } ocupado = false; hijo = null; };
  res.on('close', () => { if (!terminado) { matar(p); } });
  p.stdout.on('data', (trozo) => {
    resto += trozo.toString('utf8'); const ls = resto.split('\n'); resto = ls.pop() ?? '';
    for (const l of ls) {
      if (!l.trim()) continue; let ev; try { ev = JSON.parse(l); } catch { continue; }
      if (ev.session_id) sesion = ev.session_id;
      if (ev.type === 'assistant') for (const b of ev.message?.content ?? []) {
        if (b.type === 'text' && b.text.trim()) { huboTexto = true; linea({tipo: 'texto', texto: b.text}); }
        if (b.type === 'tool_use') { const corto = String(b.name).replace(/^mcp__ride-the-lightning__/, ''); if (humano(corto, lang)) linea({tipo: 'accion', texto: humano(corto, lang), herramienta: corto}); }
      }
      if (ev.type === 'user') revisarPieza();
      if (ev.type === 'result' && ev.is_error) errTxt = String(ev.result ?? tr('srv_chat_error_cl', null, lang));
    }
  });
  p.stderr.on('data', (t) => { errTxt = (errTxt + t.toString('utf8')).slice(-600); });
  p.on('error', (e) => { errTxt = e.code === 'ENOENT' ? tr('srv_chat_no_claude', null, lang) : String(e.message); fin(); });
  p.on('close', (code) => { if (code && !huboTexto && !errTxt) errTxt = tr('srv_chat_codigo', {c: code}, lang); fin(); });
  p.stdin.on('error', () => undefined);
  p.stdin.end(`[language: ${lang}]\n${mensaje}`);
}
export function pararChat() { if (hijo) { matar(hijo); return true; } return false; }
export function reiniciarChat() { sesion = null; return pararChat(); }
