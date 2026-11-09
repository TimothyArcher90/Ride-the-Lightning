// Guided studio: 4 steps for someone who knows neither code nor finance. The hard parts (downloads, key moments, camera, pacing,
// verification) are done by the server; here you only choose and review. "Expert mode" shows and edits the full spec.
// Every visible string goes through web/i18n.js (T / tt / num); the language switch (EN | ES) sets both the interface and the piece.
import {Escena} from '/motor/escena.js';
import {tr as T, tt, L, setL, onL, num, aplicarDOM} from '/web/i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const ICON = {
  check: '<path d="M20 6 9 17l-5-5"/>', spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', play: '<path d="M6 4l14 8-14 8z" fill="currentColor"/>', pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/>',
  up: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
// Every call tells the server which language the interface (and the piece) is in: `idioma=es|en`.
const conIdioma = (u) => u + (u.includes('?') ? '&' : '?') + 'idioma=' + L();
const api = async (u, o) => {
  const r = await fetch(conIdioma(u), o), j = await r.json().catch(() => ({}));
  if (!r.ok && !j.informe) throw new Error(j.error ?? r.statusText);
  return j;
};
const post = (u, body) => api(u, {method: 'POST', body: JSON.stringify(body && typeof body === 'object' && !Array.isArray(body) ? {idioma: L(), ...body} : body)});
/** The compiled plan gets the piece language so the engine draws its fixed texts in it, whatever the server returned. */
const conI = (plano, spec) => { if (plano && typeof plano === 'object') plano.idioma = spec?.idioma ?? L(); return plano; };
const guardar = () => { try { localStorage.setItem('rtl', JSON.stringify({series: S.series, plantilla: S.plantilla, titulo: S.titulo, formato: S.formato, camara: S.camara, vivo: S.vivo, foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, intento: S.intento, emp: S.emp, tituloEditado: S.tituloEditado, paso: Math.min(S.paso, 3), etiquetas: S.etiquetas, sel: S.sel, pais: S.pais, indPais: S.indPais, hitos: S.hitos})); } catch {} };
const cargarGuardado = () => { try { return JSON.parse(localStorage.getItem('rtl') ?? 'null'); } catch { return null; } };

const PASOS = () => [T('paso_n1'), T('paso_n2'), T('paso_n3'), T('paso_n4')];
const S = Object.assign({estiloMomento: 'tarjeta', tema: 'oscuro', intento: 'serie', emp: null, empQ: '', empresas: null, trims: null, foco: 0, paso: 0, series: [], plantilla: 'historia', titulo: '', tituloAuto: true, formato: 'horizontal', camara: 'documental', vivo: false, etiquetas: {}, sel: null,
  bib: null, q: '', cat: '', plantillas: [], camaras: [], analisis: null, spec: null, plano: null, informe: null, notas: [], error: '', generando: false, modo: 'guiado', render: null, subida: null, hitos: [{fecha: '', nombre: '', fuente: ''}, {fecha: '', nombre: '', fuente: ''}]}, cargarGuardado() ?? {});
S.tituloEditado = !!S.tituloEditado && !!S.titulo;
// Template and camera texts come from the server in Spanish; the studio translates them by id (fallback: the server text).
const nomTpl = (p) => tt('tpl', p.id, 'n', p.nombre), desTpl = (p) => tt('tpl', p.id, 'd', p.descripcion), ayuTpl = (p) => tt('tpl', p.id, 'a', p.ayuda);
const nomCam = (c) => tt('cam', c.id, 'n', c.nombre), desCam = (c) => tt('cam', c.id, 'd', c.descripcion);
const plural = (n, uno, otros) => T(n === 1 ? uno : otros, {n});

// ── step navigation ─────────────────────────────────────────────────────────────────────────────────────────────
function puedeIr(n) {
  if (n === 0) return true;
  if (S.modo !== 'guiado' && S.plano) return true;
  if (n >= 1) return S.series.length > 0;
  return false;
}
function pintarPasos() {
  $('#pasos').innerHTML = PASOS().map((p, i) => `<button type="button" data-paso="${i}" ${i === S.paso ? 'aria-current="step"' : ''} class="${i < S.paso ? 'hecho' : ''}" ${puedeIr(i) ? '' : 'disabled'}><span class="n">${i < S.paso ? ic('check') : i + 1}</span>${esc(p)}</button>`).join('');
  $('#pasos').querySelectorAll('button').forEach((b) => (b.onclick = () => ir(+b.dataset.paso)));
}
function ir(n) { S.paso = n; guardar(); pintar(); window.scrollTo({top: 0, behavior: 'smooth'}); }
function pintar() { pintarPasos(); [paso1, paso2, paso3, paso4][S.paso](); }
const barraNav = (atras, sig, sigTxt, sigOk = true) => `<div class="barra-nav">${atras ? `<button class="btn" id="atras">${ic('back')}${T('atras')}</button>` : '<span></span>'}${sig ? `<button class="btn p" id="sig" ${sigOk ? '' : 'disabled'}>${sigTxt}${ic('next')}</button>` : ''}</div>`;
function enlazarNav(paso) { const a = $('#atras'), s = $('#sig'); if (a) a.onclick = () => ir(paso - 1); if (s) s.onclick = () => ir(paso + 1); }

