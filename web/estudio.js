// Estudio guiado: 4 pasos para alguien que no sabe de código ni de finanzas. Todo lo difícil (descargas, momentos clave, cámara, ritmo,
// verificación) lo hace el servidor; aquí solo se elige y se revisa. «Modo experto» deja ver y editar la spec completa.
import {Escena} from '/motor/escena.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', play: '<path d="M6 4l14 8-14 8z" fill="currentColor"/>', pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>',
  up: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const api = async (u, o) => {
  const r = await fetch(u, o), j = await r.json().catch(() => ({}));
  if (!r.ok && !j.informe) throw new Error(j.error ?? r.statusText);
  return j;
};
const post = (u, body) => api(u, {method: 'POST', body: JSON.stringify(body)});
const guardar = () => { try { localStorage.setItem('rtl', JSON.stringify({series: S.series, plantilla: S.plantilla, titulo: S.titulo, formato: S.formato, camara: S.camara, vivo: S.vivo, foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, intento: S.intento, emp: S.emp, tituloEditado: S.tituloEditado, paso: Math.min(S.paso, 3), etiquetas: S.etiquetas, sel: S.sel})); } catch {} };
const cargarGuardado = () => { try { return JSON.parse(localStorage.getItem('rtl') ?? 'null'); } catch { return null; } };

const PASOS = ['Tus datos', 'Cómo verlo', 'Cámara y ritmo', 'Revisar y exportar'];
const S = Object.assign({estiloMomento: 'tarjeta', tema: 'oscuro', intento: 'serie', emp: null, empQ: '', empresas: null, trims: null, foco: 0, paso: 0, series: [], plantilla: 'historia', titulo: '', tituloAuto: true, formato: 'horizontal', camara: 'documental', vivo: false, etiquetas: {}, sel: null,
  bib: null, q: '', cat: '', plantillas: [], camaras: [], analisis: null, spec: null, plano: null, informe: null, notas: [], error: '', generando: false, modo: 'guiado', render: null, subida: null}, cargarGuardado() ?? {});
S.tituloEditado = !!S.tituloEditado && !!S.titulo;

// ── navegación entre pasos ──────────────────────────────────────────────────────────────────────────────────────
function puedeIr(n) {
  if (n === 0) return true;
  if (S.modo !== 'guiado' && S.plano) return true;
  if (n >= 1) return S.series.length > 0;
  return false;
}
function pintarPasos() {
  $('#pasos').innerHTML = PASOS.map((p, i) => `<button type="button" data-paso="${i}" ${i === S.paso ? 'aria-current="step"' : ''} class="${i < S.paso ? 'hecho' : ''}" ${puedeIr(i) ? '' : 'disabled'}><span class="n">${i < S.paso ? ic('check') : i + 1}</span>${p}</button>`).join('');
  $('#pasos').querySelectorAll('button').forEach((b) => (b.onclick = () => ir(+b.dataset.paso)));
}
function ir(n) { S.paso = n; guardar(); pintar(); window.scrollTo({top: 0, behavior: 'smooth'}); }
function pintar() { pintarPasos(); [paso1, paso2, paso3, paso4][S.paso](); }
const barraNav = (atras, sig, sigTxt, sigOk = true) => `<div class="barra-nav">${atras ? `<button class="btn" id="atras">${ic('back')}Atrás</button>` : '<span></span>'}${sig ? `<button class="btn p" id="sig" ${sigOk ? '' : 'disabled'}>${sigTxt}${ic('next')}</button>` : ''}</div>`;
function enlazarNav(paso) { const a = $('#atras'), s = $('#sig'); if (a) a.onclick = () => ir(paso - 1); if (s) s.onclick = () => ir(paso + 1); }

// ── PASO 1: datos ───────────────────────────────────────────────────────────────────────────────────────────────
async function cargarBiblioteca() {
  try { S.bib = await api(`/api/biblioteca?q=${encodeURIComponent(S.q)}&categoria=${encodeURIComponent(S.cat)}`); } catch (e) { S.bib = {series: [], categorias: [], total: 0, error: e.message}; }
  if (S.paso === 0) pintarLista();
}
const insigSalud = (s) => (s.estado === 'al_dia' ? `<span class="pill ok">${ic('check')}Al día</span>` : s.estado === 'atrasada' ? `<span class="pill av">${ic('warn')}Atrasada</span>` : `<span class="pill">Se descarga al elegirla</span>`);
const insigLic = (l) => (l.nivel === 'libre' ? `<span class="pill ok" title="${esc(l.texto)}">${ic('check')}Uso abierto</span>` : `<span class="pill av" title="${esc(l.texto)}">${ic('warn')}Uso restringido</span>`);
const estaElegida = (id) => S.series.some((s) => s.origen === 'biblioteca' && s.id === id);
function pintarLista() {
  const cont = $('#lista'); if (!cont) return;
  if (!S.bib) { cont.innerHTML = '<p class="ayuda">Cargando la biblioteca…</p>'; return; }
  if (S.bib.error) { cont.innerHTML = `<div class="aviso mal">${ic('warn')}<div>No se pudo cargar la biblioteca: ${esc(S.bib.error)}. Reintenta en unos segundos.</div></div>`; return; }
  $('#chips').innerHTML = [`<button type="button" class="chip" data-c="" aria-pressed="${S.cat === ''}">Todo (${S.bib.total})</button>`, ...S.bib.categorias.map((c) => `<button type="button" class="chip" data-c="${esc(c.nombre)}" aria-pressed="${S.cat === c.nombre}">${esc(c.nombre)} (${c.n})</button>`)].join('');
  $('#chips').querySelectorAll('button').forEach((b) => (b.onclick = () => { S.cat = b.dataset.c; cargarBiblioteca(); }));
  if (!S.bib.series.length) { cont.innerHTML = '<p class="ayuda">No encontré datos con esa búsqueda. Prueba con una palabra más simple: «oro», «bitcoin», «petróleo», «inflación»…</p>'; return; }
  cont.innerHTML = `<div class="rejilla" role="group" aria-label="Datos disponibles">${S.bib.series.map((s) => `
    <button type="button" class="carta" role="checkbox" aria-checked="${estaElegida(s.id)}" data-id="${esc(s.id)}">
      <span class="marca">${ic('check')}</span>
      <span class="tit">${esc(s.nombre)}</span>
      <span class="sub">${esc(s.categoria)} · ${esc(s.frecuencia)}</span>
      <span class="meta">${s.inicio ? `${esc(String(s.inicio).slice(0, 4).replace(/^-0*/, '−'))} → ${esc(String(s.fin).slice(0, 4))} · ${s.filas.toLocaleString('es-CO')} datos` : 'Historia completa desde el primer dato'}</span>
      <span class="sub">Fuente: ${esc(s.fuente)}</span>
      <span class="insig">${insigSalud(s.salud)}${insigLic(s.licencia)}</span>
    </button>`).join('')}</div>`;
  cont.querySelectorAll('.carta').forEach((b) => (b.onclick = () => alternar(S.bib.series.find((x) => x.id === b.dataset.id))));
}
function alternar(ficha) {
  const i = S.series.findIndex((s) => s.origen === 'biblioteca' && s.id === ficha.id);
  if (i >= 0) S.series.splice(i, 1);
  else { if (S.series.length >= 10) { aviso('Puedes combinar hasta 10 datos. Quita alguno para añadir otro.'); return; } S.series.push({origen: 'biblioteca', id: ficha.id, nombre: ficha.nombre.split(' — ')[0], ficha}); }
  S.sel = null; S.analisis = null; S.modo = 'guiado'; guardar(); pintarLista(); pintarSeleccion(); pintarPasos(); regenerar();
}
function pintarSeleccion() {
  const c = $('#seleccion'); if (!c) return;
  c.innerHTML = S.series.length ? `<div class="caja"><strong>Elegidos (${S.series.length}):</strong>${S.series.map((s, k) => `<span class="ficha-sel">${esc(s.nombre)}<button type="button" data-k="${k}" aria-label="Quitar ${esc(s.nombre)}">${ic('x')}</button></span>`).join('')}<span class="esp"></span><button class="btn p" id="sig">Siguiente: cómo lo quieres ver${ic('next')}</button></div>` : '<div class="caja"><span class="ayuda" style="margin:0">Todavía no elegiste ningún dato.</span></div>';
  c.querySelectorAll('.ficha-sel button').forEach((b) => (b.onclick = () => { S.series.splice(+b.dataset.k, 1); S.sel = null; S.analisis = null; guardar(); pintarLista(); pintarSeleccion(); pintarPasos(); regenerar(); }));
  const s = $('#sig'); if (s) s.onclick = () => ir(1);
}
// El primer paso no pide elegir «un tipo de gráfico»: pide elegir QUÉ HISTORIA se quiere contar. El estilo se deduce de ahí.
const INTENTOS = [
  {id: 'serie', t: 'Algo que cambia en el tiempo', s: 'Bitcoin, oro, inflación, tasas… Datos reales completos, siempre al día.', mini: 'historia', plantilla: 'historia'},
  {id: 'flujos', t: 'Cómo gana y gasta dinero una empresa', s: 'Diagrama de flujo, trimestre a trimestre, con datos oficiales de la SEC.', mini: 'resultados', plantilla: 'resultados'},
  {id: 'composicion', t: 'Cuánto pesa cada parte', s: 'Un anillo con las partes de un total y su porcentaje.', mini: 'composicion', plantilla: 'composicion'},
  {id: 'puente', t: 'Qué sumó y qué restó', s: 'Una cascada desde un total hasta el resultado. También para pérdidas.', mini: 'puente', plantilla: 'puente'},
];
const claseDe = (intento) => (intento === 'serie' ? 'serie' : intento === 'flujos' ? 'flujos' : 'categorias');
const claseDatos = () => S.series[0]?.tabla ?? (S.series.length ? 'serie' : claseDe(S.intento));
function paso1() {
  $('#paso').innerHTML = `
    <h2>¿Qué quieres contar?</h2>
    <p class="ayuda">Elige una historia. El tipo de gráfico, la cámara y los colores los resolvemos nosotros.</p>
    <div class="rejilla" id="intentos" style="grid-template-columns:repeat(2,minmax(0,1fr))" role="radiogroup" aria-label="Qué quieres contar">${INTENTOS.map((i) => `<button type="button" class="carta" role="radio" aria-checked="${S.intento === i.id}" data-id="${i.id}">${MINI[i.mini] ?? ''}<span class="marca">${ic('check')}</span><span class="tit">${esc(i.t)}</span><span class="sub">${esc(i.s)}</span></button>`).join('')}</div>
    <div id="bloque"></div>`;
  $('#intentos').querySelectorAll('.carta').forEach((b) => (b.onclick = () => {
    const nuevo = b.dataset.id; if (nuevo === S.intento) return;
    S.intento = nuevo;
    if (S.series.length && claseDatos() !== claseDe(nuevo)) { S.series = []; S.sel = null; S.analisis = null; S.subida = null; S.spec = S.plano = S.informe = null; mostrarVista(); }
    S.plantilla = INTENTOS.find((i) => i.id === nuevo).plantilla; guardar(); paso1(); pintarPasos();
  }));
  if (S.intento === 'serie') paso1Serie(); else paso1Tabla();
}
function paso1Serie() {
  $('#bloque').innerHTML = `
    <p class="ayuda">Elige un dato real. Se descarga <strong>completo, desde el primer registro que existe</strong>, y se mantiene al día solo. No tienes que buscar ni pasar archivos.</p>
    <label class="etq" for="busca">Busca en palabras simples</label>
    <input id="busca" type="search" placeholder="oro, bitcoin, petróleo, inflación, dólar, población…" value="${esc(S.q)}" autocomplete="off">
    <div class="chips" id="chips" role="group" aria-label="Categorías"></div>
    <div id="lista"></div>
    <div class="seleccion" id="seleccion"></div>
    <h3>Resultados de una empresa en el tiempo</h3>
    <p class="ayuda">Ingresos, utilidad y margen trimestre a trimestre, con datos oficiales de la SEC. Marca una o varias métricas de la misma empresa (para comparar empresas entre sí, usa «Una empresa, un trimestre» o tu propia tabla).</p>
    <label class="etq" for="busS">Busca una empresa de la bolsa de EE. UU.</label>
    <input id="busS" type="search" placeholder="Amazon, Apple, NVIDIA…" autocomplete="off">
    <div id="empSerie"></div>
    <h3>¿Tienes tus propios datos?</h3>
    <p class="ayuda">Suelta un Excel (xlsx, xls, xlsb, ods), un CSV, TSV o JSON. Te preguntamos solo lo necesario.</p>
    <div id="drop" tabindex="0">${ic('up')} Suelta aquí tu archivo o <label for="arch" style="color:var(--oro);text-decoration:underline;cursor:pointer">elígelo</label><input id="arch" type="file" class="sr"></div>
    <div id="subida"></div>`;
  let d; $('#busca').oninput = (e) => { S.q = e.target.value; clearTimeout(d); d = setTimeout(cargarBiblioteca, 250); };
  const drop = $('#drop'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('sobre'); }; drop.ondragleave = () => drop.classList.remove('sobre');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('sobre'); subir(e.dataTransfer.files[0]); };
  $('#arch').onchange = (e) => subir(e.target.files[0]);
  pintarSeleccion(); pintarSubida(); iniciarEmpSerie(); if (S.bib) pintarLista(); else cargarBiblioteca();
}

