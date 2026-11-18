/* =========================================================
   Ascend Auto: Showroom (<runway-section>)
   Desktop: 3D ring of cars. Phone: classic diagonal line
   (cars queue back to the upper right and drive out
   past the camera on the left).
   ========================================================= */
(() => {
  'use strict';
  const DATA = window.ASCEND;
  if (!DATA || !DATA.cars || !DATA.cars.length) return;
  const DEALER = DATA.dealer;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = () => RM.matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (i) => String(i + 1).padStart(2, '0');
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const miles = (n) => Number(n).toLocaleString('en-US');
  const label = (c, i) => `Car ${pad(i)}: ${c.name}`;
  const arOf = (c) => +(c.image.w / c.image.h).toFixed(4);

  /* ---------- icons ---------- */
  const SVG = (p, w = 24, h = 24, extra = '') => `<svg viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  const ICONS = {
    engine: SVG('<path d="M4 10v6M4 13h2M6 9.5h3V7.5h5v2h2l2 2h2.5v5H18l-2 2.5H8.5L6 16z"/>'),
    drivetrain: SVG('<rect x="3.5" y="3.5" width="4" height="6" rx="1"/><rect x="16.5" y="3.5" width="4" height="6" rx="1"/><rect x="3.5" y="14.5" width="4" height="6" rx="1"/><rect x="16.5" y="14.5" width="4" height="6" rx="1"/><path d="M7.5 6.5h9M7.5 17.5h9M12 6.5v11"/>'),
    exterior: SVG('<path d="M12 3.5s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4z"/><path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.4"/>'),
    fuel: SVG('<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M5 10h9M14 8l3 3v6a1.5 1.5 0 0 0 3 0V8.5L17 5.5"/>'),
    transmission: SVG('<circle cx="6" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="18" cy="5" r="1.5"/><circle cx="6" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><path d="M6 6.5v11M12 6.5v11M18 6.5V12H6"/>'),
    interior: SVG('<path d="M8.5 3.5h3.2l1.1 9.5h4.7a1.5 1.5 0 0 1 1.5 1.6l-.4 5.4H8.6L7.4 13z"/><path d="M8.6 20.5l-1 0M12 13h1"/>'),
    other: SVG('<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>')
  };
  const I_ARROW_R = SVG('<path d="M1 7h24M19 1l6 6-6 6"/>', 26, 14, 'width="22" height="12" stroke-width="1.4"');
  const I_PLUS = SVG('<path d="M12 4v16M4 12h16"/>', 24, 24, 'class="rw__i-plus" width="20" height="20"');
  const I_CHECK = SVG('<path d="M4.5 12.5l5 5L19.5 7"/>', 24, 24, 'class="rw__i-check" width="20" height="20" stroke-width="1.5"');
  const I_X = SVG('<path d="M5 5l14 14M19 5L5 19"/>', 24, 24, 'width="16" height="16" stroke-width="1.5"');

  /* ---------- ground shadow (follows the car's footprint) ---------- */
  // Fractions of the image box: f = front tyre contact, r = rear tyre contact,
  // b = lowest point of the front bumper. A car in cars.js may override with `ground`.
  const GROUND_DEFAULT = { foot: 0, contact: 1, f: { x: 0.43, y: 0.99 }, r: { x: 0.89, y: 0.87 }, b: { x: 0.07, y: 0.86 } };
  function readGround(im) {
    const w = 240, h = Math.max(1, Math.round(w * im.naturalHeight / im.naturalWidth));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data; // throws on a tainted canvas → default
    const bottom = new Array(w).fill(-1);
    for (let x = 0; x < w; x++) {
      for (let y = h - 1; y >= 0; y--) { if (d[(y * w + x) * 4 + 3] > 140) { bottom[x] = y; break; } }
    }
    const lowest = Math.max(...bottom);
    if (lowest < 0) return GROUND_DEFAULT;
    // where the tyres meet the floor = lowest fully-opaque row (a baked-in image
    // shadow is semi-transparent at its bottom edge, so it extends below this)
    let contactRow = -1, anyRow = -1;
    for (let y = h - 1; y >= 0 && (contactRow < 0 || anyRow < 0); y--) {
      for (let x = 0; x < w; x++) {
        const a = d[(y * w + x) * 4 + 3];
        if (anyRow < 0 && a > 5) anyRow = y;
        if (contactRow < 0 && a >= 240) { contactRow = y; break; }
      }
    }
    // lowest point inside a horizontal band, centred over the flat bit of the tyre
    const pick = (a, b) => {
      const x0 = Math.round(a * w), x1 = Math.min(w, Math.round(b * w));
      let by = -1;
      for (let x = x0; x < x1; x++) by = Math.max(by, bottom[x]);
      let sum = 0, n = 0;
      for (let x = x0; x < x1; x++) if (bottom[x] >= by - 1) { sum += x; n++; }
      return { x: (sum / Math.max(n, 1) + 0.5) / w, y: (by + 1) / h };
    };
    return {
      foot: clamp((h - 1 - Math.max(anyRow, 0)) / h, 0, 0.4),
      contact: contactRow >= 0 ? clamp((contactRow + 1) / h, 0.6, 1) : 1,
      f: pick(0.22, 0.62),
      r: pick(0.66, 1),
      b: pick(0, 0.2)
    };
  }
  function groundMarkup(g, ar) {
    const { f, r, b } = g;
    // work in "image-height" units so angles are true on screen
    const R = { x: r.x * ar, y: r.y }, F = { x: f.x * ar, y: f.y };
    const dx = F.x - R.x, dy = F.y - R.y;
    if (Math.abs(dx) < 1e-3) return '';
    const ang = Math.atan(dy / dx);
    // chassis shadow spans only the wheelbase (between the two tyre anchors)
    const len = Math.hypot(dx, dy);
    const mid = { x: (R.x + F.x) / 2, y: (R.y + F.y) / 2 };
    // Every value below is a fraction of the car's image box, so the shadow scales
    // with the car on desktop, mobile and in the popup.
    const blob = (c, length, thick, alpha, lift = 0, tilt = 1) =>
      `<i style="left:${(c.x / ar * 100).toFixed(2)}%;top:${((c.y - lift) * 100).toFixed(2)}%;` +
      `width:${(length / ar * 100).toFixed(2)}%;height:${(thick * 100).toFixed(2)}%;` +
      `transform:translate(-50%,-50%) rotate(${(ang * tilt).toFixed(4)}rad);` +
      `background:radial-gradient(closest-side,rgb(20 16 12/${alpha}),rgb(20 16 12/${(alpha * 0.45).toFixed(3)}) 55%,rgb(20 16 12/0))"></i>`;
    return [
      // lift > 0 moves a layer up (toward the tyre), lift < 0 moves it down
      blob(mid, len * 0.92, 0.05, 0.2, 0.006),         // faint chassis shadow between the tyres
      blob(F, 0.19 * ar, 0.05, 0.85, 0.018, 0.35),     // front tyre: tucked up so it touches the tyre
      blob(R, 0.14 * ar, 0.038, 0.8, -0.008, 0.6)      // rear tyre: sits right under the tyre
    ].join('');
  }

  /* ---------- markup ---------- */
  function imgTag(c, alt, lazy) {
    return `<img src="${esc(c.image.src)}" srcset="${esc(c.image.src)} 800w, ${esc(c.image.large)} ${c.image.w}w" sizes="(min-width: 1100px) 640px, 90vw" width="${c.image.w}" height="${c.image.h}" alt="${esc(alt)}" draggable="false" decoding="async" loading="${lazy ? 'lazy' : 'eager'}" data-model-image>`;
  }
  function pinsOf(c) {
    return c.specs.filter((s) => s.pin).map((s, k) => {
      const n = k + 1;
      const flip = s.pin.x > 70 ? ' is-flip' : '';
      return `<button class="rw__pin${flip}" type="button" data-rw-pin="${n}" data-tip="${esc(s.label)}: ${esc(s.value)}" style="left:${s.pin.x}%;top:${s.pin.y}%;--pi:${n}" aria-label="${n}: ${esc(s.label)}, ${esc(s.value)}" tabindex="-1"><span class="rw__pin-dot">${n}</span></button>`;
    }).join('');
  }
  function panelOf(c, i) {
    let pinN = 0;
    const rows = c.specs.map((s, k) => {
      const n = s.pin ? ++pinN : 0;
      return `<li class="rw__item" ${n ? `data-rw-card="${n}"` : ''} style="--i:${k + 1}">
          <span class="rw__media" aria-hidden="true">${ICONS[s.key] || ICONS.other}${n ? `<span class="rw__num">${n}</span>` : ''}</span>
          <span class="rw__info"><span class="rw__type">${esc(s.label)}</span><span class="rw__value">${esc(s.value)}</span></span>
        </li>`;
    }).join('');
    return `
    <div class="rw__look-panel${i === 0 ? ' is-in' : ''}" data-rw-panel="${i}" ${i === 0 ? '' : 'hidden'}>
      <div class="rw__car">
        <h4 class="rw__sr">${esc(c.name)}, ${esc(c.body)}, stock ${esc(c.stock)}, price ${money(c.price)}, mileage ${miles(c.mileage)}</h4>
        ${c.note ? `<p class="rw__car-note">${esc(c.note)}</p>` : ''}
      </div>
      <ul class="rw__items" role="list">${rows}</ul>
      <div class="rw__bundle">
        <!-- the same actions the ascendautos.com listing offers: call, value my trade, the listing itself -->
        <a class="rw__cta" href="tel:${DEALER.tel}" aria-label="Call ${esc(DEALER.name)} about the ${esc(c.name)}: ${esc(DEALER.phone)}">
          <span class="rw__cta-add">Call ${esc(DEALER.phone)}</span>
          ${I_ARROW_R}
        </a>
        <div class="rw__links">
          <a href="${esc(DEALER.site)}/contact?form=appraisal" target="_blank" rel="noopener noreferrer">Value My Trade ↗</a>
          <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">View full listing ↗</a>
        </div>
      </div>
    </div>`;
  }
  function captionOf(c, i) {
    return `
      <div class="rw__cap${i === 0 ? ' is-on' : ''}" data-rw-cap="${i}">
        <span class="rw__cap-type">${esc(c.body)} · Stock #${esc(c.stock)}</span>
        <span class="rw__cap-name">${esc(c.name)}</span>
        <span class="rw__cap-stats">
          <span class="rw__cap-stat"><small>Price</small><strong>${money(c.price)}</strong></span>
          <span class="rw__cap-sep" aria-hidden="true"></span>
          <span class="rw__cap-stat"><small>Mileage</small><strong>${miles(c.mileage)}</strong></span>
        </span>
      </div>`;
  }
  function buildMarkup(cars) {
    const bodies = cars.map((c, i) => `
      <div class="rw__model" data-rw-model data-index="${i}" aria-hidden="true">
        <span class="rw__shadow"></span>
        <div class="rw__figure" style="--rw-ar:${arOf(c)}"><div class="rw__art"><div class="rw__ground" aria-hidden="true"></div>${imgTag(c, '', false)}<button class="rw__hit" type="button" data-rw-go="${i}" aria-label="${esc(label(c, i))}" tabindex="-1"></button></div></div>
      </div>`).join('');
    const heroes = cars.map((c, i) => `
      <div class="rw__hero${i === 0 ? ' is-on' : ''}" data-rw-hero data-index="${i}" data-name="${esc(c.name)}" data-label="${esc(label(c, i))}" data-probe="${esc(c.image.src)}" ${i ? 'aria-hidden="true"' : ''}>
        <div class="rw__morph">
          <span class="rw__shadow"></span>
          <div class="rw__figure" style="--rw-ar:${arOf(c)}"><div class="rw__art"><div class="rw__ground" aria-hidden="true"></div>${imgTag(c, c.name, false)}<button class="rw__zoom" type="button" data-rw-zoom aria-label="View car: ${esc(c.name)}" tabindex="${i ? -1 : 0}"></button><div class="rw__pins">${pinsOf(c)}</div></div></div>
        </div>
      </div>`).join('');
    const ticks = cars.map((c, i) => `
      <button class="rw__tick" type="button" data-rw-tick="${i}" aria-current="${i === 0}" aria-label="${esc(label(c, i))}">
        <span class="rw__tick-bar"></span>
        <span class="rw__tick-label">${pad(i)}<span class="rw__tick-name">&nbsp;&nbsp;${esc(c.name)}</span></span>
      </button>`).join('');
    const ARROW_L = SVG('<path d="M25 7H1M7 1L1 7l6 6"/>', 26, 14, 'width="26" height="14"');
    const ARROW_R = SVG('<path d="M1 7h24M19 1l6 6-6 6"/>', 26, 14, 'width="26" height="14"');
    return `
    <div class="rw__sticky">
      <div class="rw__grid">
        <div class="rw__left">
          <div class="rw__head">
            <div class="rw__intro">
              <p class="rw__eyebrow">Ascend Auto · Buda, TX</p>
              <h2 class="rw__title">Find your next car.</h2>
              <p class="rw__sub">Every car on our lot is hand-picked for reliability, quality and condition. Drag to browse, then tap a car for a closer look.</p>
            </div>
            <a class="rw__all" href="${esc(DEALER.inventoryUrl)}" target="_blank" rel="noopener noreferrer">Browse all ${DEALER.inStock} cars ${I_ARROW_R}</a>
            <span class="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live></span>
          </div>
          <div class="rw__stage" data-rw-stage tabindex="0" role="region" aria-roledescription="carousel" aria-label="Showroom: use arrow keys or swipe to change car">
            <svg class="rw__floor" data-rw-floor aria-hidden="true" focusable="false"></svg>
            <div class="rw__actors" data-rw-actors>${bodies}</div>
            <div class="rw__heroes" data-rw-heroes>${heroes}</div>
            <div class="rw__caps" data-rw-caps aria-hidden="true">${cars.map(captionOf).join('')}</div>
            <span class="rw__sweep" aria-hidden="true"></span>
            <span class="rw__cursor" data-rw-cursor aria-hidden="true"><span class="rw__cursor-in"><span class="rw__cursor-label rw__cursor-drag">Drag</span><span class="rw__cursor-label rw__cursor-view">View</span></span></span>
            <span class="rw__walk" aria-hidden="true"><span class="rw__walk-line"></span></span>
          </div>
          <div class="rw__controls">
            <button class="rw__icon" type="button" data-rw-prev aria-label="Previous car">${ARROW_L}</button>
            <div class="rw__ticks">${ticks}</div>
            <button class="rw__icon rw__auto" type="button" data-rw-auto aria-pressed="false" aria-label="Autoplay">
              <svg class="rw__i-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>
              <svg class="rw__i-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>
            </button>
            <button class="rw__icon" type="button" data-rw-next aria-label="Next car">${ARROW_R}</button>
          </div>
          <div class="rw__lb" data-rw-lb data-word="Car" role="region" aria-label="View car" aria-hidden="true">
            <div class="rw__lb-stage" data-rw-lb-stage></div>
            <div class="rw__lb-top">
              <p class="rw__lb-cap"><span class="rw__lb-kicker" data-rw-lb-kicker></span><span class="rw__lb-name" data-rw-lb-name></span></p>
              <button class="rw__lb-close" type="button" data-rw-zoom-close aria-label="Close">${I_X}</button>
            </div>
            <p class="rw__lb-hint">Tap a dot to see the spec</p>
          </div>
        </div>
        <aside class="rw__panel" aria-label="This vehicle">
          <div class="rw__panel-inner">
            <div class="rw__panel-head">
              <div class="rw__panel-titles"><h3 class="rw__panel-title">This vehicle</h3><span class="rw__label" data-rw-pieces></span></div>
              <button class="rw__add" type="button" data-rw-save aria-pressed="false" aria-label="Save car">${I_PLUS}${I_CHECK}</button>
            </div>
            ${cars.map(panelOf).join('')}
          </div>
        </aside>
      </div>
    </div>`;
  }

  /* ---------- saved cars (local shortlist) ---------- */
  const Garage = (() => {
    const KEY = 'ascend-saved-cars-v1';
    const okUrl = (u) => { try { return new URL(u).hostname === 'www.ascendautos.com'; } catch { return false; } };
    const valid = (x) => x && typeof x.id === 'string' && typeof x.name === 'string' && Number.isFinite(x.price) && Number.isFinite(x.mileage) && okUrl(x.url);
    let items = [];
    try { const raw = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(raw)) items = raw.filter(valid).slice(0, 30); } catch { items = []; }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage blocked */ } };
    const listeners = new Set();
    const emit = () => { render(); listeners.forEach((f) => f()); };
    function snapshot(c) { return { id: c.id, name: c.name, body: c.body, price: c.price, mileage: c.mileage, stock: c.stock, vin: c.vin, url: c.url, image: c.image.src }; }
    function has(id) { return items.some((x) => x.id === id); }
    function add(c) { if (!has(c.id)) { items.push(snapshot(c)); save(); emit(); toast('Car saved to your list'); } }
    function remove(id) { items = items.filter((x) => x.id !== id); save(); emit(); }
    function render() {
      $$('[data-garage-count]').forEach((el) => { el.textContent = items.length; });
      const list = $('#garage-items'); if (!list) return;
      list.replaceChildren();
      if (!items.length) {
        const p = document.createElement('p'); p.className = 'garage-note';
        p.textContent = 'No saved cars yet. Tap the plus beside a car to keep it here.';
        list.append(p);
      }
      items.forEach((x) => {
        const row = document.createElement('div'); row.className = 'garage-row';
        const img = document.createElement('img'); img.src = x.image; img.alt = x.name; img.loading = 'lazy';
        const info = document.createElement('div');
        const h = document.createElement('h3'); h.textContent = x.name;
        const p = document.createElement('p'); p.textContent = `${money(x.price)} · ${miles(x.mileage)} mi · Stock #${x.stock}`;
        const a = document.createElement('a'); a.href = x.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'View full listing ↗';
        info.append(h, p, a);
        const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', `Remove ${x.name}`);
        rm.addEventListener('click', () => remove(x.id));
        row.append(img, info, rm); list.append(row);
      });
      const total = $('#garage-total');
      if (total) total.textContent = items.length ? `${items.length} saved ${items.length === 1 ? 'car' : 'cars'}` : '';
      const exp = $('#export-garage'); if (exp) exp.disabled = !items.length;
    }
    function exportList() {
      if (!items.length) return;
      const parts = ['ASCEND AUTO: SAVED CARS', `${DEALER.address}\n${DEALER.phone}`, ''];
      items.forEach((x) => parts.push(`${x.name} · ${money(x.price)} · ${miles(x.mileage)} mi\nStock #${x.stock} · VIN ${x.vin}\n${x.url}`));
      const blob = new Blob([parts.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ascend-auto-saved-cars.txt';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return { has, add, remove, render, exportList, on: (f) => listeners.add(f), off: (f) => listeners.delete(f) };
  })();

  let toastT = 0;
  function toast(msg) {
    const el = $('#garage-status'); if (!el) return;
    el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('is-on'), 2500);
  }

  /* ---------- the section ---------- */
  const K = 95, C = 2 * Math.sqrt(K), LAG = 0.04;

  class Showroom extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.cars = DATA.cars;
      this.n = this.cars.length;
      this.innerHTML = buildMarkup(this.cars);
      this.classList.add('rw', 'rw--popup', 'rw--js');
      this.speed = +(this.dataset.speed || 5000);
      this.style.setProperty('--rw-speed', this.speed / 1000 + 's');
      this.maxAr = Math.max(...this.cars.map(arOf));

      const q = (s) => this.querySelector(s);
      this.stage = q('[data-rw-stage]');
      this.actors = q('[data-rw-actors]');
      this.heroes = $$('[data-rw-hero]', this);
      this.ticks = $$('[data-rw-tick]', this);
      this.panels = $$('[data-rw-panel]', this);
      this.live = q('[data-rw-live]');
      this.pieces = q('[data-rw-pieces]');
      this.lb = q('[data-rw-lb]');
      this.lbStage = q('[data-rw-lb-stage]');
      this.cursor = q('[data-rw-cursor]');
      this.panel = q('.rw__panel');
      this.caps = $$('[data-rw-cap]', this);

      // clones so the ring always has >= 8 bodies
      this.N = this.n * Math.ceil(8 / this.n);
      const originals = $$('[data-rw-model]', this.actors);
      for (let a = this.n; a < this.N; a++) {
        const c = originals[a % this.n].cloneNode(true);
        c.dataset.rwClone = ''; c.dataset.index = a;
        $$('img', c).forEach((im) => { im.loading = 'lazy'; });
        this.actors.append(c);
      }
      this.bodies = $$('[data-rw-model]', this.actors).map((el, a) => ({
        el, a, look: a % this.n, ar: arOf(this.cars[a % this.n]), c: 0, blur: -1, op: -1, z: -1, t: ''
      }));

      // state
      this.index = 0; this.target = 0; this.vel = 0;
      this.start = reduced() ? 0 : 1.15;
      this.cur = -this.start;
      this.bodies.forEach((b) => { b.c = this.cur - (this.mode === 'classic' ? 0 : 0); });
      this.still = false; this.dragging = false; this.drag = null;
      this.visible = false; this.playing = false; this.engaged = false; this.panelHover = false; this.zoomed = false;
      this.wacc = 0; this.wheelLock = 0; this.suppressUntil = 0;
      this.vh = innerHeight; this.vw = innerWidth;

      this.decodeImages();
      this.measure();
      this.bodies.forEach((b) => { b.c = this.cur; });
      this.setIndex(0, true);
      this.syncSaved();
      this.bind();
      this.setupCursor();
      this.probeFeet();
      if (this.dataset.autoplay === 'true' && !reduced()) this.play(true);
      this.renderAll();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.raf); cancelAnimationFrame(this.craf);
      clearTimeout(this.timer); clearTimeout(this.resizeT); clearTimeout(this.lbT);
      this.io && this.io.disconnect(); this.ro && this.ro.disconnect(); this.revealIO && this.revealIO.disconnect();
      removeEventListener('resize', this._onResize);
      document.removeEventListener('visibilitychange', this._onVis);
      Garage.off(this._onGarage);
    }

    /* ----- images ----- */
    decodeImages() {
      $$('img[data-model-image]', this).forEach((img) => this.decode(img));
    }
    decode(img) {
      const done = () => img.classList.add('is-decoded');
      if (img.complete && img.naturalWidth) { done(); return; }
      (img.decode ? img.decode() : Promise.reject()).then(done, () => {
        if (img.naturalWidth) done(); else img.addEventListener('load', done, { once: true });
      });
    }
    probeFeet() {
      // Reads each car's alpha mask once to find (a) any transparent padding under the
      // tyres, so every car touches the floor, and (b) where the tyres and front bumper
      // meet the ground, so the shadow follows the car's real footprint.
      const seen = new Map();
      this.heroes.forEach((hero, i) => {
        const car = this.cars[i];
        const url = hero.dataset.probe;
        const imageShadow = this.dataset.shadow === 'image';
        const apply = (g) => {
          const figs = [hero, ...this.bodies.filter((b) => b.look === i).map((b) => b.el)];
          figs.forEach((el) => {
            el.style.setProperty('--rw-foot', g.foot);
            const gr = el.querySelector('.rw__ground');
            if (gr) gr.innerHTML = imageShadow ? '' : groundMarkup(car.ground || g, arOf(car));
          });
          if (i === 0) { this.contact = g.contact || 1; this.drawFloor(); }
        };
        if (seen.has(url)) { seen.get(url).then(apply); return; }
        const p = new Promise((res) => {
          const im = new Image(); im.crossOrigin = 'anonymous';
          im.onload = () => {
            try { res(readGround(im)); } catch { res(GROUND_DEFAULT); }
          };
          im.onerror = () => res(GROUND_DEFAULT);
          im.src = url;
        });
        seen.set(url, p); p.then(apply);
      });
    }

    /* ----- layout ----- */
    headerHeight() {
      let h = 0;
      $$('.site-header').forEach((el) => { if (!el.contains(this) && el.offsetParent !== null) h += el.offsetHeight; });
      return h;
    }
    measure() {
      const phone = innerWidth <= 749;
      this.phone = phone;
      this.mode = phone ? (this.dataset.mstyle || 'ring') : (this.dataset.style || 'ring');

      if (!phone) {
        this.style.setProperty('--rw-frame-h', Math.max(460, innerHeight - this.headerHeight()) + 'px');
        this.stage.style.height = '';
      } else {
        this.style.removeProperty('--rw-frame-h');
        const Wp = this.stage.clientWidth || innerWidth;
        const carH = Math.round(Wp * 0.8 / this.maxAr);
        this.stage.style.height = Math.round(carH + 150 + this.captionHeight()) + 'px';
      }
      const r = this.stage.getBoundingClientRect();
      const W = this.W = Math.max(1, r.width);
      const H = this.H = Math.max(1, r.height);
      const ring = this.mode === 'ring';
      const fs = this.fs = ring ? 1.08 : 1;
      let modelH, hx, hy;
      // free width = stage area not covered by the floating panel (desktop only)
      let FW = W;
      if (!phone && this.panel) {
        const pr = this.panel.getBoundingClientRect();
        if (pr.width && pr.left < r.right) FW = Math.max(W * 0.45, pr.left - r.left - 12);
      }
      this.FW = FW;
      if (ring) {
        // one car in focus: big and centred in the free area, neighbours peek in at its edges
        const wShare = phone ? 0.84 : 0.72;
        const capRoom = this.captionHeight() + (phone ? 28 : 44);   // caption + gaps above the car
        modelH = Math.max(110, Math.round(Math.min(
          (H * (phone ? 0.62 : 0.66)) / fs,
          (FW * wShare) / (this.maxAr * fs),
          (H - capRoom - (phone ? 44 : 34)) / fs)));
        hy = phone ? 44 : Math.round(clamp(34 + (H - modelH * fs - capRoom - 34) * 0.45, 34, 200));
        hx = 0.5 * FW;
        this.unit = Math.max(120, 0.45 * W);
      } else {
        modelH = Math.max(90, Math.round(W * 0.8 / this.maxAr));
        hy = 40; hx = 0.44 * W;
        this.unit = Math.max(90, W * 0.42);
      }
      this.modelH = modelH; this.hx = hx; this.hy = hy;
      // caption sits just above the car's roof, centred over the active car
      this.stage.style.setProperty('--rw-cap-bottom', Math.round(hy + modelH * fs + (phone ? 12 : 20)) + 'px');
      this.capShift = phone ? Math.min(140, W * 0.32) : Math.min(260, FW * 0.26);
      this.stage.style.setProperty('--rw-model-h', modelH + 'px');
      this.stage.style.setProperty('--rw-hx', hx + 'px');
      this.stage.style.setProperty('--rw-hy', hy + 'px');
      this.stage.style.setProperty('--rw-fs', fs);
      this.style.setProperty('--rw-ax', (hx / W * 100).toFixed(2) + '%');
      this.bodies.forEach((b) => { b.w = modelH * b.ar; });
      this.drawFloor();
      this.renderAll();
    }

    /* ----- perspective floor grid ----- */
    // One-point perspective (pinhole camera). Ground units = camera height.
    //   screen y of a ground line at depth z:  y = yh + (floorY - yh) * z0 / z
    //   screen x of a ground line at offset X: x = hx + X * (y - yh)     (square cells)
    // The front tyre (the hero's bottom edge) sits on the depth line z = z0.
    drawFloor() {
      const svg = this.querySelector('[data-rw-floor]');
      if (!svg) return;
      const { W, H, hx, hy, modelH, fs } = this;
      const carH = modelH * fs;
      // where the front tyre touches the floor (above the box bottom when the image has its own shadow)
      const floorY = H - hy - (1 - (this.contact || 1)) * carH;
      const yh = floorY - carH * (this.phone ? 0.95 : 1.02); // horizon ≈ just above the roof line
      const span = floorY - yh;
      if (span < 20) { svg.innerHTML = ''; return; }
      const z0 = 5;                                  // car distance, in camera heights
      const d = 0.55;                                // grid cell size, in camera heights
      const yAt = (z) => yh + span * z0 / z;
      const f = (n) => n.toFixed(1);
      let path = '';
      // depth lines (parallel to the horizon), from the bottom edge up toward the horizon
      const zMin = z0 * span / Math.max(1, H - yh);
      const nStart = Math.ceil((zMin - z0) / d);
      let prevY = Infinity;
      for (let n = nStart; n < 400; n++) {
        const y = yAt(z0 + n * d);
        if (prevY - y < 9 || y - yh < span * 0.12) break;   // stop before lines bunch up at the horizon
        path += `M0 ${f(y)}H${f(W)}`;
        prevY = y;
      }
      // lines running into the distance, converging on the vanishing point
      const reach = Math.max(hx, W - hx) / (d * Math.max(1, H - yh));
      const M = Math.ceil(reach) + 2;
      const y0 = yh + 2;
      for (let m = -M; m <= M; m++) {
        const k = m * d;
        path += `M${f(hx + k * (y0 - yh))} ${f(y0)}L${f(hx + k * (H - yh))} ${f(H)}`;
      }
      const fadeTop = yh + span * 0.5;
      svg.setAttribute('viewBox', `0 0 ${f(W)} ${f(H)}`);
      svg.innerHTML = `
        <defs>
          <linearGradient id="rwFloorFade" gradientUnits="userSpaceOnUse" x1="0" y1="${f(yh)}" x2="0" y2="${f(H)}">
            <stop offset="0" stop-color="#151413" stop-opacity="0"/>
            <stop offset="${((yh + span * 0.15 - yh) / (H - yh)).toFixed(3)}" stop-color="#151413" stop-opacity="0"/>
            <stop offset="${((fadeTop - yh) / (H - yh)).toFixed(3)}" stop-color="#151413" stop-opacity=".05"/>
            <stop offset="${((floorY - yh) / (H - yh)).toFixed(3)}" stop-color="#151413" stop-opacity=".11"/>
            <stop offset="1" stop-color="#151413" stop-opacity=".13"/>
          </linearGradient>
          <radialGradient id="rwFloorEdge" gradientUnits="userSpaceOnUse" cx="${f(hx)}" cy="${f(floorY)}" r="${f(Math.max(W * 0.62, span * 2))}">
            <stop offset="0" stop-color="#fff"/>
            <stop offset=".6" stop-color="#fff"/>
            <stop offset="1" stop-color="#000"/>
          </radialGradient>
          <mask id="rwFloorMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${f(W)}" height="${f(H)}">
            <rect width="${f(W)}" height="${f(H)}" fill="url(#rwFloorEdge)"/>
          </mask>
        </defs>
        <g mask="url(#rwFloorMask)">
          <path d="${path}" fill="none" stroke="url(#rwFloorFade)" stroke-width="1" vector-effect="non-scaling-stroke" shape-rendering="geometricPrecision"/>
        </g>`;
    }

    /* ----- placement ----- */
    put(b, x, bottom, scale, op, blur, z) {
      const half = b.w * scale / 2;
      if (x + half < -4 || x - half > this.W + 4) op = 0;
      op = Math.round(op * 1000) / 1000;
      const t = `translate3d(${x.toFixed(2)}px,${(-bottom).toFixed(2)}px,0) translateX(-50%) scale(${scale.toFixed(4)})`;
      const s = b.el.style;
      if (t !== b.t) { s.transform = t; b.t = t; }
      if (op !== b.op) {
        s.opacity = op; s.visibility = op < 0.01 ? 'hidden' : 'visible';
        s.pointerEvents = op < 0.5 ? 'none' : ''; b.op = op;
      }
      if (z !== b.z) { s.zIndex = z; b.z = z; }
      const bl = Math.round(blur * 10) / 10;
      if (this.dataset.blur !== 'false' && bl !== b.blur) { s.filter = bl > 0.05 ? `blur(${bl}px)` : ''; b.blur = bl; }
    }
    wrap(v) { const N = this.N; let r = ((v % N) + N) % N; if (r > N / 2) r -= N; return r; }

    captionHeight() {
      let h = 0;
      (this.caps || []).forEach((el) => { h = Math.max(h, el.offsetHeight); });
      return h || 96;
    }
    // Each car's caption is placed from the continuous carousel position, so it
    // follows the finger while dragging and settles with the same spring.
    renderCaptions() {
      if (!this.caps) return;
      const n = this.n, shift = this.capShift || 200;
      this.caps.forEach((el, i) => {
        let d = ((i - this.cur) % n + n) % n;
        if (d > n / 2) d -= n;                    // signed distance from the car in view
        const a = Math.abs(d);
        const op = clamp(1 - a * 1.2, 0, 1);       // both captions half-visible at the midpoint
        const t = `translate3d(calc(-50% + ${(d * shift).toFixed(1)}px),0,0) scale(${(1 - Math.min(a, 1) * 0.06).toFixed(3)})`;
        if (t !== el._t) { el.style.transform = t; el._t = t; }
        const o = op.toFixed(3);
        if (o !== el._o) {
          el.style.opacity = o;
          el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
          el.style.filter = a > 0.01 ? `blur(${Math.min(a * 12, 10).toFixed(1)}px)` : '';
          el._o = o;
        }
      });
    }
    renderAll() {
      if (!this.bodies) return;
      this.renderCaptions();
      const { W, fs, hx, hy, modelH } = this;
      if (this.mode === 'ring') {
        // Focus layout: slot 0 = centre, slot ±1 = centred on the stage edge
        // (half the car visible, smaller, blurred), slot ±2 and beyond = hidden.
        const SIDE = 0.6;                         // neighbour scale
        const BLUR = this.phone ? 5 : 8;          // neighbour blur (px)
        for (const b of this.bodies) {
          const s = this.wrap(b.a - this.cur);
          const t = Math.abs(s), sg = Math.sign(s);
          const p = Math.pow(SIDE, Math.min(t, 1)) * Math.pow(0.85, Math.max(0, t - 1));
          const scale = p * (1 + (fs - 1) * clamp(1 - t, 0, 1));
          const FW = this.FW || W;
          const x = hx + sg * FW * (t <= 1 ? 0.5 * t : 0.5 + 0.35 * (t - 1));
          const bottom = hy + modelH * 0.16 * (1 - Math.pow(SIDE, Math.min(t, 1)));
          const blur = t <= 1 ? BLUR * t : BLUR + 3 * (t - 1);
          let op = t <= 1 ? 1 - 0.18 * t : clamp(0.82 * (1 - (t - 1) / 0.6), 0, 1);
          if (this.still && t < 0.02) op = 0;
          this.put(b, x, bottom, scale, op, blur, Math.round(scale * 1000));
        }
      } else {
        const ax = hx / W, sx = 0.36, sy = 24, sr = 0.7, ex = 0.6;
        for (const b of this.bodies) {
          const k = this.wrap(b.a - b.c);
          if (k < 0) {
            const e = Math.min(-k, 1.4) * 1.4;
            this.put(b, W * (ax - ex * e), hy - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
          } else {
            const op = k <= 3 ? 1 - 0.13 * k : Math.max(0, 0.61 * (4 - k));
            let o = op;
            if (this.still && k < 0.02) o = 0;
            this.put(b, W * (ax + sx * k), hy + sy * k, Math.pow(sr, k), o, Math.min(0.9 * k, 3.2), 1000 - Math.round(10 * k));
          }
        }
      }
    }

    /* ----- loop ----- */
    kick() {
      if (this.raf || !this.visible || document.hidden) return;
      this.last = 0;
      this.raf = requestAnimationFrame(this._frame || (this._frame = (now) => this.frame(now)));
    }
    frame(now) {
      this.raf = 0;
      const dt = this.last ? Math.min(0.034, (now - this.last) / 1000) : 1 / 60;
      this.last = now;
      const moving = this.step(dt);
      this.setStill(!moving && !this.dragging);
      this.renderAll();
      if ((moving || this.dragging) && this.visible && !document.hidden) this.raf = requestAnimationFrame(this._frame);
    }
    step(dt) {
      if (reduced()) {
        this.cur = this.target; this.vel = 0;
        this.bodies.forEach((b) => { b.c = this.target; });
        return false;
      }
      const h = dt / 3;
      for (let i = 0; i < 3; i++) {
        const acc = -K * (this.cur - this.target) - C * this.vel;
        this.vel += acc * h; this.cur += this.vel * h;
      }
      let moving = true;
      if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005) {
        this.cur = this.target; this.vel = 0; moving = false;
      }
      if (this.mode === 'classic') {
        for (const b of this.bodies) {
          const place = Math.max(0, this.wrap(b.a - this.cur));
          const tau = this.dragging ? 0.016 : 0.03 + LAG * Math.min(place, 4);
          b.c += (this.cur - b.c) * (1 - Math.exp(-dt / tau));
          if (Math.abs(this.cur - b.c) > 0.0006) moving = true; else b.c = this.cur;
        }
      } else {
        this.bodies.forEach((b) => { b.c = this.cur; });
      }
      return moving;
    }
    setStill(v) {
      if (v === this.still) return;
      this.still = v;
      this.classList.toggle('rw--still', v);
    }

    /* ----- index ----- */
    rank(a) { return Math.round(this.wrap(a - this.target)); }
    updateRanks() {
      const lim = this.mode === 'ring' ? 1 : 3;
      for (const b of this.bodies) {
        const k = this.rank(b.a);
        const on = k !== 0 && Math.abs(k) <= lim && (this.mode === 'ring' || k > 0);
        const hit = b.el.querySelector('.rw__hit');
        if (hit) hit.tabIndex = on ? 0 : -1;
        if (on) b.el.removeAttribute('aria-hidden'); else b.el.setAttribute('aria-hidden', 'true');
      }
    }
    setIndex(i, silent) {
      i = ((i % this.n) + this.n) % this.n;
      const changed = i !== this.index;
      this.index = i;
      this.updateRanks();
      this.kick();
      if (!changed && !silent) { this.restartBar(); return; }
      if (!silent) this.closeZoom();
      this.style.setProperty('--rw-progress', ((i + 1) / this.n).toFixed(3));
      this.heroes.forEach((h, j) => {
        const on = j === i;
        h.classList.toggle('was', h.classList.contains('is-on') && !on);
        h.classList.toggle('is-on', on);
        if (on) h.removeAttribute('aria-hidden'); else h.setAttribute('aria-hidden', 'true');
        const z = h.querySelector('[data-rw-zoom]'); if (z) z.tabIndex = on ? 0 : -1;
      });
      if (!silent && !reduced()) {
        this.stage.classList.remove('is-sweep'); void this.stage.offsetWidth; this.stage.classList.add('is-sweep');
      }
      if (!silent && this.live) this.live.textContent = label(this.cars[i], i);
      this.ticks.forEach((t, j) => {
        t.setAttribute('aria-current', String(j === i));
        t.classList.toggle('is-past', j < i);
      });
      this.panels.forEach((p, j) => { p.hidden = j !== i; if (!silent) p.classList.remove('is-in'); });
      if (!silent) { void this.panels[i].offsetWidth; this.panels[i].classList.add('is-in'); }
      const c = this.cars[i];
      if (this.pieces) {
        this.pieces.textContent = `Car ${pad(i)} / ${String(this.n).padStart(2, '0')}`;
        if (!silent) { this.pieces.classList.remove('is-swap'); void this.pieces.offsetWidth; this.pieces.classList.add('is-swap'); }
      }
      this.caps.forEach((el, j) => el.classList.toggle('is-on', j === i));
      this.syncSaved();
      this.clearHot();
      this.restartBar();
    }
    moveTo(T) {
      this.target = T;
      this.setStill(false);
      this.setIndex(T, false);
    }
    next() { this.moveTo(Math.round(this.target) + 1); }
    prev() { this.moveTo(Math.round(this.target) - 1); }
    go(i) {
      let d = (((i - this.index) % this.n) + this.n) % this.n;
      if (d > this.n / 2) d -= this.n;
      if (d) this.moveTo(Math.round(this.target) + d);
    }

    /* ----- autoplay ----- */
    play(on) {
      this.playing = on;
      this.classList.toggle('is-playing', on);
      const btn = this.querySelector('[data-rw-auto]');
      if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Pause autoplay' : 'Play autoplay'); }
      this.restartBar();
    }
    restartBar() {
      clearTimeout(this.timer);
      this.ticks.forEach((t) => t.classList.remove('is-run'));
      if (!this.playing) return;
      void this.offsetWidth;
      const t = this.ticks[this.index]; if (t) t.classList.add('is-run');
      this.timer = setTimeout(() => this.autoTick(), this.speed);
    }
    autoTick() {
      if (this.playing && this.visible && !this.dragging && !document.hidden && !this.panelHover && !this.zoomed && !this.engaged) this.next();
      else this.restartBar();
    }
    engage() { if (!this.engaged) { this.engaged = true; this.play(false); } }

    /* ----- hot linking ----- */
    clearHot() { $$('.is-hot', this).forEach((e) => e.classList.remove('is-hot')); }
    hot(n, scroll) {
      this.clearHot();
      const scope = this.zoomed ? this.lbStage : this.heroes[this.index];
      const pin = scope && scope.querySelector(`[data-rw-pin="${n}"]`);
      if (pin) pin.classList.add('is-hot');
      const card = this.panels[this.index].querySelector(`[data-rw-card="${n}"]`);
      if (!card) return;
      card.classList.add('is-hot');
      if (!scroll) return;
      const list = card.parentElement;
      const behavior = reduced() ? 'auto' : 'smooth';
      if (list.scrollWidth > list.clientWidth + 2) {
        list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 20, behavior });
      } else if (list.scrollHeight > list.clientHeight + 2) {
        list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior });
      } else {
        const r = card.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight - 140) scrollBy({ top: r.top - innerHeight * 0.3, behavior });
      }
    }

    /* ----- popup ----- */
    openZoom() {
      if (this.zoomed) return;
      this.engage(); this.clearHot();
      const hero = this.heroes[this.index];
      const fig = hero.querySelector('.rw__figure');
      const wrap = document.createElement('div'); wrap.className = 'rw__lb-model';
      const sh = hero.querySelector('.rw__shadow').cloneNode(true);
      const f2 = fig.cloneNode(true);
      const z = f2.querySelector('[data-rw-zoom]'); if (z) z.remove();
      $$('.rw__pin', f2).forEach((p) => { p.tabIndex = 0; });
      $$('img', f2).forEach((im) => { im.loading = 'eager'; im.classList.add('is-decoded'); });
      wrap.append(sh, f2);
      const foot = hero.style.getPropertyValue('--rw-foot'); if (foot) wrap.style.setProperty('--rw-foot', foot);
      clearTimeout(this.lbT);
      this.lbStage.replaceChildren(wrap);
      const sr = this.lbStage.getBoundingClientRect();
      const ar = arOf(this.cars[this.index]);
      const h = Math.max(120, Math.min(sr.height, sr.width / ar));
      wrap.style.setProperty('--rw-model-h', h + 'px');
      $$('img', f2).forEach((im) => { im.sizes = Math.round(h * ar) + 'px'; });
      this.querySelector('[data-rw-lb-kicker]').textContent = `${this.lb.dataset.word} ${pad(this.index)}`;
      this.querySelector('[data-rw-lb-name]').textContent = this.cars[this.index].name;
      this.zoomed = true;
      this.classList.add('rw--zoom');
      this.lb.setAttribute('aria-hidden', 'false');
      this.cursor && this.cursor.classList.remove('is-on', 'is-view', 'is-link');
      if (!reduced()) {
        const a = fig.getBoundingClientRect(), b = f2.getBoundingClientRect();
        if (a.height && b.height) {
          wrap.style.transition = 'none'; wrap.style.transformOrigin = '0 100%';
          wrap.style.transform = `translate3d(${a.left - b.left}px,${a.bottom - b.bottom}px,0) scale(${a.height / b.height})`;
          void wrap.offsetWidth;
          wrap.style.transition = ''; wrap.style.transform = '';
        }
      }
      this.querySelector('[data-rw-zoom-close]').focus({ preventScroll: true });
    }
    closeZoom() {
      if (!this.zoomed) return;
      this.zoomed = false;
      const wrap = this.lbStage.firstElementChild;
      const fig = this.heroes[this.index].querySelector('.rw__figure');
      if (wrap && fig && !reduced()) {
        const f2 = wrap.querySelector('.rw__figure');
        const a = fig.getBoundingClientRect(), b = f2.getBoundingClientRect();
        if (a.height && b.height) {
          wrap.style.transformOrigin = '0 100%';
          wrap.style.transform = `translate3d(${a.left - b.left}px,${a.bottom - b.bottom}px,0) scale(${a.height / b.height})`;
        }
      }
      const hadFocus = this.lb.contains(document.activeElement);
      this.classList.remove('rw--zoom');
      this.lb.setAttribute('aria-hidden', 'true');
      this.clearHot();
      this.lbT = setTimeout(() => this.lbStage.replaceChildren(), 950);
      if (hadFocus) this.stage.focus({ preventScroll: true });
      this.restartBar();
    }

    /* ----- saved cars ----- */
    syncSaved() {
      const b = this.querySelector('[data-rw-save]');
      if (!b) return;
      const c = this.cars[this.index];
      const on = Garage.has(c.id);
      b.classList.toggle('is-added', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Saved' : 'Save car'}: ${c.name}`);
    }
    toggleSave(btn) {
      const c = this.cars[this.index];
      if (Garage.has(c.id)) { Garage.remove(c.id); toast('Removed from your saved cars'); return; }
      btn.classList.add('is-fresh');
      setTimeout(() => btn.classList.remove('is-fresh'), 1000);
      Garage.add(c);
      if (navigator.vibrate && !reduced() && this.phone) navigator.vibrate(12);
    }

    /* ----- events ----- */
    bind() {
      this._onClick = (e) => this.onClick(e);
      this._onKey = (e) => this.onKey(e);
      this.addEventListener('click', this._onClick);
      this.addEventListener('keydown', this._onKey);
      this.addEventListener('click', (e) => {
        if (performance.now() < this.suppressUntil) { e.stopPropagation(); e.preventDefault(); }
      }, true);

      const st = this.stage;
      st.addEventListener('pointerdown', (e) => this.onDown(e));
      st.addEventListener('pointermove', (e) => this.onMove(e));
      st.addEventListener('pointerup', (e) => this.onUp(e));
      st.addEventListener('pointercancel', (e) => this.onUp(e));
      st.addEventListener('lostpointercapture', (e) => { if (this.drag && this.drag.active) this.onUp(e); });
      st.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
      st.addEventListener('dragstart', (e) => e.preventDefault());

      this.panel.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') this.panelHover = true; });
      this.panel.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { this.panelHover = false; this.restartBar(); } });
      this.panel.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]'); if (card && !card.classList.contains('is-hot')) this.hot(+card.dataset.rwCard, false);
      });
      this.panel.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('[data-rw-card]');
        if (card && !card.contains(e.relatedTarget)) this.clearHot();
      });

      this._onResize = () => {
        clearTimeout(this.resizeT);
        this.resizeT = setTimeout(() => {
          const wChanged = innerWidth !== this.vw, hBig = Math.abs(innerHeight - this.vh) >= 160;
          if (innerWidth > 749 || wChanged || hBig) { this.vw = innerWidth; this.vh = innerHeight; this.measure(); this.kick(); }
        }, 120);
      };
      addEventListener('resize', this._onResize);
      if ('ResizeObserver' in window) {
        let first = true;
        this.ro = new ResizeObserver(() => { if (first) { first = false; return; } this._onResize(); });
        this.ro.observe(this);
      }
      this._onVis = () => { if (!document.hidden) { this.kick(); this.restartBar(); } };
      document.addEventListener('visibilitychange', this._onVis);

      this.io = new IntersectionObserver((es) => {
        this.visible = es[0].isIntersecting;
        if (this.visible) this.kick();
      }, { threshold: 0 });
      this.io.observe(this);

      if (reduced()) this.classList.add('is-revealed');
      else {
        this.revealIO = new IntersectionObserver((es) => {
          if (!es[0].isIntersecting) return;
          this.revealIO.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add('is-revealed')));
        }, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
        this.revealIO.observe(this);
      }

      this._onGarage = () => this.syncSaved();
      Garage.on(this._onGarage);
    }

    onClick(e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('.rw__panel') && t.closest('button, a')) this.engage();
      if (t.closest('[data-rw-zoom-close]')) return this.closeZoom();
      if (this.zoomed && t.closest('[data-rw-lb]') && !t.closest('.rw__lb-model') && !t.closest('.rw__lb-top')) return this.closeZoom();
      if (t.closest('[data-rw-zoom]')) return this.openZoom();
      if (t.closest('[data-rw-next]')) return this.next();
      if (t.closest('[data-rw-prev]')) return this.prev();
      const tick = t.closest('[data-rw-tick]');
      if (tick) return this.go(+tick.dataset.rwTick);
      if (t.closest('[data-rw-auto]')) { if (!this.playing) this.engaged = false; return this.play(!this.playing); }
      const pin = t.closest('[data-rw-pin]');
      if (pin) { this.engage(); return this.hot(+pin.dataset.rwPin, true); }
      const go = t.closest('[data-rw-go]');
      if (go) {
        const a = +go.closest('[data-rw-model]').dataset.index;
        const k = this.rank(a);
        if (k !== 0 && Math.abs(k) < this.N / 2) return this.moveTo(Math.round(this.target) + k);
        return this.openZoom();
      }
      const save = t.closest('[data-rw-save]');
      if (save) return this.toggleSave(save);
    }
    onKey(e) {
      if (e.key === 'Escape') {
        if (this.zoomed) { e.preventDefault(); this.closeZoom(); return; }
      }
      if (e.target === this.stage) {
        if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
      }
    }

    onDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (this.zoomed || e.target.closest('.rw__pin')) return;
      this.drag = { x: e.clientX, y: e.clientY, t: this.target, id: e.pointerId, samples: [{ x: e.clientX, time: e.timeStamp }], active: false };
    }
    onMove(e) {
      if (e.pointerType === 'mouse') this.moveCursor(e);
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { this.onUp(e); return; }
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { this.drag = null; return; }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          d.active = true; this.dragging = true;
          this.classList.add('rw--dragging');
          try { this.stage.setPointerCapture(e.pointerId); } catch { /* ignore */ }
          this.setStill(false);
          this.cursor && this.cursor.classList.remove('is-view', 'is-link');
        } else return;
      }
      d.samples.push({ x: e.clientX, time: e.timeStamp });
      if (d.samples.length > 6) d.samples.shift();
      this.target = d.t - dx / this.unit;
      this.updateRanks();
      this.kick();
    }
    onUp(e) {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      if (!d.active) return;
      this.dragging = false;
      this.classList.remove('rw--dragging');
      this.suppressUntil = performance.now() + 60;
      const s = d.samples, f = s[0], l = s[s.length - 1];
      const span = l.time - f.time;
      const vx = span > 0 ? (l.x - f.x) / span : 0;
      const dx = (Number.isFinite(e.clientX) ? e.clientX : l.x) - d.x;
      const from = Math.round(d.t);
      if (this.phone) {
        if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) this.moveTo(from + (dx > 0 ? -1 : 1));
        else this.moveTo(from);
      } else {
        let i = Math.round(this.target - vx * 160 / this.unit);
        if (i === from && Math.abs(vx) > 0.3) i = from + (vx > 0 ? -1 : 1);
        i = clamp(i, from - 2, from + 2);
        this.moveTo(i);
      }
    }
    onWheel(e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || this.zoomed) return;
      e.preventDefault();
      const now = performance.now();
      if (now < this.wheelLock) return;
      this.wacc += e.deltaX;
      if (Math.abs(this.wacc) > 45) {
        if (this.wacc > 0) this.next(); else this.prev();
        this.wacc = 0; this.wheelLock = now + 520;
      }
    }

    /* ----- custom cursor ----- */
    setupCursor() {
      if (!this.cursor) return;
      if (!FINE.matches) { this.cursor.remove(); this.cursor = null; return; }
      this.classList.add('rw--cursor');
      this.cx = { x: 0, y: 0, tx: 0, ty: 0 };
      this.stage.addEventListener('pointerleave', () => this.cursor.classList.remove('is-on', 'is-link', 'is-view'));
    }
    moveCursor(e) {
      const cu = this.cursor; if (!cu || this.zoomed) return;
      const r = this.stage.getBoundingClientRect();
      const c = this.cx;
      c.tx = e.clientX - r.left; c.ty = e.clientY - r.top;
      if (!cu.classList.contains('is-on')) { c.x = c.tx; c.y = c.ty; cu.classList.add('is-on'); }
      const t = e.target instanceof Element ? e.target : null;
      cu.classList.toggle('is-view', !!(t && t.closest('[data-rw-zoom]')) && !this.dragging);
      cu.classList.toggle('is-link', !!(t && t.closest('.rw__pin, .rw__hit')) && !this.dragging);
      if (!this.craf) this.craf = requestAnimationFrame(() => this.cursorLoop());
    }
    cursorLoop() {
      this.craf = 0;
      const c = this.cx, k = reduced() ? 1 : 0.18;
      c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k;
      this.cursor.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
      if (Math.hypot(c.tx - c.x, c.ty - c.y) > 0.2) this.craf = requestAnimationFrame(() => this.cursorLoop());
    }
  }

  customElements.define('runway-section', Showroom);

  /* ---------- page wiring: saved cars dialog ---------- */
  function wirePage() {
    Garage.render();
    const dlg = $('#garage-dialog');
    const open = $('#open-garage');
    if (open && dlg) open.addEventListener('click', () => { Garage.render(); dlg.showModal(); });
    const close = $('#close-garage');
    if (close && dlg) close.addEventListener('click', () => dlg.close());
    if (dlg) dlg.addEventListener('click', (e) => {
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    const exp = $('#export-garage');
    if (exp) exp.addEventListener('click', () => Garage.exportList());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wirePage);
  else wirePage();
})();