// ── STEP 1: data ────────────────────────────────────────────────────────────────────────────────────────────────
// With no search or category only the data almost everyone wants is shown (not all 185 series at once).
const POPULARES = ['yf_btc_usd', 'bm_gold', 'yf_gspc', 'fred_cpiaucsl', 'fred_dgs10', 'bm_crude_oil_wti', 'fred_unrate', 'fred_dexuseu', 'fed_balance', 'fred_gdp', 'bm_copper', 'yf_ixic'];
async function cargarBiblioteca(mas = false) {
  const desde = mas ? (S.bib?.series?.length ?? 0) : 0, previas = mas ? S.bib?.series ?? [] : [], busca = S.q.trim() || S.cat;
  const url = busca ? `/api/biblioteca?q=${encodeURIComponent(S.q)}&categoria=${encodeURIComponent(S.cat)}&desde=${desde}` : `/api/biblioteca?ids=${POPULARES.join(',')}`;
  try { const j = await api(url); S.bib = {...j, series: previas.concat(j.series), populares: !busca}; } catch (e) { S.bib = {series: [], categorias: [], total: 0, coinciden: 0, error: e.message}; }
  if (S.paso === 0) pintarLista();
}
const estaElegida = (id) => S.series.some((s) => s.origen === 'biblioteca' && s.id === id);
const rango = (s) => (s.inicio ? `${String(s.inicio).slice(0, 4).replace(/^-0*/, '−')} → ${String(s.fin).slice(0, 4)}` : T('hist_completa'));
function pintarLista() {
  const cont = $('#lista'); if (!cont) return;
  if (!S.bib) { cont.innerHTML = `<p class="ayuda">${T('cargando_datos')}</p>`; return; }
  if (S.bib.error) { cont.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('lista_error', {e: esc(S.bib.error)})}</div></div>`; return; }
  $('#chips').innerHTML = [`<button type="button" class="chip" data-c="" aria-pressed="${S.cat === ''}">${T('populares')}</button>`, ...S.bib.categorias.slice(0, 14).map((c) => `<button type="button" class="chip" data-c="${esc(c.nombre)}" aria-pressed="${S.cat === c.nombre}">${esc(c.nombre)}</button>`)].join('');
  $('#chips').querySelectorAll('button').forEach((b) => (b.onclick = () => { S.cat = b.dataset.c; cargarBiblioteca(); }));
  if (!S.bib.series.length) { cont.innerHTML = `<p class="ayuda">${T('sin_resultados_datos')}</p>`; return; }
  const titulo = S.bib.populares ? T('mas_usados') : plural(S.bib.coinciden, 'res_1', 'res_n');
  const hay = S.bib.series.length < (S.bib.coinciden ?? 0);
  cont.innerHTML = `<p class="tag" style="margin:0 0 8px">${esc(titulo)}</p><ul class="filas" role="group" aria-label="${T('datos_disp')}">${S.bib.series.map((s) => `
    <li><button type="button" class="dato" role="checkbox" aria-checked="${estaElegida(s.id)}" data-id="${esc(s.id)}">
      <span class="marca">${ic('check')}</span>
      <span class="dato-t"><span class="tit">${esc(s.nombre)}</span><span class="sub">${esc(s.categoria)} · ${esc(s.frecuencia)} · ${esc(rango(s))} · ${esc(s.fuente)}</span></span>
      ${s.salud.estado === 'atrasada' ? `<span class="pill av" title="${esc(s.salud.texto)}">${ic('warn')}${T('atrasada')}</span>` : ''}${s.licencia.nivel !== 'libre' ? `<span class="pill av" title="${esc(s.licencia.texto)}">${ic('warn')}${T('uso_restringido')}</span>` : ''}
    </button></li>`).join('')}</ul>
    ${hay ? `<button type="button" class="btn" id="verMas" style="margin-top:12px">${T('ver_mas', {n: S.bib.coinciden - S.bib.series.length})}</button>` : S.bib.populares ? `<p class="ayuda" style="margin-top:12px">${T('no_ves_tuyo', {n: S.bib.total})}</p>` : ''}`;
  cont.querySelectorAll('.dato').forEach((b) => (b.onclick = () => alternar(S.bib.series.find((x) => x.id === b.dataset.id))));
  const vm = $('#verMas'); if (vm) vm.onclick = () => cargarBiblioteca(true);
}
function alternar(ficha) {
  const i = S.series.findIndex((s) => s.origen === 'biblioteca' && s.id === ficha.id);
  if (i >= 0) S.series.splice(i, 1);
  else { if (S.series.length >= 10) { aviso(T('max10')); return; } S.series.push({origen: 'biblioteca', id: ficha.id, nombre: ficha.nombre.split(' — ')[0], ficha}); }
  S.sel = null; S.analisis = null; S.modo = 'guiado'; guardar(); pintarLista(); pintarSeleccion(); pintarPasos(); regenerar();
}
function pintarSeleccion() {
  const c = $('#seleccion'); if (!c) return;
  c.innerHTML = S.series.length ? `<div class="caja"><strong>${T('elegidos', {n: S.series.length})}</strong>${S.series.map((s, k) => `<span class="ficha-sel">${esc(s.nombre)}<button type="button" data-k="${k}" aria-label="${esc(T('quitar', {x: s.nombre}))}">${ic('x')}</button></span>`).join('')}<span class="esp"></span><button class="btn p" id="sig">${T('sig_como_se_ve')}${ic('next')}</button></div>` : `<div class="caja"><span class="ayuda" style="margin:0">${T('elige_uno')}</span></div>`;
  c.querySelectorAll('.ficha-sel button').forEach((b) => (b.onclick = () => { S.series.splice(+b.dataset.k, 1); S.sel = null; S.analisis = null; guardar(); pintarLista(); pintarSeleccion(); pintarPasos(); regenerar(); }));
  const s = $('#sig'); if (s) s.onclick = () => ir(1);
}
// The first step does not ask for "a chart type": it asks WHICH STORY you want to tell. The style follows from that.
const INTENTOS = [
  {id: 'serie', g: 'int_g_mercados', t: 'int_serie_t', s: 'int_serie_s', plantilla: 'historia'},
  {id: 'pais', g: 'int_g_paises', t: 'int_pais_t', s: 'int_pais_s', plantilla: 'historia'},
  {id: 'paises', g: 'int_g_paises', t: 'int_paises_t', s: 'int_paises_s', plantilla: 'comparar'},
  {id: 'flujos', g: 'int_g_empresas', t: 'int_flujos_t', s: 'int_flujos_s', plantilla: 'resultados'},
  {id: 'puente', g: 'int_g_empresas', t: 'int_puente_t', s: 'int_puente_s', plantilla: 'puente'},
  {id: 'composicion', g: 'int_g_mis', t: 'int_comp_t', s: 'int_comp_s', plantilla: 'composicion'},
];
const esSerie = () => ['serie', 'pais', 'paises'].includes(S.intento);
const claseDe = (intento) => (['serie', 'pais', 'paises'].includes(intento) ? 'serie' : intento === 'flujos' ? 'flujos' : 'categorias');
const claseDatos = () => S.series[0]?.tabla ?? (S.series.length ? 'serie' : claseDe(S.intento));
// «Surprise me»: a real series from the catalog (long history, not a licence-restricted one) paired with the style the visualizer ranks first for it.
// The randomness lives only here (UI); the engine stays deterministic. Step 2 then shows the 3 best-fitting styles side by side as live drafts.
async function sorprender() {
  const est = $('#sorpresaEstado'), btn = $('#sorpresa'); btn.disabled = true; est.textContent = T('sorpresa_busca');
  try {
    const tot = (await api('/api/biblioteca?desde=0')).total ?? 0;
    for (let intento = 0; intento < 8; intento++) {
      const desde = Math.floor(Math.random() * Math.max(1, tot - 24)), lote = (await api('/api/biblioteca?desde=' + desde)).series ?? [];
      const largas = lote.filter((f) => f.descargada && f.inicio && f.fin && +String(f.fin).slice(0, 4) - +String(f.inicio).slice(0, 4) >= 15 && !/\bNC\b|personal|no redistribuir|investigaci|términos/i.test(f.licencia ?? ''));
      for (const f of largas.sort(() => Math.random() - 0.5).slice(0, 3)) {
        const serie = {origen: 'biblioteca', id: f.id, nombre: f.nombre.split(' — ')[0], ficha: f};
        const rec = (await post('/api/recomendar', {series: [limpio(serie)], formato: S.formato})).recomendadas ?? [];
        if (!rec.length) continue;
        S.intento = 'serie'; S.series = [serie]; S.plantilla = rec[0].plantilla; S.sel = null; S.analisis = null; S.modo = 'guiado'; S.subida = null; S.titulo = ''; S.tituloEditado = false;
        guardar(); pintarPasos(); regenerar(); ir(1); return;
      }
    }
    est.textContent = T('sorpresa_fallo');
  } catch { est.textContent = T('sorpresa_fallo'); }
  btn.disabled = false;
}
function paso1() {
  $('#paso').innerHTML = `
    <div class="guia"><strong>${T('guia_para_que')}</strong> ${T('guia_texto')}
      <ol><li>${T('guia_1')}</li><li>${T('guia_2')}</li><li>${T('guia_3')}</li></ol></div>
    <h2>${T('p1_h')}</h2>
    <p style="margin:0 0 10px"><button type="button" class="btn" id="sorpresa">${ic('spark')}${T('sorpresa_b')}</button> <span class="ayuda" id="sorpresaEstado" role="status">${T('sorpresa_a')}</span></p>
    <div class="intentos" id="intentos" role="radiogroup" aria-label="${T('p1_aria')}">${INTENTOS.map((i) => `<button type="button" class="intento" role="radio" aria-checked="${S.intento === i.id}" data-id="${i.id}"><span class="g">${esc(T(i.g))}</span><span class="t">${esc(T(i.t))}</span><span class="s">${esc(T(i.s))}</span></button>`).join('')}</div>
    <div id="bloque"></div>`;
  $('#sorpresa').onclick = sorprender;
  $('#intentos').querySelectorAll('.intento').forEach((b) => (b.onclick = () => {
    const nuevo = b.dataset.id; if (nuevo === S.intento) return;
    S.intento = nuevo;
    if (S.series.length) { S.series = []; S.sel = null; S.analisis = null; S.subida = null; S.spec = S.plano = S.informe = null; mostrarVista(); }
    S.plantilla = INTENTOS.find((i) => i.id === nuevo).plantilla; guardar(); paso1(); pintarPasos();
  }));
  if (S.intento === 'pais') paso1Pais(); else if (S.intento === 'paises') paso1Paises(); else if (S.intento === 'serie') paso1Serie(); else paso1Tabla();
}
function paso1Serie() {
  $('#bloque').innerHTML = `
    <p class="ayuda">${T('serie_ayuda')}</p>
    <div class="buscador">${ic('search')}<input id="busca" type="search" aria-label="${T('serie_buscar_aria')}" placeholder="${T('serie_buscar_ph')}" value="${esc(S.q)}" autocomplete="off"></div>
    <div class="chips" id="chips" role="group" aria-label="${T('categorias')}"></div>
    <div id="lista"></div>
    <div class="seleccion" id="seleccion"></div>
    <details class="det otras" ${S.subida || empSeriesSel ? 'open' : ''}><summary>${T('otras_formas')}</summary>
      <h3>${T('emp_serie_h')}</h3>
      <p class="ayuda">${T('emp_serie_a')}</p>
      <label class="etq" for="busS">${T('emp_buscar_l')}</label>
      <input id="busS" type="search" placeholder="${T('emp_ph')}" autocomplete="off">
      <div id="empSerie"></div>
      <h3>${T('propios_h')}</h3>
      <p class="ayuda">${T('propios_a')}</p>
      <div id="drop" tabindex="0">${ic('up')} ${T('suelta')} <label for="arch" style="color:var(--oro);text-decoration:underline;cursor:pointer">${T('elegirlo')}</label><input id="arch" type="file" class="sr"></div>
      <div id="subida"></div>
    </details>`;
  let d; $('#busca').oninput = (e) => { S.q = e.target.value; clearTimeout(d); d = setTimeout(cargarBiblioteca, 250); };
  const drop = $('#drop'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('sobre'); }; drop.ondragleave = () => drop.classList.remove('sobre');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('sobre'); subir(e.dataTransfer.files[0]); };
  $('#arch').onchange = (e) => subir(e.target.files[0]);
  pintarSeleccion(); pintarSubida(); iniciarEmpSerie(); if (S.bib) pintarLista(); else cargarBiblioteca();
}

// ── countries: a country card with key figures, and country-vs-country comparison ───────────────────────────────────
const GRUPOS_PAISES = {g7: ['USA', 'JPN', 'DEU', 'GBR', 'FRA', 'ITA', 'CAN'], latam: ['COL', 'MEX', 'BRA', 'ARG', 'CHL', 'PER'], brics: ['BRA', 'RUS', 'IND', 'CHN', 'ZAF'], mayores: ['USA', 'CHN', 'DEU', 'JPN', 'IND']};
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let paisesCat = null, paisesIdioma = null;
async function cargarPaises() {
  if (paisesIdioma !== L()) { paisesCat = null; paisesIdioma = L(); }   // names and regions come localized from the server
  if (!paisesCat) { try { const [p, i] = await Promise.all([api('/api/paises'), api('/api/indicadores-pais')]); paisesCat = {paises: p.paises ?? [], indicadores: i.indicadores ?? []}; } catch (e) { paisesCat = {error: e.message, paises: [], indicadores: []}; } }
  return paisesCat;
}
function aplicarSeries(lista, titulo = '', resalta = undefined) { S.series = lista; S.sel = null; S.analisis = null; S.modo = 'guiado'; S.titulo = titulo; S.tituloEditado = !!titulo; S.foco = 0; S.resalta = resalta; guardar(); pintarSeleccion(); pintarPasos(); regenerar(); }
const porRegion = (paises) => paises.reduce((m, p) => ((m[p.region] ??= []).push(p), m), {});
async function paso1Pais() {
  $('#bloque').innerHTML = `<p class="ayuda">${T('pais_ayuda')}</p>
    <div class="buscador">${ic('search')}<input id="busP" type="search" aria-label="${T('pais_buscar_aria')}" placeholder="${T('pais_buscar_ph')}" autocomplete="off"></div>
    <div id="listaP"><p class="ayuda">${T('cargando_paises')}</p></div><div id="fichaP"></div><div class="seleccion" id="seleccion"></div>`;
  pintarSeleccion();
  const cat = await cargarPaises(); const lp = $('#listaP'); if (!lp) return;
  if (cat.error || !cat.paises.length) { lp.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('paises_error')}${cat.error ? ': ' + esc(cat.error) : ''}.</div></div>`; return; }
  const pintar = () => {
    const q = norm($('#busP').value), l = cat.paises.filter((p) => !q || norm(p.nombre).includes(q) || norm(p.region).includes(q)), reg = porRegion(l);
    lp.innerHTML = l.length ? Object.entries(reg).map(([r, ps]) => `<p class="tag" style="margin:12px 0 6px">${esc(r)}</p><div class="chips" style="margin:0" role="radiogroup" aria-label="${esc(r)}">${ps.map((p) => `<button type="button" class="chip" role="radio" data-iso="${p.iso3}" aria-checked="${S.pais === p.iso3}" aria-pressed="${S.pais === p.iso3}">${esc(p.nombre)}</button>`).join('')}</div>`).join('') : `<p class="ayuda">${T('pais_no_hay')}</p>`;
    lp.querySelectorAll('.chip').forEach((b) => (b.onclick = () => elegirPais(b.dataset.iso)));
  };
  $('#busP').oninput = pintar; pintar(); if (S.pais) elegirPais(S.pais);
}
async function elegirPais(iso) {
  S.pais = iso; guardar(); const box = $('#fichaP'); if (!box) return;
  document.querySelectorAll('#listaP .chip').forEach((b) => { const on = b.dataset.iso === iso; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); });
  box.innerHTML = `<p class="ayuda"><span class="pulso"></span> ${T('pais_trayendo')}</p>`;
  let f; try { f = await api('/api/ficha-pais?iso=' + iso); } catch (e) { box.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; return; }
  if (S.pais !== iso) return;
  if (S.series.some((s) => !String(s.id ?? '').startsWith('pais_' + iso + '_'))) aplicarSeries([]);
  const on = (i) => S.series.some((s) => s.id === i.serieId);
  box.innerHTML = `<h3>${T('pais_datos_clave', {p: esc(f.pais.nombre)})}</h3><div class="kpis">${f.indicadores.map((i) => `<button type="button" class="kpi" data-id="${esc(i.serieId)}" aria-pressed="${on(i)}" ${i.valor == null ? 'disabled' : ''}><span class="k">${esc(i.nombre)}</span><span class="v">${esc(i.valorFormateado ?? T('sin_dato'))}</span><span class="m">${i.valor == null ? esc(i.motivo ?? T('no_publicado')) : esc(i.anio + ' · ' + (i.fuente?.nombre ?? ''))}</span>${i.nota ? `<span class="m" style="color:var(--oro)">${esc(i.nota)}</span>` : ''}<span class="marca">${ic('check')}</span></button>`).join('')}</div>
    <p class="ayuda" style="margin-top:10px">${T('pais_nota')}</p>`;
  box.querySelectorAll('.kpi').forEach((b) => (b.onclick = () => {
    const ind = f.indicadores.find((x) => x.serieId === b.dataset.id), i = S.series.findIndex((s) => s.id === ind.serieId), lista = S.series.slice();
    if (i >= 0) lista.splice(i, 1); else { if (lista.length >= 10) { aviso(T('max10_corto')); return; } lista.push({origen: 'biblioteca', id: ind.serieId, nombre: ind.nombre.split(' (')[0]}); }
    aplicarSeries(lista, lista.length === 1 ? `${f.pais.nombre}: ${lista[0].nombre}` : lista.length ? T('pais_titulo_clave', {p: f.pais.nombre}) : ''); b.setAttribute('aria-pressed', i < 0);
  }));
}
async function paso1Paises() {
  $('#bloque').innerHTML = `<p class="ayuda">${T('paises_ayuda')}</p>
    <h3>${T('paises_h1')}</h3><div id="indP"><p class="ayuda">${T('cargando')}</p></div>
    <h3>${T('paises_h2')}</h3><div class="chips" id="grupos" role="group" aria-label="${T('grupos_aria')}"></div><div id="listaP"></div><div class="seleccion" id="seleccion"></div>`;
  pintarSeleccion();
  const cat = await cargarPaises(); if (!$('#indP')) return;
  if (cat.error || !cat.paises.length) { $('#indP').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('paises_error')}${cat.error ? ': ' + esc(cat.error) : ''}.</div></div>`; return; }
  const clave = () => S.indPais ?? cat.indicadores[0]?.clave, isos = () => S.series.map((s) => String(s.id).split('_')[1]).filter(Boolean);
  const nombreDe = (iso) => cat.paises.find((p) => p.iso3 === iso)?.nombre ?? iso;
  const poner = (lista) => aplicarSeries(lista.slice(0, 8).map((iso) => ({origen: 'biblioteca', id: `pais_${iso}_${clave()}`, nombre: nombreDe(iso)})), lista.length ? (cat.indicadores.find((i) => i.clave === clave())?.nombre ?? '').split(' (')[0] : '');
  const pintar = () => {
    const temas = cat.indicadores.reduce((m, i) => ((m[i.tema ?? T('otros')] ??= []).push(i), m), {});
    const actual = cat.indicadores.find((i) => i.clave === clave());
    $('#indP').innerHTML = `<select id="selInd" aria-label="${T('indicador')}">${Object.entries(temas).map(([t, l]) => `<optgroup label="${esc(t)}">${l.map((i) => `<option value="${esc(i.clave)}" ${clave() === i.clave ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}</optgroup>`).join('')}</select>${actual ? `<p class="ayuda" style="margin:6px 0 0">${T('fuente_l')} ${esc(actual.fuente ?? '')} · ${esc(actual.unidad ?? '')}</p>` : ''}`;
    $('#selInd').onchange = (e) => { const act = isos(); S.indPais = e.target.value; guardar(); pintar(); if (act.length) poner(act); };
    $('#grupos').innerHTML = Object.keys(GRUPOS_PAISES).map((g) => `<button type="button" class="chip" data-g="${esc(g)}">${esc(T('grp_' + g))}</button>`).join('') + (S.series.length ? `<button type="button" class="chip" data-g="">${T('quitar_todos')}</button>` : '');
    $('#grupos').querySelectorAll('.chip').forEach((b) => (b.onclick = () => { if (!b.dataset.g) aplicarSeries([]); else poner(GRUPOS_PAISES[b.dataset.g]); pintar(); }));
    const reg = porRegion(cat.paises), sel = isos();
    $('#listaP').innerHTML = Object.entries(reg).map(([r, ps]) => `<p class="tag" style="margin:12px 0 6px">${esc(r)}</p><div class="chips" style="margin:0" role="group" aria-label="${esc(r)}">${ps.map((p) => `<button type="button" class="chip" data-iso="${p.iso3}" aria-pressed="${sel.includes(p.iso3)}">${esc(p.nombre)}</button>`).join('')}</div>`).join('');
    $('#listaP').querySelectorAll('.chip').forEach((b) => (b.onclick = () => { const l = isos(), k = l.indexOf(b.dataset.iso); if (k >= 0) l.splice(k, 1); else { if (l.length >= 8) { aviso(T('max8')); return; } l.push(b.dataset.iso); } poner(l); pintar(); }));
  };
  pintar();
}

// ── a company's results as time series (mixed with the rest of the library) ─────────────────────────────────────────
let empSeriesDeb, empSeriesSel = null;
function iniciarEmpSerie() {
  const inp = $('#busS'); if (!inp) return;
  const buscar = async () => {
    const l = (await api('/api/empresas?q=' + encodeURIComponent(inp.value))).empresas.slice(0, 16), box = $('#empSerie'); if (!box) return;
    box.innerHTML = `<div class="chips">${l.map((e) => `<button type="button" class="chip" data-t="${esc(e.ticker)}" aria-pressed="${empSeriesSel?.ticker === e.ticker}">${esc(e.nombre)} <small style="opacity:.6">${esc(e.ticker)}</small></button>`).join('')}</div><div id="empMetricas"></div>`;
    box.querySelectorAll('.chip').forEach((b) => (b.onclick = async () => {
      $('#empMetricas').innerHTML = `<p class="ayuda"><span class="pulso"></span> ${T('sec_trayendo_res')}</p>`;
      try { empSeriesSel = await api('/api/serie-empresa?ticker=' + b.dataset.t); pintarMetricas(); } catch (e) { $('#empMetricas').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; }
    }));
    if (empSeriesSel) pintarMetricas();
  };
  inp.oninput = () => { clearTimeout(empSeriesDeb); empSeriesDeb = setTimeout(buscar, 250); };
  buscar();
}
function pintarMetricas() {
  const box = $('#empMetricas'); if (!box || !empSeriesSel) return;
  if (!empSeriesSel.series.length) { box.innerHTML = `<div class="aviso">${ic('info')}<div>${T('emp_sin_res', {n: esc(empSeriesSel.nombre)})}</div></div>`; return; }
  const on = (s) => S.series.some((x) => x.ruta === s.ruta && x.col === s.col);
  box.innerHTML = `<p class="ayuda" style="margin:10px 0 4px">${T('emp_rango', {n: `<strong>${esc(empSeriesSel.nombre)}</strong>`, d: esc(empSeriesSel.desde), h: esc(empSeriesSel.hasta)})}</p><div class="chips">${empSeriesSel.series.map((s, k) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${on(s)}">${esc(s.nombre.split(' · ')[1])}</button>`).join('')}</div>`;
  box.querySelectorAll('.chip').forEach((b) => (b.onclick = () => {
    const s = empSeriesSel.series[+b.dataset.k], i = S.series.findIndex((x) => x.ruta === s.ruta && x.col === s.col);
    if (S.series.some((x) => x.tabla || x.origen === "biblioteca" || x.ruta !== s.ruta)) S.series = [];   // one company at a time
    if (i >= 0) S.series.splice(i, 1); else { if (S.series.length >= 10) { aviso(T('max10_corto')); return; } S.series.push(s); }
    S.sel = null; S.analisis = null; S.modo = 'guiado'; S.tituloEditado = false; guardar(); pintarMetricas(); pintarSeleccion(); pintarPasos(); regenerar();
  }));
}

// ── table stories: company + quarter (SEC), or your own table ───────────────────────────────────────────────────────
const AYUDA_TABLA = {
  flujos: {cols: 'tabla_flujos', archivo: 'estado_resultados_ejemplo.csv'},
  composicion: {cols: 'tabla_comp', archivo: 'composicion_ejemplo.csv'},
  puente: {cols: 'tabla_puente', archivo: 'puente_ejemplo.csv'},
};
function paso1Tabla() {
  const conEmpresa = S.intento === 'flujos' || S.intento === 'puente', a = AYUDA_TABLA[S.intento];
  $('#bloque').innerHTML = `
    ${conEmpresa ? `<h3>${T('trim_h')}</h3>
      <p class="ayuda">${T('trim_a')}</p>
      <label class="etq" for="busE">${T('trim_buscar_l')}</label>
      <input id="busE" type="search" placeholder="${T('trim_ph')}" value="${esc(S.empQ)}" autocomplete="off">
      <div id="listaE"></div><div id="trims"></div>` : ''}
    <h3>${conEmpresa ? T('o_tabla') : T('tu_tabla')}</h3>
    <p class="ayuda">${T(a.cols)} ${T('excel_o_csv')}</p>
    <div class="fila"><button class="btn" id="ej">${ic('film')}${T('probar_ej')}</button><a class="btn" href="/ejemplos/${a.archivo}" download>${ic('up')}${T('bajar_plantilla')}</a></div>
    <div id="drop" tabindex="0" style="margin-top:12px">${ic('up')} ${T('suelta')} <label for="arch" style="color:var(--oro);text-decoration:underline;cursor:pointer">${T('elegirlo')}</label><input id="arch" type="file" class="sr"></div>
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
      guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso(T('ej_cargado'));
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
  const l = S.empresas ?? []; if (!l.length) { c.innerHTML = `<p class="ayuda">${T('emp_no_hay')}</p>`; return; }
  c.innerHTML = `<p class="ayuda" style="margin:8px 0 4px">${S.empQ.trim() ? plural(l.length, 'res_1', 'res_n') : T('emp_destacadas')}${T('emp_demas')}</p>
    <div class="chips" role="radiogroup" aria-label="${T('empresas')}">${l.map((e) => `<button type="button" class="chip" role="radio" data-t="${esc(e.ticker)}" aria-checked="${S.emp === e.ticker}" aria-pressed="${S.emp === e.ticker}" title="${esc(e.trimestres ? T('emp_tip', {n: e.trimestres, u: e.ultimo}) : T('se_descarga'))}">${esc(e.nombre)} <small style="opacity:.6">${esc(e.ticker)}</small></button>`).join('')}</div>`;
  c.querySelectorAll('.chip').forEach((b) => (b.onclick = () => elegirEmpresa(b.dataset.t)));
}
async function elegirEmpresa(t) {
  S.emp = t; S.trims = null; pintarEmpresas(); const box = $('#trims'); if (box) box.innerHTML = `<p class="ayuda"><span class="pulso"></span> ${T('sec_trayendo_trim')}</p>`;
  try { S.trims = await api('/api/trimestres?ticker=' + t); } catch (e) { if (box) box.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; return; }
  guardar(); pintarTrims();
}
const fmtMM = (v) => (v >= 1e9 ? T('mm_b', {v: num(v / 1e9, {maximumFractionDigits: 1})}) : T('mm_m', {v: num(v / 1e6, {maximumFractionDigits: 0})}));
function pintarTrims() {
  const box = $('#trims'); if (!box || !S.trims) return;
  const Tr = S.trims, flujo = S.intento === 'flujos', sel = S.series[0]?.trimestre, esSel = (t) => sel && sel.ticker === Tr.ticker && sel.fin === t.fin;
  const chip = (t) => { const off = flujo && !t.sankey; return `<button type="button" class="chip" data-fin="${t.fin}" aria-pressed="${esSel(t)}" ${off ? 'disabled' : ''} title="${esc(off ? T('trim_perdida') : T('trim_tip', {f: t.form, p: t.publicado, i: fmtMM(t.ingresos)}) + (t.q4Calculado ? T('trim_q4') : '') + (t.conSegmentos ? T('trim_seg') : ''))}">${esc(t.etiqueta.replace(' FY', ' · '))}${t.conSegmentos ? ` <span title="${T('trim_seg_tip')}" style="color:var(--oro)">●</span>` : ''}</button>`; };
  if (Tr.sinDatos) { box.innerHTML = `<h3 style="margin-top:14px">${esc(Tr.nombre)}</h3><div class="aviso">${ic('info')}<div>${esc(Tr.sinDatos)}</div></div>`; return; }
  const recientes = Tr.trimestres.slice(0, 8), resto = Tr.trimestres.slice(8), porAnio = {};
  resto.forEach((t) => (porAnio[t.fy] ??= []).push(t));
  box.innerHTML = `<h3 style="margin-top:14px">${T('trim_elige', {n: esc(Tr.nombre)})}</h3>
    <div class="chips" role="group" aria-label="${T('trim_recientes')}">${recientes.map(chip).join('')}</div>
    ${resto.length ? `<details class="det"><summary>${T('trim_anteriores', {n: resto.length, d: esc(Tr.trimestres.at(-1).etiqueta)})}</summary>${Object.entries(porAnio).sort((a, b) => b[0] - a[0]).map(([y, l]) => `<p class="etq" style="margin:10px 0 4px">FY${y}</p><div class="chips">${l.map(chip).join('')}</div>`).join('')}</details>` : ''}
    <p class="ayuda" style="margin-top:10px">${T('trim_fuente', {d: esc(String(Tr.actualizado).slice(0, 10))})}</p>`;
  box.querySelectorAll('.chip').forEach((b) => (b.onclick = () => elegirTrim(b.dataset.fin)));
}
async function elegirTrim(fin) {
  const uso = S.intento === 'puente' ? 'puente' : 'sankey';
  try {
    const it = await api(`/api/trimestre?ticker=${S.emp}&fin=${fin}&uso=${uso}`);
    S.series = [it]; S.plantilla = uso === 'sankey' ? 'resultados' : 'puente'; S.sel = null; S.analisis = null; S.modo = 'guiado'; S.tituloEditado = false;
    guardar(); pintarSeleccion(); pintarPasos(); pintarTrims(); regenerar(); aviso(T('trim_listo', {n: it.nombre}));
  } catch (e) { $('#trims').insertAdjacentHTML('beforeend', `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`); }
}
function pintarSubidaTabla() {
  const box = $('#subida'); if (!box || !S.subida) return;
  const {insp, ruta, nombre, tabla} = S.subida, necesita = claseDe(S.intento), nom = nombre.replace(/\.[^.]+$/, '');
  if (tabla !== necesita) {
    box.innerHTML = `<div class="aviso mal">${ic('warn')}<div><strong>${T('tabla_no_sirve')}</strong><br>${T('tabla_tiene_cols', {c: insp.columnas.map((c) => esc(c.nombre)).join(', ')})}<br>${T(AYUDA_TABLA[S.intento].cols)}</div></div>`; return;
  }
  box.innerHTML = `<div class="simple" style="margin-top:12px"><h3>${esc(nombre)} · ${T('tabla_filas', {n: num(insp.filas), t: tabla === 'flujos' ? T('tipo_flujos') : T('tipo_cats')})}</h3>
    <label class="etq" for="fnom">${T('fuente_oblig')}</label>
    <input id="fnom" type="text" placeholder="${T('fuente_ph_tabla')}">
    <p class="ayuda" style="margin:6px 0 0">${T('fuente_nota_tabla')}</p>
    <div class="fila" style="margin-top:10px"><div><label class="etq" for="fpre">${T('simbolo_antes')}</label><input id="fpre" type="text" placeholder="US$ " maxlength="6"></div><div><label class="etq" for="fsuf">${T('texto_despues')}</label><input id="fsuf" type="text" placeholder="${T('suf_ph')}" maxlength="10"></div></div>
    <div id="errSub"></div><div class="fila" style="margin-top:12px"><button class="btn p" id="usarSub">${T('usar_tabla')}</button></div></div>`;
  $('#usarSub').onclick = () => {
    const fn = $('#fnom').value.trim(); if (!fn) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('falta_fuente')}</div></div>`; $('#fnom').focus(); return; }
    S.series = [{origen: 'archivo', ruta, hoja: insp.hoja ?? undefined, filaEncabezado: insp.filaEncabezado, tabla, nombre: nom, fuente: {nombre: fn, obtenido: new Date().toISOString().slice(0, 10)}, prefijo: $('#fpre').value || undefined, sufijo: $('#fsuf').value || undefined, decimales: 'auto'}];
    S.plantilla = INTENTOS.find((i) => i.id === S.intento).plantilla; S.tituloEditado = false; S.sel = null; S.analisis = null; S.modo = 'guiado';
    guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso(T('tabla_lista'));
  };
}

// ── your own data ───────────────────────────────────────────────────────────────────────────────────────────────
async function subir(f) {
  if (!f) return;
  const box = $('#subida'); box.innerHTML = `<p class="ayuda">${T('leyendo')}</p>`;
  try {
    const j = await api('/api/subir?nombre=' + encodeURIComponent(f.name), {method: 'POST', body: await f.arrayBuffer()});
    if (j.tipo === 'imagen') { box.innerHTML = `<div class="aviso ok">${ic('check')}<div>${T('img_guardada', {r: `<span class="mono">${esc(j.ruta)}</span>`})}</div></div>`; return; }
    S.subida = {ruta: j.ruta, insp: j.inspeccion, nombre: f.name, tabla: j.tabla};
    if (j.tabla && esSerie()) { S.intento = j.tabla === 'flujos' ? 'flujos' : 'composicion'; S.plantilla = S.intento === 'flujos' ? 'resultados' : 'composicion'; guardar(); paso1(); pintarPasos(); return; }   // it looks like a table: switch to its story
    if (esSerie()) pintarSubida(); else pintarSubidaTabla();
  } catch (e) { box.innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('no_lei', {e: esc(e.message)})}</div></div>`; }
}
function pintarSubida() {
  const box = $('#subida'); if (!box || !S.subida) return;
  const {insp, ruta, nombre} = S.subida, cols = insp.columnas, fecha = cols.find((c) => c.tipo === 'fecha') ?? cols.find((c) => c.tipo === 'número' && Number(c.primero) > 1000 && Number(c.primero) < 2200) ?? cols[0];
  const nums = cols.filter((c) => c.tipo === 'número' && c !== fecha);
  box.innerHTML = `<div class="simple" style="margin-top:12px">
    <h3>${esc(nombre)} · ${T('n_filas', {n: num(insp.filas)})}${insp.hoja ? T('hoja_x', {h: esc(insp.hoja)}) : ''}</h3>
    ${insp.hojas && insp.hojas.length > 1 ? `<label class="etq" for="hoja">${T('hoja_libro')}</label><select id="hoja">${insp.hojas.map((h) => `<option ${h === insp.hoja ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select>` : ''}
    <label class="etq" for="colX" style="margin-top:10px">${T('col_fechas')}</label>
    <select id="colX">${cols.map((c) => `<option value="${esc(c.nombre)}" ${c === fecha ? 'selected' : ''}>${esc(c.nombre)} (${esc(c.tipo)})</option>`).join('')}</select>
    <p class="etq" style="margin-top:12px">${T('que_graficar')}</p>
    ${nums.length ? nums.slice(0, 12).map((c, k) => `<label class="conmuta" style="margin:4px 0"><input type="checkbox" class="cv" value="${esc(c.nombre)}" ${k === 0 ? 'checked' : ''}><span>${esc(c.nombre)}<br><small class="mono" style="color:var(--suave)">${T('ej_l')} ${esc((c.ejemplo ?? []).join(' · '))}</small></span></label>`).join('') : `<p class="ayuda">${T('sin_numericas')}</p>`}
    <label class="etq" for="fnom" style="margin-top:12px">${T('fuente_oblig')}</label>
    <input id="fnom" type="text" placeholder="${T('fuente_ph_serie')}">
    <p class="ayuda" style="margin:6px 0 0">${T('fuente_nota_serie')}</p>
    <details class="det"><summary>${T('avanzadas')}</summary>
      <label class="etq" for="fdec">${T('sep_decimal')}</label><select id="fdec"><option value="">${T('dec_auto')}</option><option value=",">${T('dec_coma')}</option></select>
      <label class="etq" for="ffec" style="margin-top:8px">${T('orden_fecha')}</label><select id="ffec"><option value="">${T('fec_iso')}</option><option value="dmy">${T('fec_dmy')}</option><option value="mdy">${T('fec_mdy')}</option></select>
      <label class="conmuta" style="margin-top:8px"><input type="checkbox" id="fser"><span>${T('fec_serial')}</span></label>
    </details>
    <div id="errSub"></div>
    <div class="fila" style="margin-top:12px"><button class="btn p" id="usarSub">${T('usar_datos')}</button></div></div>`;
  const hs = $('#hoja'); if (hs) hs.onchange = async () => { const j = await api(`/api/inspeccionar?archivo=${encodeURIComponent(ruta)}&hoja=${encodeURIComponent(hs.value)}`); S.subida.insp = j; pintarSubida(); };
  $('#usarSub').onclick = () => {
    const fn = $('#fnom').value.trim(), x = $('#colX').value, vs = [...box.querySelectorAll('.cv:checked')].map((i) => i.value), cx = cols.find((c) => c.nombre === x);
    if (!fn) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('falta_fuente')}</div></div>`; $('#fnom').focus(); return; }
    if (!vs.length) { $('#errSub').innerHTML = `<div class="aviso mal">${ic('warn')}<div>${T('marca_una')}</div></div>`; return; }
    S.series = vs.map((v) => ({origen: 'archivo', ruta, hoja: insp.hoja ?? undefined, filaEncabezado: insp.filaEncabezado, x, tipoX: cx.tipo === 'fecha' ? 'fecha' : cx.tipo === 'número' && Number(cx.primero) > 1000 && Number(cx.primero) < 2200 ? 'anio' : 'num', col: v, nombre: v,
      decimal: $('#fdec').value || undefined, formatoFecha: $('#ffec').value || undefined, fechaSerial: $('#fser').checked || undefined, fuente: {nombre: fn, obtenido: new Date().toISOString().slice(0, 10)}}));
    S.sel = null; S.analisis = null; S.modo = 'guiado'; guardar(); pintarSeleccion(); pintarPasos(); regenerar(); aviso(T('datos_listos'));
  };
}

