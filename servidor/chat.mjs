// Chat del estudio: editar la pieza en vivo hablando. Igual que el chat de Electric Eye: cada mensaje lanza Claude Code en modo no interactivo
// (`claude -p`) con SOLO las herramientas de Ride the Lightning (servidor/mcp.mjs). Usa la cuenta con la que hayas entrado en Claude Code
// (o ANTHROPIC_API_KEY si existe). La conversación sigue con --resume. La pieza abierta viaja por specs/_chat_actual.json:
// el estudio la escribe antes de cada mensaje, Claude la edita con editar_pieza (que valida antes de guardar) y el estudio recibe el cambio al instante.
import {execSync, spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RAIZ, compilar} from './compilar.mjs';

const ACTUAL = path.join(RAIZ, 'specs', '_chat_actual.json');
const TMP = path.join(os.tmpdir(), 'ride-the-lightning');
const MAX_MS = (Number(process.env.RTL_CHAT_MAX_MIN) || 10) * 60000;
let sesion = null, hijo = null, ocupado = false;

const INSTRUCCIONES = `Eres el editor del chat de Ride the Lightning, un estudio local que anima gráficas financieras (Sankey de estados de resultados por trimestre, líneas, anillos, cascadas).
El usuario tiene una pieza abierta en el estudio y te pide cambios hablando. Haz el cambio TÚ, con las herramientas ride-the-lightning, rápido y sin rodeos.

CÓMO TRABAJAR
1) Llama a pieza_actual (siempre primero) para ver la pieza abierta.
2) Cambios pequeños (tema, formato, duración, título, textos, estilos de momento, cámara, quitar o añadir una capa): editar_pieza con la ruta exacta. Si dice que no compila, corrígelo; no se guarda nada roto.
3) Cambios grandes (otra empresa, otro trimestre, otra serie de datos): generar_trimestre o generar_pieza con como_actual: true. Para buscar una empresa: listar_trimestres({buscar}); sus trimestres: listar_trimestres({ticker}). Para series de mercado: buscar_series y descargar_serie.
4) Contesta en español, en 1–3 frases cortas: qué cambiaste y, si hay algo dudoso, qué. Nada de párrafos.
5) No exportes videos a menos que lo pidan expresamente.

LO QUE SE PUEDE CAMBIAR (rutas de editar_pieza)
- tema: oscuro | harris (negro y rosa-rojo) | carbon (gris carbón y teal). formato: horizontal | vertical. duracion: segundos. titulo y capas[i].texto del título.
- Momentos (llamada): capas[i].estilo = tarjeta | barra | pildora | circulo; capas[i].t = [inicio, fin]. Cámara de una línea: capas[i].camara = "seguir".
- Capas sankey, donut y cascada: capas[i].t = [inicio, fin] (cuánto tarda en construirse).

REGLAS DURAS DE EXACTITUD
- Nunca escribas una cifra a mano en un texto: las cifras salen de los datos (marcadores como {valor}, {fecha}). Un número literal en un texto no compila.
- Cada dato lleva su fuente. No inventes empresas, trimestres ni cifras. Si lo pedido necesita un dato que no existe, dilo y propón lo más cercano.
- Poco texto, sin textos que se pisen, el año siempre visible. Si un cambio hace que algo se pise, la auditoría lo detecta: no lo ocultes.`;

