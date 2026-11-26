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
