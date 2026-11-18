"""Prepare a car cut-out for the showroom.

- makes the (almost-opaque) car body fully solid
- removes the baked-in ground shadow: pure-black or dark pixels that are
  semi-transparent and sit outside the solid car body (tyres stay: they are solid)
- removes faint specks / haze
- crops tight (tyres on the bottom edge) and exports a full-size and an 800px WebP

usage: python tools/prep-car.py <source image> <outdir> <basename> [--keep-shadow]
       e.g. python tools/prep-car.py ~/Downloads/acura.png assets/cars acura-tl-2014
  --keep-shadow  the image has its own studio shadow: keep it untouched and crop
                 around car + shadow (use with data-shadow="image" on the section)
Prints the final size; put it in js/cars.js as image.w / image.h.
"""
import sys
from PIL import Image, ImageFilter

src, outdir, base = sys.argv[1], sys.argv[2], sys.argv[3]
keep_shadow = '--keep-shadow' in sys.argv[4:]
im = Image.open(src).convert('RGBA')
W, H = im.size
px = im.load()

if keep_shadow:
    # no pixel edits at all: crop around everything that is visibly there (car + shadow)
    box = im.getchannel('A').point(lambda v: 255 if v > 5 else 0).getbbox()
    c = im.crop(box)
    c.save(f'{outdir}/{base}.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
    w, h = c.size
    c.resize((800, round(800 * h / w)), Image.LANCZOS).save(
        f'{outdir}/{base}-800.webp', 'WEBP', quality=86, alpha_quality=100, method=6)
    print(f'kept shadow; crop {box} -> {w}x{h} (aspect {w / h:.4f})')
    sys.exit(0)

# 1) solidify the body, drop specks, drop semi-transparent pure black (shadow)
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        if a >= 240:
            px[x, y] = (r, g, b, 255)
        elif a <= 40 or max(r, g, b) <= 10:
            px[x, y] = (r, g, b, 0)

# 2) anything dark/faint that is not touching the solid body is shadow residue
body = im.getchannel('A').point(lambda v: 255 if v >= 200 else 0).filter(ImageFilter.MaxFilter(5))
bm = body.load()
for y in range(H):
    for x in range(W):
        r, g, b, a = px[x, y]
        if 0 < a < 255 and not bm[x, y] and (max(r, g, b) < 90 or a < 60):
            px[x, y] = (r, g, b, 0)

# 3) tight crop (ignores tiny isolated specks)
A = im.getchannel('A').load()
rows = [sum(1 for x in range(0, W, 2) if A[x, y] > 40) for y in range(H)]
cols = [sum(1 for y in range(0, H, 2) if A[x, y] > 40) for x in range(W)]
ys = [y for y, c in enumerate(rows) if c > 6]
xs = [x for x, c in enumerate(cols) if c > 6]
box = (xs[0], ys[0], xs[-1] + 1, ys[-1] + 1)
c = im.crop(box)
c.save(f'{outdir}/{base}.webp', 'WEBP', quality=90, alpha_quality=100, method=6)
w, h = c.size
c.resize((800, round(800 * h / w)), Image.LANCZOS).save(
    f'{outdir}/{base}-800.webp', 'WEBP', quality=86, alpha_quality=100, method=6)
hist = c.getchannel('A').histogram()
print(f'crop {box} -> {w}x{h} (aspect {w / h:.4f}); semi-transparent px: {sum(hist[1:255])}')