// ── STEP 2: how to see it ───────────────────────────────────────────────────────────────────────────────────────
const MINI = {
  dos_hitos: '<svg class="mini" viewBox="0 0 200 84" aria-hidden="true"><path d="M10 52 L50 54 L80 36 L110 44 L150 20 L190 26" fill="none" stroke="#C9A84C" stroke-width="2.5"/><path d="M10 52 L50 50 L80 62 L110 56 L150 48 L190 40" fill="none" stroke="#50B5A2" stroke-width="2.5"/><circle cx="10" cy="52" r="4" fill="#F2EEE3"/></svg>',
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
// Two milestones: every date is a claim, so nothing is drawn until BOTH have a date, a name and a source (the server enforces the same rule).
const hitoOk = (h) => /^\d{4}-\d{2}-\d{2}$/.test(h.fecha) && h.nombre.trim() !== '' && h.fuente.trim().length >= 8;
const hitosListos = () => S.hitos.every(hitoOk);
const extraHitos = () => (S.plantilla === 'dos_hitos' ? {hitos: S.hitos.map((h) => ({fecha: h.fecha, nombre: h.nombre.trim(), fuente: h.fuente.trim()})), estricto: true} : {});
function panelHitos() {
  const s0 = S.series[0] ?? {}, ini = s0.inicio ? String(s0.inicio).slice(0, 10) : '', fin = s0.fin ? String(s0.fin).slice(0, 10) : '';
  return `<h3>${T('hitos_h')}</h3><p class="ayuda">${T('hitos_a')}${ini && fin ? ' ' + T('hitos_rango', {a: ini, b: fin}) : ''}</p>
    ${S.hitos.map((h, k) => `<fieldset class="hito" style="border:1px solid var(--linea,#3a3a36);border-radius:10px;margin:8px 0;padding:10px 12px"><legend>${T('hito_n', {n: k + 1})}</legend>
      <label class="etq" for="hf${k}">${T('hito_fecha')}</label><input id="hf${k}" type="date" data-k="${k}" data-c="fecha" value="${esc(h.fecha)}"${ini ? ` min="${ini}"` : ''}${fin ? ` max="${fin}"` : ''}>
      <label class="etq" for="hn${k}">${T('hito_nombre')}</label><input id="hn${k}" type="text" maxlength="40" data-k="${k}" data-c="nombre" value="${esc(h.nombre)}" placeholder="${esc(T('hito_nombre_ph'))}">
      <label class="etq" for="hs${k}">${T('hito_fuente')}</label><input id="hs${k}" type="text" maxlength="200" data-k="${k}" data-c="fuente" value="${esc(h.fuente)}" placeholder="${esc(T('hito_fuente_ph'))}"></fieldset>`).join('')}
    <p class="ayuda" id="hitosEstado" ${hitosListos() ? 'hidden' : ''}>${T('hitos_faltan')}</p>`;
}
async function paso2() {
  const n = S.series.length;
  // First ask which styles tell THIS data well (visualizer rules); only those are shown large.
  let rec = null; try { rec = (await post('/api/recomendar', {series: S.series.map(limpio), formato: S.formato})).recomendadas ?? null; } catch { rec = null; }
  if (S.paso !== 1) return;
  if (S.series.length === 1 && /^pais_/.test(S.series[0].id ?? '')) await cargarPaises();
  const porque = Object.fromEntries((rec ?? []).map((r) => [r.plantilla, r.porque])), orden = (rec ?? []).map((r) => r.plantilla);
  $('#paso').innerHTML = `
    <h2>${T('p2_h')}</h2>
    <p class="ayuda">${T('p2_a')}</p>
    ${ideasPais()}${ideasSerie()}
    ${(() => {
      // only the styles that work for what you chose are shown; the rest stay folded (no scolding)
      const clase = claseDatos(), mios = S.plantillas.filter((p) => (p.datos ?? 'serie') === clase), encajan = mios.filter((p) => n >= p.necesita.min && n <= p.necesita.max), otros = mios.filter((p) => !encajan.includes(p));
      const carta = (p, ok, extra = false) => `<button type="button" class="carta tpl${extra ? ' extra' : ''}" role="radio" aria-checked="${S.plantilla === p.id}" aria-disabled="${!ok}" data-id="${p.id}">${MINI[p.id] ?? ''}<span class="marca">${ic('check')}</span><span class="tit">${esc(nomTpl(p))}</span><span class="sub">${esc(desTpl(p))}</span>${ok ? (porque[p.id] ? `<span class="sub recom">${orden[0] === p.id ? T('recomendada_c') : T('encaja_c')}${esc(porque[p.id])}</span>` : '') : `<span class="sub" style="color:var(--oro)">${ic('warn')} ${esc(ayuTpl(p))} ${T('elegiste', {n})}</span>`}</button>`;
      let casos = clase === 'categorias' && !esSerie() ? encajan.filter((p) => (S.intento === 'puente' ? p.id === 'puente' : p.id === 'composicion')).concat(encajan.filter((p) => !(S.intento === 'puente' ? p.id === 'puente' : p.id === 'composicion'))) : encajan;
      let sobran = [];
      if (orden.length) { const rec2 = orden.map((id) => casos.find((p) => p.id === id)).filter(Boolean); if (rec2.length) { sobran = casos.filter((p) => !rec2.includes(p)); casos = rec2; } }
      if (!casos.some((p) => p.id === S.plantilla) && !sobran.some((p) => p.id === S.plantilla) && casos[0]) { S.plantilla = casos[0].id; guardar(); setTimeout(regenerar, 0); }
      return `<div class="rejilla galeria" role="radiogroup" aria-label="${T('estilos_aria')}">${casos.map((p) => carta(p, true)).join('')}</div>
        ${sobran.length ? `<details class="det"><summary>${T('otros_no_rec', {n: sobran.length})}</summary><p class="ayuda" style="margin-top:8px">${T('otros_no_rec_a')}</p><div class="rejilla" style="margin-top:10px">${sobran.map((p) => carta(p, true, true)).join('')}</div></details>` : ''}
        ${otros.length ? `<details class="det"><summary>${T('otros_cantidad')}</summary><div class="rejilla" style="margin-top:10px">${otros.map((p) => carta(p, false, true)).join('')}</div></details>` : ''}`;
    })()}
    <h3>${T('titulo_h')}</h3>
    <label class="etq" for="titulo">${T('titulo_l')}</label>
    <input id="titulo" type="text" maxlength="60" value="${esc(S.titulo)}" placeholder="${esc(S.series[0]?.nombre ?? T('titulo_ph'))}">
    <h3>${T('formato_h')}</h3>
    <div class="seg" role="group" aria-label="${T('formato_aria')}"><button type="button" data-f="horizontal" aria-pressed="${S.formato === 'horizontal'}">${T('fmt_h')}</button><button type="button" data-f="vertical" aria-pressed="${S.formato === 'vertical'}">${T('fmt_v')}</button></div>
    ${S.plantilla === 'dos_hitos' ? panelHitos() : ''}
    ${S.plantilla === 'comparar' ? `<h3>${T('protagonista_h')}</h3><p class="ayuda">${T('protagonista_a')}</p><div role="radiogroup" aria-label="${T('protagonista_aria')}">${S.series.map((s, k) => `<label class="conmuta" style="margin:4px 0"><input type="radio" name="foco" value="${k}" ${S.foco === k ? 'checked' : ''}><span>${esc(s.nombre)}</span></label>`).join('')}</div>` : ''}
    <div id="momentos"></div>
    ${barraNav(true, true, T('sig_camara'), n > 0)}`;
  // The visualizer marks the chart that best tells this data and says why (rules from "From Data to Viz" / FT Visual Vocabulary)
  post('/api/recomendar', {series: S.series.map(limpio), formato: S.formato}).then((r) => {
    const lista = r.recomendadas ?? []; if (!lista.length || S.paso !== 1) return;
    lista.forEach((c, k) => { const el = $('#paso').querySelector(`.tpl[data-id="${c.plantilla}"]`); if (!el || el.querySelector('.recom')) return; el.insertAdjacentHTML('beforeend', `<span class="sub recom" style="color:var(--oro,#C9A84C)">${k === 0 ? T('recomendada_c') : T('encaja_c')}${esc(c.porque)}</span>`); });
    const gal = $('#paso').querySelector('.galeria'); if (gal) [...lista].reverse().forEach((c) => { const el = gal.querySelector(`.tpl[data-id="${c.plantilla}"]`); if (el) gal.prepend(el); });
  }).catch(() => {});
  $('#paso').querySelectorAll('.hito input').forEach((i) => (i.oninput = () => { S.hitos[+i.dataset.k][i.dataset.c] = i.value; guardar(); const m = $('#hitosEstado'); if (m) m.hidden = hitosListos(); regenerarDebounce(); }));
  $('#paso').querySelectorAll('input[name=foco]').forEach((r) => (r.onchange = () => { S.foco = +r.value; guardar(); regenerar(); }));
  $('#paso').querySelectorAll('.tpl').forEach((b) => (b.onclick = () => { if (b.getAttribute('aria-disabled') === 'true') { aviso(ayuTpl(S.plantillas.find((p) => p.id === b.dataset.id))); return; } S.plantilla = b.dataset.id; guardar(); paso2(); regenerar(); }));
  $('#titulo').oninput = (e) => { S.titulo = e.target.value; S.tituloEditado = !!S.titulo.trim(); guardar(); regenerarDebounce(); };
  $('#paso').querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { S.formato = b.dataset.f; guardar(); paso2(); regenerar(); }));
  enlazarNav(1); enlazarIdeas(); enlazarIdeasSerie();
  miniaturas();
  if (S.plantilla === 'historia' && n === 1) await pintarMomentos();
}
// "Ideas": a lone country figure is thin; what makes it a story is putting it against other countries or in a ranking.
const datosPaisSel = () => { const m = S.series.length === 1 && /^pais_([A-Z]{3})_(.+)$/.exec(S.series[0].id ?? ''); return m ? {iso: m[1], clave: m[2]} : null; };
function ideasPais() {
  const d = datosPaisSel(); if (!d) return '';
  const nom = paisesCat?.paises?.find((p) => p.iso3 === d.iso)?.nombre ?? d.iso, ind = paisesCat?.indicadores?.find((i) => i.clave === d.clave);
  return `<div class="ideas"><p class="tag">${T('ideas_h')}</p><div class="ideas-fila">
    <button type="button" class="idea" id="ideaComparar"><b>${T('idea_comp_t', {p: esc(nom)})}</b><span>${T('idea_comp_s', {i: esc(ind?.nombre.split(' (')[0] ?? T('mismo_ind'))})}</span></button>
    <button type="button" class="idea" id="ideaRanking"><b>${T('idea_rank_t', {p: esc(nom)})}</b><span>${T('idea_rank_s', {p: esc(nom)})}</span></button></div></div>`;
}
function enlazarIdeas() {
  const d = datosPaisSel(); if (!d) return;
  const c = $('#ideaComparar'), r = $('#ideaRanking');
  if (c) c.onclick = async () => {
    const cat = await cargarPaises(), reg = cat.paises.find((p) => p.iso3 === d.iso)?.region, base = /latin|latam|caribbean|caribe/i.test(reg ?? '') ? GRUPOS_PAISES.latam : GRUPOS_PAISES.mayores;
    const isos = [d.iso, ...base.filter((x) => x !== d.iso)].slice(0, 6), nombre = (cat.indicadores.find((i) => i.clave === d.clave)?.nombre ?? '').split(' (')[0];
    S.intento = 'paises'; S.indPais = d.clave; S.plantilla = 'comparar';
    aplicarSeries(isos.map((iso) => ({origen: 'biblioteca', id: `pais_${iso}_${d.clave}`, nombre: cat.paises.find((p) => p.iso3 === iso)?.nombre ?? iso})), nombre); ir(1);
  };
  if (r) r.onclick = async () => {
    r.disabled = true; r.querySelector('span').textContent = T('armando_ranking');
    try {
      const {resalta, ...item} = await api(`/api/ranking-pais?clave=${d.clave}&iso=${d.iso}`);
      S.intento = 'paises'; S.indPais = d.clave; S.plantilla = 'ranking_pais'; aplicarSeries([item], item.nombre, d.iso); ir(1);
    } catch (e) { r.disabled = false; r.querySelector('span').textContent = e.message; }
  };
}
// More ideas for ONE catalog series (not a country figure): put it next to similar series, or let the line stop at its biggest moves.
const serieSuelta = () => (S.series.length === 1 && S.series[0].origen === 'biblioteca' && !datosPaisSel() ? S.series[0] : null);
function ideasSerie() {
  const sr = serieSuelta(); if (!sr) return '';
  const cat = sr.ficha?.categoria ?? '';
  return `<div class="ideas"><p class="tag">${T('ideas_h')}</p><div class="ideas-fila">
    ${cat ? `<button type="button" class="idea" id="ideaParecidas"><b>${T('idea_rel_t')}</b><span>${T('idea_rel_s', {c: esc(cat)})}</span></button>` : ''}
    <button type="button" class="idea" id="ideaMovs"><b>${T('idea_mov_t')}</b><span>${T('idea_mov_s')}</span></button></div></div>`;
}
function enlazarIdeasSerie() {
  const sr = serieSuelta(); if (!sr) return;
  const rel = $('#ideaParecidas'), mov = $('#ideaMovs');
  if (rel) rel.onclick = async () => {
    rel.disabled = true; const sp = rel.querySelector('span'); sp.textContent = T('idea_rel_busca');
    try {
      const lista = (await api('/api/biblioteca?categoria=' + encodeURIComponent(sr.ficha.categoria))).series ?? [];
      const otras = lista.filter((f) => f.id !== sr.id && f.descargada && f.frecuencia === sr.ficha.frecuencia && !/\bNC\b|personal|no redistribuir|investigaci|términos/i.test(f.licencia ?? '')).slice(0, 2);
      if (!otras.length) { sp.textContent = T('idea_rel_no'); rel.disabled = false; return; }
      S.series = [sr, ...otras.map((f) => ({origen: 'biblioteca', id: f.id, nombre: f.nombre.split(' — ')[0], ficha: f}))]; S.plantilla = 'comparar'; S.foco = 0; S.sel = null; S.analisis = null; guardar(); pintarPasos(); regenerar(); paso2();
    } catch { sp.textContent = T('idea_rel_no'); rel.disabled = false; }
  };
  if (mov) mov.onclick = async () => {
    mov.disabled = true;
    try {
      const an = await post('/api/analizar', {series: [limpio(sr)]});
      if (an.ok) { S.analisis = an; S.sel = Object.fromEntries(an.momentos.map((m) => [m.id, m.tipo === 'subida' || m.tipo === 'caida'])); }
      S.plantilla = 'historia'; guardar(); regenerar(); paso2();
    } catch { mov.disabled = false; }
  };
}
// Live gallery: each style shows how YOUR data would look (not a generic doodle). A real frame of each one is drawn.
let miniSeq = 0;
const cacheMini = new Map();   // miniaturas ya dibujadas, por (idioma + todo lo que cambia el dibujo): cambiar de paso o de título no las redibuja
const momentosSel = () => (S.analisis?.momentos ?? []).filter((m) => S.sel?.[m.id]).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: (S.etiquetas[m.id] || m.etiqueta).slice(0, 30)}));
async function miniaturas() {
  const seq = ++miniSeq, cards = [...$('#paso').querySelectorAll('.galeria .tpl:not([aria-disabled="true"])')];
  try { await document.fonts.load('800 40px Geist'); await document.fonts.load('500 20px "Geist Mono"'); } catch {}
  for (const card of cards) {
    if (seq !== miniSeq || S.paso !== 1) return;
    card.classList.add('cargando');
    try {
      if (card.dataset.id === 'dos_hitos' && !hitosListos()) { card.classList.remove('cargando'); continue; }
      const carga = {...(card.dataset.id === 'dos_hitos' ? {hitos: S.hitos.map((h) => ({fecha: h.fecha, nombre: h.nombre.trim(), fuente: h.fuente.trim()})), estricto: true} : {}), plantilla: card.dataset.id, series: S.series.map(limpio), momentos: momentosSel(), camara: S.camara, formato: S.formato, titulo: '', foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, resalta: S.resalta};
      const clave = JSON.stringify([L(), carga]), hit = cacheMini.get(clave);
      if (hit) {   // misma combinación ya dibujada: se reutiliza sin llamar al servidor ni volver a dibujar
        cacheMini.delete(clave); cacheMini.set(clave, hit);
        const cv = document.createElement('canvas'); cv.width = hit.width; cv.height = hit.height; cv.className = hit.className; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', hit.getAttribute('aria-label') ?? ''); cv.getContext('2d').drawImage(hit, 0, 0);
        const v0 = card.querySelector('svg.mini, canvas.mini-vivo'); if (v0) v0.replaceWith(cv); else card.prepend(cv);
        card.classList.remove('cargando'); continue;
      }
      const r = await post('/api/generar', carga);
      if (seq !== miniSeq || !card.isConnected) return;
      if (!r.plano || r.informe?.errores?.length) { card.classList.remove('cargando'); continue; }
      conI(r.plano, r.spec);
      const vert = r.plano.formato === 'vertical', cv = document.createElement('canvas'); cv.width = vert ? 270 : 480; cv.height = vert ? 480 : 270; cv.className = 'mini-vivo' + (vert ? ' vert' : ''); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', T('vista_de', {n: card.querySelector('.tit').textContent}));
      new Escena(r.plano, await cargarImagenes(r.plano)).dibujar(cv.getContext('2d'), cv.width, cv.height, r.plano.duracion * 0.88);
      const viejo = card.querySelector('svg.mini, canvas.mini-vivo'); if (viejo) viejo.replaceWith(cv); else card.prepend(cv);
      { const copia = document.createElement('canvas'); copia.width = cv.width; copia.height = cv.height; copia.className = cv.className; copia.setAttribute('aria-label', cv.getAttribute('aria-label') ?? ''); copia.getContext('2d').drawImage(cv, 0, 0); cacheMini.set(clave, copia); if (cacheMini.size > 80) cacheMini.delete(cacheMini.keys().next().value); }
    } catch { /* the generic doodle stays */ }
    card.classList.remove('cargando');
  }
}
async function pintarMomentos() {
  const cont = $('#momentos'); if (!cont) return;
  cont.innerHTML = `<h3>${T('mom_h')}</h3><p class="ayuda">${T('mom_a')}</p><p class="ayuda">${T('analizando')}</p>`;
  try {
    if (!S.analisis) S.analisis = await post('/api/analizar', {series: S.series.map(limpio)});
    if (!S.analisis.ok) { cont.innerHTML += `<div class="aviso mal">${ic('warn')}<div>${esc((S.analisis.errores ?? []).join(' · '))}</div></div>`; return; }
    if (!S.sel) S.sel = Object.fromEntries(S.analisis.momentos.map((m) => [m.id, m.seleccionado]));
    const r = S.analisis.resumen, avisos = S.analisis.avisos.filter((a) => !/^datos\.|ninguna capa|no layer/.test(a));
    cont.innerHTML = `<h3>${T('mom_h')}</h3>
      <p class="ayuda">${T('mom_a')}</p>
      <div class="aviso">${ic('info')}<div>${T('mom_resumen', {d: `<strong>${esc(r.desde)}</strong>`, h: `<strong>${esc(r.hasta)}</strong>`, n: num(r.filas)})}${avisos.length ? '<br>' + avisos.map(esc).join('<br>') : ''}</div></div>
      ${S.analisis.momentos.map((m) => `<div class="momento"><input type="checkbox" id="m_${m.id}" data-id="${m.id}" ${S.sel[m.id] ? 'checked' : ''}><div><label for="m_${m.id}" class="etq" style="margin:0">${esc(m.anio)} · ${esc(m.valor)}</label><input type="text" maxlength="30" data-et="${m.id}" aria-label="${esc(T('mom_nombre', {x: m.etiqueta}))}" value="${esc(S.etiquetas[m.id] ?? m.etiqueta)}"></div><div class="expl">${esc(m.explicacion)}</div></div>`).join('')}`;
    cont.querySelectorAll('input[type=checkbox]').forEach((c) => (c.onchange = () => { S.sel[c.dataset.id] = c.checked; guardar(); regenerar(); }));
    cont.querySelectorAll('input[data-et]').forEach((t) => (t.oninput = () => { S.etiquetas[t.dataset.et] = t.value; guardar(); regenerarDebounce(); }));
  } catch (e) { cont.innerHTML += `<div class="aviso mal">${ic('warn')}<div>${esc(e.message)}</div></div>`; }
}
const limpio = (s) => { const {ficha, ...r} = s; return r; };

