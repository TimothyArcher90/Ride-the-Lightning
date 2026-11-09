"""Dev tool: reads the frames written by scripts/medir-animacion.mjs and prints, per case, how much of the final picture is on screen
at fixed fractions of the data-layer window. Progress p(t) = 1 - |frame(t) - final| / |frame(first) - final| over the chart band (title strip and footer excluded).
Flags: DEAD START (<8 % at 12 % of the window), ABRUPT START (>45 % at 12 %), DEAD END (>=99 % before 70 % of the window), JUMP (any single step >35 %).
Usage: python scripts/curva-animacion.py <dir>"""
import sys, os, json, glob
from PIL import Image, ImageChops
import numpy as np

raiz = sys.argv[1]
def carga(f):
    im = Image.open(f).convert('L'); w, h = im.size
    return np.asarray(im.crop((0, int(h * 0.18), w, int(h * 0.9))), dtype=np.float32)
filas = []
for d in sorted(glob.glob(os.path.join(raiz, '*', 'meta.json'))):
    m = json.load(open(d)); base = os.path.dirname(d)
    fr = sorted(glob.glob(os.path.join(base, 'f_t*.png')), key=lambda p: float(os.path.basename(p)[3:-4].replace('_', '.')))
    ts = [float(os.path.basename(p)[3:-4].replace('_', '.')) for p in fr]
    final = carga(fr[-1]); ims = [carga(p) for p in fr]
    den = max(1e-6, np.abs(ims[0] - final).mean())
    p = [max(0.0, min(1.0, 1 - np.abs(i - final).mean() / den)) for i in ims]
    def ext(a, b):
        cols = (np.abs(a - b) > 30).sum(axis=0); idx = np.nonzero(cols >= 2)[0]
        return float(idx.max()) if len(idx) else 0.0
    t0r = m['ventana'][0]; r0 = next((k for k, t in enumerate(ts) if t >= t0r), 0)
    fx = max(1.0, ext(ims[r0], final)); px = [min(1.0, ext(ims[r0], i) / fx) if k >= r0 else 0.0 for k, i in enumerate(ims)]
    t0, t1 = m['ventana']; win = max(0.1, t1 - t0)
    modo = os.environ.get('RTL_METRICA', 'ext')
    def en(frac):
        t = t0 + frac * win
        return float(np.interp(t, ts, px if modo == 'ext' else p))
    pts = {k: en(k) for k in (0.05, 0.12, 0.25, 0.5, 0.75, 0.9)}
    q = px if modo == 'ext' else p
    cuando99 = next((t for t, v in zip(ts, q) if v >= 0.99), None)
    saltos = max((b - a) for a, b in zip(q, q[1:])) if len(q) > 1 else 0
    flags = []
    if pts[0.12] < 0.04: flags.append('DEAD START')
    if pts[0.12] > 0.45: flags.append('ABRUPT START')
    if cuando99 is not None and (cuando99 - t0) < 0.7 * win: flags.append('DEAD END')
    if saltos > 0.35: flags.append('JUMP %.0f%%' % (saltos * 100))
    filas.append((m['id'], t0, t1, pts, flags, ','.join(sorted(set(m['tipos'])))))
print('%-18s %-9s %s  flags' % ('caso', 'ventana', ' '.join('%5s' % ('%d%%' % (k * 100)) for k in (0.05, 0.12, 0.25, 0.5, 0.75, 0.9))))
for i, a, b, pts, fl, tp in filas:
    print('%-18s %4.1f-%-4.1f %s  %s  [%s]' % (i, a, b, ' '.join('%5.0f' % (v * 100) for v in pts.values()), ' '.join(fl), tp))
