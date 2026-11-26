// 放視大賞 VGW 2027 — page behaviour. Everything here is progressive: without JS the
// page is complete (nav links visible, no motion). Decorative parts are aria-hidden
// and skipped for touch devices and for users who prefer reduced motion.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // ---- Mobile nav: collapse the links into a menu button (≤950px) ----
  var header = document.querySelector('.site-header');
  var nav = header && header.querySelector('nav');
  if (nav) {
    nav.id = nav.id || 'site-nav';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-controls', nav.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', '主選單');
    btn.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"><span></span></span>';
    nav.parentNode.insertBefore(btn, nav);
    header.classList.add('has-nav-toggle');
    var setOpen = function (open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      header.classList.toggle('nav-open', open);
    };
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', function (e) { if (header.classList.contains('nav-open') && !header.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); btn.focus(); }
    });

    // Transparent over the cover, frosted once the page scrolls.
    var scrolled = false;
    var onScroll = function () { var v = window.scrollY > 24; if (v !== scrolled) { scrolled = v; header.classList.toggle('is-scrolled', v); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Looping motion (cover scan, registration mist) with a visible pause control (WCAG 2.2.2) ----
  var hero = document.querySelector('.hero');
  if (hero && !reduce.matches) {
    root.classList.add('motion-loop');
    var mt = document.createElement('button');
    mt.type = 'button';
    mt.className = 'motion-toggle';
    mt.setAttribute('aria-pressed', 'false');
    mt.textContent = '暫停動態';
    mt.addEventListener('click', function () {
      var paused = root.classList.toggle('motion-paused');
      mt.setAttribute('aria-pressed', paused ? 'true' : 'false');
      mt.textContent = paused ? '播放動態' : '暫停動態';
    });
    hero.appendChild(mt);
  }

  // ---- 報名資訊: the red mist drifts after the mouse, arriving ~3 s later ----
  var sec = document.querySelector('section.participate');
  var blob = sec && sec.querySelector('.reg-blob');
  if (blob && finePointer.matches && !reduce.matches) {
    var bx = 0, by = 0, tx = 0, ty = 0, raf = 0, last = 0, rect = null;
    var measure = function () { rect = sec.getBoundingClientRect(); };
    var put = function () { blob.style.setProperty('--bx', bx.toFixed(1) + 'px'); blob.style.setProperty('--by', by.toFixed(1) + 'px'); };
    var init = function () { measure(); bx = tx = rect.width * 0.62; by = ty = rect.height * 0.35; put(); };
    window.addEventListener('load', init); init();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', function () { rect = null; }, { passive: true });
    var step = function (t) {
      var dt = last ? Math.min(64, t - last) : 16; last = t;
      var k = 1 - Math.exp(-dt / 900);   // time constant ~0.9 s → settles in about 3 s
      bx += (tx - bx) * k; by += (ty - by) * k; put();
      if (Math.abs(tx - bx) > 0.5 || Math.abs(ty - by) > 0.5) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
    };
    sec.addEventListener('pointermove', function (e) {
      if (root.classList.contains('motion-paused')) return;
      if (!rect) measure();
      tx = e.clientX - rect.left; ty = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }

  // ---- Camera focus frame: brackets close around a link / button under the mouse ----
  // Pure decoration; the system cursor is never hidden.
  if (finePointer.matches && !reduce.matches) {
    var fr = document.createElement('div');
    fr.className = 'cam-af';
    fr.setAttribute('aria-hidden', 'true');
    fr.innerHTML = '<i></i><i></i><i></i><i></i>';
    document.body.appendChild(fr);
    var SEL = 'a, button, summary, [role="button"]';
    var target = null, frameRaf = 0, mx = 0, my = 0;
    var place = function () {
      frameRaf = 0;
      if (!target || !document.contains(target)) { fr.classList.remove('is-on'); return; }
      var b = target.getBoundingClientRect(), p = 6;
      fr.style.transform = 'translate(' + (b.left - p) + 'px,' + (b.top - p) + 'px)';
      fr.style.width = (b.width + p * 2) + 'px';
      fr.style.height = (b.height + p * 2) + 'px';
      fr.classList.add('is-on');
    };
    var queue = function () { if (!frameRaf) frameRaf = requestAnimationFrame(place); };
    document.addEventListener('pointerover', function (e) {
      var el = e.target.closest ? e.target.closest(SEL) : null;
      if (el !== target) { target = el; queue(); }
    });
    document.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener('scroll', function () {
      // re-check what is under the (stationary) pointer after scrolling
      var el = document.elementFromPoint(mx, my);
      target = el && el.closest ? el.closest(SEL) : null;
      queue();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { target = null; queue(); });
  }
})();