// ── STEP 3: camera and pace ─────────────────────────────────────────────────────────────────────────────────────
const botonesTema = () => `<div class="seg" role="group" aria-label="${T('aspecto_aria')}"><button type="button" data-tema="oscuro" aria-pressed="${S.tema === 'oscuro'}">${T('tema_oscuro')}</button><button type="button" data-tema="harris" aria-pressed="${S.tema === 'harris'}">${T('tema_harris')}</button><button type="button" data-tema="carbon" aria-pressed="${S.tema === 'carbon'}">${T('tema_carbon')}</button></div>`;
function paso3() {
  if (S.series[0]?.tabla) {   // flows, rings and waterfalls build themselves: no camera to choose, only the look
    $('#paso').innerHTML = `
      <h2>${T('p3t_h')}</h2>
      <p class="ayuda">${T('p3t_a')}</p>
      ${botonesTema()}
      ${S.plano ? `<p class="ayuda" style="margin-top:16px">${T('duracion_p', {s: `<strong>${S.plano.duracion.toFixed(1)} ${T('segundos')}</strong>`})}</p>` : ''}
      ${barraNav(true, true, T('sig_revisar'))}`;
    $('#paso').querySelectorAll('[data-tema]').forEach((b) => (b.onclick = () => { S.tema = b.dataset.tema; guardar(); paso3(); regenerar(); }));
    enlazarNav(2); return;
  }
  $('#paso').innerHTML = `
    <h2>${T('p3_h')}</h2>
    <p class="ayuda">${T('p3_a')}</p>
    <div class="rejilla" role="radiogroup" aria-label="${T('camaras_aria')}">${S.camaras.map((c) => `<button type="button" class="carta" role="radio" aria-checked="${S.camara === c.id}" data-id="${c.id}"><span class="marca">${ic('check')}</span><span class="tit">${esc(nomCam(c))}</span><span class="sub">${esc(desCam(c))}</span><span class="meta">${T('se_dibuja', {s: c.dibujo})}${c.mov ? T('con_zoom') : T('sin_zoom')}</span>${c.id === 'documental' ? `<span class="pill ok" style="align-self:flex-start">${T('recomendada')}</span>` : ''}</button>`).join('')}</div>
    ${S.plantilla !== 'historia' ? `<div class="aviso">${ic('info')}<div>${T('cam_propia', {e: esc(nomTpl(S.plantillas.find((p) => p.id === S.plantilla) ?? {id: S.plantilla, nombre: ''}))})}</div></div>` : ''}
    ${S.plantilla === 'historia' ? `<h3>${T('mom_estilo_h')}</h3><div class="seg" role="group" aria-label="${T('mom_estilo_aria')}"><button type="button" data-em="tarjeta" aria-pressed="${S.estiloMomento === 'tarjeta'}">${T('em_tarjeta')}</button><button type="button" data-em="barra" aria-pressed="${S.estiloMomento === 'barra'}">${T('em_barra')}</button><button type="button" data-em="pildora" aria-pressed="${S.estiloMomento === 'pildora'}">${T('em_pildora')}</button><button type="button" data-em="circulo" aria-pressed="${S.estiloMomento === 'circulo'}">${T('em_circulo')}</button></div>` : ''}
    <h3>${T('aspecto_h')}</h3>${botonesTema()}
    <details class="det" ${S.vivo ? 'open' : ''}><summary>${T('vivo_sum')}</summary>
    <label class="conmuta" style="margin-top:8px"><input type="checkbox" id="vivo" ${S.vivo ? 'checked' : ''}><span><strong>${T('vivo_t')}</strong><br><span class="ayuda" style="margin:0">${T('vivo_a')}</span></span></label></details>
    <label class="conmuta" style="margin-top:12px"><input type="checkbox" id="comercial" ${S.comercial ? 'checked' : ''}><span><strong>${T('comercial_t')}</strong><br><span class="ayuda" style="margin:0">${T('comercial_a')}</span></span></label>
    ${S.plano ? `<p class="ayuda" style="margin-top:16px">${T('duracion_v', {s: `<strong>${S.plano.duracion.toFixed(1)} ${T('segundos')}</strong>`})}</p>` : ''}
    ${barraNav(true, true, T('sig_revisar'))}`;
  $('#paso').querySelectorAll('.carta').forEach((b) => (b.onclick = () => { S.camara = b.dataset.id; guardar(); paso3(); regenerar(); }));
  $('#paso').querySelectorAll('[data-em]').forEach((b) => (b.onclick = () => { S.estiloMomento = b.dataset.em; guardar(); paso3(); regenerar(); }));
  $('#paso').querySelectorAll('[data-tema]').forEach((b) => (b.onclick = () => { S.tema = b.dataset.tema; guardar(); paso3(); regenerar(); }));
  $('#vivo').onchange = (e) => { S.vivo = e.target.checked; guardar(); regenerar(); };
  $('#comercial').onchange = (e) => { S.comercial = e.target.checked; guardar(); regenerar(); };
  enlazarNav(2);
}

