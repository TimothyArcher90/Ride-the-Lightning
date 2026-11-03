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
const guardar = () => { try { localStorage.setItem('rtl', JSON.stringify({series: S.series, plantilla: S.plantilla, titulo: S.titulo, formato: S.formato, camara: S.camara, vivo: S.vivo, foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, tituloEditado: S.tituloEditado, paso: Math.min(S.paso, 3), etiquetas: S.etiquetas, sel: S.sel})); } catch {} };
const cargarGuardado = () => { try { return JSON.parse(localStorage.getItem('rtl') ?? 'null'); } catch { return null; } };

const PASOS = ['Tus datos', 'Cómo verlo', 'Cámara y ritmo', 'Revisar y exportar'];
const S = Object.assign({estiloMomento: 'tarjeta', tema: 'oscuro', foco: 0, paso: 0, series: [], plantilla: 'historia', titulo: '', tituloAuto: true, formato: 'horizontal', camara: 'documental', vivo: false, etiquetas: {}, sel: null,
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
function paso1() {
  $('#paso').innerHTML = `
    <h2>¿Qué quieres mostrar?</h2>
    <p class="ayuda">Elige un dato real. Se descarga <strong>completo, desde el primer registro que existe</strong>, y se mantiene al día solo. No tienes que buscar ni pasar archivos.</p>
    <label class="etq" for="busca">Busca en palabras simples</label>
    <input id="busca" type="search" placeholder="oro, bitcoin, petróleo, inflación, dólar, población…" value="${esc(S.q)}" autocomplete="off">
    <div class="chips" id="chips" role="group" aria-label="Categorías"></div>
    <div id="lista"></div>
    <div class="seleccion" id="seleccion"></div>
    <h3>¿Tienes tus propios datos?</h3>
    <p class="ayuda">Suelta un Excel (xlsx, xls, xlsb, ods), un CSV, TSV o JSON. Te preguntamos solo lo necesario.</p>
    <div id="drop" tabindex="0">${ic('up')} Suelta aquí tu archivo o <label for="arch" style="color:var(--oro);text-decoration:underline;cursor:pointer">elígelo</label><input id="arch" type="file" class="sr"></div>
    <div id="subida"></div>`;
  let d; $('#busca').oninput = (e) => { S.q = e.target.value; clearTimeout(d); d = setTimeout(cargarBiblioteca, 250); };
  const drop = $('#drop'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('sobre'); }; drop.ondragleave = () => drop.classList.remove('sobre');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('sobre'); subir(e.dataTransfer.files[0]); };
  $('#arch').onchange = (e) => subir(e.target.files[0]);
  pintarSeleccion(); pintarSubida(); if (S.bib) pintarLista(); else cargarBiblioteca();
}

// ── datos propios ───────────────────────────────────────────────────────────────────────────────────────────────
async function subir(f) {
  if (!f) return;
  const box = $('#subida'); box.innerHTML = '<p class="ayuda">Leyendo tu archivo…</p>';
  try {
    const j = await api('/api/subir?nombre=' + encodeURIComponent(f.name), {method: 'POST', body: await f.arrayBuffer()});
    if (j.tipo === 'imagen') { box.innerHTML = `<div class="aviso ok">${ic('check')}<div>Imagen guardada: <span class="mono">${esc(j.ruta)}</span>. Las imágenes se usan como fondo o encuadre en el Modo experto.</div></div>`; return; }
    S.subida = {ruta: j.ruta, insp: j.inspeccion, nombre: f.name}; pintarSubida();
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
  correlacion: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true">' + [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect x="${50 + c * 26}" y="${4 + r * 19}" width="24" height="17" rx="2" fill="${r === c ? '#50B5A2' : (r + c) % 3 === 0 ? '#C27BCB' : '#50B5A2'}" opacity="${r === c ? 1 : 0.25 + ((r * 3 + c) % 4) * 0.2}"/>`)).join('') + '</svg>',
};
async function paso2() {
  const n = S.series.length;
  $('#paso').innerHTML = `
    <h2>¿Cómo lo quieres ver?</h2>
    <p class="ayuda">Elige un estilo. Ya viene con el ritmo, los zooms y los colores de marca resueltos; tú decides qué contar.</p>
    <div class="rejilla" role="radiogroup" aria-label="Estilos de animación">${S.plantillas.map((p) => {
      const ok = n >= p.necesita.min && n <= p.necesita.max;
      return `<button type="button" class="carta tpl" role="radio" aria-checked="${S.plantilla === p.id}" aria-disabled="${!ok}" data-id="${p.id}">${MINI[p.id] ?? ''}<span class="marca">${ic('check')}</span><span class="tit">${esc(p.nombre)}</span><span class="sub">${esc(p.descripcion)}</span><span class="sub" style="color:${ok ? 'var(--teal)' : 'var(--oro)'}">${ok ? ic('check') : ic('warn')} ${ok ? 'Encaja con lo que elegiste' : esc(p.ayuda) + ` Elegiste ${n}.`}</span></button>`;
    }).join('')}</div>
    <h3>Título</h3>
    <label class="etq" for="titulo">Lo que se lee arriba del video (corto funciona mejor)</label>
    <input id="titulo" type="text" maxlength="60" value="${esc(S.titulo)}" placeholder="${esc(S.series[0]?.nombre ?? 'Mi título')}">
    <h3>Formato</h3>
    <div class="seg" role="group" aria-label="Formato del video"><button type="button" data-f="horizontal" aria-pressed="${S.formato === 'horizontal'}">Horizontal 16:9 · YouTube</button><button type="button" data-f="vertical" aria-pressed="${S.formato === 'vertical'}">Vertical 9:16 · Reels y Shorts</button></div>
    ${S.plantilla === 'comparar' ? `<h3>¿Cuál es la protagonista?</h3><p class="ayuda">La línea resaltada. Las demás quedan atenuadas como contexto.</p><div role="radiogroup" aria-label="Serie protagonista">${S.series.map((s, k) => `<label class="conmuta" style="margin:4px 0"><input type="radio" name="foco" value="${k}" ${S.foco === k ? 'checked' : ''}><span>${esc(s.nombre)}</span></label>`).join('')}</div>` : ''}
    <div id="momentos"></div>
    ${barraNav(true, true, 'Siguiente: cámara y ritmo', n > 0)}`;
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
  if (def && (S.series.length < def.necesita.min || S.series.length > def.necesita.max)) {
    const ok = S.plantillas.find((p) => S.series.length >= p.necesita.min && S.series.length <= p.necesita.max);
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
  inf.datos.forEach((d) => items.push(li('ok', 'check', `<strong>Datos reales:</strong> ${esc(d.fuente.nombre)}.<br><span class="mono" style="font-size:12px;color:var(--suave)">${esc(String(d.inicio))} → ${esc(String(d.fin))} · ${d.filas.toLocaleString('es-CO')} registros${d.recortada ? ' · RECORTADA' : ' · serie completa'}</span>${d.fuente.url ? `<br><a href="${esc(d.fuente.url)}" target="_blank" rel="noopener">Ver la fuente</a>` : ''}`)));
  S.series.filter((s) => s.ficha).forEach((s) => { const sa = s.ficha.salud; items.push(li(sa.estado === 'al_dia' ? 'ok' : 'av', sa.estado === 'al_dia' ? 'check' : 'warn', `<strong>${esc(s.nombre)}:</strong> ${esc(sa.texto)}`)); });
  inf.avisos.filter((a) => /LICENCIA|RECORTADA|coinciden|largo/.test(a)).forEach((a) => items.push(li('av', 'warn', esc(a.replace(/^datos\.\w+:\s*/, '')))));
  S.notas.forEach((n) => items.push(li('', 'info', esc(n))));
  box.innerHTML = `<h3>Tu animación, en simple</h3><ul>${items.join('')}</ul>
    <details class="det"><summary>Ver cada cifra y de qué fila sale</summary>${cifras.map((c) => `<div class="cifra">«${esc(c.mostrado)}»<small>${esc(c.serie ?? '')} · ${esc(String(c.fecha ?? ''))}${c.fila != null ? ' · fila ' + c.fila : ''}</small></div>`).join('') || '<p class="ayuda">Esta pieza no muestra cifras sueltas.</p>'}</details>`;
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

(async () => {
  const pl = await api('/api/plantillas'); S.plantillas = pl.plantillas; S.camaras = pl.camaras;
  pintar(); estadoVivo(); setInterval(estadoVivo, 60000);
  if (S.series.length) { S.series = S.series.map((s) => s); regenerar(); }
})();
