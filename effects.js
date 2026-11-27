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
  document.addEventListener('click', function (e) { if (header.classList.contains('nav-open') && !header.contains(e.target)) set(false); });
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
    x += (tx - x) * 0.35; y += (ty - y) * 0.35;
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
  var items = Array.prototype.slice.call(document.querySelectorAll(RV)).filter(function (el) { return !el.closest('.updates, .page-head, .article-head'); });
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
      setTimeout(function () { el.classList.remove('rv', 'is-in'); el.style.removeProperty('--d'); }, 1500);
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

// Camera-focus cursor: replaces the system cursor with a crosshair (exactly at the pointer) and an
// AF frame that trails it; over links / buttons the frame hunts and locks (AF), click = shutter.
// Mouse only; when skipped (touch / reduced motion) the normal cursor is used.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  var dot = document.createElement('div'); dot.className = 'cam-dot'; dot.setAttribute('aria-hidden', 'true');
  var fr = document.createElement('div'); fr.className = 'cam-af'; fr.setAttribute('aria-hidden', 'true');
  fr.innerHTML = '<i></i><i></i><i></i><i></i><b class="cam-af-l">LOCK</b>';
  document.body.appendChild(fr); document.body.appendChild(dot);
  root.classList.add('cam-cursor');   // system arrow hidden; a crosshair sits exactly at the pointer
  var W = 46, H = 32, cur = { x: -200, y: -200, w: W, h: H }, tgt = { x: -200, y: -200, w: W, h: H }, raf = 0, lockEl = null, mx = -200, my = -200;
  var SEL = 'a, button, [role="button"], summary, label, input, select, textarea, .judge-category';
  // the frame wraps a judge category as a whole, and follows it when it opens or closes
  function box(el) { return (el && el.closest && el.closest('.judge-category')) || el; }
  var ro = window.ResizeObserver ? new ResizeObserver(function () { kick(); }) : null;
  function aim() {
    if (lockEl && document.contains(lockEl)) { var b = box(lockEl).getBoundingClientRect(), p = 7; tgt = { x: b.left - p, y: b.top - p, w: b.width + p * 2, h: b.height + p * 2 }; }
    else tgt = { x: mx - W / 2, y: my - H / 2, w: W, h: H };
  }
  function step() {
    aim();
    var k = lockEl ? .3 : .2, moving = false;
    ['x', 'y', 'w', 'h'].forEach(function (q) { var d = tgt[q] - cur[q]; cur[q] += d * k; if (Math.abs(d) > .3) moving = true; });
    fr.style.transform = 'translate(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px)';
    fr.style.width = cur.w.toFixed(1) + 'px'; fr.style.height = cur.h.toFixed(1) + 'px';
    raf = moving ? requestAnimationFrame(step) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(step); }
  document.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    if (!fr.classList.contains('is-on')) { cur = { x: mx - W / 2, y: my - H / 2, w: W, h: H }; fr.classList.add('is-on'); dot.classList.add('is-on'); }
    var el = e.target.closest ? e.target.closest(SEL) : null;
    if (el && el.closest('.site-header, section.follow')) el = null;   // no lock on the top nav or in 追蹤我們
    var inFollow = !!(e.target.closest && e.target.closest('section.follow'));
    fr.classList.toggle('is-away', inFollow); dot.classList.toggle('is-away', inFollow);
    var inNav = !!(e.target.closest && e.target.closest('.site-header'));
    fr.classList.toggle('is-nav', inNav); dot.classList.toggle('is-nav', inNav);
    if (el !== lockEl) {
      if (ro) { if (lockEl) ro.unobserve(box(lockEl)); if (el) ro.observe(box(el)); }
      lockEl = el;
      fr.classList.remove('is-lock', 'is-hunt');
      if (el) { void fr.offsetWidth; fr.classList.add('is-hunt'); setTimeout(function () { if (lockEl === el) fr.classList.add('is-lock'); }, 380); }
    }
    kick();
  }, { passive: true });
  document.addEventListener('click', function () { kick(); });
  document.addEventListener('pointerdown', function () { fr.classList.remove('is-shot'); void fr.offsetWidth; fr.classList.add('is-shot'); });
  addEventListener('scroll', function () {
    var el = document.elementFromPoint(mx, my);
    el = el && el.closest ? el.closest(SEL) : null;
    if (el && el.closest('.site-header, section.follow')) el = null;
    if (el !== lockEl) { lockEl = el; fr.classList.toggle('is-lock', !!el); }
    kick();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { fr.classList.remove('is-on'); dot.classList.remove('is-on'); });
  document.documentElement.addEventListener('mouseenter', function () { fr.classList.add('is-on'); dot.classList.add('is-on'); });
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

// Phones: a back-to-top button appears after scrolling (the phone header does not stay on screen).
(function () {
  var b = document.createElement('a');
  b.className = 'to-top';
  b.href = '#top';
  b.textContent = '回到頁首';
  document.body.appendChild(b);
  var on = false;
  function upd() { var v = window.scrollY > window.innerHeight * 1.5; if (v !== on) { on = v; b.classList.toggle('is-on', v); } }
  window.addEventListener('scroll', upd, { passive: true }); upd();
})();

// 參觀資訊: draw the walking route from the light-rail station to the venue when the map comes into view.
(function () {
  var map = document.querySelector('.visit-map');
  if (!map || !map.querySelector('.map-route')) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { map.classList.add('is-drawn'); return; }
  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { map.classList.add('is-drawn'); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(map);
})();

// 導覽列：滑鼠移上（或鍵盤聚焦）時，文字一個字一個字由亂碼轉回正確字。
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var links = document.querySelectorAll('.nav-list a');
  if (!links.length) return;
  var pool = '放視大賞展覽競賽報名參觀資訊評審名單主題活動最新消息高雄創意數位設計遊戲動畫影像互動';
  Array.prototype.forEach.call(links, function (a) {
    var text = a.textContent.trim();
    if (!text || a.children.length) return;   // only plain-text links
    a.setAttribute('aria-label', text);
    var timer = 0;
    function run() {
      clearInterval(timer);
      var frame = 0, total = text.length * 3 + 2;
      timer = setInterval(function () {
        frame++;
        var done = Math.floor(frame / 3), out = '';
        for (var i = 0; i < text.length; i++) out += i < done ? text[i] : pool[(Math.random() * pool.length) | 0];
        a.textContent = out;
        if (frame >= total) { clearInterval(timer); a.textContent = text; }
      }, 40);
    }
    a.addEventListener('mouseenter', run);
    a.addEventListener('focus', run);
  });
})();

