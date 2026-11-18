/* Below-the-fold sections: Google reviews + Locate us (hours / open status). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = (window.ASCEND && window.ASCEND.dealer) || {};
  const HOURS = D.hours || { 0: null, 1: [630, 1080], 2: [630, 1080], 3: [630, 1080], 4: [630, 1080], 5: [630, 1080], 6: [630, 900] };
  const TZ = D.timeZone || 'America/Chicago';
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---------- open now / today (in the dealer's time zone) ---------- */
  function zoned(date) {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(date).forEach((x) => { p[x.type] = x.value; });
    return { dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), mins: (+p.hour % 24) * 60 + +p.minute };
  }
  const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  function hours() {
    const now = zoned(new Date());
    const table = $('[data-hours]');
    if (table) table.querySelectorAll('tr[data-day]').forEach((tr) => tr.classList.toggle('is-today', +tr.dataset.day === now.dow));
    const el = $('[data-open-status]');
    if (!el) return;
    const h = HOURS[now.dow];
    let open = false, text;
    if (h && now.mins >= h[0] && now.mins < h[1]) { open = true; text = `Open now · until ${fmt(h[1])}`; }
    else if (h && now.mins < h[0]) text = `Closed · opens today at ${fmt(h[0])}`;
    else {
      for (let k = 1; k <= 7; k++) {
        const d = zoned(new Date(Date.now() + k * 864e5)), dh = HOURS[d.dow];
        if (dh) { text = `Closed · opens ${k === 1 ? 'tomorrow' : DAYS[d.dow]} at ${fmt(dh[0])}`; break; }
      }
    }
    el.textContent = text || '';
    el.classList.toggle('is-open', open);
  }

  /* ---------- Google reviews ---------- */
  const star = (fill) => `<svg viewBox="0 0 20 20" aria-hidden="true"><defs><linearGradient id="s${fill}"><stop offset="${fill}%" stop-color="#f4b400"/><stop offset="${fill}%" stop-color="#d9dee7"/></linearGradient></defs><path fill="url(#s${fill})" d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"/></svg>`;
  const stars = (r) => `<span class="stars" role="img" aria-label="${r} out of 5 stars">${[0, 1, 2, 3, 4].map((i) => star(Math.round(Math.max(0, Math.min(1, r - i)) * 100))).join('')}</span>`;

  function renderReviews(data) {
    const list = $('[data-reviews-list]'), sum = $('[data-reviews-summary]'), attr = $('[data-reviews-attr]'), link = $('[data-reviews-link]');
    if (data.url && link) link.href = data.url;
    if (data.rating) {
      sum.innerHTML = `<span class="reviews__score">${data.rating.toFixed(1)}</span><span class="reviews__meta">${stars(data.rating)}<span>${data.total.toLocaleString('en-US')} Google reviews</span></span>`;
      sum.hidden = false;
    }
    const reviews = (data.reviews || []).filter((r) => r.text);
    list.innerHTML = reviews.map((r) => `
      <article class="review">
        <header class="review__head">
          ${r.photo ? `<img class="review__avatar" src="${esc(r.photo)}" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer">` : `<span class="review__avatar review__avatar--initial">${esc(r.author.charAt(0))}</span>`}
          <div><a class="review__name" href="${esc(r.authorUrl || r.url || (link && link.href) || '#')}" target="_blank" rel="noopener noreferrer">${esc(r.author)}</a><span class="review__when">${esc(r.when)}</span></div>
        </header>
        ${stars(r.rating)}
        <p class="review__text">${esc(r.text)}</p>
        ${r.url ? `<a class="review__more" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Read on Google ↗</a>` : ''}
      </article>`).join('') || fallbackCard(link && link.href);
    list.removeAttribute('aria-busy');
    attr.hidden = false;
  }
  function fallbackCard(href) {
    return `<div class="review review--cta">
      <p class="review__cta-title">See what our customers say</p>
      <p class="review__cta-text">Read reviews of Ascend Auto on our Google Business profile.</p>
      <a class="btn btn--primary" href="${esc(href || '#')}" target="_blank" rel="noopener noreferrer">Read our reviews on Google ↗</a>
    </div>`;
  }
  /* Layout preview only. Shown on localhost or with ?demo=reviews, never to normal
     visitors. Every card is labelled as a sample; nothing claims to be a real review. */
  const demoMode = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || new URLSearchParams(location.search).get('demo') === 'reviews';
  function renderDemo() {
    const list = $('[data-reviews-list]'), sum = $('[data-reviews-summary]'), attr = $('[data-reviews-attr]');
    const sample = (n, when, lines) => `
      <article class="review review--sample">
        <header class="review__head">
          <span class="review__avatar review__avatar--initial">${n}</span>
          <div><span class="review__name">Customer name</span><span class="review__when">${when}</span></div>
        </header>
        ${stars(5)}
        <p class="review__text">${lines}</p>
      </article>`;
    list.innerHTML =
      sample('A', 'Placeholder date', 'Sample text showing where a customer review will appear. Real reviews from Ascend Auto’s Google Business profile replace these cards automatically.') +
      sample('B', 'Placeholder date', 'Sample text for layout preview. Longer reviews are trimmed to six lines with a link to read the full review on Google.') +
      sample('C', 'Placeholder date', 'Sample text. Each real review shows the reviewer’s name and photo, their star rating, how long ago they posted, and a link to Google.');
    list.removeAttribute('aria-busy');
    sum.hidden = true;
    attr.hidden = true;
  }
  async function loadReviews() {
    const list = $('[data-reviews-list]');
    if (!list) return;
    try {
      const r = await fetch('/api/reviews', { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      renderReviews(await r.json());
    } catch {
      if (demoMode()) { renderDemo(); return; }
      // API not configured: link to the Google listing instead
      const link = $('[data-reviews-link]');
      list.innerHTML = fallbackCard(link && link.href);
      list.removeAttribute('aria-busy');
    }
  }

  /* ---------- reveal on scroll ---------- */
  function reveal() {
    const items = document.querySelectorAll('.sec');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { items.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    items.forEach((e) => io.observe(e));
  }

  /* ---------- quick-action dock ---------- */
  function dock() {
    // Text Roger: pre-fill a message about the car currently in the showroom (editable before sending)
    const text = $('[data-dock-text]');
    if (text) text.addEventListener('click', () => {
      const show = $('runway-section');
      const car = show && show.cars && show.cars[show.index];
      const body = car
        ? `Hi Roger, I'm interested in the ${car.name} (Stock #${car.stock}) I saw on your website.`
        : "Hi Roger, I'm interested in one of your cars I saw on your website.";
      text.href = `sms:+15125578283?&body=${encodeURIComponent(body)}`;
    });
    // Find us: smooth-scroll to the map / hours section
    const map = $('[data-dock-map]');
    if (map) map.addEventListener('click', (e) => {
      const target = $('#visit');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#visit');
    });
  }

  function init() {
    dock();
    hours(); setInterval(hours, 60000);
    reveal();
    // load reviews when the section gets close to the viewport
    const sec = $('#reviews');
    if (sec && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); loadReviews(); } }, { rootMargin: '400px 0px' });
      io.observe(sec);
    } else loadReviews();
    const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
