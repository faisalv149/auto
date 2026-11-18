# Ascend Auto: Showroom landing page

Landing page for [Ascend Auto](https://www.ascendautos.com), a family-owned used car dealership in Buda, TX.

The hero is an interactive showroom:
- one car in focus on a perspective floor, with the previous and next cars blurred at the edges
- each car's name, price and mileage float above it and move with the drag
- a floating glass card with the car's specs, a call button, Value My Trade and a link to the full listing
- a "View car" close-up with numbered spec pins, autoplay, drag/swipe/keyboard navigation, and a saved-cars list

Plain HTML, CSS and JavaScript. No framework and no build step.

## Run it locally

```bash
python -m http.server 8765
# open http://127.0.0.1:8765/
```

Serve it over HTTP rather than opening `index.html` as a file. The page reads each car image to find where the tyres touch the floor, and browsers block that on `file://`.

## Project layout

| Path | What it is |
|---|---|
| `index.html` | Page shell: header, showroom section, saved-cars dialog |
| `js/cars.js` | **All car data.** The showroom, captions, pins and spec card are generated from this file |
| `js/showroom.js` | The `<runway-section>` element: carousel, captions, floor grid, popup, saved cars |
| `css/showroom.css` | Styles |
| `assets/cars/` | Car cut-outs (transparent WebP, full size and 800px) |
| `assets/brand/` | Logo and photos from the current site |
| `data/` | Inventory and business details crawled from ascendautos.com |
| `tools/prep-car.py` | Crops a car cut-out and exports both sizes |

## Adding or replacing a car

1. Make a transparent PNG cut-out: 3/4 front view, car facing left. A soft studio shadow under the car is fine; it's kept.
2. Process it:
   ```bash
   pip install pillow
   python tools/prep-car.py "path/to/car.png" assets/cars ford-f150-2014 --keep-shadow
   ```
   The script prints the final size.
3. Add an entry to `js/cars.js`: copy an existing car and change the name, body, price, mileage, stock, VIN, listing URL, image paths and `w`/`h` (from step 2).
4. Copy the specs **exactly as worded on the ascendautos.com listing**, in this order: Engine, Transmission, Drivetrain, Exterior Color, Interior Color, Fuel Economy.
5. Set `pin: { x, y }` (percent of the image box) on the specs you want pinned on the car in the close-up view.

Only show information that's on the dealer's existing listing.