// ── resultados de una empresa como series de tiempo (se mezclan con el resto de la biblioteca) ─────────────────────
let empSeriesDeb, empSeriesSel = null;
function iniciarEmpSerie() {
  const inp = $('#busS'); if (!inp) return;
  const buscar = async () => {
    const l = (await api('/api/empresas?q=' + encodeURIComponent(inp.value))).empresas.slice(0, 16), box = $('#empSerie'); if (!box) return;
    box.innerHTML = `<div class="chips">${l.map((e) => `<button type="button" class="chip" data-t="${esc(e.ticker)}" aria-pressed="${empSeriesSel?.ticker === e.ticker}">${esc(e.nombre)} <small style="opacity:.6">${esc(e.ticker)}</small></button>`).join('')}</div><div id="empMetricas"></div>`;
    box.querySelectorAll('.chip').forEach((b) => (b.onclick = async () => {
      $('#empMetricas').innerHTML = '<p class="ayuda"><span class="pulso"></span> Trayendo los resultados de la SEC (10–20 s la primera vez)…</p>';
      try { empSeriesSel = await api('/api/serie-empresa?ticker=' + b.dataset.t); pintarMetricas(); } catch (e) { $('#empMetricas').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; }
    }));
    if (empSeriesSel) pintarMetricas();
  };
  inp.oninput = () => { clearTimeout(empSeriesDeb); empSeriesDeb = setTimeout(buscar, 250); };
  buscar();
}
function pintarMetricas() {
  const box = $('#empMetricas'); if (!box || !empSeriesSel) return;
  if (!empSeriesSel.series.length) { box.innerHTML = `<div class="aviso">${ic('info')}<div>${esc(empSeriesSel.nombre)} no presenta resultados como empresa industrial o de servicios (bancos, aseguradoras y empresas nuevas suelen quedar fuera).</div></div>`; return; }
  const on = (s) => S.series.some((x) => x.ruta === s.ruta && x.col === s.col);
  box.innerHTML = `<p class="ayuda" style="margin:10px 0 4px"><strong>${esc(empSeriesSel.nombre)}</strong> · de ${esc(empSeriesSel.desde)} a ${esc(empSeriesSel.hasta)}. Marca lo que quieras graficar:</p><div class="chips">${empSeriesSel.series.map((s, k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${on(s)}">${esc(s.nombre.split(' · ')[1])}</button>`).join('')}</div>`;
  box.querySelectorAll('.chip').forEach((b) => (b.onclick = () => {
    const s = empSeriesSel.series[+b.dataset.k], i = S.series.findIndex((x) => x.ruta === s.ruta && x.col === s.col);
    if (S.series.some((x) => x.tabla || x.origen === "biblioteca" || x.ruta !== s.ruta)) S.series = [];   // una sola empresa a la vez
    if (i >= 0) S.series.splice(i, 1); else { if (S.series.length >= 10) { aviso('Puedes combinar hasta 10 datos.'); return; } S.series.push(s); }
    S.sel = null; S.analisis = null; S.modo = 'guiado'; S.tituloEditado = false; guardar(); pintarMetricas(); pintarSeleccion(); pintarPasos(); regenerar();
  }));
}

// ── historias con tablas: empresa + trimestre (SEC), o tu propia tabla ──────────────────────────────────────────────
const AYUDA_TABLA = {
  flujos: {cols: 'Tres columnas: <strong>origen</strong>, <strong>destino</strong> y <strong>valor</strong> (y, si quieres, <strong>tipo</strong>: ingreso, beneficio o costo).', archivo: 'estado_resultados_ejemplo.csv'},
  composicion: {cols: 'Dos columnas: <strong>concepto</strong> y <strong>valor</strong>.', archivo: 'composicion_ejemplo.csv'},
  puente: {cols: 'Dos columnas: <strong>concepto</strong> y <strong>valor</strong> (las restas con signo menos). En <strong>tipo</strong> marca «inicio» la primera fila y «total» los subtotales: se comprueba que cuadren.', archivo: 'puente_ejemplo.csv'},
};
function paso1Tabla() {
  const conEmpresa = S.intento === 'flujos' || S.intento === 'puente', a = AYUDA_TABLA[S.intento];
  $('#bloque').innerHTML = `
    ${conEmpresa ? `<h3>Una empresa, un trimestre</h3>
      <p class="ayuda">Los números salen del <strong>reporte oficial</strong> que la empresa entrega a la SEC (10-Q / 10-K). Cuando publique el siguiente, aparece aquí solo.</p>
      <label class="etq" for="busE">Busca entre las más de 7.000 empresas de la bolsa de EE. UU. (nombre o ticker)</label>
      <input id="busE" type="search" placeholder="Amazon, Apple, NVIDIA, SoFi, Uber…" value="${esc(S.empQ)}" autocomplete="off">
      <div id="listaE"></div><div id="trims"></div>` : ''}
    <h3>${conEmpresa ? 'O usa tu propia tabla' : 'Tu tabla'}</h3>
    <p class="ayuda">${a.cols} Excel (xlsx, xls, ods) o CSV.</p>
    <div class="fila"><button class="btn" id="ej">${ic('film')}Probar con un ejemplo</button><a class="btn" href="/ejemplos/${a.archivo}" download>${ic('up')}Descargar la plantilla</a></div>
    <div id="drop" tabindex="0" style="margin-top:12px">${ic('up')} Suelta aquí tu archivo o <label for="arch" style="color:var(--oro);text-decoration:underline;cursor:pointer">elígelo</label><input id="arch" type="file" class="sr"></div>
    <div id="subida"></div>
    <div class="seleccion" id="seleccion"></div>`;
  const drop = $('#drop'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('sobre'); }; drop.ondragleave = () => drop.classList.remove('sobre');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('sobre'); subir(e.dataTransfer.files[0]); };
  $('#arch').onchange = (e) => subir(e.target.files[0]);
  $('#ej').onclick = async () => {
    try {
      const j = await api('/api/ejemplo?id=' + S.intento);
      S.series = [{origen: 'archivo', ruta: j.ruta, tabla: j.tabla, nombre: j.nombre, fuente: j.fuente, prefijo: j.prefijo, sufijo: j.sufijo, decimales: j.decimales}];
      S.plantilla = INTENTOS.find((i) => i.id === S.intento).plantilla; S.tituloEditado = false; S.sel = null; S.analisis = null; S.modo = 'guiado';
      guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso('Ejemplo cargado: mira la vista previa. Las cifras son de demostración.');
    } catch (e) { $('#subida').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; }
  };
  pintarSeleccion(); if (S.subida) pintarSubidaTabla();
  if (conEmpresa) {
    let d; $('#busE').oninput = (e) => { S.empQ = e.target.value; clearTimeout(d); d = setTimeout(cargarEmpresas, 200); };
    cargarEmpresas(); if (S.emp && S.trims) pintarTrims();
  }
}
async function cargarEmpresas() {
  try { S.empresas = (await api('/api/empresas?q=' + encodeURIComponent(S.empQ))).empresas; } catch (e) { S.empresas = []; }
  pintarEmpresas();
}
function pintarEmpresas() {
  const c = $('#listaE'); if (!c) return;
  const l = S.empresas ?? []; if (!l.length) { c.innerHTML = '<p class="ayuda">No encuentro esa empresa en la bolsa de EE. UU. Prueba con otro nombre o con su ticker, o sube tu propia tabla abajo.</p>'; return; }
  c.innerHTML = `<p class="ayuda" style="margin:8px 0 4px">${S.empQ.trim() ? `${l.length} resultado${l.length === 1 ? '' : 's'}` : 'Empresas destacadas (con toda su historia desde 2009)'}. Las demás se traen de la SEC al elegirlas (unos segundos).</p>
    <div class="chips" role="radiogroup" aria-label="Empresas">${l.map((e) => `<button type="button" class="chip" role="radio" data-t="${esc(e.ticker)}" aria-checked="${S.emp === e.ticker}" aria-pressed="${S.emp === e.ticker}" title="${e.trimestres ? e.trimestres + ' trimestres · último ' + esc(e.ultimo) : 'Se descarga al elegirla'}">${esc(e.nombre)} <small style="opacity:.6">${esc(e.ticker)}</small></button>`).join('')}</div>`;
  c.querySelectorAll('.chip').forEach((b) => (b.onclick = () => elegirEmpresa(b.dataset.t)));
}
async function elegirEmpresa(t) {
  S.emp = t; S.trims = null; pintarEmpresas(); const box = $('#trims'); if (box) box.innerHTML = '<p class="ayuda"><span class="pulso"></span> Trayendo los trimestres de la SEC (la primera vez de una empresa tarda 10–20 s)…</p>';
  try { S.trims = await api('/api/trimestres?ticker=' + t); } catch (e) { if (box) box.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; return; }
  guardar(); pintarTrims();
}
const fmtMM = (v) => (v >= 1e9 ? 'US$ ' + (v / 1e9).toLocaleString('es-CO', {maximumFractionDigits: 1}) + ' mil M' : 'US$ ' + (v / 1e6).toLocaleString('es-CO', {maximumFractionDigits: 0}) + ' M');
function pintarTrims() {
  const box = $('#trims'); if (!box || !S.trims) return;
  const T = S.trims, flujo = S.intento === 'flujos', sel = S.series[0]?.trimestre, esSel = (t) => sel && sel.ticker === T.ticker && sel.fin === t.fin;
  const chip = (t) => { const off = flujo && !t.sankey; return `<button type="button" class="chip" data-fin="${t.fin}" aria-pressed="${esSel(t)}" ${off ? 'disabled' : ''} title="${esc(off ? 'Trimestre con pérdida: el flujo no puede dibujarlo. Usa «Qué sumó y qué restó».' : `Reporte ${t.form} del ${t.publicado} · ingresos ${fmtMM(t.ingresos)}${t.q4Calculado ? ' · Q4 calculado: año − 9 meses' : ''}${t.conSegmentos ? ' · con ingresos por producto' : ''}`)}">${esc(t.etiqueta.replace(' FY', ' · '))}${t.conSegmentos ? ' <span title="Incluye ingresos por producto o segmento" style="color:var(--oro)">●</span>' : ''}</button>`; };
  if (T.sinDatos) { box.innerHTML = `<h3 style="margin-top:14px">${esc(T.nombre)}</h3><div class="aviso">${ic('info')}<div>${esc(T.sinDatos)}</div></div>`; return; }
  const recientes = T.trimestres.slice(0, 8), resto = T.trimestres.slice(8), porAnio = {};
  resto.forEach((t) => (porAnio[t.fy] ??= []).push(t));
  box.innerHTML = `<h3 style="margin-top:14px">${esc(T.nombre)} · elige un trimestre</h3>
    <div class="chips" role="group" aria-label="Trimestres recientes">${recientes.map(chip).join('')}</div>
    ${resto.length ? `<details class="det"><summary>Ver los ${resto.length} trimestres anteriores (desde ${esc(T.trimestres.at(-1).etiqueta)})</summary>${Object.entries(porAnio).sort((a, b) => b[0] - a[0]).map(([y, l]) => `<p class="etq" style="margin:10px 0 4px">FY${y}</p><div class="chips">${l.map(chip).join('')}</div>`).join('')}</details>` : ''}
    <p class="ayuda" style="margin-top:10px">Fuente: SEC EDGAR · dominio público. Última revisión ${esc(String(T.actualizado).slice(0, 10))}. Los trimestres nuevos se suman solos.</p>`;
  box.querySelectorAll('.chip').forEach((b) => (b.onclick = () => elegirTrim(b.dataset.fin)));
}
async function elegirTrim(fin) {
  const uso = S.intento === 'puente' ? 'puente' : 'sankey';
  try {
    const it = await api(`/api/trimestre?ticker=${S.emp}&fin=${fin}&uso=${uso}`);
    S.series = [it]; S.plantilla = uso === 'sankey' ? 'resultados' : 'puente'; S.sel = null; S.analisis = null; S.modo = 'guiado'; S.tituloEditado = false;
    guardar(); pintarSeleccion(); pintarPasos(); pintarTrims(); regenerar(); aviso(`${it.nombre}: listo. Mira la vista previa.`);
  } catch (e) { $('#trims').insertAdjacentHTML('beforeend', `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`); }
}
function pintarSubidaTabla() {
  const box = $('#subida'); if (!box || !S.subida) return;
  const {insp, ruta, nombre, tabla} = S.subida, necesita = claseDe(S.intento), nom = nombre.replace(/\.[^.]+$/, '');
  if (tabla !== necesita) {
    box.innerHTML = `<div class="aviso mal">${ic('warn')}<div><strong>Esta tabla no sirve para esta historia.</strong><br>Tiene las columnas: ${insp.columnas.map((c) => esc(c.nombre)).join(', ')}.<br>${AYUDA_TABLA[S.intento].cols}</div></div>`; return;
  }
  box.innerHTML = `<div class="simple" style="margin-top:12px"><h3>${esc(nombre)} · ${insp.filas.toLocaleString('es-CO')} filas · detecté una tabla de ${tabla === 'flujos' ? 'flujos' : 'categorías'}</h3>
    <label class="etq" for="fnom">¿De dónde vienen estos datos? (obligatorio)</label>
    <input id="fnom" type="text" placeholder="Ej.: Informe trimestral de la empresa, 2026">
    <p class="ayuda" style="margin:6px 0 0">Sale escrito al pie del video. Sin fuente no podemos garantizar la exactitud.</p>
    <div class="fila" style="margin-top:10px"><div><label class="etq" for="fpre">Símbolo antes de la cifra</label><input id="fpre" type="text" placeholder="US$ " maxlength="6"></div><div><label class="etq" for="fsuf">Texto después de la cifra</label><input id="fsuf" type="text" placeholder=" mil M" maxlength="10"></div></div>
    <div id="errSub"></div><div class="fila" style="margin-top:12px"><button class="btn p" id="usarSub">Usar esta tabla</button></div></div>`;
  $('#usarSub').onclick = () => {
    const fn = $('#fnom').value.trim(); if (!fn) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>Falta decir de dónde vienen los datos.</div></div>`; $('#fnom').focus(); return; }
    S.series = [{origen: 'archivo', ruta, hoja: insp.hoja ?? undefined, filaEncabezado: insp.filaEncabezado, tabla, nombre: nom, fuente: {nombre: fn, obtenido: new Date().toISOString().slice(0, 10)}, prefijo: $('#fpre').value || undefined, sufijo: $('#fsuf').value || undefined, decimales: 'auto'}];
    S.plantilla = INTENTOS.find((i) => i.id === S.intento).plantilla; S.tituloEditado = false; S.sel = null; S.analisis = null; S.modo = 'guiado';
    guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso('Listo: tu tabla está elegida. Mira la vista previa.');
  };
}