const humano = {
  pieza_actual: 'Miré la pieza abierta', editar_pieza: 'Edité la pieza', generar_trimestre: 'Armé el trimestre', generar_pieza: 'Armé la pieza', listar_trimestres: 'Busqué en la biblioteca de empresas',
  buscar_series: 'Busqué datos', descargar_serie: 'Traje el dato', analizar_serie: 'Analicé la serie', vista_previa: 'Revisé fotogramas', compilar_spec: 'Compilé la pieza',
};

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
export function chat(req, res, {mensaje, spec}) {
  const linea = (o) => { try { res.write(JSON.stringify(o) + '\n'); } catch { /* cliente cerrado */ } };
  res.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store'});
  if (ocupado) { linea({tipo: 'error', texto: 'Todavía estoy con el mensaje anterior. Espera un momento o pulsa «Parar».'}); linea({tipo: 'fin'}); res.end(); return; }
  ocupado = true;
  try { if (spec) fs.writeFileSync(ACTUAL, JSON.stringify(spec, null, 2)); else if (fs.existsSync(ACTUAL)) fs.unlinkSync(ACTUAL); } catch (e) { linea({tipo: 'error', texto: 'No pude guardar la pieza abierta: ' + e.message}); }
  const mtime0 = fs.existsSync(ACTUAL) ? fs.statSync(ACTUAL).mtimeMs : 0;
  const {mcp, instr} = archivosTemporales();
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--mcp-config', mcp, '--strict-mcp-config', '--allowedTools', 'mcp__ride-the-lightning',
    '--disallowedTools', 'Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', '--append-system-prompt-file', instr];
  if (sesion) args.push('--resume', sesion);
  const exe = ejecutableClaude(), conShell = process.platform === 'win32' && !/\.exe$/i.test(exe);
  const entorno = {...process.env, MCP_TIMEOUT: '60000', MCP_TOOL_TIMEOUT: '900000'};
  hijo = conShell ? spawn([exe, ...args].map(comillas).join(' '), {cwd: RAIZ, shell: true, windowsHide: true, env: entorno}) : spawn(exe, args, {cwd: RAIZ, windowsHide: true, env: entorno});
  const p = hijo; let resto = '', ultimaMtime = mtime0, terminado = false, huboTexto = false, errTxt = '';
  const revisarPieza = () => { try { const m = fs.statSync(ACTUAL).mtimeMs; if (m !== ultimaMtime) { ultimaMtime = m; const e = estadoPieza(); if (e) linea({tipo: 'pieza', ...e}); } } catch { /* aún no existe */ } };
  const poll = setInterval(revisarPieza, 700);
  const reloj = setTimeout(() => { linea({tipo: 'error', texto: `Llevaba más de ${Math.round(MAX_MS / 60000)} min y lo paré. Lo ya cambiado se queda.`}); matar(p); }, MAX_MS);
  const fin = () => { if (terminado) return; terminado = true; clearInterval(poll); clearTimeout(reloj); revisarPieza(); if (!huboTexto && errTxt) linea({tipo: 'error', texto: errTxt}); linea({tipo: 'fin'}); try { res.end(); } catch { /* ya cerrado */ } ocupado = false; hijo = null; };
  res.on('close', () => { if (!terminado) { matar(p); } });
  p.stdout.on('data', (trozo) => {
    resto += trozo.toString('utf8'); const ls = resto.split('\n'); resto = ls.pop() ?? '';
    for (const l of ls) {
      if (!l.trim()) continue; let ev; try { ev = JSON.parse(l); } catch { continue; }
      if (ev.session_id) sesion = ev.session_id;
      if (ev.type === 'assistant') for (const b of ev.message?.content ?? []) {
        if (b.type === 'text' && b.text.trim()) { huboTexto = true; linea({tipo: 'texto', texto: b.text}); }
        if (b.type === 'tool_use') { const corto = String(b.name).replace(/^mcp__ride-the-lightning__/, ''); if (humano[corto]) linea({tipo: 'accion', texto: humano[corto], herramienta: corto}); }
      }
      if (ev.type === 'user') revisarPieza();
      if (ev.type === 'result' && ev.is_error) errTxt = String(ev.result ?? 'Claude terminó con un error.');
    }
  });
  p.stderr.on('data', (t) => { errTxt = (errTxt + t.toString('utf8')).slice(-600); });
  p.on('error', (e) => { errTxt = e.code === 'ENOENT' ? 'No encuentro Claude Code en este equipo. Instálalo y entra con tu cuenta (claude), y vuelve a intentarlo.' : String(e.message); fin(); });
  p.on('close', (code) => { if (code && !huboTexto && !errTxt) errTxt = `Claude terminó con código ${code}. Prueba de nuevo.`; fin(); });
  p.stdin.on('error', () => undefined);
  p.stdin.end(mensaje);
}
export function pararChat() { if (hijo) { matar(hijo); return true; } return false; }
export function reiniciarChat() { sesion = null; return pararChat(); }
