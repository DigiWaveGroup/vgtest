// Mobile nav: collapse the header links into a menu button (≤650px).
// Without JS the links simply stay visible as a plain list.
(function () {
  var header = document.querySelector('.site-header');
  var nav = header && header.querySelector('nav');
  if (!nav) return;
  nav.id = nav.id || 'site-nav';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-controls', nav.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"><span></span></span>';
  btn.setAttribute('aria-label', '主選單');
  nav.parentNode.insertBefore(btn, nav);
  header.classList.add('has-nav-toggle');
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    header.classList.toggle('nav-open', open);
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) { set(false); btn.focus(); }
  });
})();

// Decorative cursor glow on cards. Mouse-only; skipped for reduced motion and touch.
// Purely visual: no content, focus or keyboard behaviour depends on it.
(function () {
  var ok = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
           !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!ok) return;
  var SEL = '.participate-card, .event-card, .judge-card, .sponsor-group, .fb-card, .post-card';
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest ? e.target.closest(SEL) : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', Math.round(e.clientX - r.left) + 'px');
    card.style.setProperty('--my', Math.round(e.clientY - r.top) + 'px');
  }, { passive: true });
  document.documentElement.classList.add('has-glow');
})();

// 追蹤我們: red targeting dot that follows the mouse (mouse only; decorative, aria-hidden;
// skipped for touch and reduced motion). Movement is driven only by the user's pointer.
(function () {
  var sec = document.querySelector('section.follow');
  if (!sec) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var t = document.createElement('div');
  t.className = 'trk';
  t.setAttribute('aria-hidden', 'true');
  t.innerHTML = '<span class="trk-x"></span><span class="trk-y"></span><span class="trk-ring"></span><span class="trk-dot"></span><span class="trk-label"></span>';
  sec.appendChild(t);
  var x = 0, y = 0, tx = 0, ty = 0, raf = 0, label = t.querySelector('.trk-label');
  function pad(n) { n = Math.max(0, Math.round(n)); return ('0000' + n).slice(-4); }
  function step() {
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    t.style.setProperty('--x', x.toFixed(1) + 'px');
    t.style.setProperty('--y', y.toFixed(1) + 'px');
    label.textContent = 'TRK ' + pad(x) + ' / ' + pad(y);
    raf = (Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3) ? requestAnimationFrame(step) : 0;
  }
  sec.addEventListener('pointermove', function (e) {
    var r = sec.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top;
    if (!t.classList.contains('is-on')) { x = tx; y = ty; t.classList.add('is-on'); }
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
  sec.addEventListener('pointerleave', function () { t.classList.remove('is-on'); });
})();

// Hero scan beam loops continuously, with a visible pause / play control (WCAG 2.2.2).
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('motion-loop');
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'motion-toggle';
  b.setAttribute('aria-pressed', 'false');
  b.textContent = '暫停動態';
  b.addEventListener('click', function () {
    var paused = root.classList.toggle('motion-paused');
    b.setAttribute('aria-pressed', paused ? 'true' : 'false');
    b.textContent = paused ? '播放動態' : '暫停動態';
  });
  hero.appendChild(b);
})();

// Mouse "signal interference": every 6–12 s while the mouse moves, a brief glitch flickers at the cursor.
// Small (120×44 px), under 0.35 s, never more than once per 6 s (well below WCAG 2.3.1 flash limits).
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var g = document.createElement('div');
  g.className = 'sig-glitch';
  g.setAttribute('aria-hidden', 'true');
  g.innerHTML = '<span></span><span></span><span></span><span></span>';
  document.body.appendChild(g);
  var next = Date.now() + 4000;
  document.addEventListener('pointermove', function (e) {
    if (document.documentElement.classList.contains('motion-paused')) return;
    var now = Date.now();
    if (now < next) return;
    next = now + 6000 + Math.random() * 6000;
    g.style.setProperty('--gx', (e.clientX - 60) + 'px');
    g.style.setProperty('--gy', (e.clientY - 22) + 'px');
    g.classList.remove('is-on'); void g.offsetWidth; g.classList.add('is-on');
  }, { passive: true });
})();