// ── datos propios ───────────────────────────────────────────────────────────────────────────────────────────────
async function subir(f) {
  if (!f) return;
  const box = $('#subida'); box.innerHTML = '<p class="ayuda">Leyendo tu archivo…</p>';
  try {
    const j = await api('/api/subir?nombre=' + encodeURIComponent(f.name), {method: 'POST', body: await f.arrayBuffer()});
    if (j.tipo === 'imagen') { box.innerHTML = `<div class="aviso ok">${ic('check')}<div>Imagen guardada: <span class="mono">${esc(j.ruta)}</span>. Las imágenes se usan como fondo o encuadre en el Modo experto.</div></div>`; return; }
    S.subida = {ruta: j.ruta, insp: j.inspeccion, nombre: f.name, tabla: j.tabla};
    if (j.tabla && S.intento === 'serie') { S.intento = j.tabla === 'flujos' ? 'flujos' : 'composicion'; S.plantilla = S.intento === 'flujos' ? 'resultados' : 'composicion'; guardar(); paso1(); pintarPasos(); return; }   // parece una tabla: pasamos a la historia que le corresponde
    if (S.intento === 'serie') pintarSubida(); else pintarSubidaTabla();
  } catch (e) { box.innerHTML = `<div class="aviso mal">${ic('warn')}<div>No pude leer ese archivo: ${esc(e.message)}</div></div>`; }
}
function pintarSubida() {
  const box = $('#subida'); if (!box || !S.subida) return;
  const {insp, ruta, nombre} = S.subida, cols = insp.columnas, fecha = cols.find((c) => c.tipo === 'fecha') ?? cols.find((c) => c.tipo === 'número' && Number(c.primero) > 1000 && Number(c.primero) < 2200) ?? cols[0];
  const nums = cols.filter((c) => c.tipo === 'número' && c !== fecha);
  box.innerHTML = `<div class="simple" style="margin-top:12px">
    <h3>${esc(nombre)} · ${insp.filas.toLocaleString('es-CO')} filas${insp.hoja ? ' · hoja «' + esc(insp.hoja) + '»' : ''}</h3>
    ${insp.hojas && insp.hojas.length > 1 ? `<label class="etq" for="hoja">Hoja del libro</label><select id="hoja">${insp.hojas.map((h) => `<option ${h === insp.hoja ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select>` : ''}
    <label class="etq" for="colX" style="margin-top:10px">¿Qué columna tiene las fechas o los años?</label>
    <select id="colX">${cols.map((c) => `<option value="${esc(c.nombre)}" ${c === fecha ? 'selected' : ''}>${esc(c.nombre)} (${esc(c.tipo)})</option>`).join('')}</select>
    <p class="etq" style="margin-top:12px">¿Qué quieres graficar?</p>
    ${nums.length ? nums.slice(0, 12).map((c, k) => `<label class="conmuta" style="margin:4px 0"><input type="checkbox" class="cv" value="${esc(c.nombre)}" ${k === 0 ? 'checked' : ''}><span>${esc(c.nombre)}<br><small class="mono" style="color:var(--suave)">ej.: ${esc((c.ejemplo ?? []).join(' · '))}</small></span></label>`).join('') : '<p class="ayuda">No encontré columnas numéricas. Revisa que los números no tengan texto.</p>'}
    <label class="etq" for="fnom" style="margin-top:12px">¿De dónde vienen estos datos? (obligatorio)</label>
    <input id="fnom" type="text" placeholder="Ej.: Banco Central de Chile, serie IPC (descargado en 2026)">
    <p class="ayuda" style="margin:6px 0 0">Esto sale escrito al pie del video. Sin una fuente no podemos garantizar la exactitud.</p>
    <details class="det"><summary>Opciones avanzadas</summary>
      <label class="etq" for="fdec">Separador decimal de los números</label><select id="fdec"><option value="">Automático (punto)</option><option value=",">Coma (1.234,56)</option></select>
      <label class="etq" for="ffec" style="margin-top:8px">Si las fechas son 03/04/2020, ¿qué orden usan?</label><select id="ffec"><option value="">No aplica / ISO</option><option value="dmy">Día/Mes/Año</option><option value="mdy">Mes/Día/Año</option></select>
      <label class="conmuta" style="margin-top:8px"><input type="checkbox" id="fser"><span>Las fechas son números de serie de Excel (43831, 43862…)</span></label>
    </details>
    <div id="errSub"></div>
    <div class="fila" style="margin-top:12px"><button class="btn p" id="usarSub">Usar estos datos</button></div></div>`;
  const hs = $('#hoja'); if (hs) hs.onchange = async () => { const j = await api(`/api/inspeccionar?archivo=${encodeURIComponent(ruta)}&hoja=${encodeURIComponent(hs.value)}`); S.subida.insp = j; pintarSubida(); };
  $('#usarSub').onclick = () => {
    const fn = $('#fnom').value.trim(), x = $('#colX').value, vs = [...box.querySelectorAll('.cv:checked')].map((i) => i.value), cx = cols.find((c) => c.nombre === x);
    if (!fn) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>Falta decir de dónde vienen los datos.</div></div>`; $('#fnom').focus(); return; }
    if (!vs.length) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>Marca al menos una columna para graficar.</div></div>`; return; }
    S.series = vs.map((v) => ({origen: 'archivo', ruta, hoja: insp.hoja ?? undefined, filaEncabezado: insp.filaEncabezado, x, tipoX: cx.tipo === 'fecha' ? 'fecha' : cx.tipo === 'número' && Number(cx.primero) > 1000 && Number(cx.primero) < 2200 ? 'anio' : 'num', col: v, nombre: v,
      decimal: $('#fdec').value || undefined, formatoFecha: $('#ffec').value || undefined, fechaSerial: $('#fser').checked || undefined, fuente: {nombre: fn, obtenido: new Date().toISOString().slice(0, 10)}}));
    S.sel = null; S.analisis = null; S.modo = 'guiado'; guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso('Listo: tus datos están elegidos. Mira la vista previa y pulsa «Siguiente».');
  };
}

// ── PASO 2: cómo verlo ──────────────────────────────────────────────────────────────────────────────────────────
const MINI = {
  comparar: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M8 60 L50 56 L90 62 L130 50 L190 52" fill="none" stroke="#50B5A2" stroke-width="2" opacity=".4"/><path d="M8 66 L50 64 L90 56 L130 58 L190 40" fill="none" stroke="#C27BCB" stroke-width="2" opacity=".4"/><path d="M8 72 L50 60 L90 46 L130 30 L190 12" fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/><circle cx="190" cy="12" r="5" fill="#fff"/></svg>',
  historia: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M8 70 L40 64 L64 66 L96 40 L124 46 L168 18 L168 78 L8 78Z" fill="#C9A84C" opacity=".15"/><path d="M8 70 L40 64 L64 66 L96 40 L124 46 L168 18" fill="none" stroke="#C9A84C" stroke-width="3" stroke-linecap="round"/><circle cx="168" cy="18" r="5" fill="#fff"/><rect x="104" y="6" width="50" height="22" rx="3" fill="#232320" stroke="#C9A84C"/></svg>',
  panel: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + [[8, 6], [106, 6], [8, 46], [106, 46]].map(([x, y], k) => `<path d="M${x} ${y + 32} L${x + 24} ${y + 24} L${x + 48} ${y + 28} L${x + 84} ${y + 6}" fill="none" stroke="${['#C9A84C', '#50B5A2', '#C27BCB', '#CBC6BC'][k]}" stroke-width="2.5"/>`).join('') + '</svg>',
  carrera: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + [150, 120, 96, 60].map((w, k) => `<rect x="10" y="${8 + k * 19}" width="${w}" height="13" rx="2" fill="${['#CBC6BC', '#50B5A2', '#C9A84C', '#C27BCB'][k]}"/>`).join('') + '</svg>',
  resultados: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><rect x="8" y="12" width="8" height="60" fill="#C9A84C"/><path d="M16 14 C50 14 50 8 84 8 L84 38 C50 38 50 70 16 70Z" fill="#4FB477" opacity=".4"/><path d="M16 40 C50 40 50 44 84 44 L84 70 C50 70 50 70 16 70Z" fill="#D9534F" opacity=".4"/><rect x="84" y="8" width="8" height="30" fill="#4FB477"/><rect x="84" y="44" width="8" height="26" fill="#D9534F"/><path d="M92 10 C130 10 130 12 168 12 L168 26 C130 26 130 30 92 30Z" fill="#4FB477" opacity=".4"/><path d="M92 32 C130 32 130 48 168 48 L168 60 C130 60 130 36 92 36Z" fill="#D9534F" opacity=".4"/><rect x="168" y="12" width="8" height="14" fill="#4FB477"/><rect x="168" y="48" width="8" height="12" fill="#D9534F"/></svg>',
  composicion: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><g transform="translate(46 42)" fill="none" stroke-width="16">' + [['#C9A84C', 0, 38], ['#50B5A2', 38, 24], ['#C27BCB', 62, 20], ['#4FB477', 82, 12], ['#CBC6BC', 94, 6]].map(([c, a, b]) => `<circle r="26" stroke="${c}" stroke-dasharray="${(b * 163.4) / 100} 163.4" stroke-dashoffset="${-(a * 163.4) / 100}" transform="rotate(-90)"/>`).join('') + '</g><g fill="#CBC6BC" opacity=".5"><rect x="104" y="18" width="70" height="6" rx="2"/><rect x="104" y="34" width="56" height="6" rx="2"/><rect x="104" y="50" width="62" height="6" rx="2"/></g></svg>',
  puente: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><rect x="12" y="10" width="22" height="62" fill="#C9A84C"/><rect x="44" y="10" width="22" height="26" fill="#D9534F"/><rect x="76" y="36" width="22" height="36" fill="#C9A84C"/><rect x="108" y="36" width="22" height="14" fill="#D9534F"/><rect x="140" y="50" width="22" height="22" fill="#4FB477" opacity=".9"/><path d="M34 10 H44 M66 36 H76 M98 36 H108 M130 50 H140" stroke="#CBC6BC" stroke-dasharray="3 3" opacity=".6"/></svg>',
  pendiente: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M60 62 L140 14" stroke="#50B5A2" stroke-width="3.5" stroke-linecap="round"/><path d="M60 40 L140 52" stroke="#C27BCB" stroke-width="3.5" stroke-linecap="round"/><path d="M60 22 L140 70" stroke="#D9534F" stroke-width="3.5" stroke-linecap="round"/><g fill="#fff"><circle cx="60" cy="62" r="4.5"/><circle cx="140" cy="14" r="4.5"/><circle cx="60" cy="40" r="4.5"/><circle cx="140" cy="52" r="4.5"/><circle cx="60" cy="22" r="4.5"/><circle cx="140" cy="70" r="4.5"/></g></svg>',
  bump: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M16 14 C50 14 50 42 84 42 S120 14 184 14" fill="none" stroke="#C9A84C" stroke-width="4"/><path d="M16 42 C50 42 50 14 84 14 S120 42 184 42" fill="none" stroke="#50B5A2" stroke-width="4"/><path d="M16 70 H184" stroke="#C27BCB" stroke-width="4"/></svg>',
  divergente: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M70 6 V78" stroke="#CBC6BC" opacity=".6"/><rect x="70" y="10" width="110" height="12" fill="#4FB477"/><rect x="70" y="30" width="62" height="12" fill="#4FB477"/><rect x="40" y="50" width="30" height="12" fill="#D9534F"/><rect x="14" y="68" width="56" height="10" fill="#D9534F"/></svg>',
  treemap: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><rect x="6" y="6" width="100" height="72" fill="#C9A84C" opacity=".9"/><rect x="108" y="6" width="86" height="40" fill="#50B5A2" opacity=".9"/><rect x="108" y="48" width="52" height="30" fill="#C27BCB" opacity=".9"/><rect x="162" y="48" width="32" height="30" fill="#D9534F" opacity=".9"/></svg>',
  waffle: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + Array.from({length: 40}, (_, i) => `<rect x="${44 + (i % 10) * 11.5}" y="${6 + Math.floor(i / 10) * 19}" width="9" height="15" fill="${i < 18 ? '#C9A84C' : i < 29 ? '#50B5A2' : i < 36 ? '#C27BCB' : '#CBC6BC'}"/>`).join('') + '</svg>',
  lollipop: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + [150, 110, 80, 46].map((w, k) => `<path d="M12 ${14 + k * 19} H${12 + w}" stroke="${['#C9A84C', '#50B5A2', '#C27BCB', '#4FB477'][k]}" stroke-width="4"/><circle cx="${12 + w}" cy="${14 + k * 19}" r="7" fill="${['#C9A84C', '#50B5A2', '#C27BCB', '#4FB477'][k]}"/>`).join('') + '</svg>',
  correlacion: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect x="${50 + c * 26}" y="${4 + r * 19}" width="24" height="17" rx="2" fill="${r === c ? '#50B5A2' : (r + c) % 3 === 0 ? '#C27BCB' : '#50B5A2'}" opacity="${r === c ? 1 : 0.25 + ((r * 3 + c) % 4) * 0.2}"/>`)).join('') + '</svg>',
};
async function paso2() {
  const n = S.series.length;
  $('#paso').innerHTML = `
    <h2>¿Cómo lo quieres ver?</h2>
    <p class="ayuda">Elige un estilo. Ya viene con el ritmo, los zooms y los colores de marca resueltos; tú decides qué contar.</p>
    ${(() => {
      // solo se muestran los estilos que sirven para lo que elegiste; el resto queda plegado (sin regañar)
      const clase = claseDatos(), mios = S.plantillas.filter((p) => (p.datos ?? 'serie') === clase), encajan = mios.filter((p) => n >= p.necesita.min && n <= p.necesita.max), otros = mios.filter((p) => !encajan.includes(p));
      const carta = (p, ok) => `<button type="button" class="carta tpl" role="radio" aria-checked="${S.plantilla === p.id}" aria-disabled="${!ok}" data-id="${p.id}">${MINI[p.id] ?? ''}<span class="marca">${ic('check')}</span><span class="tit">${esc(p.nombre)}</span><span class="sub">${esc(p.descripcion)}</span>${ok ? '' : `<span class="sub" style="color:var(--oro)">${ic('warn')} ${esc(p.ayuda)} Elegiste ${n}.</span>`}</button>`;
      const casos = clase === 'categorias' && S.intento !== 'serie' ? encajan.filter((p) => (S.intento === 'puente' ? p.id === 'puente' : p.id === 'composicion')).concat(encajan.filter((p) => !(S.intento === 'puente' ? p.id === 'puente' : p.id === 'composicion'))) : encajan;
      return `<div class="rejilla" role="radiogroup" aria-label="Estilos de animación">${casos.map((p) => carta(p, true)).join('')}</div>${otros.length ? `<details class="det"><summary>Otros estilos (necesitan otra cantidad de datos)</summary><div class="rejilla" style="margin-top:10px">${otros.map((p) => carta(p, false)).join('')}</div></details>` : ''}`;
    })()}
    <h3>Título</h3>
    <label class="etq" for="titulo">Lo que se lee arriba del video (corto funciona mejor)</label>
    <input id="titulo" type="text" maxlength="60" value="${esc(S.titulo)}" placeholder="${esc(S.series[0]?.nombre ?? 'Mi título')}">
    <h3>Formato</h3>
    <div class="seg" role="group" aria-label="Formato del video"><button type="button" data-f="horizontal" aria-pressed="${S.formato === 'horizontal'}">Horizontal 16:9 · YouTube</button><button type="button" data-f="vertical" aria-pressed="${S.formato === 'vertical'}">Vertical 9:16 · Reels y Shorts</button></div>
    ${S.plantilla === 'comparar' ? `<h3>¿Cuál es la protagonista?</h3><p class="ayuda">La línea resaltada. Las demás quedan atenuadas como contexto.</p><div role="radiogroup" aria-label="Serie protagonista">${S.series.map((s, k) => `<label class="conmuta" style="margin:4px 0"><input type="radio" name="foco" value="${k}" ${S.foco === k ? 'checked' : ''}><span>${esc(s.nombre)}</span></label>`).join('')}</div>` : ''}
    <div id="momentos"></div>
    ${barraNav(true, true, 'Siguiente: cámara y ritmo', n > 0)}`;
  // El visualizador marca la gráfica que mejor cuenta este dato y dice por qué (reglas de «From Data to Viz» / FT Visual Vocabulary)
  post('/api/recomendar', {series: S.series.map(limpio), formato: S.formato}).then((r) => {
    const lista = r.recomendadas ?? []; if (!lista.length || S.paso !== 1) return;
    lista.forEach((c, k) => { const el = $('#paso').querySelector(`.tpl[data-id="${c.plantilla}"]`); if (!el || el.querySelector('.recom')) return; el.insertAdjacentHTML('beforeend', `<span class="sub recom" style="color:var(--oro,#C9A84C)">${k === 0 ? '★ Recomendada: ' : '✓ Encaja: '}${esc(c.porque)}</span>`); });
  }).catch(() => {});
  $('#paso').querySelectorAll('input[name=foco]').forEach((r) => (r.onchange = () => { S.foco = +r.value; guardar(); regenerar(); }));
  $('#paso').querySelectorAll('.tpl').forEach((b) => (b.onclick = () => { if (b.getAttribute('aria-disabled') === 'true') { aviso(S.plantillas.find((p) => p.id === b.dataset.id).ayuda); return; } S.plantilla = b.dataset.id; guardar(); paso2(); regenerar(); }));
  $('#titulo').oninput = (e) => { S.titulo = e.target.value; S.tituloEditado = !!S.titulo.trim(); guardar(); regenerarDebounce(); };
  $('#paso').querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { S.formato = b.dataset.f; guardar(); paso2(); regenerar(); }));
  enlazarNav(1);
  if (S.plantilla === 'historia' && n === 1) await pintarMomentos();
}
async function pintarMomentos() {
  const cont = $('#momentos'); if (!cont) return;
  cont.innerHTML = '<h3>Momentos que vale la pena contar</h3><p class="ayuda">Los buscamos nosotros <strong>en los datos</strong>: nada es inventado. Marca los que quieras mostrar y ponles un nombre corto.</p><p class="ayuda">Analizando tus datos…</p>';
  try {
    if (!S.analisis) S.analisis = await post('/api/analizar', {series: S.series.map(limpio)});
    if (!S.analisis.ok) { cont.innerHTML += `<div class="aviso mal">${ic('warn')}<div>${esc((S.analisis.errores ?? []).join(' · '))}</div></div>`; return; }
    if (!S.sel) S.sel = Object.fromEntries(S.analisis.momentos.map((m) => [m.id, m.seleccionado]));
    const r = S.analisis.resumen;
    cont.innerHTML = `<h3>Momentos que vale la pena contar</h3>
      <p class="ayuda">Los buscamos nosotros <strong>en los datos</strong>: nada es inventado. Marca los que quieras mostrar y ponles un nombre corto.</p>
      <div class="aviso">${ic('info')}<div>Tu dato va de <strong>${esc(r.desde)}</strong> a <strong>${esc(r.hasta)}</strong> (${r.filas.toLocaleString('es-CO')} registros).${S.analisis.avisos.length ? '<br>' + S.analisis.avisos.map(esc).join('<br>') : ''}</div></div>
      ${S.analisis.momentos.map((m) => `<div class="momento"><input type="checkbox" id="m_${m.id}" data-id="${m.id}" ${S.sel[m.id] ? 'checked' : ''}><div><label for="m_${m.id}" class="etq" style="margin:0">${esc(m.anio)} · ${esc(m.valor)}</label><input type="text" maxlength="30" data-et="${m.id}" aria-label="Nombre corto para ${esc(m.etiqueta)}" value="${esc(S.etiquetas[m.id] ?? m.etiqueta)}"></div><div class="expl">${esc(m.explicacion)}</div></div>`).join('')}`;
    cont.querySelectorAll('input[type=checkbox]').forEach((c) => (c.onchange = () => { S.sel[c.dataset.id] = c.checked; guardar(); regenerar(); }));
    cont.querySelectorAll('input[data-et]').forEach((t) => (t.oninput = () => { S.etiquetas[t.dataset.et] = t.value; guardar(); regenerarDebounce(); }));
  } catch (e) { cont.innerHTML += `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; }
}
const limpio = (s) => { const {ficha, ...r} = s; return r; };

// ── PASO 3: cámara y ritmo ──────────────────────────────────────────────────────────────────────────────────────
function paso3() {
  if (S.series[0]?.tabla) {   // flujos, anillos y cascadas se construyen solos: no hay cámara que elegir, solo el aspecto
    $('#paso').innerHTML = `
      <h2>Aspecto</h2>
      <p class="ayuda">Esta animación se construye sola, de izquierda a derecha, sin zooms que elegir. Solo falta escoger cómo se ve.</p>
      <div class="seg" role="group" aria-label="Aspecto de color"><button type="button" data-tema="oscuro" aria-pressed="${S.tema === 'oscuro'}">MacroWise (oscuro cálido)</button><button type="button" data-tema="harris" aria-pressed="${S.tema === 'harris'}">Negro y rosa-rojo</button><button type="button" data-tema="carbon" aria-pressed="${S.tema === 'carbon'}">Gris carbón y teal</button></div>
      ${S.plano ? `<p class="ayuda" style="margin-top:16px">Duración: <strong>${S.plano.duracion.toFixed(1)} segundos</strong>.</p>` : ''}
      ${barraNav(true, true, 'Siguiente: revisar y exportar')}`;
    $('#paso').querySelectorAll('[data-tema]').forEach((b) => (b.onclick = () => { S.tema = b.dataset.tema; guardar(); paso3(); regenerar(); }));
    enlazarNav(2); return;
  }
  $('#paso').innerHTML = `
    <h2>Cámara y ritmo</h2>
    <p class="ayuda">Define cómo se mueve la cámara y qué tan rápido se cuenta. Puedes cambiarlo y ver el resultado a la derecha al instante.</p>
    <div class="rejilla" role="radiogroup" aria-label="Estilos de cámara">${S.camaras.map((c) => `<button type="button" class="carta" role="radio" aria-checked="${S.camara === c.id}" data-id="${c.id}"><span class="marca">${ic('check')}</span><span class="tit">${esc(c.nombre)}</span><span class="sub">${esc(c.descripcion)}</span><span class="meta">Trazo ${c.dibujo} s${c.mov ? ` · zoom ${c.mov} s` : ' · sin zoom'}</span></button>`).join('')}</div>
    ${S.plantilla !== 'historia' ? `<div class="aviso">${ic('info')}<div>Este estilo (${esc((S.plantillas.find((p) => p.id === S.plantilla) ?? {}).nombre ?? '')}) usa su propia cámara fija; el ritmo cambia solo en «La historia de una cifra».</div></div>` : ''}
    ${S.plantilla === 'historia' ? `<h3>Cómo se marcan los momentos</h3><div class="seg" role="group" aria-label="Estilo de los momentos"><button type="button" data-em="tarjeta" aria-pressed="${S.estiloMomento === 'tarjeta'}">Tarjeta: año · qué pasó · dato</button><button type="button" data-em="barra" aria-pressed="${S.estiloMomento === 'barra'}">Solo barra con el año (la voz cuenta el resto)</button><button type="button" data-em="pildora" aria-pressed="${S.estiloMomento === 'pildora'}">Píldora amarilla con la frase</button><button type="button" data-em="circulo" aria-pressed="${S.estiloMomento === 'circulo'}">Círculo sobre el dato</button></div>` : ''}
    <h3>Aspecto</h3><div class="seg" role="group" aria-label="Aspecto de color"><button type="button" data-tema="oscuro" aria-pressed="${S.tema === 'oscuro'}">MacroWise (oscuro cálido)</button><button type="button" data-tema="harris" aria-pressed="${S.tema === 'harris'}">Negro y rosa-rojo</button><button type="button" data-tema="carbon" aria-pressed="${S.tema === 'carbon'}">Gris carbón y teal</button></div>
    <h3>¿Mantenerlo siempre al día?</h3>
    <label class="conmuta"><input type="checkbox" id="vivo" ${S.vivo ? 'checked' : ''}><span><strong>Actualizar el video solo cuando la fuente publique datos nuevos</strong><br><span class="ayuda" style="margin:0">Los datos se actualizan siempre. Con esto, además, se genera una versión nueva del video (v2, v3…) cada vez que haya un dato nuevo, como mucho cada 6 horas. Requiere que el actualizador esté encendido.</span></span></label>
    ${S.plano ? `<p class="ayuda" style="margin-top:16px">Duración de esta versión: <strong>${S.plano.duracion.toFixed(1)} segundos</strong>.</p>` : ''}
    ${barraNav(true, true, 'Siguiente: revisar y exportar')}`;
  $('#paso').querySelectorAll('.carta').forEach((b) => (b.onclick = () => { S.camara = b.dataset.id; guardar(); paso3(); regenerar(); }));
  $('#paso').querySelectorAll('[data-em]').forEach((b) => (b.onclick = () => { S.estiloMomento = b.dataset.em; guardar(); paso3(); regenerar(); }));
  $('#paso').querySelectorAll('[data-tema]').forEach((b) => (b.onclick = () => { S.tema = b.dataset.tema; guardar(); paso3(); regenerar(); }));
  $('#vivo').onchange = (e) => { S.vivo = e.target.checked; guardar(); regenerar(); };
  enlazarNav(2);
}

// ── PASO 4: revisar y exportar ──────────────────────────────────────────────────────────────────────────────────
function paso4() {
  const inf = S.informe, errores = inf?.errores ?? [];
  $('#paso').innerHTML = `
    <h2>Revisar y exportar</h2>
    <p class="ayuda">Mira la animación a la derecha. Si te gusta, expórtala. Antes de hacerlo, el sistema comprueba que <strong>ningún texto se pise</strong> y que <strong>cada cifra salga de los datos</strong>.</p>
    ${errores.length ? `<div class="aviso mal">${ic('warn')}<div><strong>Hay algo por corregir:</strong><br>${errores.map(esc).join('<br>')}</div></div>` : ''}
    <h3>Qué vas a recibir</h3>
    <ul style="margin:0;padding-left:20px"><li><strong>Video MP4</strong> para ver y compartir (1920×1080 o 1080×1920).</li><li><strong>Archivo ProRes 4444 con transparencia</strong> para montar en Premiere (solo en la versión final).</li><li><strong>Informe de verificación</strong> con el origen de cada cifra.</li></ul>
    <div class="fila" style="margin-top:20px">
      <button class="btn" id="rBorrador" ${errores.length || !S.spec ? 'disabled' : ''}>${ic('film')}Exportar borrador (rápido, ~30 s)</button>
      <button class="btn p" id="rFinal" ${errores.length || !S.spec ? 'disabled' : ''}>${ic('film')}Exportar versión final (3–6 min)</button>
    </div>
    <div id="estadoRender" aria-live="polite" style="margin-top:16px"></div>
    ${barraNav(true, false)}`;
  $('#rBorrador').onclick = () => exportar('borrador', false);
  $('#rFinal').onclick = () => exportar('final', true);
  enlazarNav(3);
  if (S.render) pintarRender();
}
async function exportar(calidad, alfa) {
  S.render = {estado: 'enviando'}; pintarRender();
  try {
    const {id} = await post('/api/render', {spec: S.spec, calidad, alfa, nombre: S.titulo || S.series[0]?.nombre || 'pieza'});
    const bucle = async () => {
      const j = await api('/api/trabajo?id=' + id); S.render = j;
      pintarRender();
      if (j.estado === 'en curso') setTimeout(bucle, 1500);
    };
    bucle();
  } catch (e) { S.render = {estado: 'error', error: e.message}; pintarRender(); }
}
function pintarRender() {
  const c = $('#estadoRender'); if (!c) return; const r = S.render;
  if (r.estado === 'enviando') c.innerHTML = '<p class="ayuda">Comprobando y enviando…</p>';
  else if (r.estado === 'en curso') { const p = r.progreso; c.innerHTML = `<p class="etq">${p ? (p.tipo === 'alfa' ? 'Creando la versión con transparencia' : 'Creando el video') : 'Preparando'}… ${p ? Math.round((p.cuadro / p.total) * 100) + ' %' : ''}</p><progress max="100" value="${p ? Math.round((p.cuadro / p.total) * 100) : 0}"></progress>`; }
  else if (r.estado === 'error') c.innerHTML = `<div class="aviso mal">${ic('warn')}<div><strong>No se pudo exportar.</strong><br>${esc(r.error)}<br><span class="ayuda">Si dice que hay textos que se pisan, quita un momento o acorta su nombre en el paso 2.</span></div></div>`;
  else if (r.estado === 'listo') {
    const s = r.resultado.salidas;
    c.innerHTML = `<div class="aviso ok">${ic('check')}<div><strong>Listo en ${r.resultado.segundos} s.</strong><br>${Object.entries(s).filter(([k]) => k !== 'contacto').map(([k, v]) => `<span class="mono" style="font-size:13px">${esc(k === 'mp4' ? 'Video' : k === 'alfa' ? 'Con transparencia (Premiere)' : 'Informe')}: ${esc(v)}</span>`).join('<br>')}</div></div>
      <button class="btn" id="abrirCarpeta">${ic('folder')}Abrir la carpeta</button>`;
    $('#abrirCarpeta').onclick = () => post('/api/abrir', {ruta: s.mp4});
  }
}

// ── generación de la spec ───────────────────────────────────────────────────────────────────────────────────────
let genSeq = 0, deb;
const regenerarDebounce = () => { clearTimeout(deb); deb = setTimeout(regenerar, 500); };
async function regenerar() {
  const seq = ++genSeq, def = S.plantillas.find((p) => p.id === S.plantilla);
  if (!S.series.length) { S.spec = S.plano = S.informe = null; mostrarVista(); pintarEstadoPasos(); return; }
  const claseSel = S.series[0]?.tabla ?? 'serie';
  if (def && ((def.datos ?? 'serie') !== claseSel || S.series.length < def.necesita.min || S.series.length > def.necesita.max)) {
    const ok = S.plantillas.find((p) => (p.datos ?? 'serie') === claseSel && S.series.length >= p.necesita.min && S.series.length <= p.necesita.max);
    if (ok) { S.plantilla = ok.id; guardar(); if (S.paso === 1) paso2(); } else { S.error = 'Esta cantidad de datos no encaja con ningún estilo.'; mostrarVista(); return; }
  }
  S.generando = true; $('#carga').hidden = false; S.error = '';
  try {
    if (S.plantilla === 'historia' && S.series.length === 1 && !S.analisis) { S.analisis = await post('/api/analizar', {series: S.series.map(limpio)}); if (S.analisis.ok && !S.sel) S.sel = Object.fromEntries(S.analisis.momentos.map((m) => [m.id, m.seleccionado])); }
    const momentos = (S.analisis?.momentos ?? []).filter((m) => S.sel?.[m.id]).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: (S.etiquetas[m.id] || m.etiqueta).slice(0, 30)}));
    const r = await post('/api/generar', {plantilla: S.plantilla, series: S.series.map(limpio), momentos, camara: S.camara, formato: S.formato, titulo: S.tituloEditado ? S.titulo : '', foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, vivo: S.vivo ? {render: 'final', alfa: true, minEntreRendersMin: 360} : null});
    if (seq !== genSeq) return;
    Object.assign(S, {spec: r.spec, plano: r.plano ?? null, informe: r.informe, notas: r.notas ?? []});
    if (!S.tituloEditado) S.titulo = r.spec.titulo ?? '';
  } catch (e) { if (seq !== genSeq) return; S.error = e.message; S.spec = S.plano = null; S.informe = {errores: [], avisos: [], datos: [], cifras: []}; }
  S.generando = false; $('#carga').hidden = true;
  mostrarVista(); pintarEstadoPasos(); $('#specTxt').value = S.spec ? JSON.stringify(S.spec, null, 2) : '';
}
function pintarEstadoPasos() { pintarPasos(); if (S.paso === 3) paso4(); }

// ── vista previa ────────────────────────────────────────────────────────────────────────────────────────────────
const lienzo = $('#lienzo'), ctx = lienzo.getContext('2d');
let escena = null, tiempo = 0, jugando = false, ultimo = 0;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function cargarImagenes(p) {
  const out = {}; await Promise.all((p.imagenes ?? []).map((r) => new Promise((ok) => { const im = new Image(); im.onload = () => { out[r] = im; ok(); }; im.onerror = ok; im.src = '/archivos/' + r.split('/').map(encodeURIComponent).join('/'); })));
  return out;
}
async function mostrarVista() {
  const vacio = $('#vacio'), simple = $('#simple'), marco = $('#marco');
  if (S.error || !S.plano) {
    vacio.hidden = false; escena = null; ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    vacio.innerHTML = S.error ? `<div><p style="font-size:18px;font-weight:700;margin:0 0 6px;color:var(--rojo)">No se pudo armar la animación</p><p style="margin:0">${esc(S.error)}</p></div>` : '<div><p style="font-size:20px;font-weight:700;margin:0 0 6px">Aquí verás tu animación</p><p style="margin:0">Elige un dato a la izquierda para empezar.</p></div>';
    simple.hidden = !S.informe; if (S.informe) pintarSimple(); return;
  }
  vacio.hidden = true;
  await document.fonts.load('800 40px Geist'); await document.fonts.load('500 20px "Geist Mono"');
  const vert = S.plano.formato === 'vertical'; marco.classList.toggle('vert', vert);
  lienzo.width = vert ? 540 : 960; lienzo.height = vert ? 960 : 540;
  escena = new Escena(S.plano, await cargarImagenes(S.plano));
  $('#t').max = S.plano.duracion;
  $('#marcas')?.remove(); const dl = document.createElement('datalist'); dl.id = 'marcas';
  dl.innerHTML = S.plano.capas.filter((c) => c.tipo === 'llamada').map((c) => `<option value="${c.t[0]}"></option>`).join(''); document.body.append(dl); $('#t').setAttribute('list', 'marcas');
  tiempo = reducido ? Math.min(S.plano.duracion, (S.plano.capas.find((c) => c.tipo === 'llamada')?.t[0] ?? S.plano.duracion * 0.7) + 0.9) : 0;
  jugando = !reducido; ultimo = performance.now(); pintarBotonPlay(); dibujar(); if (jugando) requestAnimationFrame(tick);
  simple.hidden = false; pintarSimple();
}
function dibujar() { if (!escena) return; escena.dibujar(ctx, lienzo.width, lienzo.height, tiempo); $('#t').value = tiempo; $('#tt').textContent = `${tiempo.toFixed(1)} / ${S.plano.duracion.toFixed(1)} s`; }
function tick(ahora) { if (!jugando || !escena) return; tiempo += (ahora - ultimo) / 1000; ultimo = ahora; if (tiempo >= S.plano.duracion) { tiempo = S.plano.duracion; jugando = false; pintarBotonPlay(); } dibujar(); if (jugando) requestAnimationFrame(tick); }
function pintarBotonPlay() { const b = $('#play'); b.innerHTML = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${jugando ? ICON.pause : ICON.play}</svg>`; b.setAttribute('aria-label', jugando ? 'Pausar' : 'Reproducir'); }
$('#play').onclick = () => { if (!escena) return; if (tiempo >= S.plano.duracion - 0.05) tiempo = 0; jugando = !jugando; ultimo = performance.now(); pintarBotonPlay(); if (jugando) requestAnimationFrame(tick); };
$('#t').oninput = (e) => { tiempo = +e.target.value; jugando = false; pintarBotonPlay(); dibujar(); };
addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); $('#play').click(); } });

