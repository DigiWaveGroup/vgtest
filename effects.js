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
