/* Page loader: shows the animated logo until the page is ready, then wipes away.
   Ready = window load + web fonts + the intro animation has played (min time).
   Fires `ascend:ready` on window so the showroom can start its entrance. */
(() => {
  'use strict';
  const html = document.documentElement;
  const el = document.getElementById('loader');
  if (!el || !html.classList.contains('is-loading')) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduced ? 300 : 2100;   // let the logo animation finish
  const MAX = 7000;                   // never trap the visitor behind the loader

  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  const intro = new Promise((r) => setTimeout(r, MIN));

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    el.classList.add('is-leaving');
    html.classList.remove('is-loading');
    dispatchEvent(new Event('ascend:ready'));
    setTimeout(() => el.remove(), reduced ? 350 : 1000);
  }
  setTimeout(() => el.classList.add('is-waiting'), MIN);
  Promise.all([loaded, fonts, intro]).then(finish);
  setTimeout(finish, MAX);
})();