function pintarSimple() {
  const inf = S.informe, box = $('#simple'); if (!inf) { box.hidden = true; return; }
  const li = (cls, ico, txt) => `<li class="${cls}">${ic(ico)}<span>${txt}</span></li>`, items = [];
  const cifras = inf.cifras.filter((c) => c.mostrado), fuentes = [...new Set(inf.datos.map((d) => d.fuente.nombre))];
  if (inf.errores.length) inf.errores.forEach((e) => items.push(li('mal', 'warn', esc(e))));
  else items.push(li('ok', 'check', `<strong>Todas las cifras salen de los datos.</strong> ${cifras.length} cifra${cifras.length === 1 ? '' : 's'} en pantalla, calculadas por el sistema (ninguna escrita a mano).`));
  inf.datos.forEach((d) => items.push(li('ok', 'check', `<strong>Datos reales:</strong> ${esc(d.fuente.nombre)}.<br><span class="mono" style="font-size:12px;color:var(--suave)">${d.tipoTabla ? `${d.elementos} elementos · ${d.filas.toLocaleString('es-CO')} filas · cada cifra sale de su fila` : `${esc(String(d.inicio))} → ${esc(String(d.fin))} · ${d.filas.toLocaleString('es-CO')} registros${d.recortada ? ' · RECORTADA' : ' · serie completa'}`}</span>${d.fuente.url ? `<br><a href="${esc(d.fuente.url)}" target="_blank" rel="noopener">Ver la fuente</a>` : ''}`)));
  S.series.filter((s) => s.ficha).forEach((s) => { const sa = s.ficha.salud; items.push(li(sa.estado === 'al_dia' ? 'ok' : 'av', sa.estado === 'al_dia' ? 'check' : 'warn', `<strong>${esc(s.nombre)}:</strong> ${esc(sa.texto)}`)); });
  inf.avisos.filter((a) => /LICENCIA|RECORTADA|coinciden|largo/.test(a)).forEach((a) => items.push(li('av', 'warn', esc(a.replace(/^datos\.\w+:\s*/, '')))));
  S.notas.forEach((n) => items.push(li('', 'info', esc(n))));
  box.innerHTML = `<h3>Tu animación, en simple</h3><ul>${items.join('')}</ul>
    <details class="det"><summary>Ver cada cifra y de qué fila sale</summary>${cifras.map((c) => `<div class="cifra">«${esc(c.mostrado)}»<small>${esc(c.serie ?? c.nombre ?? '')} · ${esc(String(c.fecha ?? ''))}${c.fila != null ? ' · fila ' + c.fila : c.filas ? ' · filas ' + c.filas.join(', ') : ''}</small></div>`).join('') || '<p class="ayuda">Esta pieza no muestra cifras sueltas.</p>'}</details>`;
}

