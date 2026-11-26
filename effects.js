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



// ===== Cyberpunk motion layer (decorative; all skipped for reduced motion) =====
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('cy');

  // 1) Scroll reveal: blocks materialise (blur → sharp, rise) as they enter, slightly staggered.
  var RV = '.section-heading, .visit-heading, .post-row, .participate-card, .event-card, .judge-category, .visit-content, .visit-facts > div, .fb-card, .sponsor-group, .faq-list > div, .article-body > *';
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
      Array.prototype.forEach.call(el.querySelectorAll('h2'), function (x) { decode(x); });
      var h = el.querySelector('h2'); if (h) { h.classList.add('is-glitch'); setTimeout(function () { h.classList.remove('is-glitch'); }, 700); }
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });

  // 3) Scroll progress rail (right edge) + vertical system label (left edge, wide screens).
  var rail = document.createElement('div'); rail.className = 'cy-rail'; rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<i></i>';
  var side = document.createElement('div'); side.className = 'cy-side'; side.setAttribute('aria-hidden', 'true');
  side.textContent = 'VISION GET WILD // 2027 // KAOHSIUNG // SIGNAL LOCKED';
  document.body.appendChild(rail);
  var bar = rail.firstChild, ticking = false;
  function upd() { var h = root.scrollHeight - innerHeight; bar.style.transform = 'scaleY(' + (h > 0 ? scrollY / h : 0).toFixed(4) + ')'; ticking = false; }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

// Mouse "data debris": tiny pixel squares shed along the pointer path, drifting and fading (~0.6 s).
// Canvas overlay, mouse only, user-driven, capped particle count; skipped for reduced / paused motion.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var cv = document.createElement('canvas'); cv.className = 'debris'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), P = [], raf = 0, lx = null, ly = null;
  function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  var COLORS = ['241,43,32', '255,80,70', '215,233,239'];
  function tick(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i], a = 1 - (t - p.t0) / p.life;
      if (a <= 0) { P.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vy += .02;
      ctx.fillStyle = 'rgba(' + p.c + ',' + (a * p.o).toFixed(3) + ')';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    raf = P.length ? requestAnimationFrame(tick) : 0;
  }
  document.addEventListener('pointermove', function (e) {
    if (root.classList.contains('motion-paused')) return;
    var x = e.clientX, y = e.clientY;
    if (lx === null) { lx = x; ly = y; return; }
    var d = Math.hypot(x - lx, y - ly), n = Math.min(4, Math.floor(d / 14));
    for (var k = 0; k < n && P.length < 60; k++) {
      var f = k / Math.max(1, n);
      P.push({ x: lx + (x - lx) * f + (Math.random() - .5) * 10, y: ly + (y - ly) * f + (Math.random() - .5) * 10,
        vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2 - .3, s: Math.random() < .7 ? 2 : 3,
        c: COLORS[Math.random() < .75 ? (Math.random() < .5 ? 0 : 1) : 2], o: .55 + Math.random() * .4, t0: performance.now(), life: 450 + Math.random() * 300 });
    }
    lx = x; ly = y;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();

// Top nav: transparent at the top, frosted once the page scrolls.
(function () {
  var h = document.querySelector('.site-header');
  if (!h) return;
  var on = false;
  function upd() { var v = scrollY > 24; if (v !== on) { on = v; h.classList.toggle('is-scrolled', v); } }
  addEventListener('scroll', upd, { passive: true }); upd();
})();

// 參觀資訊: the map card tilts toward the mouse for a sense of depth (mouse only; decorative).
(function () {
  var sec = document.querySelector('section.visit'), card = sec && sec.querySelector('.visit-map');
  if (!card || !window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 951px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.addEventListener('pointermove', function (e) {
    if (card.matches(':hover')) { card.style.transform = ''; return; }
    var r = sec.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    card.style.transform = 'rotateY(' + (9 - nx * 10).toFixed(2) + 'deg) rotateX(' + (3 + ny * 6).toFixed(2) + 'deg)';
  }, { passive: true });
  sec.addEventListener('pointerleave', function () { card.style.transform = ''; });
})();

// 報名資訊: the misty red glow drifts after the mouse, arriving ~3 s later (decorative; mouse only).
(function () {
  var sec = document.querySelector('section.participate'), blob = sec && sec.querySelector('.reg-blob');
  if (!blob) return;
  var r0 = sec.getBoundingClientRect();
  var x = r0.width * .62, y = r0.height * .35, tx = x, ty = y, raf = 0, last = 0;
  function put() { blob.style.setProperty('--bx', x.toFixed(1) + 'px'); blob.style.setProperty('--by', y.toFixed(1) + 'px'); }
  put();
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function step(t) {
    var dt = last ? Math.min(64, t - last) : 16; last = t;
    var k = 1 - Math.exp(-dt / 900);            // time constant ~0.9 s → settles in about 3 s
    x += (tx - x) * k; y += (ty - y) * k; put();
    if (Math.abs(tx - x) > .5 || Math.abs(ty - y) > .5) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
  }
  sec.addEventListener('pointermove', function (e) {
    if (document.documentElement.classList.contains('motion-paused')) return;
    var r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
})();

// First screen: cover + 最新消息 together fill exactly one window (desktop).
(function () {
  var news = document.querySelector('main > section.updates'), hero = document.querySelector('main > section.hero');
  if (!news || !hero) return;
  var root = document.documentElement;
  function fit() { root.style.setProperty('--news-h', Math.ceil(news.getBoundingClientRect().height) + 'px'); }
  fit(); addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(news);
})();
