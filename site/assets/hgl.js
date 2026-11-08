/* Home Garden Lot: menu, share buttons and small enhancements. Shared by blog and tool pages. */
(function () {
  'use strict';
  var d = document;
  var toggle = d.querySelector('.hgl-nav__toggle');
  var nav = d.getElementById('hgl-nav');
  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    d.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    var social = d.querySelector('.hgl-footer .hgl-social');
    if (social) {
      var copy = social.cloneNode(true);
      copy.classList.add('hgl-social--nav');
      nav.appendChild(copy);
    }
    nav.querySelectorAll('.hgl-nav__subtoggle').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.parentNode.classList.toggle('is-open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.setAttribute('aria-label', open ? 'Hide tools' : 'Show tools');
      });
    });
  }

  // The table of contents starts collapsed on phones so the answer stays above the fold.
  var toc = d.getElementById('hgl-toc');
  if (toc && window.matchMedia('(max-width: 700px)').matches) toc.open = false;

  d.querySelectorAll('.hgl-share').forEach(function (share) {
    share.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-net]');
      if (!btn) return;
      var url = encodeURIComponent(share.dataset.url);
      var title = encodeURIComponent(share.dataset.title);
      var first = d.querySelector('#hgl-post-body img');
      var img = share.dataset.image || (first ? first.src : '');
      var targets = {
        pinterest: 'https://www.pinterest.com/pin/create/button/?url=' + url + '&media=' + encodeURIComponent(img) + '&description=' + title,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
        x: 'https://x.com/intent/post?url=' + url + '&text=' + title,
        whatsapp: 'https://wa.me/?text=' + title + '%20' + url
      };
      var net = btn.getAttribute('data-net');
      if (net === 'copy') {
        if (navigator.clipboard) navigator.clipboard.writeText(share.dataset.url).then(function () {
          if (btn.querySelector('svg')) btn.setAttribute('aria-label', 'Copied!'); else btn.textContent = 'Copied!';
          btn.style.background = 'var(--hgl-green)';
          btn.style.color = '#fff';
        });
        return;
      }
      window.open(targets[net], '_blank', 'noopener,width=640,height=560');
    });
  });

  // Contact form: confirmation after Web3Forms redirects back.
  if (/[?&]sent=1/.test(location.search)) {
    var form = d.querySelector('.hgl-cf');
    if (form) {
      var ok = d.createElement('p');
      ok.className = 'hgl-note';
      ok.setAttribute('role', 'status');
      ok.textContent = 'Thanks! Your message was sent. We usually reply within 3 business days.';
      form.parentNode.insertBefore(ok, form);
    }
  }
})();
