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

  // Contact form: sends in the background so the reader stays on the page; without JavaScript it posts normally.
  var cf = d.querySelector('[data-contact]');
  if (cf) {
    var status = cf.querySelector('[data-status]');
    var btn = cf.querySelector('button[type=submit]');
    var t = cf.querySelector('input[name=t]');
    if (t) t.value = String(Date.now());
    var topic = new URLSearchParams(location.search).get('topic');
    if (topic && cf.topic.querySelector('option[value="' + topic.replace(/[^a-z]/g, '') + '"]')) cf.topic.value = topic;
    var done = function () {
      cf.innerHTML = '<div class="hgl-cf__done" tabindex="-1"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" opacity=".12"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><h2>Thanks, your message is on its way</h2><p>We reply to every genuine message, usually within 3 business days. Check your spam folder if you haven’t heard back.</p></div>';
      cf.querySelector('.hgl-cf__done').focus();
    };
    if (/[?&]sent=1/.test(location.search)) done();
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cf.reportValidity()) return;
      if (t && Date.now() - Number(t.value) < 3000) { status.className = 'hgl-cf__status hgl-cf__status--err'; status.textContent = 'That was quick. Please wait a few seconds and send again.'; return; }
      var fd = new FormData(cf);
      var label = cf.topic.options[cf.topic.selectedIndex].text;
      fd.set('subject', '[Home Garden Lot] ' + label + ': ' + (fd.get('name') || 'reader'));
      fd.delete('redirect'); fd.delete('t');
      btn.disabled = true; btn.textContent = 'Sending…';
      status.className = 'hgl-cf__status'; status.textContent = '';
      fetch(cf.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          if (j && j.success) { done(); if (window.gtag) window.gtag('event', 'contact_sent', { topic: cf.topic ? cf.topic.value : '' }); return; }
          throw new Error(j && j.message);
        })
        .catch(function () {
          status.className = 'hgl-cf__status hgl-cf__status--err';
          status.textContent = 'Your message could not be sent. Please check your connection and try again.';
          btn.disabled = false; btn.textContent = 'Send message';
        });
    });
  }
})();