// 封面：滑鼠移動經過時，游標周圍的圖片變成馬賽克（WebGL）。
// 移動越快範圍越大；停止移動後約 1 秒淡回原圖，畫布清空。
(function () {
  var hero = document.querySelector('.hero');
  var img = hero && hero.querySelector('.hero-cover');
  if (!img) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var cv = document.createElement('canvas');
  cv.className = 'hero-fx';
  cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false });
  if (!gl) return;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTex;uniform vec2 uRes,uImg,uPtr;uniform float uTime,uVel,uCell;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'vec2 fit(){float ca=uRes.x/uRes.y,ia=uImg.x/uImg.y;return ca>ia?vec2(ia/ca,1.):vec2(1.,ca/ia);}',
    'vec4 tx(vec2 p,vec2 s){return texture2D(uTex,(p-.5)/s+.5);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;uv.y=1.-uv.y;vec2 s=fit();',
    ' vec2 q=(uv-.5)/s+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.){gl_FragColor=vec4(0.);return;}',
    ' float asp=uRes.x/uRes.y;vec2 cells=uRes/uCell;vec2 cuv=(floor(uv*cells)+.5)/cells;',
    ' float d=length((cuv-uPtr)*vec2(asp,1.))+(h(cuv*31.+floor(uTime*10.))-.5)*.04;',
    ' float r0=.04+.10*uVel;float a=uVel*(1.-smoothstep(r0,r0+.06,d));',
    ' gl_FragColor=vec4(tx(a>.05?cuv:uv,s).rgb,1.);',
    '}'
  ].join('\n');
  function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var pg = gl.createProgram(); gl.attachShader(pg, vs); gl.attachShader(pg, fs); gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return;
  gl.useProgram(pg);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pg, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uTex', 'uRes', 'uImg', 'uPtr', 'uTime', 'uVel', 'uCell'].forEach(function (n) { U[n] = gl.getUniformLocation(pg, n); });

  var ready = false, raf = 0, t0 = performance.now();
  var ptr = { x: .5, y: .5 }, last = null, vel = 0;
  function now() { return (performance.now() - t0) / 1000; }

  var tex = gl.createTexture(), src = new Image();
  src.onload = function () {
    try {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (gl.getError() !== gl.NO_ERROR) return;
      gl.uniform1i(U.uTex, 0); gl.uniform2f(U.uImg, src.naturalWidth, src.naturalHeight);
      ready = true; hero.appendChild(cv); size();
    } catch (e) { /* file:// 等無法讀取圖片像素時，維持原圖不加特效 */ }
  };
  src.src = img.currentSrc || img.src;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = img.offsetWidth, hgt = img.offsetHeight;
    cv.style.setProperty('left', img.offsetLeft + 'px'); cv.style.setProperty('top', img.offsetTop + 'px');
    cv.style.setProperty('width', w + 'px'); cv.style.setProperty('height', hgt + 'px');
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(hgt * dpr));
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uCell, 18 * dpr);
  }
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (ready) size(); }).observe(img);

  function paused() { return document.documentElement.classList.contains('motion-paused'); }
  function frame() {
    raf = 0;
    if (!ready) return;
    var t = now();
    vel *= .86;
    var vn = Math.min(1, Math.max(0, (vel - .002) / (.03 - .002)));
    if (vn <= .02 || paused()) { cv.classList.remove('is-on'); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); return; }
    gl.uniform2f(U.uPtr, ptr.x, ptr.y); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uVel, vn);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cv.classList.add('is-on');
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function toUv(e) { var b = img.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }; }

  hero.addEventListener('pointerleave', function () { last = null; });
  hero.addEventListener('pointermove', function (e) {
    var p = toUv(e);
    if (last) { var d = Math.hypot(p.x - last.x, p.y - last.y); vel += (d - vel) * .45; }
    last = p; ptr = p; kick();
  }, { passive: true });
})();