// ── estado de los datos vivos, avisos y ejemplos ────────────────────────────────────────────────────────────────
function aviso(txt) { const p = $('#estadoDatos'); const prev = p.innerHTML; p.className = 'pill ok'; p.innerHTML = `${ic('check')}${esc(txt)}`; setTimeout(() => { estadoVivo(); }, 4500); void prev; }
async function estadoVivo() {
  try {
    const e = await api('/api/vivo'), ts = Object.entries(e).filter(([k]) => !k.startsWith('_')).map(([, v]) => v.ultimoExito).filter(Boolean).sort();
    const p = $('#estadoDatos');
    if (!ts.length) { p.className = 'pill'; p.textContent = 'Datos: se actualizan al elegirlos'; return; }
    const min = Math.round((Date.now() - new Date(ts[ts.length - 1]).getTime()) / 60000);
    p.className = 'pill ok'; p.innerHTML = `${ic('check')}Datos vivos · última actualización hace ${min < 1 ? 'instantes' : min + ' min'}`;
  } catch { $('#estadoDatos').textContent = ''; }
}
try {
  const es = new EventSource('/api/eventos');
  es.addEventListener('trimestre', (e) => { const d = JSON.parse(e.data); aviso(`${d.nombre} publicó su ${d.etiqueta}: ya está en la biblioteca y tienes un borrador listo.`); if (S.paso === 0 && S.emp === d.ticker) elegirEmpresa(d.ticker); else if (S.paso === 0) cargarEmpresas(); });
  es.addEventListener('serie', (e) => { const d = JSON.parse(e.data); aviso(`Datos nuevos: ${d.nombre ?? d.id}`); if (S.series.some((s) => s.id === d.id)) { S.analisis = null; regenerar(); } });
} catch {}
$('#btnExperto').onclick = (e) => { const on = document.body.classList.toggle('exp'); e.currentTarget.setAttribute('aria-pressed', on); };
$('#aplicarSpec').onclick = async () => {
  try { const spec = JSON.parse($('#specTxt').value), r = await post('/api/compilar', spec); Object.assign(S, {spec, plano: r.informe.ok ? r.spec : null, informe: r.informe, notas: [], error: '', modo: 'manual'}); $('#expertoInforme').textContent = (r.informe.errores.length ? 'ERRORES:\n' + r.informe.errores.join('\n') + '\n' : '✓ compila\n') + r.informe.avisos.join('\n'); mostrarVista(); pintarPasos(); }
  catch (e) { $('#expertoInforme').textContent = 'JSON no válido: ' + e.message; }
};
$('#btnEjemplos').onclick = async () => {
  const box = $('#ejemplos'); if (!box.hidden) { box.hidden = true; return; }
  const l = await api('/api/specs'); box.innerHTML = '<p class="tag" style="margin:6px 8px">Ejemplos listos</p>' + l.map((n) => `<button class="btn" style="width:100%;justify-content:flex-start;margin:4px 0" data-n="${esc(n)}">${esc(n.replace('.json', '').replace(/-/g, ' '))}</button>`).join(''); box.hidden = false;
  box.querySelectorAll('button').forEach((b) => (b.onclick = async () => {
    box.hidden = true; const spec = await api('/api/spec?n=' + encodeURIComponent(b.dataset.n)), r = await post('/api/compilar', spec);
    Object.assign(S, {spec, plano: r.informe.ok ? r.spec : null, informe: r.informe, notas: [], error: '', modo: 'ejemplo', titulo: spec.titulo ?? ''}); $('#specTxt').value = JSON.stringify(spec, null, 2); await mostrarVista(); ir(3);
  }));
};

