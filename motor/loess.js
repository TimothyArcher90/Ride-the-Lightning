// LOESS / LOWESS local-linear smoother (Cleveland 1979), own implementation from the public description: for each point, a weighted straight-line fit
// over its `ventana` fraction of nearest neighbours with tricube weights (1 − |d|³)³. Pure and deterministic; no robustness iterations.
// STATUS (2026-11-09 spike): NOT wired into the renderer on purpose. If it is ever drawn it must be an OPTIONAL overlay, declared on screen as
// "smoothed" with its window, never replacing the real line (see docs/diagnosticos/2026-11-09-noche3.md §5 for the decision).
/** x ascendente (números), y (números o null). Devuelve el array suavizado (null donde y es null). `ventana` en (0, 1]: fracción de puntos por ajuste. */
export function loess(x, y, ventana = 0.2) {
  const idx = []; x.forEach((_, i) => { if (y[i] != null && Number.isFinite(y[i])) idx.push(i); });
  const n = idx.length, k = Math.max(3, Math.min(n, Math.ceil(ventana * n))), out = y.map(() => null);
  if (n < 3) return out;
  const xs = idx.map((i) => x[i]), ys = idx.map((i) => y[i]);
  let lo = 0;   // ventana deslizante de k vecinos más cercanos (xs es ascendente)
  for (let c = 0; c < n; c++) {
    while (lo + k < n && xs[c] - xs[lo] > xs[lo + k] - xs[c]) lo++;
    const hi = lo + k - 1, h = Math.max(xs[c] - xs[lo], xs[hi] - xs[c]) || 1;
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = lo; j <= hi; j++) { const d = Math.abs(xs[j] - xs[c]) / h, w = d >= 1 ? 0 : Math.pow(1 - d * d * d, 3); sw += w; sx += w * xs[j]; sy += w * ys[j]; sxx += w * xs[j] * xs[j]; sxy += w * xs[j] * ys[j]; }
    const den = sw * sxx - sx * sx;
    out[idx[c]] = Math.abs(den) < 1e-12 * (sw * sxx || 1) ? sy / (sw || 1) : (sy * sxx - sx * sxy) / den + ((sw * sxy - sx * sy) / den) * xs[c];
  }
  return out;
}
