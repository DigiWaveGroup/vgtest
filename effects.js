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

// ===== Cyberpunk motion layer (decorative; all skipped for reduced motion) =====
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('cy');

  // 1) Scroll reveal: blocks materialise (blur → sharp, rise) as they enter, slightly staggered.
  var RV = '.section-heading, .post-row, .participate-card, .event-card, .judge-category, .visit-content, .visit-map, .visit-facts > div, .fb-card, .sponsor-group, .faq-list > div, .article-body > *';
  var items = Array.prototype.slice.call(document.querySelectorAll(RV));
  items.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(RV); });
    el.classList.add('rv');
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * 80 + 'ms');
  });

  // 2) Text decode: headings / labels scramble into place once (real text kept for screen readers).
  var LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+';
  var CJK = '電訊網路視覺放大賞展覽創意未來數位訊號系統連線解碼像素霓虹';
  function decode(el, again) {
    if (el.dataset.dec && !again) return;
    if (el.dataset.busy) return; el.dataset.dec = '1'; el.dataset.busy = '1';
    var nodes = [];
    (function walk(n) { Array.prototype.forEach.call(n.childNodes, function (c) {
      if (c.nodeType === 3 && c.textContent.trim()) nodes.push(c); else if (c.nodeType === 1 && !c.classList.contains('visually-hidden')) walk(c);
    }); })(el);
    if (!nodes.length) return;
    var full = el.textContent;
    var sr = document.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = full;
    var origs = nodes.map(function (n) { return n.textContent; });
    nodes.forEach(function (n) { if (n.parentNode) { var w = document.createElement('span'); w.setAttribute('aria-hidden', 'true'); n.parentNode.replaceChild(w, n); w.appendChild(n); } });
    el.insertBefore(sr, el.firstChild);
    var start = performance.now(), dur = 650;
    function frame(t) {
      var p = Math.min(1, (t - start) / dur);
      nodes.forEach(function (n, i) {
        var o = origs[i], out = '';
        for (var k = 0; k < o.length; k++) {
          var ch = o[k];
          if (/\s/.test(ch) || k / o.length < p) { out += ch; continue; }
          var pool = /[㐀-鿿]/.test(ch) ? CJK : LAT;
          out += pool[Math.floor(Math.random() * pool.length)];
        }
        n.textContent = out;
      });
      if (p < 1) requestAnimationFrame(frame);
      else { nodes.forEach(function (n, i) { n.textContent = origs[i]; var w = n.parentNode; w.parentNode.replaceChild(n, w); }); sr.remove(); delete el.dataset.busy; }
    }
    requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('is-in');
      Array.prototype.forEach.call(el.querySelectorAll('h2, .eyebrow, .event-title, .post-title, time'), function (x) { decode(x); });
      var h = el.querySelector('h2'); if (h) { h.classList.add('is-glitch'); setTimeout(function () { h.classList.remove('is-glitch'); }, 700); }
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
  // News rows: the title / date re-decode when hovered or focused
  Array.prototype.forEach.call(document.querySelectorAll('.post-row a'), function (a) {
    function go() { Array.prototype.forEach.call(a.querySelectorAll('.post-title, time'), function (x) { decode(x, true); }); }
    a.addEventListener('mouseenter', go); a.addEventListener('focus', go);
  });

  // 3) Scroll progress rail (right edge) + vertical system label (left edge, wide screens).
  var rail = document.createElement('div'); rail.className = 'cy-rail'; rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<i></i>';
  var side = document.createElement('div'); side.className = 'cy-side'; side.setAttribute('aria-hidden', 'true');
  side.textContent = 'VISION GET WILD // 2027 // KAOHSIUNG // SIGNAL LOCKED';
  document.body.appendChild(rail); document.body.appendChild(side);
  var bar = rail.firstChild, ticking = false;
  function upd() { var h = root.scrollHeight - innerHeight; bar.style.transform = 'scaleY(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; ticking = false; }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

// 神機錯亂 (cyber-psychosis): a fast scroll triggers a ~0.5 s screen-tear / RGB-split episode.
// User-triggered, 12 s cooldown, no bright full-screen flashes (stays under WCAG 2.3.1 limits).
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, main = document.querySelector('main');
  if (!main) return;
  var ov = document.createElement('div');
  ov.className = 'psy'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<span class="psy-txt">ERR::NEURAL_LINK_UNSTABLE // 0x2027</span><span class="psy-txt b">SIGNAL OVERRIDE // VGW-NET</span>';
  document.body.appendChild(ov);
  var lastY = scrollY, lastT = performance.now(), cool = performance.now() + 3000;
  function fire() {
    root.classList.remove('psy-on'); void root.offsetWidth; root.classList.add('psy-on');
    setTimeout(function () { root.classList.remove('psy-on'); }, 600);
  }
  addEventListener('scroll', function () {
    var now = performance.now(), dy = Math.abs(scrollY - lastY), dt = now - lastT;
    lastY = scrollY; lastT = now;
    if (dt <= 0 || root.classList.contains('motion-paused')) return;
    if (dy / dt > 4.5 && now > cool) { cool = now + 12000; fire(); }   // > ~4500 px/s
  }, { passive: true });
})();