// ── chat: editar la animación hablando (Claude Code con las herramientas del estudio; ver servidor/chat.mjs) ──────────
const chatEl = $('#chat'), chatMsgs = $('#chatMsgs'), chatIn = $('#chatIn');
let chatOcupado = false;
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<span class="mono">$1</span>').replace(/\n/g, '<br>');
function burbuja(clase, html) { const d = document.createElement('div'); d.className = 'cm ' + clase; d.innerHTML = html; chatMsgs.append(d); chatMsgs.scrollTop = chatMsgs.scrollHeight; return d; }
function sugerencias() {
  const box = $('#chatSug'); if (!box) return;
  const tri = S.series[0]?.trimestre, lista = tri
    ? ['Pásalo a vertical', 'Ponlo en negro y rosa-rojo', 'Muéstrame el trimestre anterior', 'Ahora en cascada', 'Hazlo más corto']
    : S.plano ? ['Pásalo a vertical', 'Cambia los colores', 'Hazlo más corto', 'Pon un título más claro']
    : ['Muéstrame Amazon, último trimestre', 'Cómo gana dinero NVIDIA', 'Compara el balance de la Fed con el oro'];
  box.innerHTML = lista.map((t) => `<button type="button">${esc(t)}</button>`).join('');
  box.querySelectorAll('button').forEach((b) => (b.onclick = () => enviarChat(b.textContent)));
}
function abrirChat(on) {
  chatEl.hidden = !on; $('#chatBtn').setAttribute('aria-expanded', String(on));
  if (!on) return;
  if (!chatMsgs.children.length) burbuja('ia', 'Hola. Dime qué quieres **cambiar** en la animación (colores, formato, otro trimestre, otra empresa…) y lo hago aquí mismo. Si tocas los pasos de la izquierda, la pieza se rehace desde cero.');
  sugerencias(); chatIn.focus();
}
function aplicarPiezaChat({spec, plano, informe}) {
  Object.assign(S, {spec, plano: informe.ok ? plano : null, informe, notas: [], error: informe.ok ? '' : (informe.errores[0] ?? ''), modo: 'manual', titulo: spec.titulo ?? S.titulo, tituloEditado: true});
  $('#specTxt').value = JSON.stringify(spec, null, 2); mostrarVista(); pintarPasos(); if (S.paso === 3) paso4();
  burbuja('acc', `${ic('check')}<span>Vista previa actualizada</span>`);
}
function eventoChat(ev, espera) {
  if (ev.tipo === 'texto') burbuja('ia', md(ev.texto));
  else if (ev.tipo === 'accion') espera.innerHTML = `<span class="pulso"></span> ${esc(ev.texto)}…`;
  else if (ev.tipo === 'error') burbuja('mal', md(ev.texto));
  else if (ev.tipo === 'pieza') aplicarPiezaChat(ev);
}
async function enviarChat(texto) {
  texto = String(texto ?? '').trim(); if (!texto || chatOcupado) return;
  chatOcupado = true; burbuja('yo', esc(texto)); chatIn.value = ''; chatIn.style.height = ''; $('#chatSug').innerHTML = '';
  const espera = burbuja('acc', '<span class="pulso"></span> Pensando…');
  try {
    const r = await fetch('/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mensaje: texto, spec: S.spec})});
    const lector = r.body.getReader(), dec = new TextDecoder(); let resto = '';
    for (;;) { const {done, value} = await lector.read(); if (done) break; resto += dec.decode(value, {stream: true}); const ls = resto.split('\n'); resto = ls.pop() ?? ''; for (const l of ls) if (l.trim()) { try { eventoChat(JSON.parse(l), espera); } catch { /* línea a medias */ } } }
  } catch (e) { burbuja('mal', esc(e.message)); }
  espera.remove(); chatOcupado = false; sugerencias();
}
$('#chatBtn').onclick = () => abrirChat(true);
$('#chatCerrar').onclick = () => abrirChat(false);
$('#chatNuevo').onclick = async () => { try { await api('/api/chat-nuevo'); } catch { /* sin servidor */ } chatMsgs.innerHTML = ''; abrirChat(true); };
$('#chatForm').onsubmit = (e) => { e.preventDefault(); enviarChat(chatIn.value); };
chatIn.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat(chatIn.value); } };
chatIn.oninput = () => { chatIn.style.height = 'auto'; chatIn.style.height = Math.min(120, chatIn.scrollHeight) + 'px'; };

(async () => {
  const pl = await api('/api/plantillas'); S.plantillas = pl.plantillas; S.camaras = pl.camaras;
  pintar(); estadoVivo(); setInterval(estadoVivo, 60000);
  if (S.series.length) { S.series = S.series.map((s) => s); regenerar(); }
})();
