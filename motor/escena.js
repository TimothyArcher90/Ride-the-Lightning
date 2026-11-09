// Escena: ordena las capas por z y las pinta para un instante t. Determinista: sin Math.random, sin Date.now.
import {DIBUJO, Z} from './capas.js';
import {PALETA, TEMA, rgba, clamp, aplicarTema} from './nucleo.js';
import {fijarFormato} from './diseno.js';
import {fijarIdioma} from './idioma.js';
import {TIPOS_EXTRA} from './capas_extra.js';

const ANOTACION = new Set(['llamada', 'contador', 'titulo', 'cortina', 'sello']);
const GRAFICA = new Set(['linea', 'barras', 'carrera', 'dispersion', 'calor', 'sankey', 'donut', 'cascada', 'pendiente', 'bump', 'treemap', 'waffle', 'lollipop', 'divergente', ...TIPOS_EXTRA, 'zona', 'imagen']);

export class Escena {
  scratch(W, H) {
    if (!this._s) { this._s = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), {width: W, height: H}); }
    this._s.width = W; this._s.height = H;
    return this._s.getContext('2d');
  }

  constructor(spec, imgs = {}) {
    this.spec = spec;
    this.imgs = imgs;
    aplicarTema(spec.tema);
    fijarIdioma(spec.idioma);
    this.capas = spec.capas
      .map((c, i) => ({...c, _i: i}))
      .sort((a, b) => (a.z ?? Z[a.tipo] ?? 10) - (b.z ?? Z[b.tipo] ?? 10) || a._i - b._i);
  }

  /** Fondo de marca: negro cálido, viñeta, resplandor lento que se desplaza y rejilla de puntos. */
  fondo(ctx, W, H, t) {
    const f = this.spec.fondo ?? {};
    ctx.fillStyle = PALETA.fondo; ctx.fillRect(0, 0, W, H);
    if (f.imagen && this.imgs[f.imagen]) {
      const im = this.imgs[f.imagen], s = Math.max(W / im.width, H / im.height) * (1 + 0.04 * (t / Math.max(1, this.spec.duracion)));
      ctx.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s);
      ctx.fillStyle = rgba(PALETA.fondo, f.tono ?? 0.78); ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createRadialGradient(W * (0.3 + 0.05 * Math.sin(t * 0.2)), H * 0.35, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
      g.addColorStop(0, rgba(TEMA.brillo, 0.07)); g.addColorStop(1, rgba(TEMA.brillo, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (f.puntos !== false) {
      const u = Math.min(W, H) / 1080, paso = 48 * u;
      ctx.fillStyle = rgba(PALETA.piedra, 0.06);
      for (let y = paso / 2; y < H; y += paso) for (let x = paso / 2; x < W; x += paso) ctx.fillRect(x, y, 1.6 * u, 1.6 * u);
    }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, rgba(PALETA.profundo, 0)); v.addColorStop(1, rgba(PALETA.profundo, 0.6));
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  /** modo: 'todo' | 'graficas' (fondo + gráficas, para promediar el desenfoque) | 'texto' (anotaciones nítidas, sin desenfoque). */
  dibujar(ctx, W, H, t, {sinFondo = false, modo = 'todo'} = {}) {
    fijarFormato(H > W, Math.min(W, H) / 1080);
    ctx.clearRect(0, 0, W, H);
    if (!sinFondo && modo !== 'texto') this.fondo(ctx, W, H, t);
    const env = {ctx, W, H, u: Math.min(W, H) / 1080, t, tablas: this.spec.tablas, imgs: this.imgs, vistas: {}, cabezas: {}, proy: {}, registro: [], capasTodas: this.capas};
    // las zonas (z 8) van DETRÁS de la gráfica (z 10) pero necesitan su proyección datos→píxel: se dibuja antes la gráfica a la que apuntan en un lienzo desechable
    // solo para publicar su vista, y se descarta lo que ese dibujo registró (cajas de texto) para no duplicar colisiones
    const conZona = new Set(this.capas.filter((c) => c.tipo === 'zona' && c.capa).map((c) => c.capa));
    if (conZona.size) for (const capa of this.capas) {
      if (!conZona.has(capa.id) || !DIBUJO[capa.tipo] || !GRAFICA.has(capa.tipo)) continue;
      const n = env.registro.length; env.ctx = this.scratch(W, H); env.ctx.save(); DIBUJO[capa.tipo](env, capa); env.ctx.restore(); env.ctx = ctx; env.registro.length = n;
    }
    for (const capa of this.capas) {
      const f = DIBUJO[capa.tipo];
      if (!f) continue;
      const esTexto = ANOTACION.has(capa.tipo);
      if (modo === 'graficas' && esTexto) continue;
      if (modo === 'texto' && !esTexto && !GRAFICA.has(capa.tipo)) continue;
      // en modo texto las gráficas se dibujan en un lienzo desechable solo para publicar sus vistas (proyección datos→píxel)
      const destino = modo === 'texto' && GRAFICA.has(capa.tipo) ? this.scratch(W, H) : null;
      if (destino) env.ctx = destino;
      env.ctx.save();
      f(env, capa);
      env.ctx.restore();
      env.ctx = ctx;
    }
    return env;
  }
}
