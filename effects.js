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

// Glyph blink: on hover/focus, the letters of nav links and buttons flicker one by one
// (decorative; text stays the same for screen readers; skipped for reduced motion).
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = '.nav-list a, .news-all a, .event-card a.event-register, .button, .dl-link';
  Array.prototype.forEach.call(document.querySelectorAll(SEL), function (el) {
    var n = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType !== 3 || !node.textContent.trim()) return;
      var frag = document.createElement('span');
      frag.className = 'glyph-run';
      Array.prototype.forEach.call(node.textContent, function (ch) {
        if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
        var s = document.createElement('span');
        s.className = 'glyph';
        s.style.setProperty('--i', n++);
        s.textContent = ch;
        frag.appendChild(s);
      });
      // Screen readers get the original text; the per-letter copy is visual only (WCAG 1.3.1)
      frag.setAttribute('aria-hidden', 'true');
      var sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = node.textContent;
      var wrap = document.createDocumentFragment();
      wrap.appendChild(sr); wrap.appendChild(frag);
      node.parentNode.replaceChild(wrap, node);
    });
    if (!n) return;
    var t;
    function blink() {
      el.classList.remove('is-blink'); void el.offsetWidth; el.classList.add('is-blink');
      clearTimeout(t); t = setTimeout(function () { el.classList.remove('is-blink'); }, 340 + n * 26);
    }
    el.addEventListener('mouseenter', blink);
    el.addEventListener('focus', blink);
  });
})();
