// Events page filter (date). Toggle buttons use aria-pressed;
// the result count is announced via a polite live region.
// Without JS the filter bar stays hidden and every event is listed.
(function () {
  var bar = document.querySelector('.filter-bar');
  if (!bar) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('.event-tile[data-date]'));
  var days = Array.prototype.slice.call(document.querySelectorAll('.event-day'));
  var status = bar.querySelector('.filter-status');
  var state = { date: 'all' };
  bar.hidden = false;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    var kind = btn.dataset.filter;
    state[kind] = btn.dataset.value;
    bar.querySelectorAll('.filter-btn[data-filter="' + kind + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    apply();
  });
  function apply() {
    var n = 0;
    items.forEach(function (li) {
      var ok = state.date === 'all' || li.dataset.date === state.date;
      li.hidden = !ok;
      if (ok) n++;
    });
    days.forEach(function (d) { d.hidden = !d.querySelector('.event-tile:not([hidden])'); });
    status.textContent = n ? status.dataset.template.replace('{n}', n) : status.dataset.empty;
  }
  apply();
})();