// ── STEP 4: review and export ───────────────────────────────────────────────────────────────────────────────────
function paso4() {
  const inf = S.informe, errores = inf?.errores ?? [];
  $('#paso').innerHTML = `
    <h2>${T('p4_h')}</h2>
    <p class="ayuda">${T('p4_a')}</p>
    ${errores.length ? `<div class="aviso mal">${ic('warn')}<div><strong>${T('p4_corregir')}</strong><br>${errores.map(esc).join('<br>')}</div></div>` : ''}
    <div class="resumen4"><div><small>${T('res_dato')}</small><b>${esc(S.series.map((s) => s.nombre).slice(0, 2).join(' + ') || '—')}${S.series.length > 2 ? ' +' + (S.series.length - 2) : ''}</b></div><div><small>${T('res_estilo')}</small><b>${esc(nomTplId(S.plantilla) || '—')}</b></div><div><small>${T('res_formato')}</small><b>${S.formato === 'vertical' ? T('res_vertical') : T('res_horizontal')}</b></div><div><small>${T('res_duracion')}</small><b>${S.plano ? S.plano.duracion.toFixed(1) + ' s' : '—'}</b></div></div>
    <h3>${T('descargar_h')}</h3>
    <div class="entrega">
      <button class="btn" id="rBorrador" ${errores.length || !S.spec ? 'disabled' : ''}>${ic('film')}${T('borrador_t')}<small>${T('borrador_s')}</small></button>
      <button class="btn p" id="rFinal" ${errores.length || !S.spec ? 'disabled' : ''}>${ic('film')}${T('final_t')}<small>${T('final_s')}</small></button>
    </div>
    <div id="estadoRender" aria-live="polite" style="margin-top:16px"></div>
    ${barraNav(true, false)}`;
  $('#rBorrador').onclick = () => exportar('borrador', false);
  $('#rFinal').onclick = () => exportar('final', true);
  enlazarNav(3);
  if (S.render) pintarRender();
}
const nomTplId = (id) => { const p = S.plantillas.find((x) => x.id === id); return p ? nomTpl(p) : ''; };
async function exportar(calidad, alfa) {
  S.render = {estado: 'enviando'}; pintarRender();
  try {
    const {id} = await post('/api/render', {spec: S.spec, calidad, alfa, nombre: S.titulo || S.series[0]?.nombre || T('pieza')});
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
  if (r.estado === 'enviando') c.innerHTML = `<p class="ayuda">${T('r_enviando')}</p>`;
  else if (r.estado === 'en curso') { const p = r.progreso; c.innerHTML = `<p class="etq">${p ? (p.tipo === 'alfa' ? T('r_alfa') : T('r_video')) : T('r_preparando')}… ${p ? Math.round((p.cuadro / p.total) * 100) + ' %' : ''}</p><progress max="100" value="${p ? Math.round((p.cuadro / p.total) * 100) : 0}"></progress>`; }
  else if (r.estado === 'error') c.innerHTML = `<div class="aviso mal">${ic('warn')}<div><strong>${T('r_error')}</strong><br>${esc(r.error)}<br><span class="ayuda">${T('r_error_pista')}</span></div></div>`;
  else if (r.estado === 'listo') {
    const s = r.resultado.salidas;
    c.innerHTML = `<div class="aviso ok">${ic('check')}<div><strong>${T('r_listo', {s: r.resultado.segundos})}</strong><br>${Object.entries(s).filter(([k]) => k !== 'contacto').map(([k, v]) => `<span class="mono" style="font-size:13px">${esc(k === 'mp4' ? T('r_k_video') : k === 'alfa' ? T('r_k_alfa') : T('r_k_informe'))}: ${esc(v)}</span>`).join('<br>')}</div></div>
      <button class="btn" id="abrirCarpeta">${ic('folder')}${T('abrir_carpeta')}</button>`;
    $('#abrirCarpeta').onclick = () => post('/api/abrir', {ruta: s.mp4});
  }
}

// ── spec generation ─────────────────────────────────────────────────────────────────────────────────────────────
let genSeq = 0, deb;
const regenerarDebounce = () => { clearTimeout(deb); deb = setTimeout(regenerar, 500); };
async function regenerar() {
  const seq = ++genSeq, def = S.plantillas.find((p) => p.id === S.plantilla);
  if (!S.series.length) { S.spec = S.plano = S.informe = null; mostrarVista(); pintarEstadoPasos(); return; }
  const claseSel = S.series[0]?.tabla ?? 'serie';
  if (def && ((def.datos ?? 'serie') !== claseSel || S.series.length < def.necesita.min || S.series.length > def.necesita.max)) {
    const ok = S.plantillas.find((p) => (p.datos ?? 'serie') === claseSel && S.series.length >= p.necesita.min && S.series.length <= p.necesita.max);
    if (ok) { S.plantilla = ok.id; guardar(); if (S.paso === 1) paso2(); } else { S.error = T('cantidad_no_encaja'); mostrarVista(); return; }
  }
  S.generando = true; $('#carga').hidden = false; S.error = '';
  try {
    if (S.plantilla === 'historia' && S.series.length === 1 && !S.analisis) { S.analisis = await post('/api/analizar', {series: S.series.map(limpio)}); if (S.analisis.ok && !S.sel) S.sel = Object.fromEntries(S.analisis.momentos.map((m) => [m.id, m.seleccionado])); }
    const momentos = (S.analisis?.momentos ?? []).filter((m) => S.sel?.[m.id]).map((m) => ({tipo: m.tipo, ancla: m.ancla, etiqueta: (S.etiquetas[m.id] || m.etiqueta).slice(0, 30)}));
    if (S.plantilla === 'dos_hitos' && !hitosListos()) { S.error = T('hitos_faltan'); S.spec = S.plano = null; S.informe = {errores: [], avisos: [], datos: [], cifras: []}; S.generando = false; $('#carga').hidden = true; mostrarVista(); pintarEstadoPasos(); return; }
    const r = await post('/api/generar', {...extraHitos(), plantilla: S.plantilla, series: S.series.map(limpio), momentos, camara: S.camara, formato: S.formato, titulo: S.tituloEditado ? S.titulo : '', foco: S.foco, estiloMomento: S.estiloMomento, tema: S.tema, resalta: S.resalta, comercial: !!S.comercial, vivo: S.vivo ? {render: 'final', alfa: true, minEntreRendersMin: 360} : null});
    if (seq !== genSeq) return;
    if (r.spec) r.spec.idioma = L();
    Object.assign(S, {spec: r.spec, plano: conI(r.plano ?? null, r.spec), informe: r.informe, notas: r.notas ?? []});
    if (!S.tituloEditado) S.titulo = r.spec.titulo ?? '';
  } catch (e) { if (seq !== genSeq) return; S.error = e.message; S.spec = S.plano = null; S.informe = {errores: [], avisos: [], datos: [], cifras: []}; }
  S.generando = false; $('#carga').hidden = true;
  mostrarVista(); pintarEstadoPasos(); $('#specTxt').value = S.spec ? JSON.stringify(S.spec, null, 2) : '';
}
function pintarEstadoPasos() { pintarPasos(); if (S.paso === 3) paso4(); }

// ── preview ─────────────────────────────────────────────────────────────────────────────────────────────────────
const lienzo = $('#lienzo'), ctx = lienzo.getContext('2d');
let escena = null, tiempo = 0, jugando = false, ultimo = 0;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function cargarImagenes(p) {
  const out = {}; await Promise.all((p.imagenes ?? []).map((r) => new Promise((ok) => { const im = new Image(); im.onload = () => { out[r] = im; ok(); }; im.onerror = ok; im.src = '/archivos/' + r.split('/').map(encodeURIComponent).join('/'); })));
  return out;
}
async function mostrarVista() {
  const vacio = $('#vacio'), simple = $('#simple'), marco = $('#marco');
  document.body.classList.toggle('conVista', !!S.plano && !S.error);
  if (S.error || !S.plano) {
    vacio.hidden = false; escena = null; ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    vacio.innerHTML = S.error ? `<div><p style="font-size:18px;font-weight:700;margin:0 0 6px;color:var(--rojo)">${T('vacio_error')}</p><p style="margin:0">${esc(S.error)}</p></div>` : `<div><p style="font-size:20px;font-weight:700;margin:0 0 6px">${T('vacio_t')}</p><p style="margin:0 0 14px">${T('vacio_s')}</p><button class="btn p" id="vacioEj" type="button">${T('ver_ejemplo_hecho')}</button></div>`;
    const ve = $('#vacioEj'); if (ve) ve.onclick = () => $('#btnEjemplos').click();
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
function pintarBotonPlay() { const b = $('#play'); b.innerHTML = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${jugando ? ICON.pause : ICON.play}</svg>`; b.setAttribute('aria-label', jugando ? T('pausar') : T('reproducir')); }
$('#play').onclick = () => { if (!escena) return; if (tiempo >= S.plano.duracion - 0.05) tiempo = 0; jugando = !jugando; ultimo = performance.now(); pintarBotonPlay(); if (jugando) requestAnimationFrame(tick); };
$('#t').oninput = (e) => { tiempo = +e.target.value; jugando = false; pintarBotonPlay(); dibujar(); };
addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); $('#play').click(); } });

function pintarSimple() {
  const inf = S.informe, box = $('#simple'); if (!inf) { box.hidden = true; return; }
  const li = (cls, ico, txt) => `<li class="${cls}">${ic(ico)}<span>${txt}</span></li>`, items = [];
  const cifras = inf.cifras.filter((c) => c.mostrado);
  if (inf.errores.length) inf.errores.forEach((e) => items.push(li('mal', 'warn', esc(e))));
  else items.push(li('ok', 'check', `<strong>${T('s_todas')}</strong> ${plural(cifras.length, 's_cifras_1', 's_cifras_n')}`));
  const fuenteLimpia = (n) => { const m = /(?:de|of):\s*(.+)$/.exec(n); if (!m) return n; const u = [...new Set(m[1].split(' + ').map((x) => x.split(' · ')[0].trim()))]; return T('s_varias') + ' — ' + u.join(L() === 'es' ? ' y ' : ' and '); };
  inf.datos.forEach((d) => items.push(li('ok', 'check', `<strong>${T('s_datos_reales')}</strong> ${esc(fuenteLimpia(d.fuente.nombre))}.<br><span class="mono" style="font-size:12px;color:var(--suave)">${d.tipoTabla ? T('s_elementos', {e: d.elementos, f: num(d.filas)}) : `${esc(String(d.inicio))} → ${esc(String(d.fin))} · ${T('s_registros', {n: num(d.filas)})}${d.recortada ? T('s_recortada') : T('s_completa')}`}</span>${d.fuente.url ? `<br><a href="${esc(d.fuente.url)}" target="_blank" rel="noopener">${T('s_ver_fuente')}</a>` : ''}`)));
  S.series.filter((s) => s.ficha).forEach((s) => { const sa = s.ficha.salud; items.push(li(sa.estado === 'al_dia' ? 'ok' : 'av', sa.estado === 'al_dia' ? 'check' : 'warn', `<strong>${esc(s.nombre)}:</strong> ${esc(sa.texto)}`)); });
  inf.avisos.filter((a) => /LICENCIA|LICENSE|RECORTADA|TRIMMED|coinciden|largo|match|long/.test(a)).forEach((a) => items.push(li('av', 'warn', esc(a.replace(/^datos\.\w+:\s*/, '')))));
  S.notas.forEach((n) => items.push(li('', 'info', esc(n))));
  box.innerHTML = `<h3>${T('s_h')}</h3><ul>${items.join('')}</ul>
    <details class="det"><summary>${T('s_ver_cifras')}</summary>${cifras.map((c) => `<div class="cifra">«${esc(c.mostrado)}»<small>${esc(c.serie ?? c.nombre ?? '')} · ${esc(String(c.fecha ?? ''))}${c.fila != null ? T('s_fila', {n: c.fila}) : c.filas ? T('s_filas', {n: c.filas.join(', ')}) : ''}</small></div>`).join('') || `<p class="ayuda">${T('s_sin_cifras')}</p>`}</details>`;
}

// ── live-data status, notices and examples ──────────────────────────────────────────────────────────────────────
function aviso(txt) { const p = $('#estadoDatos'); p.className = 'pill ok'; p.innerHTML = `${ic('check')}${esc(txt)}`; setTimeout(() => { estadoVivo(); }, 4500); }
async function estadoVivo() {
  try {
    const e = await api('/api/vivo'), ts = Object.entries(e).filter(([k]) => !k.startsWith('_')).map(([, v]) => v.ultimoExito).filter(Boolean).sort();
    const p = $('#estadoDatos');
    if (!ts.length) { p.className = 'pill'; p.textContent = T('datos_al_elegir'); return; }
    const min = Math.round((Date.now() - new Date(ts[ts.length - 1]).getTime()) / 60000);
    p.className = 'pill ok'; p.innerHTML = `${ic('check')}${T('datos_vivos', {t: min < 1 ? T('instantes') : T('n_min', {n: min})})}`;
  } catch { $('#estadoDatos').textContent = ''; }
}
try {
  const es = new EventSource('/api/eventos');
  es.addEventListener('trimestre', (e) => { const d = JSON.parse(e.data); aviso(T('ev_trimestre', {n: d.nombre, e: d.etiqueta})); if (S.paso === 0 && S.emp === d.ticker) elegirEmpresa(d.ticker); else if (S.paso === 0) cargarEmpresas(); });
  es.addEventListener('serie', (e) => { const d = JSON.parse(e.data); aviso(T('ev_serie', {n: d.nombre ?? d.id})); cacheMini.clear(); if (S.series.some((s) => s.id === d.id)) { S.analisis = null; regenerar(); } });
} catch {}
$('#btnExperto').onclick = (e) => { const on = document.body.classList.toggle('exp'); e.currentTarget.setAttribute('aria-pressed', on); };
const compilarManual = async (spec) => { const r = await post('/api/compilar', spec); return {r, plano: r.informe.ok ? conI(r.spec, spec) : null}; };
$('#aplicarSpec').onclick = async () => {
  try { const spec = JSON.parse($('#specTxt').value), {r, plano} = await compilarManual(spec); Object.assign(S, {spec, plano, informe: r.informe, notas: [], error: '', modo: 'manual'}); $('#expertoInforme').textContent = (r.informe.errores.length ? T('x_errores') + '\n' + r.informe.errores.join('\n') + '\n' : T('x_compila') + '\n') + r.informe.avisos.join('\n'); mostrarVista(); pintarPasos(); }
  catch (e) { $('#expertoInforme').textContent = T('x_json_mal', {e: e.message}); }
};
$('#btnEjemplos').onclick = async () => {
  const box = $('#ejemplos'); if (!box.hidden) { box.hidden = true; return; }
  const l = await api('/api/specs'); box.innerHTML = `<p class="tag" style="margin:6px 8px">${T('ejemplos_h')}</p>` + l.map((n) => `<button class="btn" style="width:100%;justify-content:flex-start;margin:4px 0" data-n="${esc(n)}">${esc(n.replace('.json', '').replace(/-/g, ' '))}</button>`).join(''); box.hidden = false;
  box.querySelectorAll('button').forEach((b) => (b.onclick = async () => {
    box.hidden = true; const spec = await api('/api/spec?n=' + encodeURIComponent(b.dataset.n)), {r, plano} = await compilarManual(spec);
    Object.assign(S, {spec, plano, informe: r.informe, notas: [], error: '', modo: 'ejemplo', titulo: spec.titulo ?? ''}); $('#specTxt').value = JSON.stringify(spec, null, 2); await mostrarVista(); ir(3);
  }));
};

// ── chat: edit the animation by talking (Claude Code with the studio's tools; see servidor/chat.mjs) ────────────────
const chatEl = $('#chat'), chatMsgs = $('#chatMsgs'), chatIn = $('#chatIn');
let chatOcupado = false;
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<span class="mono">$1</span>').replace(/\n/g, '<br>');
function burbuja(clase, html) { const d = document.createElement('div'); d.className = 'cm ' + clase; d.innerHTML = html; chatMsgs.append(d); chatMsgs.scrollTop = chatMsgs.scrollHeight; return d; }
function sugerencias() {
  const box = $('#chatSug'); if (!box) return;
  const tri = S.series[0]?.trimestre, lista = (tri ? ['sug_t1', 'sug_t2', 'sug_t3', 'sug_t4', 'sug_t5'] : S.plano ? ['sug_p1', 'sug_p2', 'sug_p3', 'sug_p4'] : ['sug_v1', 'sug_v2', 'sug_v3']).map((k) => T(k));
  box.innerHTML = lista.map((t) => `<button type="button">${esc(t)}</button>`).join('');
  box.querySelectorAll('button').forEach((b) => (b.onclick = () => enviarChat(b.textContent)));
}
function abrirChat(on) {
  chatEl.hidden = !on; $('#chatBtn').setAttribute('aria-expanded', String(on));
  if (!on) return;
  if (!chatMsgs.children.length) burbuja('ia', md(T('chat_hola')));
  sugerencias(); chatIn.focus();
}
function aplicarPiezaChat({spec, plano, informe}) {
  Object.assign(S, {spec, plano: informe.ok ? conI(plano, spec) : null, informe, notas: [], error: informe.ok ? '' : (informe.errores[0] ?? ''), modo: 'manual', titulo: spec.titulo ?? S.titulo, tituloEditado: true});
  $('#specTxt').value = JSON.stringify(spec, null, 2); mostrarVista(); pintarPasos(); if (S.paso === 3) paso4();
  burbuja('acc', `${ic('check')}<span>${T('chat_actualizada')}</span>`);
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
  const espera = burbuja('acc', `<span class="pulso"></span> ${T('chat_pensando')}`);
  try {
    const r = await fetch(conIdioma('/api/chat'), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mensaje: texto, spec: S.spec, idioma: L()})});
    const lector = r.body.getReader(), dec = new TextDecoder(); let resto = '';
    for (;;) { const {done, value} = await lector.read(); if (done) break; resto += dec.decode(value, {stream: true}); const ls = resto.split('\n'); resto = ls.pop() ?? ''; for (const l of ls) if (l.trim()) { try { eventoChat(JSON.parse(l), espera); } catch { /* partial line */ } } }
  } catch (e) { burbuja('mal', esc(e.message)); }
  espera.remove(); chatOcupado = false; sugerencias();
}
$('#chatBtn').onclick = () => abrirChat(true);
$('#chatCerrar').onclick = () => abrirChat(false);
$('#chatNuevo').onclick = async () => { try { await api('/api/chat-nuevo'); } catch { /* no server */ } chatMsgs.innerHTML = ''; abrirChat(true); };
$('#chatForm').onsubmit = (e) => { e.preventDefault(); enviarChat(chatIn.value); };
chatIn.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat(chatIn.value); } };
chatIn.oninput = () => { chatIn.style.height = 'auto'; chatIn.style.height = Math.min(120, chatIn.scrollHeight) + 'px'; };

// ── language switch (EN | ES): sets the interface AND the piece; pieces made by hand are recompiled in the new language ──
function botonEjemploVacio() {
  if (S.series.length || S.plano) return;
  const ve = document.createElement('button'); ve.className = 'btn p'; ve.type = 'button'; ve.style.marginTop = '14px'; ve.textContent = T('ver_ejemplo_hecho'); ve.onclick = () => $('#btnEjemplos').click(); $('#vacio > div')?.append(ve);
}
async function refrescarFichas() {
  const ids = S.series.filter((s) => s.ficha).map((s) => s.id);
  if (ids.length) { try { const j = await api('/api/biblioteca?ids=' + ids.join(',')); for (const f of j.series) { const s = S.series.find((x) => x.id === f.id); if (s) s.ficha = f; } guardar(); } catch { /* keep the old cards */ } }
}
async function alCambiarIdioma() {
  aplicarDOM(); pintarBotonPlay(); estadoVivo(); $('#ejemplos').hidden = true;
  S.bib = null;   // the library list and the series cards (health, license) come localized from the server: fetch them again
  await refrescarFichas();
  if (!chatEl.hidden) { if (chatMsgs.children.length <= 1) { chatMsgs.innerHTML = ''; burbuja('ia', md(T('chat_hola'))); } sugerencias(); }
  pintar();   // steps, labels and template/camera names are redrawn in the new language
  if (S.series.length && S.modo === 'guiado') { S.analisis = null; regenerar(); }   // the piece itself (titles, units, month names) is regenerated in the new language
  else if (S.spec) { S.spec.idioma = L(); try { const {r, plano} = await compilarManual(S.spec); Object.assign(S, {plano, informe: r.informe}); $('#specTxt').value = JSON.stringify(S.spec, null, 2); } catch { /* keep the previous one */ } mostrarVista(); pintarPasos(); }
  else mostrarVista();
}

(async () => {
  aplicarDOM(); onL(alCambiarIdioma);
  const pl = await api('/api/plantillas'); S.plantillas = pl.plantillas; S.camaras = pl.camaras;
  pintar(); pintarBotonPlay(); estadoVivo(); setInterval(estadoVivo, 60000);
  botonEjemploVacio();
  if (S.series.length) { await refrescarFichas(); regenerar(); }
})();
