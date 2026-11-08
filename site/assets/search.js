/* Site search: filters /search-index.json in the browser. */
(function () {
  'use strict';
  var q = (new URLSearchParams(location.search).get('q') || '').trim();
  var input = document.getElementById('hgl-q3');
  var out = document.getElementById('hgl-results');
  var title = document.getElementById('hgl-search-title');
  if (input) input.value = q;
  if (!q || !out) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var words = q.toLowerCase().split(/\s+/).filter(Boolean);
  fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (list) {
    var hits = list.map(function (it) {
      var hay = (it.t + ' ' + it.d + ' ' + it.h).toLowerCase();
      var score = 0;
      words.forEach(function (w) { if (hay.indexOf(w) > -1) score += it.t.toLowerCase().indexOf(w) > -1 ? 3 : 1; });
      return { it: it, score: score };
    }).filter(function (x) { return x.score >= words.length; }).sort(function (a, b) { return b.score - a.score; });
    title.textContent = hits.length ? 'Results for “' + q + '”' : 'No results for “' + q + '”';
    out.innerHTML = hits.slice(0, 30).map(function (x) {
      return '<article class="hgl-card"><div class="hgl-card__body"><span class="hgl-card__label">' + esc(x.it.h) + '</span><h2 class="hgl-card__title"><a href="' + esc(x.it.u) + '">' + esc(x.it.t) + '</a></h2><p class="hgl-card__excerpt">' + esc(x.it.d) + '</p></div></article>';
    }).join('') || '<p>Try fewer or different words, or browse a topic from the menu.</p>';
  });
})();
