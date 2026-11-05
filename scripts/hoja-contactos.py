"""Dev tool: contact sheets of docs/gallery PNGs for visual audits.
Usage: python scripts/hoja-contactos.py [galeria_dir] [salida_dir]
Writes <salida>/h-N.jpg (2 columns, horizontal frames) and <salida>/v-N.jpg (6 columns, vertical frames)."""
import sys, os, glob
from PIL import Image, ImageDraw

gal = sys.argv[1] if len(sys.argv) > 1 else 'docs/gallery'
out = sys.argv[2] if len(sys.argv) > 2 else '.tmp/hojas'
os.makedirs(out, exist_ok=True)
nombres = sorted({os.path.basename(f)[:-6] for f in glob.glob(os.path.join(gal, '*-?.png'))})

def hoja(nombres, sufijo, cols, ancho, nombre_out):
    celdas = []
    for n in nombres:
        p = os.path.join(gal, f'{n}-{sufijo}.png')
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            h = int(im.height * ancho / im.width)
            celdas.append((n, im.resize((ancho, h), Image.LANCZOS)))
    if not celdas: return
    filas = [celdas[i:i + cols] for i in range(0, len(celdas), cols)]
    alto_f = [max(c[1].height for c in f) + 16 for f in filas]
    sheet = Image.new('RGB', (cols * ancho, sum(alto_f)), (30, 30, 30))
    d = ImageDraw.Draw(sheet); y = 0
    for f, ah in zip(filas, alto_f):
        for i, (n, im) in enumerate(f):
            sheet.paste(im, (i * ancho, y + 16)); d.text((i * ancho + 4, y + 2), n, fill=(255, 220, 90))
        y += ah
    sheet.save(os.path.join(out, nombre_out), quality=82)

g = 6
for k in range(0, len(nombres), g):
    grp = nombres[k:k + g]
    hoja(grp, 'h', 2, 800, f'h-{k // g + 1}.jpg')
    hoja(grp, 'v', 6, 260, f'v-{k // g + 1}.jpg')
print(len(nombres), 'modelos', os.listdir(out))
