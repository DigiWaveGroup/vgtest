// Judge categories: accessible disclosure (WAI-ARIA pattern).
// Without JS every category stays expanded.
document.querySelectorAll('.judge-category').forEach(function (cat) {
  var btn = cat.querySelector('.judge-toggle');
  var panel = document.getElementById(btn.getAttribute('aria-controls'));
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }
  set(cat.hasAttribute('data-default-open'));
  btn.addEventListener('click', function () {
    set(btn.getAttribute('aria-expanded') !== 'true');
  });
});
