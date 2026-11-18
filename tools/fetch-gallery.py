"""Download a car's listing photos from ascendautos.com into assets/cars/gallery/<slug>/.

Uses the photo URLs saved in data/inventory.json (crawled from the dealer site).
Writes NN.jpg (800x600, as served) and NN-thumb.jpg (240x180) for the gallery strip.

usage: python tools/fetch-gallery.py <stock#> <slug> [<stock#> <slug> ...]
  e.g. python tools/fetch-gallery.py 2102 acura-tl-2014 2088 audi-q3-2018
Prints the photo count; put it in js/cars.js as gallery: { dir, count }.
"""
import io
import json
import os
import sys
import urllib.request
from PIL import Image

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36'}
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
inv = {v['stock']: v for v in json.load(open(os.path.join(root, 'data', 'inventory.json'), encoding='utf-8'))}

args = sys.argv[1:]
if not args or len(args) % 2:
    sys.exit(__doc__)
for stock, slug in zip(args[::2], args[1::2]):
    car = inv.get(stock)
    if not car:
        print(f'{stock}: not in data/inventory.json'); continue
    out = os.path.join(root, 'assets', 'cars', 'gallery', slug)
    os.makedirs(out, exist_ok=True)
    n = 0
    for url in car.get('photos', []):
        im = None
        for attempt in range(4):  # the CDN times out now and then: retry before giving up
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45).read()
                im = Image.open(io.BytesIO(data)).convert('RGB')
                break
            except Exception as e:
                err = e
        if im is None:  # skip a broken photo, keep the rest
            print(f'  skip {url}: {err}'); continue
        n += 1
        im.save(os.path.join(out, f'{n:02d}.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
        th = im.copy(); th.thumbnail((240, 180), Image.LANCZOS)
        th.save(os.path.join(out, f'{n:02d}-thumb.jpg'), 'JPEG', quality=78, optimize=True)
    print(f'{car["title"]} (stock {stock}) -> assets/cars/gallery/{slug}: {n} photos')
